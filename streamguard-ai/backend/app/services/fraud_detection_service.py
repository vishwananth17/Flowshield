import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal

from app.schemas.transaction import TransactionAnalyzeRequest

SANCTIONED_COUNTRIES = frozenset({"IR", "KP", "SY"})
HIGH_RISK_MCC_PREFIXES = ("7995", "4829", "5960", "6211")
NIGHT_HOURS = {23, 0, 1, 2, 3, 4, 5}
MODEL_VERSION = "rules_v1"


@dataclass
class FraudResult:
    risk_score: float
    risk_label: str
    decision: str
    confidence: float
    reasons: list[str]


def _classify(score: float) -> tuple[str, str]:
    if score < 0.3:
        return "safe", "allow"
    if score < 0.55:
        return "suspicious", "review"
    if score < 0.75:
        return "review", "review"
    return "fraud", "block"


class FraudDetectionService:
    """Phase-1 rule-based scorer. ML ensemble replaces this in later phases."""

    def analyze(self, tx: TransactionAnalyzeRequest) -> FraudResult:
        reasons: list[str] = []
        score = 0.12

        amt = float(tx.amount)
        if amt > 100_000 and tx.customer.country != tx.card.issuing_country:
            score = max(score, 0.95)
            reasons.append("High-value cross-border transaction")

        if tx.customer.country in SANCTIONED_COUNTRIES:
            score = 1.0
            reasons.append("Transaction from sanctioned jurisdiction")

        if amt >= 50_000:
            score = max(score, 0.55)
            reasons.append("Very high transaction amount")

        if amt >= 10_000 and tx.channel == "web":
            score = max(score, 0.35)
            reasons.append("Elevated amount for web channel")

        mcc = tx.merchant.category
        if any(mcc.startswith(p) for p in HIGH_RISK_MCC_PREFIXES):
            score = max(score, 0.45)
            reasons.append("High-risk merchant category")

        if tx.customer.country != tx.card.issuing_country:
            score = max(score, 0.4)
            reasons.append("IP geolocation mismatch with card country")

        if tx.customer.country != tx.merchant.country:
            score = max(score, 0.22)
            reasons.append("Customer country differs from merchant country")

        now = datetime.now(UTC)
        if now.hour in NIGHT_HOURS:
            score = max(score, 0.28)
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
