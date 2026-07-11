import datetime
import uuid
from sqlalchemy import DateTime, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from decimal import Decimal

from app.models.base import Base


class ModelComparisonLog(Base):
    __tablename__ = "model_comparison_log"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transaction_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    production_model_version: Mapped[str] = mapped_column(String(50), nullable=False)
    production_score: Mapped[Decimal] = mapped_column(Numeric(5, 4), nullable=False)
    candidate_model_version: Mapped[str] = mapped_column(String(50), nullable=False)
    candidate_score: Mapped[Decimal] = mapped_column(Numeric(5, 4), nullable=False)
    actual_label: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
