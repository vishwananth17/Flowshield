from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TransactionRequest(BaseModel):
    transaction_id: str
    user_id: str
    amount: float
    currency: str
    location: str
    device_id: str
    timestamp: datetime

class TransactionResponse(BaseModel):
    transaction_id: str
    fraud_risk_score: float
    status: str
    recommendation: str

class AlertResponse(BaseModel):
    transaction_id: str
    user_id: str
    amount: float
    fraud_risk_score: float
    status: str
    timestamp: datetime

class ModelStatusResponse(BaseModel):
    model_name: str
    status: str
    version: str
    accuracy_estimate: float
