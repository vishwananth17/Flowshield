import json
from decimal import Decimal
from datetime import datetime, UTC
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser, get_db
from app.models.customer_refund_history import CustomerRefundHistory

router = APIRouter(prefix="/refund-events", tags=["Refund Events"])

class RefundEventCreate(BaseModel):
    customer_id: str = Field(..., max_length=255)
    customer_email: str | None = Field(default=None, max_length=255)
    device_fingerprint_hash: str | None = Field(default=None, max_length=64)
    refund_amount: Decimal = Field(..., ge=0)
    order_id: str = Field(..., max_length=255)
    reason: str | None = Field(default=None, max_length=255)

@router.post("", status_code=status.HTTP_201_CREATED)
async def log_refund_event(
    body: RefundEventCreate,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db)
):
    # Fetch or create customer refund history
    stmt = select(CustomerRefundHistory).where(
        CustomerRefundHistory.org_id == user.org_id,
        CustomerRefundHistory.customer_id == body.customer_id
    ).limit(1)
    result = await db.execute(stmt)
    history = result.scalar_one_or_none()

    if not history:
        history = CustomerRefundHistory(
            org_id=user.org_id,
            customer_id=body.customer_id,
            customer_email=body.customer_email,
            device_fingerprint_hash=body.device_fingerprint_hash,
            total_orders=1,
            total_refunds=1,
            refund_rate=Decimal("1.0000"),
            total_refund_amount=body.refund_amount,
            last_refund_at=datetime.now(UTC),
            is_flagged=False
        )
        db.add(history)
    else:
        history.total_orders += 1
        history.total_refunds += 1
        history.total_refund_amount += body.refund_amount
        history.last_refund_at = datetime.now(UTC)
        if history.total_orders > 0:
            history.refund_rate = Decimal(str(history.total_refunds / history.total_orders))
        if history.refund_rate > Decimal("0.30"):
            history.is_flagged = True

    await db.commit()

    # Invalidate Redis cache for this customer
    try:
        from app.core.config import get_settings
        import redis.asyncio as async_redis
        settings = get_settings()
        redis_client = async_redis.from_url(settings.redis_url, decode_responses=True)
        refund_key = f"refund_history:{user.org_id}:{body.customer_email or ''}"
        await redis_client.delete(refund_key)
        if body.device_fingerprint_hash:
            device_refund_key = f"device_refunds:{user.org_id}:{body.device_fingerprint_hash}"
            await redis_client.incr(device_refund_key)
            await redis_client.expire(device_refund_key, 86400 * 30)
    except Exception:
        pass

    return {"status": "refund_logged"}
