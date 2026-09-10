import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, Field


class MerchantIn(BaseModel):
    id: str = Field(..., max_length=255)
    name: str = Field(..., max_length=255)
    category: str = Field(..., max_length=10, description="MCC code")
    country: str = Field(..., min_length=2, max_length=2)


class CardIn(BaseModel):
    last_four: str = Field(..., min_length=4, max_length=4)
    type: str = Field(..., max_length=50)
    issuing_country: str = Field(..., min_length=2, max_length=2)


class UpiIn(BaseModel):
    vpa: str | None = Field(default=None, max_length=255, description="Virtual Payment Address, e.g. rohit@okhdfcbank")
    app: str | None = Field(default=None, max_length=50, description="gpay, phonepe, paytm, cred, bhim, other")
    flow_type: str | None = Field(default="intent", max_length=50, description="intent, collect, qr, autopay")
    payer_name: str | None = Field(default=None, max_length=255, description="Name registered on bank UPI PSP")
    bank_ref_no: str | None = Field(default=None, max_length=50, description="12-digit NPCI RRN reference number")


class DeliveryIn(BaseModel):
    pincode: str | None = Field(default=None, max_length=10, description="6-digit postal code")
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    address_hash: str | None = Field(default=None, max_length=64, description="SHA256 of normalized shipping address")
    is_cod: bool = Field(default=False, description="Cash on Delivery order flag")


class CustomerIn(BaseModel):
    id: str = Field(..., max_length=255)
    email: str | None = Field(default=None, max_length=255)
    ip: str | None = Field(default=None, max_length=45)
    device_fingerprint: str | None = Field(default=None, max_length=255)
    country: str = Field(default="IN", min_length=2, max_length=2)
    city: str | None = Field(default=None, max_length=100)


class TransactionAnalyzeRequest(BaseModel):
    transaction_id: str = Field(..., max_length=255, description="Your external transaction id")
    amount: Decimal = Field(..., ge=0)
    currency: str = Field(default="INR", min_length=3, max_length=3)
    merchant: MerchantIn
    card: CardIn | None = Field(default=None, description="Optional when transaction is UPI or NetBanking")
    upi: UpiIn | None = Field(default=None, description="Native UPI payment telemetry")
    delivery: DeliveryIn | None = Field(default=None, description="Shipping & RTO delivery telemetry")
    customer: CustomerIn
    channel: str = Field(default="web", max_length=50)
    payment_method: str = Field(default="upi", max_length=50, description="upi, card, netbanking, cod, wallet")
    gateway: str | None = Field(default=None, max_length=50, description="razorpay, cashfree, phonepe, payu, stripe")
    metadata: dict[str, Any] = Field(default_factory=dict)


class TransactionAnalyzeResponse(BaseModel):
    transaction_id: str
    risk_score: float
    risk_label: str
    decision: str
    confidence: float
    detection_latency_ms: int
    reasons: list[str]
    model_version: str
    model_scores: dict[str, float] | None = None
    fraud_type: str | None = None
    fraud_type_confidence: float | None = None
    fraud_signals: dict[str, Any] | None = None
    signals_json: dict[str, Any] | None = None
    decision_details: dict[str, Any] | None = None
    challenge_method: str | None = None
    top_signals: list[dict[str, Any]] | None = None
    explanation: str | None = None
    upi_signals: dict[str, Any] | None = None
    rto_risk_score: int | None = None
    cod_recommendation: str | None = None
    processed_at: datetime
