import uuid
from datetime import datetime

from sqlalchemy import DateTime, Integer, String, func
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


from typing import TYPE_CHECKING  # noqa: E402

if TYPE_CHECKING:
    from app.models.api_key import ApiKey
    from app.models.user import User
