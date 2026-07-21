import uuid
from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, String, Boolean, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base

class PromoAbuseSignal(Base):
    __tablename__ = "promo_abuse_signals"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    org_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True
    )
    signal_type: Mapped[str] = mapped_column(String(30), nullable=False)
    signal_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    account_count: Mapped[int] = mapped_column(Integer, default=1)
    order_count: Mapped[int] = mapped_column(Integer, default=0)
    promo_use_count: Mapped[int] = mapped_column(Integer, default=0)
    first_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    is_flagged: Mapped[bool] = mapped_column(Boolean, default=False)
