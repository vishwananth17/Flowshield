import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class TransactionOutcome(Base):
    __tablename__ = "transaction_outcomes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    transaction_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("transactions.id"), nullable=False, index=True
    )
    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True
    )
    original_decision: Mapped[str | None] = mapped_column(String(20), nullable=True)
    original_risk_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 4), nullable=True)
    outcome_type: Mapped[str] = mapped_column(String(30), nullable=False)
    outcome_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    days_after_transaction: Mapped[int | None] = mapped_column(Integer, nullable=True)
    outcome_source: Mapped[str | None] = mapped_column(String(30), nullable=True)
    feedback_label: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )

    transaction: Mapped["Transaction"] = relationship("Transaction", back_populates="outcomes")


from typing import TYPE_CHECKING  # noqa: E402
if TYPE_CHECKING:
    from app.models.transaction import Transaction
