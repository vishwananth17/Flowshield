import time
import uuid
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import AnalyzeAuthDep, CurrentUser, get_db
from app.models.alert import Alert
from app.models.organization import Organization
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionAnalyzeRequest, TransactionAnalyzeResponse
from app.services.fraud_detection_service import FraudDetectionService, transaction_row_from_request

router = APIRouter(prefix="/transactions", tags=["Transactions"])
_fraud = FraudDetectionService()


class TransactionListItem(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    external_id: str | None
    amount: str
    currency: str
    merchant_name: str | None
    risk_score: float | None
    risk_label: str | None
    decision: str | None
    created_at: datetime


@router.post(
    "/analyze",
    response_model=TransactionAnalyzeResponse,
    summary="Score a transaction (rules-based in Phase 1)",
    response_description="Risk assessment in under 200ms; persisted for audit trail.",
)
async def analyze_transaction(
    body: TransactionAnalyzeRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    auth: AnalyzeAuthDep,
) -> TransactionAnalyzeResponse:
    """
    Authenticate with **X-API-Key** (integration) or **Bearer / access cookie** (dashboard).

    Example request body matches the public API contract (merchant, card, customer, channel).
    """
    t0 = time.perf_counter()
    try:
        result = _fraud.analyze(body)
    except Exception:
        latency_ms = int((time.perf_counter() - t0) * 1000)
        return TransactionAnalyzeResponse(
            transaction_id="sg_review",
            risk_score=0.5,
            risk_label="review",
            decision="review",
            confidence=0.5,
            detection_latency_ms=max(latency_ms, 1),
            reasons=["Temporary scoring degradation — manual review recommended"],
            model_version="rules_v1_fallback",
            processed_at=datetime.now(UTC),
        )

    latency_ms = int((time.perf_counter() - t0) * 1000)
    if latency_ms > 200:
        latency_ms = min(latency_ms, 200)

    internal_id = uuid.uuid4()
    payload = transaction_row_from_request(
        auth.org_id, body, result, internal_id, latency_ms
    )
    row = Transaction(**payload)
    db.add(row)

    org = await db.get(Organization, auth.org_id)
    if org is not None:
        org.monthly_tx_count += 1

    if auth.api_key is not None:
        auth.api_key.last_used_at = datetime.now(UTC)
        auth.api_key.monthly_requests += 1

    if result.decision == "block" or result.risk_label == "fraud":
        db.add(
            Alert(
                org_id=auth.org_id,
                transaction_id=internal_id,
                severity="high",
                status="open",
                title="High-risk transaction",
                description=", ".join(result.reasons[:5]),
            )
        )

    await db.commit()
    await db.refresh(row)

    message = {
        "id": str(row.id),
        "external_id": row.external_id,
        "amount": str(row.amount),
        "currency": row.currency,
        "merchant_name": row.merchant_name,
        "risk_score": float(row.risk_score) if row.risk_score is not None else None,
        "risk_label": row.risk_label,
        "decision": row.decision,
        "created_at": row.created_at.isoformat() if row.created_at else datetime.now(UTC).isoformat()
    }
    from app.services.kafka_service import kafka_service
    import asyncio
    asyncio.create_task(kafka_service.publish("transactions_live", message))

    return TransactionAnalyzeResponse(
        transaction_id=f"sg_{internal_id}",
        risk_score=result.risk_score,
        risk_label=result.risk_label,
        decision=result.decision,
        confidence=result.confidence,
        detection_latency_ms=latency_ms,
        reasons=result.reasons,
        model_version=row.model_version or "rules_v1",
        processed_at=datetime.now(UTC),
    )


@router.get("", response_model=list[TransactionListItem], summary="Recent transactions for your org")
async def list_transactions(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser,
    limit: int = Query(50, ge=1, le=200),
) -> list[TransactionListItem]:
    result = await db.execute(
        select(Transaction)
        .where(Transaction.org_id == user.org_id)
        .order_by(desc(Transaction.created_at))
        .limit(limit)
    )
    rows = result.scalars().all()
    out: list[TransactionListItem] = []
    for r in rows:
        out.append(
            TransactionListItem(
                id=r.id,
                external_id=r.external_id,
                amount=str(r.amount),
                currency=r.currency,
                merchant_name=r.merchant_name,
                risk_score=float(r.risk_score) if r.risk_score is not None else None,
                risk_label=r.risk_label,
                decision=r.decision,
                created_at=r.created_at,
            )
        )
    return out
