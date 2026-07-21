import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import DateTime, ForeignKey, Integer, String, Boolean, Numeric, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base

class CustomerDisputeHistory(Base):
    __tablename__ = "customer_dispute_history"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    org_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True
    )
    customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    customer_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    customer_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    dispute_count: Mapped[int] = mapped_column(Integer, default=1)
    dispute_won_count: Mapped[int] = mapped_column(Integer, default=0)
    dispute_lost_count: Mapped[int] = mapped_column(Integer, default=0)
    total_disputed_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"))
    last_dispute_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    dispute_rate: Mapped[Decimal] = mapped_column(Numeric(5, 4), default=Decimal("0.0000"))
    is_flagged_chargeback_risk: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
