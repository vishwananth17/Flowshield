import uuid
from typing import Any
from datetime import datetime, UTC
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser, get_db
from app.models.account_event import AccountEvent
from app.models.customer_session import CustomerSession

router = APIRouter(prefix="/account-events", tags=["Account Events"])

class AccountEventCreate(BaseModel):
    customer_id: str = Field(..., max_length=255)
    event_type: str = Field(..., max_length=50)
    event_metadata: dict[str, Any] = Field(default_factory=dict)
    ip_address: str | None = Field(default=None, max_length=45)
    ip_country: str | None = Field(default=None, max_length=2)
    device_fingerprint_hash: str | None = Field(default=None, max_length=64)

@router.post("", status_code=status.HTTP_201_CREATED)
async def log_account_event(
    body: AccountEventCreate,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db)
):
    event = AccountEvent(
        org_id=user.org_id,
        customer_id=body.customer_id,
        event_type=body.event_type,
        event_metadata=body.event_metadata,
        ip_address=body.ip_address,
        ip_country=body.ip_country,
        device_fingerprint_hash=body.device_fingerprint_hash,
        created_at=datetime.now(UTC)
    )
    db.add(event)

    if body.event_type == "login" and body.ip_address:
        session = CustomerSession(
            org_id=user.org_id,
            customer_id=body.customer_id,
            session_id=body.event_metadata.get("session_id", uuid.uuid4().hex),
            ip_address=body.ip_address,
            ip_country=body.ip_country or "IN",
            ip_city=body.event_metadata.get("city", "Mumbai"),
            device_fingerprint_hash=body.device_fingerprint_hash,
            login_at=datetime.now(UTC)
        )
        db.add(session)

    await db.commit()
    return {"status": "event_logged"}
