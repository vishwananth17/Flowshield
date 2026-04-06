import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    external_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    merchant_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    merchant_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    merchant_category: Mapped[str | None] = mapped_column(String(10), nullable=True)
    card_last_four: Mapped[str | None] = mapped_column(String(4), nullable=True)
    card_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    customer_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    customer_country: Mapped[str | None] = mapped_column(String(2), nullable=True)
    customer_city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    device_fingerprint: Mapped[str | None] = mapped_column(String(255), nullable=True)
    channel: Mapped[str | None] = mapped_column(String(50), nullable=True)
    risk_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 4), nullable=True)
    risk_label: Mapped[str | None] = mapped_column(String(20), nullable=True)
    decision: Mapped[str | None] = mapped_column(String(20), nullable=True)
    fraud_reasons: Mapped[list[Any]] = mapped_column(
        JSONB, nullable=False, server_default="[]"
    )
    model_version: Mapped[str | None] = mapped_column(String(50), nullable=True)
    detection_latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_confirmed_fraud: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    alerts: Mapped[list["Alert"]] = relationship("Alert", back_populates="transaction")


from typing import TYPE_CHECKING  # noqa: E402

if TYPE_CHECKING:
    from app.models.alert import Alert
