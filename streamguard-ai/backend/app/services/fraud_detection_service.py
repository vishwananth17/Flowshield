import sys, os
import uuid
import time
import logging
import asyncio
import hashlib
from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal
import numpy as np

# Ensure ML package is reachable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ml'))

from app.schemas.transaction import TransactionAnalyzeRequest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

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
    features: dict = None
    fraud_type: str | None = None
    fraud_type_confidence: float | None = None
    fraud_signals: dict = None

class FraudDetectionService:
    """Production Ensemble Scorer: AST Rules + MVI Anomaly + XGBoost Classifier."""

    async def analyze(
        self, 
        tx: TransactionAnalyzeRequest, 
        plan: str = "free", 
        db: AsyncSession = None, 
        org_id: uuid.UUID = None,
        request = None
    ) -> FraudResult:
        from app.ml.ensemble import get_ensemble
        from app.core.billing_config import get_plan_limits
        from app.ml.features.feature_engineer import UnifiedFeatureEngineer
        from app.services.rule_evaluator import SafeRuleEvaluator
        import redis.asyncio as async_redis
        from app.core.config import get_settings
        
        # Import detectors
        from app.services.stolen_card_detector import compute_stolen_card_features
        from app.services.chargeback_detector import compute_chargeback_features
        from app.services.ato_detector import compute_ato_features
        from app.services.refund_detector import compute_refund_features
        from app.services.promo_abuse_detector import compute_promo_abuse_features
        from app.core.bot_detector import BotDetector
        from app.services.fraud_type_classifier import FraudTypeClassifier
        
        start = time.time()
        limits = get_plan_limits(plan)
        
        # 1. Fetch organization custom thresholds if db and org_id are available
        threshold_review = 0.15
        threshold_block = 0.39
        if db and org_id:
            from app.models.organization import Organization
            try:
                stmt = select(Organization).where(Organization.id == org_id)
                res = await db.execute(stmt)
                org = res.scalar_one_or_none()
                if org:
                    threshold_review = float(org.threshold_review)
                    threshold_block = float(org.threshold_block)
            except Exception as e:
                logger.error(f"Error fetching organization thresholds: {e}")

        try:
            # 2. Extract base features using UnifiedFeatureEngineer
            settings = get_settings()
            redis_client = async_redis.from_url(settings.redis_url, decode_responses=True)
            feat_eng = UnifiedFeatureEngineer(redis_client)
            
            # Since compute_inference_vector is async, await it
            features = await feat_eng.compute_inference_vector(tx, db)
            
            # Compute additional keys
            customer_id = tx.customer.id
            customer_email = tx.customer.email or ""
            device_hash = hashlib.sha256(tx.customer.device_fingerprint.encode("utf-8")).hexdigest() if tx.customer.device_fingerprint else ""
            features["device_fingerprint_hash"] = device_hash
            org_id_str = str(org_id) if org_id else "mock_org"

            # Parse transaction dict for detectors
            tx_dict = tx.model_dump()
            tx_dict["device_fingerprint_hash"] = device_hash

            # Instantiate BotDetector
            bot_detector = BotDetector(redis_client)

            # 3. Compute fraud-type specific features in parallel
            stolen_card_f, chargeback_f, ato_f, refund_f, promo_f, bot_f = await asyncio.gather(
                compute_stolen_card_features(customer_id, org_id_str, tx_dict, redis_client),
                compute_chargeback_features(customer_id, customer_email, tx_dict, redis_client, db),
                compute_ato_features(customer_id, org_id_str, tx_dict, db),
                compute_refund_features(customer_id, customer_email, device_hash, org_id_str, tx_dict, redis_client, db),
                compute_promo_abuse_features(tx_dict, org_id_str, redis_client),
                bot_detector.analyze_request(request, org_id_str) if request is not None else asyncio.sleep(0, result={
                    "is_bot_user_agent": int(tx.metadata.get("is_bot_user_agent", 0)),
                    "requests_per_minute": int(tx.metadata.get("requests_per_minute", 1)),
                    "identical_body_count": int(tx.metadata.get("identical_body_count", 1)),
                    "interval_regularity": float(tx.metadata.get("interval_regularity", 0.0)),
                    "missing_browser_headers": int(tx.metadata.get("missing_browser_headers", 0)),
                    "is_bot_attack": int(tx.metadata.get("is_bot_attack", 0)),
                    "fraud_type_hint": None
                })
            )

            # Combine all features
            features.update(stolen_card_f)
            features.update(chargeback_f)
            features.update(ato_f)
            features.update(refund_f)
            features.update(promo_f)
            features.update(bot_f)

            # Add missing browser headers key if not present
            features["missing_browser_headers"] = bot_f.get("missing_browser_headers", 0)
            features["is_bot_attack"] = bot_f.get("is_bot_attack", 0)

            # 4. Bot attack hard override (skip ML for clear bots)
            if bot_f.get("is_bot_attack"):
                latency_ms = int((time.time() - start) * 1000)
                return FraudResult(
                    risk_score=0.99,
                    risk_label="fraud",
                    decision="block",
                    confidence=1.0,
                    reasons=[
                        f"Bot attack detected: {bot_f['requests_per_minute']} requests/minute from this IP",
                        "Request pattern shows automated behavior",
                        "Timing regularity indicates scripted requests"
                    ],
                    model_scores={"rules": 0.99},
                    model_version="bot_override_v2.0",
                    detection_latency_ms=latency_ms,
                    features=features,
                    fraud_type="bot_attack",
                    fraud_type_confidence=1.0,
                    fraud_signals={
                        "bot_attack": {
                            "is_bot_user_agent": bool(bot_f.get("is_bot_user_agent")),
                            "requests_per_minute": bot_f.get("requests_per_minute")
                        }
                    }
                )

            # 5. Evaluate Hard Rules (Pre-computation precedence layer)
            rule_decision = None
            rule_score_override = 0.0
            rule_reasons = []
            
            if db:
                try:
                    from app.models.risk_rule import RiskRule
                    rules_stmt = select(RiskRule).where(RiskRule.is_active == True).order_by(RiskRule.priority.desc())
                    rules_res = await db.execute(rules_stmt)
                    active_rules = rules_res.scalars().all()
                    
                    evaluator = SafeRuleEvaluator()
                    for rule in active_rules:
                        if evaluator.evaluate(rule.condition_json, features):
                            rule_reasons.append(f"Rule: {rule.name}")
                            if rule.action == 'block':
                                rule_decision = 'block'
                                rule_score_override = float(rule.risk_score_override) if rule.risk_score_override is not None else 1.0
                                break
                            elif rule.action == 'review':
                                rule_decision = 'review'
                                rule_score_override = max(rule_score_override, float(rule.risk_score_override) if rule.risk_score_override is not None else 0.50)
                except Exception as e:
                    logger.error(f"Error executing custom risk rules: {e}")
            
            # If a rule triggered a hard block, short circuit immediately
            if rule_decision == 'block':
                latency_ms = int((time.time() - start) * 1000)
                return FraudResult(
                    risk_score=rule_score_override,
                    risk_label="fraud",
                    decision="block",
                    confidence=1.0,
                    reasons=rule_reasons[:3],
                    model_scores={"rules": rule_score_override},
                    model_version="rules_override_v1.0",
                    detection_latency_ms=latency_ms,
                    features=features,
                    fraud_type="unknown_pattern",
                    fraud_type_confidence=0.0,
                    fraud_signals={}
                )

            # 6. Compute ML Model Scores (XGBoost + MVIForest)
            ensemble = get_ensemble()
            mvi_score = 0.5
            xgb_score = 0.5
            xgb_reasons = []
            
            if "XGBoost" in limits.ensemble_layers and "MVIForest" in limits.ensemble_layers:
                mvi_score = ensemble._get_mvi_score(features)
                xgb_score, xgb_reasons = ensemble._get_xgb_score(features)
                ml_score = 0.15 * mvi_score + 0.85 * xgb_score
                model_ver = "ensemble_v2.0_mvi+xgb+rules"
                
            elif "MVIForest" in limits.ensemble_layers:
                mvi_score = ensemble._get_mvi_score(features)
                ml_score = mvi_score
                model_ver = "ensemble_v2.0_mvi+rules"
                
            else:
                ml_score = 0.05
                model_ver = "rules_only_v2.0"
                
            # Combine score with rule overrides
            final_score = max(ml_score, rule_score_override)
            final_score = float(np.clip(final_score, 0.0, 1.0))
            
            # 7. Apply Organization-specific decision thresholds
            if final_score >= threshold_block:
                label, decision = "fraud", "block"
            elif final_score >= threshold_review:
                label, decision = "suspicious", "review"
            else:
                label, decision = "safe", "allow"
                
            # Reasons compilation
            reasons = []
            reasons.extend(rule_reasons)
            reasons.extend(xgb_reasons)
            
            if not reasons:
                if decision == "block":
                    reasons = ["ML ensemble detected high risk anomaly pattern"]
                elif decision == "review":
                    reasons = ["Mildly unusual transaction — review recommended"]
                else:
                    reasons = ["Transaction within normal parameters"]
                    
            confidence = float(np.clip(1.0 - abs(final_score - 0.5) * 2, 0.5, 1.0))
            
            # 8. Run fraud type classifier
            fraud_type_classifier = FraudTypeClassifier()
            # If Model A score or rules suggest it's fraud (final_score > 0.35), classify
            if final_score >= 0.35:
                fraud_type_result = fraud_type_classifier.classify(final_score, features)
            else:
                fraud_type_result = {"fraud_type": "legitimate", "fraud_type_confidence": 1.0}

            # 9. Assemble fraud signals
            fraud_signals = {}
            f_type = fraud_type_result["fraud_type"]
            if f_type == "stolen_card":
                fraud_signals["stolen_card"] = {
                    "is_new_device": bool(stolen_card_f.get("is_new_device")),
                    "geo_mismatch": bool(stolen_card_f.get("geo_mismatch")),
                    "amount_vs_avg_ratio": stolen_card_f.get("amount_vs_avg_ratio")
                }
            elif f_type == "chargeback_fraud":
                fraud_signals["chargeback_fraud"] = {
                    "prior_dispute_count": chargeback_f.get("prior_dispute_count"),
                    "customer_dispute_rate": chargeback_f.get("customer_dispute_rate"),
                    "dispute_prone_product": bool(chargeback_f.get("dispute_prone_product"))
                }
            elif f_type == "account_takeover":
                fraud_signals["account_takeover"] = {
                    "ato_impossible_travel": bool(ato_f.get("ato_impossible_travel")),
                    "ato_password_reset": bool(ato_f.get("ato_password_reset")),
                    "ato_new_device": bool(ato_f.get("ato_new_device"))
                }
            elif f_type == "refund_fraud":
                fraud_signals["refund_fraud"] = {
                    "customer_refund_rate": refund_f.get("customer_refund_rate"),
                    "device_refund_count": refund_f.get("device_refund_count")
                }
            elif f_type == "promo_abuse":
                fraud_signals["promo_abuse"] = {
                    "device_account_count": promo_f.get("device_account_count"),
                    "ip_account_count": promo_f.get("ip_account_count"),
                    "is_new_account": bool(promo_f.get("is_new_account"))
                }
            elif f_type == "bot_attack":
                fraud_signals["bot_attack"] = {
                    "is_bot_user_agent": bool(bot_f.get("is_bot_user_agent")),
                    "requests_per_minute": bot_f.get("requests_per_minute")
                }

            result_dict = {
                "risk_score": round(final_score, 4),
                "risk_label": label,
                "decision": decision,
                "confidence": round(confidence, 4),
                "reasons": reasons[:3],
                "model_scores": {
                    "mviforest": round(float(mvi_score), 4),
                    "xgboost": round(float(xgb_score), 4),
                    "rules": round(float(rule_score_override), 4)
                },
                "model_version": model_ver,
                "fraud_type": f_type,
                "fraud_type_confidence": fraud_type_result["fraud_type_confidence"],
                "fraud_signals": fraud_signals
            }

        except Exception as e:
            logger.error(f"Fraud analysis ensemble error: {e}", exc_info=True)
            result_dict = {
                "risk_score": 0.5,
                "risk_label": "review",
                "decision": "review",
                "confidence": 0.5,
                "reasons": ["AI Core offline — manual review recommended"],
                "model_scores": {},
                "model_version": "fallback_v2.0",
                "fraud_type": "unknown_pattern",
                "fraud_type_confidence": 0.0,
                "fraud_signals": {}
            }
            
        latency_ms = int((time.time() - start) * 1000)
        
        # Clean reasons Unicode character
        clean_reasons = [r.replace('\u20b9', 'INR') for r in result_dict['reasons']]
        print(f"==> [AUDIT] Score: {result_dict['risk_score']} | Decision: {result_dict['decision']} | Reasons: {clean_reasons[:1]}")
        
        return FraudResult(
            risk_score=result_dict["risk_score"],
            risk_label=result_dict["risk_label"],
            decision=result_dict["decision"],
            confidence=result_dict["confidence"],
            reasons=clean_reasons,
            model_scores=result_dict["model_scores"],
            model_version=result_dict["model_version"],
            detection_latency_ms=latency_ms,
            features=features,
            fraud_type=result_dict["fraud_type"],
            fraud_type_confidence=result_dict["fraud_type_confidence"],
            fraud_signals=result_dict["fraud_signals"]
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
    geo_mismatch = tx.customer.country.upper() != tx.card.issuing_country.upper()
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
        # Fraud Telemetry Additions
        "device_fingerprint_hash": result.features.get("device_fingerprint_hash") if result.features else None,
        "device_first_seen": bool(result.features.get("device_first_seen")) if result.features else False,
        "customer_avg_amount_30d": Decimal(str(result.features.get("customer_avg_amount_30d"))) if (result.features and result.features.get("customer_avg_amount_30d") is not None) else None,
        "amount_vs_avg_ratio": Decimal(str(result.features.get("amount_vs_avg_ratio"))) if (result.features and result.features.get("amount_vs_avg_ratio") is not None) else None,
        "ip_geolocation_country": tx.customer.country.upper(),
        "card_issuing_country": tx.card.issuing_country.upper(),
        "geo_mismatch": geo_mismatch,
        "account_inactive_days": int(result.features.get("account_inactive_days")) if (result.features and result.features.get("account_inactive_days") is not None) else 0,
        "fraud_type_detected": result.fraud_type
    }
