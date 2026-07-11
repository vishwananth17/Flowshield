import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Dispute(Base):
    __tablename__ = "disputes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    dispute_reference: Mapped[str] = mapped_column(String(255), nullable=False)
    transaction_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("transactions.id"), nullable=True
    )
    external_transaction_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    payment_gateway: Mapped[str] = mapped_column(String(50), nullable=False)
    dispute_type: Mapped[str] = mapped_column(String(50), nullable=False)
    dispute_reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    dispute_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), server_default="INR", default="INR")
    customer_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    customer_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    customer_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    order_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    order_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    dispute_raised_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    response_deadline: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(30), server_default="open", default="open")
    outcome: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    outcome_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    auto_evidence_gathered: Mapped[bool] = mapped_column(Boolean, server_default="false", default=False)
    response_document_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ml_risk_score: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 4), nullable=True)
    ml_fraud_signals: Mapped[list[Any]] = mapped_column(
        JSONB, server_default="'[]'::jsonb", default=list
    )
    merchant_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    evidence: Mapped[list["DisputeEvidence"]] = relationship(
        "DisputeEvidence", back_populates="dispute", cascade="all, delete-orphan"
    )
    timeline: Mapped[list["DisputeTimeline"]] = relationship(
        "DisputeTimeline", back_populates="dispute", cascade="all, delete-orphan"
    )
    reminders: Mapped[list["DisputeReminder"]] = relationship(
        "DisputeReminder", back_populates="dispute", cascade="all, delete-orphan"
    )


class DisputeEvidence(Base):
    __tablename__ = "dispute_evidence"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    dispute_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("disputes.id", ondelete="CASCADE"), nullable=False
    )
    evidence_type: Mapped[str] = mapped_column(String(50), nullable=False)
    evidence_source: Mapped[str] = mapped_column(String(30), nullable=False)
    file_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    content_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_included_in_response: Mapped[bool] = mapped_column(Boolean, server_default="true", default=True)
    display_order: Mapped[int] = mapped_column(Integer, server_default="0", default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    dispute: Mapped["Dispute"] = relationship("Dispute", back_populates="evidence")


class DisputeTimeline(Base):
    __tablename__ = "dispute_timeline"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    dispute_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("disputes.id", ondelete="CASCADE"), nullable=False
    )
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    event_description: Mapped[str] = mapped_column(Text, nullable=False)
    triggered_by: Mapped[str] = mapped_column(String(20), server_default="system", default="system")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    dispute: Mapped["Dispute"] = relationship("Dispute", back_populates="timeline")


class DisputeReminder(Base):
    __tablename__ = "dispute_reminders"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    dispute_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("disputes.id", ondelete="CASCADE"), nullable=False
    )
    remind_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    reminder_type: Mapped[str] = mapped_column(String(20), nullable=False)
    days_before_deadline: Mapped[int] = mapped_column(Integer, nullable=False)
    sent: Mapped[bool] = mapped_column(Boolean, server_default="false", default=False)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    dispute: Mapped["Dispute"] = relationship("Dispute", back_populates="reminders")
