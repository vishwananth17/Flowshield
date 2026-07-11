import sys, os
import uuid
import time
import logging
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

class FraudDetectionService:
    """Production Ensemble Scorer: AST Rules + MVI Anomaly + XGBoost Classifier."""

    async def analyze(
        self, 
        tx: TransactionAnalyzeRequest, 
        plan: str = "free", 
        db: AsyncSession = None, 
        org_id: uuid.UUID = None
    ) -> FraudResult:
        from app.ml.ensemble import get_ensemble
        from app.core.billing_config import get_plan_limits
        from app.ml.features.feature_engineer import UnifiedFeatureEngineer
        from app.services.rule_evaluator import SafeRuleEvaluator
        import redis.asyncio as async_redis
        from app.core.config import get_settings
        
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
            # 2. Extract features using UnifiedFeatureEngineer
            settings = get_settings()
            redis_client = async_redis.from_url(settings.redis_url, decode_responses=True)
            feat_eng = UnifiedFeatureEngineer(redis_client)
            
            # Since compute_inference_vector is async, await it
            features = await feat_eng.compute_inference_vector(tx, db)
            
            # 3. Evaluate Hard Rules (Pre-computation precedence layer)
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
                    features=features
                )

            # 4. Compute ML Model Scores (XGBoost + MVIForest)
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
            
            # 5. Apply Organization-specific decision thresholds
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
                "model_version": model_ver
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
                "model_version": "fallback_v2.0"
            }
            
        latency_ms = int((time.time() - start) * 1000)
        
        # Clean reasons Unicode character ₹ -> INR
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
            features=features
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
