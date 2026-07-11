import uuid
from datetime import datetime

from decimal import Decimal
from sqlalchemy import DateTime, Integer, String, Numeric, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    plan: Mapped[str] = mapped_column(String(20), default="free")
    plan_interval: Mapped[str | None] = mapped_column(String(10), nullable=True) # monthly | annual
    
    # Razorpay Specifics
    razorpay_customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    razorpay_subscription_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    subscription_status: Mapped[str] = mapped_column(String(20), default="active") # active | past_due | cancelled | paused
    
    subscription_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    subscription_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    trial_ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Risk Engine thresholds
    threshold_review: Mapped[Decimal] = mapped_column(Numeric(5, 4), default=Decimal("0.4000"), nullable=False)
    threshold_block: Mapped[Decimal] = mapped_column(Numeric(5, 4), default=Decimal("0.8000"), nullable=False)

    # Usage Limits
    monthly_request_limit: Mapped[int] = mapped_column(Integer, default=1000)
    monthly_request_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # Legacy / Mixed fields (can be migrated/cleaned later)
    stripe_customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    stripe_subscription_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    billing_period_start: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    users: Mapped[list["User"]] = relationship("User", back_populates="organization")
    api_keys: Mapped[list["ApiKey"]] = relationship("ApiKey", back_populates="organization")

    from sqlalchemy.orm import validates
    @validates("threshold_review", "threshold_block")
    def validate_thresholds(self, key, value):
        if value is None:
            return value
        val = Decimal(str(value))
        if val < Decimal("0.0") or val > Decimal("1.0"):
            raise ValueError(f"{key} must be between 0.0 and 1.0")
        
        if key == "threshold_review":
            if self.threshold_block is not None and val > Decimal(str(self.threshold_block)):
                raise ValueError("threshold_review cannot be greater than threshold_block")
        elif key == "threshold_block":
            if self.threshold_review is not None and val < Decimal(str(self.threshold_review)):
                raise ValueError("threshold_block cannot be less than threshold_review")
                
        return val


from typing import TYPE_CHECKING  # noqa: E402

if TYPE_CHECKING:
    from app.models.api_key import ApiKey
    from app.models.user import User
