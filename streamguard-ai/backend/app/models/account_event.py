import uuid
from datetime import datetime
from typing import Any
from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID, INET, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base

class AccountEvent(Base):
    __tablename__ = "account_events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    org_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True
    )
    customer_id: Mapped[str] = mapped_column(String(255), nullable=False)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    event_metadata: Mapped[dict[str, Any] | None] = mapped_column(JSONB, server_default="{}", nullable=True)
    ip_address: Mapped[str | None] = mapped_column(INET, nullable=True)
    ip_country: Mapped[str | None] = mapped_column(String(2), nullable=True)
    device_fingerprint_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
