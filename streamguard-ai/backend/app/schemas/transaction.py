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


class CustomerIn(BaseModel):
    id: str = Field(..., max_length=255)
    ip: str | None = Field(default=None, max_length=45)
    device_fingerprint: str | None = Field(default=None, max_length=255)
    country: str = Field(..., min_length=2, max_length=2)
    city: str | None = Field(default=None, max_length=100)


class TransactionAnalyzeRequest(BaseModel):
    transaction_id: str = Field(..., max_length=255, description="Your external transaction id")
    amount: Decimal = Field(..., ge=0)
    currency: str = Field(..., min_length=3, max_length=3)
    merchant: MerchantIn
    card: CardIn
    customer: CustomerIn
    channel: str = Field(default="web", max_length=50)
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
    processed_at: datetime
