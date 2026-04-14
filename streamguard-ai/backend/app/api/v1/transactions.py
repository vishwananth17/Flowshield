import asyncio
import time
import uuid
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import AnalyzeAuthDep, CurrentUser, get_db
from app.core.websockets import ws_manager
from app.core.kafka import kafka_streamer
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
    summary="Score a transaction (ML + Rules)",
    response_description="Risk assessment with persistence and live dashboard broadcast.",
)
async def analyze_transaction(
    body: TransactionAnalyzeRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    auth: AnalyzeAuthDep,
) -> TransactionAnalyzeResponse:
    # 1. Start timer for latency tracking
    start_time = time.perf_counter()
    
    # 2. Run analysis (ML + Rules Engine)
    result = _fraud.analyze(body)
    
    # 3. Calculate latency
    latency_ms = int((time.perf_counter() - start_time) * 1000)
    
    # 4. Persistence
    internal_id = uuid.uuid4()
    row_data = transaction_row_from_request(
        auth.org_id, body, result, internal_id, latency_ms
    )
    
    # Add to DB
    new_tx = Transaction(**row_data)
    db.add(new_tx)
    await db.commit()
    
    # 5. Background Tasks (Alerting)
    asyncio.create_task(_fraud.process_auto_alert(auth.org_id, body, result, internal_id))

    # 6. WebSocket Broadcast (Dashboard Live Feed)
    await ws_manager.broadcast({
        "type": "new_transaction",
        "org_id": str(auth.org_id),
        "data": {
            "id": str(internal_id),
            "external_id": body.transaction_id,
            "merchant_name": body.merchant.name,
            "amount": float(body.amount),
            "currency": body.currency,
            "risk_score": result.risk_score,
            "risk_label": result.risk_label,
            "decision": result.decision,
            "created_at": datetime.now(UTC).isoformat()
        }
    }, org_id=auth.org_id)

    # 7. Kafka (Optional - enabled if configured)
    try:
        if kafka_streamer.producer:
            await kafka_streamer.send_transaction(row_data)
    except Exception:
        pass # Don't block API if Kafka is down

    return {
        "transaction_id": str(internal_id),
        "risk_score": result.risk_score,
        "risk_label": result.risk_label,
        "decision": result.decision,
        "confidence": result.confidence,
        "detection_latency_ms": latency_ms,
        "reasons": result.reasons,
        "model_version": "ensemble_v2",
        "processed_at": datetime.now(UTC),
    }



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
@router.post("/simulate", summary="Trigger synthetic traffic burst (Demo Only)")
async def simulate_traffic(
    auth: AnalyzeAuthDep,
    db: Annotated[AsyncSession, Depends(get_db)],
    count: int = Query(5, ge=1, le=20)
):
    """
    Synthesize mock transactions to demonstrate live dashboard updates.
    """
    from app.schemas.transaction import MerchantIn, CardIn, CustomerIn
    import random
    
    scenarios = [
        {"amount": 49.99, "email": "legit.user@gmail.com", "country": "US", "label": "SAFE"},
        {"amount": 12500, "email": "bot_998877@tempmail.com", "country": "RU", "label": "FRAUD"},
        {"amount": 850, "email": "john.doe@yahoo.com", "country": "NG", "label": "REVIEW"},
    ]
    
    for i in range(count):
        scene = random.choice(scenarios)
        tx_req = TransactionAnalyzeRequest(
            transaction_id=f"sim_{uuid.uuid4().hex[:8]}",
            amount=scene["amount"],
            currency="USD",
            merchant=MerchantIn(id="m_sim_store", name="Simulated Store", category="5411", country="US"),
            card=CardIn(last_four=str(random.randint(1000, 9999)), type="credit", issuing_country="US"),
            customer=CustomerIn(id=f"c_{uuid.uuid4().hex[:8]}", email=scene["email"], country=scene["country"], ip="127.0.0.1"),
            channel="web"
        )
        
        # We call the internal logic
        await analyze_transaction(tx_req, db, auth)
        await asyncio.sleep(0.5) # Space them out for the websocket effect
        
    return {"status": "simulation_triggered", "count": count}
