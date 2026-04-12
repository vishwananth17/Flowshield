import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal

from app.schemas.transaction import TransactionAnalyzeRequest
from app.ml.model import ml_model

SANCTIONED_COUNTRIES = frozenset({"IR", "KP", "SY"})
HIGH_RISK_MCC_PREFIXES = ("7995", "4829", "5960", "6211")
NIGHT_HOURS = {23, 0, 1, 2, 3, 4, 5}
MODEL_VERSION = "ensemble_v2_isolation_forest"


@dataclass
class FraudResult:
    risk_score: float
    risk_label: str
    decision: str
    confidence: float
    reasons: list[str]
    risk_weights: dict[str, float]


def _classify(score: float) -> tuple[str, str]:
    if score < 0.35:
        return "safe", "allow"
    if score < 0.6:
        return "suspicious", "review"
    if score < 0.8:
        return "review", "review"
    return "fraud", "block"


class FraudDetectionService:
    """Phase-3 Ensemble Scorer coupling Isolation Forest anomaly patterns with static rules."""

    def analyze(self, tx: TransactionAnalyzeRequest) -> FraudResult:
        reasons: list[str] = []
        weights: dict[str, float] = {}
        
        now = datetime.now(UTC)
        is_cb = tx.customer.country != tx.card.issuing_country
        
        # Invoke Sci-Kit Learn Model
        ml_score = ml_model.predict_risk(float(tx.amount), now.hour, is_cb)
        
        # Start base score with ML insights
        score = ml_score
        weights["ai_anomaly"] = round(ml_score, 2)
        
        if ml_score > 0.6:
            reasons.append(f"AI Anomaly Model spotted high deviation (score: {ml_score:.2f})")

        # Digital Footprint: Email Reputation Logic
        if tx.customer.email:
            email = tx.customer.email.lower()
            disposable_domains = {"tempmail.com", "guerrillamail.com", "sharklasers.com", "10minutemail.com"}
            domain = email.split("@")[-1] if "@" in email else ""
            
            if domain in disposable_domains:
                score = max(score, 0.85)
                weights["disposable_email"] = 0.85
                reasons.append("Disposable email provider detected")
            
            # Simulated: Unusual username patterns (e.g. lots of numbers)
            username = email.split("@")[0]
            if sum(c.isdigit() for c in username) > 5:
                score = max(score, 0.45)
                weights["email_entropy"] = 0.35
                reasons.append("High entropy email username (bot signature)")

        amt = float(tx.amount)
        if amt > 100_000 and is_cb:
            score = max(score, 0.95)
            weights["high_value_cb"] = 0.95
            reasons.append("High-value cross-border transaction")

        if tx.customer.country in SANCTIONED_COUNTRIES:
            score = 1.0
            weights["sanctioned_region"] = 1.0
            reasons.append("Transaction from sanctioned jurisdiction")

        if amt >= 50_000:
            score = max(score, 0.55)
            weights["amount_threshold"] = 0.55
            reasons.append("Very high transaction amount")

        if amt >= 10_000 and tx.channel == "web":
            score = max(score, 0.35)
            weights["web_high_amount"] = 0.35
            reasons.append("Elevated amount for web channel")

        mcc = tx.merchant.category
        if any(mcc.startswith(p) for p in HIGH_RISK_MCC_PREFIXES):
            score = max(score, 0.45)
            weights["mcc_risk"] = 0.45
            reasons.append("High-risk merchant category")

        if is_cb:
            score = max(score, 0.4)
            weights["geolocation_mismatch"] = 0.4
            reasons.append("IP geolocation mismatch with card country")

        if tx.customer.country != tx.merchant.country:
            score = max(score, 0.22)
            weights["merchant_distance"] = 0.22
            reasons.append("Customer country differs from merchant country")

        now = datetime.now(UTC)
        if now.hour in NIGHT_HOURS:
            score = max(score, 0.28)
            weights["unusual_hour"] = 0.28
            reasons.append("Unusual transaction hour")

        if not reasons:
            reasons.append("No elevated risk signals detected")

        label, decision = _classify(score)
        confidence = min(0.99, max(score, 0.05))

        return FraudResult(
            risk_score=round(min(score, 1.0), 4),
            risk_label=label,
            decision=decision,
            confidence=round(confidence, 4),
            reasons=reasons[:12],
            risk_weights=weights
        )

    async def process_auto_alert(
        self,
        org_id: uuid.UUID,
        tx: TransactionAnalyzeRequest,
        result: FraudResult,
        internal_id: uuid.UUID
    ):
        """Non-blocking background task to generate alerts for suspicious transactions."""
        severity = None
        if result.risk_score >= 0.95:
            severity = "critical"
            title = f"Critical fraud detected — {tx.merchant.name}"
        elif result.risk_score >= 0.85:
            severity = "high"
            title = f"High-risk transaction flagged — {tx.merchant.name}"
        elif result.risk_score >= 0.70:
            severity = "medium"
            title = f"Suspicious transaction — {tx.merchant.name}"
        
        if severity:
            from app.services.alert_service import AlertService
            description = (
                f"Transaction SG_{str(internal_id)[:8].upper()} for {tx.currency.upper()} {tx.amount} at {tx.merchant.name} "
                f"received a risk score of {result.risk_score:.2f}. "
                f"Top reasons: {', '.join(result.reasons[:2])}."
            )
            await AlertService.create_alert(
                org_id=org_id,
                transaction_id=internal_id,
                severity=severity,
                title=title,
                description=description
            )


def transaction_row_from_request(
    org_id: uuid.UUID,
    tx: TransactionAnalyzeRequest,
    result: FraudResult,
    internal_id: uuid.UUID,
    latency_ms: int,
) -> dict[str, object]:
    return {
        "id": internal_id,
        "org_id": org_id,
        "external_id": tx.transaction_id,
        "amount": tx.amount,
        "currency": tx.currency.upper(),
        "merchant_id": tx.merchant.id,
        "merchant_name": tx.merchant.name,
        "merchant_category": tx.merchant.category,
        "card_last_four": tx.card.last_four,
        "card_type": tx.card.type,
        "customer_id": tx.customer.id,
        "customer_ip": tx.customer.ip,
        "customer_country": tx.customer.country.upper(),
        "customer_city": tx.customer.city,
        "device_fingerprint": tx.customer.device_fingerprint,
        "channel": tx.channel,
        "risk_score": Decimal(str(result.risk_score)),
        "risk_label": result.risk_label,
        "decision": result.decision,
        "fraud_reasons": result.reasons,
        "model_version": MODEL_VERSION,
        "detection_latency_ms": latency_ms,
        "is_confirmed_fraud": None,
    }
