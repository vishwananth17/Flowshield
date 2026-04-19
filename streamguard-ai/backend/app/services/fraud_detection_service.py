import sys, os
import uuid
import time
import logging
from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal

# Ensure ML package is reachable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ml'))

from app.schemas.transaction import TransactionAnalyzeRequest

logger = logging.getLogger(__name__)

@dataclass
class FraudResult:
    risk_score: float
    risk_label: str
    decision: str
    confidence: float
    reasons: list[str]
    model_scores: dict[str, float]
    model_version: str
    detection_latency_ms: int

def _extract_features(tx: TransactionAnalyzeRequest) -> dict:
    """
    Convert raw transaction object to ML feature dict.
    """
    now = datetime.now(UTC)
    hour = now.hour
    dow  = now.weekday()

    # MCC risk tier mapping
    HIGH_RISK_MCC  = {'7995', '4829', '5960', '6211', '6051', '6012', '5933'}
    MED_RISK_MCC   = {'5999','7011','5912','6099'}
    mcc = tx.merchant.category
    
    if any(mcc.startswith(p) for p in HIGH_RISK_MCC):
        mcc_tier = 2
    elif any(mcc.startswith(p) for p in MED_RISK_MCC):
        mcc_tier = 1
    else:
        mcc_tier = 0

    return {
        'amount_inr':           float(tx.amount),
        'hour_of_day':          hour,
        'day_of_week':          dow,
        'is_weekend':           1 if dow >= 5 else 0,
        'is_night':             1 if hour < 6 or hour >= 22 else 0,
        
        # Velocity features (mocked or from request if extended)
        'tx_count_last_1h':     getattr(tx, 'tx_count_1h', 1),
        'tx_count_last_24h':    getattr(tx, 'tx_count_24h', 3),
        'amount_sum_last_1h':   float(tx.amount), 
        'amount_vs_avg_ratio':  1.0,
        'unique_merchants_24h': 1,

        # Geographic features
        'ip_country_match':     1 if tx.customer.country == tx.card.issuing_country else 0,
        'card_country_match':   1, 
        'customer_country':     tx.customer.country.upper(),

        # Device features
        'is_new_device':        1 if not tx.customer.device_fingerprint else 0,
        'device_age_days':      365,
        'is_first_transaction': 0,

        # Merchant features
        'merchant_risk_score':  0.1,
        'mcc_risk_tier':        mcc_tier,
    }

class FraudDetectionService:
    """Production Ensemble Scorer: MVI + XGBoost + Deterministic Rules."""

    def analyze(self, tx: TransactionAnalyzeRequest, plan: str = "free") -> FraudResult:
        from app.ml.ensemble import get_ensemble
        
        start = time.time()
        try:
            features = _extract_features(tx)
            ensemble = get_ensemble()

            if plan == 'free' or plan == 'starter':
                # Tier-restricted: Rules only
                rule_score, rule_reasons = ensemble._apply_hard_rules(features)
                final_score = rule_score if rule_score > 0 else 0.05

                if final_score >= 0.80: label, decision = "fraud", "block"
                elif final_score >= 0.40: label, decision = "suspicious", "review"
                else: label, decision = "safe", "allow"

                result_dict = {
                    "risk_score": round(final_score, 4),
                    "risk_label": label,
                    "decision": decision,
                    "confidence": 0.65,
                    "reasons": rule_reasons or ["Standard rule-set pass"],
                    "model_scores": {"rules": round(final_score, 4)},
                    "model_version": "rules_only_v1.0",
                }
            else:
                # Premium: Full Ensemble (MVI + XGB + Rules)
                result_dict = ensemble.predict(features)

        except Exception as e:
            logger.error(f"Fraud analysis ensemble error: {e}", exc_info=True)
            result_dict = {
                "risk_score": 0.5,
                "risk_label": "review",
                "decision": "review",
                "confidence": 0.5,
                "reasons": ["AI Core offline — manual review recommended"],
                "model_scores": {},
                "model_version": "fallback_v1.0",
            }

        latency_ms = int((time.time() - start) * 1000)
        
        return FraudResult(
            risk_score=result_dict["risk_score"],
            risk_label=result_dict["risk_label"],
            decision=result_dict["decision"],
            confidence=result_dict["confidence"],
            reasons=result_dict["reasons"],
            model_scores=result_dict.get("model_scores", {}),
            model_version=result_dict["model_version"],
            detection_latency_ms=latency_ms
        )

    async def process_auto_alert(self, org_id: uuid.UUID, tx: TransactionAnalyzeRequest, result: FraudResult, internal_id: uuid.UUID):
        if result.risk_score >= 0.70:
            severity = "critical" if result.risk_score >= 0.95 else ("high" if result.risk_score >= 0.85 else "medium")
            from app.services.alert_service import AlertService
            description = (
                f"Transaction SG_{str(internal_id)[:8].upper()} for {tx.currency.upper()} {tx.amount} at {tx.merchant.name} "
                f"received a risk score of {result.risk_score:.2f}. Reasons: {', '.join(result.reasons[:2])}."
            )
            await AlertService.create_alert(
                org_id=org_id, transaction_id=internal_id, severity=severity,
                title=f"Anomaly Detected — {tx.merchant.name}", description=description
            )

def transaction_row_from_request(org_id: uuid.UUID, tx: TransactionAnalyzeRequest, result: FraudResult, internal_id: uuid.UUID, latency_ms: int) -> dict[str, object]:
    return {
        "id": internal_id, "org_id": org_id, "external_id": tx.transaction_id,
        "amount": tx.amount, "currency": tx.currency.upper(),
        "merchant_id": tx.merchant.id, "merchant_name": tx.merchant.name, "merchant_category": tx.merchant.category,
        "card_last_four": tx.card.last_four, "card_type": tx.card.type,
        "customer_id": tx.customer.id, "customer_ip": tx.customer.ip, "customer_country": tx.customer.country.upper(),
        "device_fingerprint": tx.customer.device_fingerprint, "channel": tx.channel,
        "risk_score": Decimal(str(result.risk_score)), "risk_label": result.risk_label, "decision": result.decision,
        "fraud_reasons": result.reasons, "model_version": result.model_version,
        "detection_latency_ms": result.detection_latency_ms, "is_confirmed_fraud": None,
    }
