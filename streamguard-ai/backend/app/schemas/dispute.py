import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any, List, Optional
from pydantic import BaseModel, Field


class DisputeCreate(BaseModel):
    dispute_reference: str = Field(..., description="Razorpay dispute ID or bank reference number")
    payment_gateway: str = Field(..., description="razorpay | cashfree | payu | stripe | manual")
    dispute_type: str = Field(..., description="chargeback | dispute | upi_complaint | refund_claim")
    dispute_reason: Optional[str] = Field(None, description="Reason code from payment gateway")
    dispute_amount: Decimal = Field(..., description="Amount of the disputed transaction")
    currency: str = Field("INR", description="Three-letter currency code")
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    order_id: Optional[str] = None
    order_date: Optional[datetime] = None
    dispute_raised_at: datetime
    response_deadline: datetime
    external_transaction_id: Optional[str] = None


class DisputeUpdate(BaseModel):
    status: Optional[str] = None
    outcome: Optional[str] = None
    merchant_notes: Optional[str] = None


class EvidenceUpdate(BaseModel):
    is_included_in_response: Optional[bool] = None


class EvidenceCreate(BaseModel):
    evidence_type: str
    evidence_source: str = "manual_upload"
    file_url: Optional[str] = None
    content_text: Optional[str] = None
    is_included_in_response: bool = True
    display_order: int = 0


class EvidenceResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    dispute_id: uuid.UUID
    evidence_type: str
    evidence_source: str
    file_url: Optional[str]
    content_text: Optional[str]
    is_included_in_response: bool
    display_order: int
    created_at: datetime


class TimelineResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    dispute_id: uuid.UUID
    event_type: str
    event_description: str
    triggered_by: str
    created_at: datetime


class DisputeListItemResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    dispute_reference: str
    order_id: Optional[str]
    payment_gateway: str
    dispute_type: str
    dispute_reason: Optional[str]
    dispute_amount: float
    currency: str
    customer_name: Optional[str]
    customer_email: Optional[str]
    status: str
    outcome: Optional[str]
    response_deadline: datetime
    urgency: str
    evidence_strength_score: int
    created_at: datetime


class DisputeDetailResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    org_id: uuid.UUID
    dispute_reference: str
    transaction_id: Optional[uuid.UUID]
    external_transaction_id: Optional[str]
    payment_gateway: str
    dispute_type: str
    dispute_reason: Optional[str]
    dispute_amount: float
    currency: str
    customer_name: Optional[str]
    customer_email: Optional[str]
    customer_phone: Optional[str]
    order_id: Optional[str]
    order_date: Optional[datetime]
    dispute_raised_at: datetime
    response_deadline: datetime
    status: str
    outcome: Optional[str]
    outcome_date: Optional[datetime]
    auto_evidence_gathered: bool
    response_document_url: Optional[str]
    ml_risk_score: Optional[float]
    ml_fraud_signals: list[Any]
    merchant_notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    evidence: List[EvidenceResponse]
    timeline: List[TimelineResponse]
    days_remaining: int
    urgency: str
    evidence_strength_score: int
    recommended_action: str


class DisputeStatsResponse(BaseModel):
    total_disputes: int
    open: int
    won: int
    lost: int
    accepted: int
    win_rate: float
    total_amount_at_risk: float
    total_amount_recovered: float
    avg_response_time_hours: float
    disputes_by_gateway: dict
    disputes_by_reason: dict
    upcoming_deadlines: list
