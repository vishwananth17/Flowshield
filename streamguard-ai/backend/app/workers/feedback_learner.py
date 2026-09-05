"""
Flowshield AI — Post-Checkout Feedback Learner Worker
Continuous learning loop that processes confirmed disputes, chargebacks, fraud reports,
and false positive feedback to dynamically adapt customer risk profiles and retrain models.
"""

import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.models.transaction_outcome import TransactionOutcome
from app.models.transaction import Transaction

logger = logging.getLogger(__name__)


class FeedbackLearner:
    """
    Processes confirmed outcomes and updates customer risk profiles and the network radar.
    """

    RETRAIN_THRESHOLD = 50  # Retrain trigger after 50 new confirmed labels

    def __init__(self, redis_client=None):
        self.redis = redis_client

    async def process_new_outcome(
        self,
        outcome: TransactionOutcome,
        db: Optional[AsyncSession] = None,
        tx: Optional[Transaction] = None
    ) -> Dict[str, Any]:
        """
        Called whenever a new post-checkout outcome is reported or updated.
        """
        if outcome.feedback_label is None:
            logger.info(f"Outcome {outcome.id} is ambiguous (label is None) — skipping immediate feedback update.")
            return {"status": "skipped_ambiguous"}

        results = {}

        # 1. Fetch transaction record if not supplied
        if tx is None and db is not None:
            stmt = select(Transaction).where(Transaction.id == outcome.transaction_id)
            exec_res = await db.execute(stmt)
            tx = exec_res.scalar_one_or_none()

        customer_id = tx.customer_id if tx else "anonymous"
        org_id = str(outcome.org_id)
        is_fraud = (outcome.feedback_label == 1)

        # 2. Add to Redis Training Queue
        if self.redis:
            try:
                queue_entry = {
                    "outcome_id": str(outcome.id),
                    "transaction_id": str(outcome.transaction_id),
                    "org_id": org_id,
                    "feedback_label": outcome.feedback_label,
                    "outcome_type": outcome.outcome_type,
                    "signals": tx.signals_json if tx and tx.signals_json else {},
                    "processed_at": datetime.now(timezone.utc).isoformat()
                }
                await self.redis.lpush("ml:training_queue", json.dumps(queue_entry))
                await self.redis.incr("ml:new_labeled_samples_count")
            except Exception as e:
                logger.error(f"Failed to push to Redis training queue: {e}")

        # 3. Update Customer Risk Profile in Redis
        if self.redis and customer_id and customer_id != "anonymous":
            try:
                profile_res = await self.update_customer_risk_profile(
                    customer_id=customer_id,
                    org_id=org_id,
                    label=outcome.feedback_label
                )
                results["customer_profile"] = profile_res
            except Exception as e:
                logger.error(f"Failed updating customer risk profile: {e}")

        # 4. Cross-Merchant Network Flagging (The Network Radar)
        if is_fraud and tx and self.redis:
            try:
                signals = tx.signals_json or {}
                dev_hash = signals.get("device_fingerprint_hash") or tx.device_fingerprint_hash
                card_last_four = tx.card_last_four or ""
                card_bin = signals.get("card_bin", "")
                
                # Flag device fingerprint across entire merchant collective
                if dev_hash:
                    await self.redis.sadd("network:flagged_devices", dev_hash)
                    logger.info(f"Cross-merchant network flagged device hash: {dev_hash[:12]}...")

                # Flag card hash across network
                if card_last_four:
                    card_token = f"{card_bin}_{card_last_four}"
                    card_hash = signals.get("card_hash")
                    if not card_hash:
                        import hashlib
                        card_hash = hashlib.sha256(card_token.encode()).hexdigest()
                    await self.redis.sadd("network:flagged_cards", card_hash)
                    logger.info(f"Cross-merchant network flagged card hash: {card_hash[:12]}...")
            except Exception as e:
                logger.error(f"Failed to flag cross-merchant entity: {e}")

        # 5. Update Signal Predictive Stats in Redis
        if tx and tx.signals_json and self.redis:
            try:
                await self.update_signal_stats(
                    signals=tx.signals_json,
                    was_fraud=is_fraud,
                    was_false_positive=(outcome.outcome_type == "false_positive_confirmed")
                )
            except Exception as e:
                logger.error(f"Failed to update signal stats: {e}")

        # 6. Check Retraining Threshold
        should_retrain = False
        if self.redis:
            try:
                count_val = await self.redis.get("ml:new_labeled_samples_count")
                if count_val and int(count_val) >= self.RETRAIN_THRESHOLD:
                    should_retrain = True
                    results["retraining_triggered"] = True
                    logger.info(f"Retraining threshold reached ({count_val} samples). Triggering model update worker.")
            except Exception as e:
                logger.error(f"Failed checking retrain threshold: {e}")

        # Update transaction record's feedback_label in DB
        if db is not None and tx is not None:
            try:
                tx.feedback_label = outcome.feedback_label
                if outcome.feedback_label == 1:
                    tx.is_confirmed_fraud = True
                await db.commit()
            except Exception as e:
                logger.error(f"Failed updating transaction feedback label: {e}")

        results["status"] = "processed"
        results["feedback_label"] = outcome.feedback_label
        results["is_fraud"] = is_fraud
        results["should_retrain"] = should_retrain
        return results

    async def update_customer_risk_profile(
        self,
        customer_id: str,
        org_id: str,
        label: int
    ) -> Dict[str, Any]:
        """
        Maintains persistent real-time customer risk score and anomaly counts in Redis.
        """
        profile_key = f"customer_risk:{org_id}:{customer_id}"
        profile = await self.redis.hgetall(profile_key) or {}

        fraud_count = int(profile.get("fraud_count", 0))
        dispute_count = int(profile.get("dispute_count", 0))
        total_tx = int(profile.get("total_transactions", 1))

        if label == 1:
            fraud_count += 1
            dispute_count += 1
        elif label == 0:
            pass  # Legitimate confirmed

        total_tx += 1
        fraud_rate = round(fraud_count / max(1, total_tx), 4)

        mapping = {
            "fraud_count": str(fraud_count),
            "dispute_count": str(dispute_count),
            "total_transactions": str(total_tx),
            "fraud_rate": str(fraud_rate),
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
        await self.redis.hset(profile_key, mapping=mapping)
        await self.redis.expire(profile_key, 86400 * 365)  # 1 year retention

        # If customer accumulates 3+ fraud cases, tag on merchant's high-risk list
        if fraud_count >= 3:
            await self.redis.sadd(f"high_risk_customers:{org_id}", customer_id)
            logger.warning(f"Customer {customer_id} added to high-risk blacklist for org {org_id}")

        return mapping

    async def update_signal_stats(
        self,
        signals: Dict[str, Any],
        was_fraud: bool,
        was_false_positive: bool = False
    ) -> None:
        """
        Tracks accuracy and false-positive frequency per signal.
        """
        for sig_name, val in signals.items():
            if not val:
                continue
            if was_fraud:
                await self.redis.hincrby("signal_stats:true_positives", sig_name, 1)
            elif was_false_positive:
                await self.redis.hincrby("signal_stats:false_positives", sig_name, 1)
            else:
                await self.redis.hincrby("signal_stats:clean_cases", sig_name, 1)
