from pydantic import BaseModel, Field
from typing import Optional, List
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

# ------------------------------------------------------------
# Authentication Schemas (Layer 2)
# ------------------------------------------------------------

class UserRegisterRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    organization_name: str

class UserLoginRequest(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    role: str
    org_id: str
    created_at: datetime

    class Config:
        from_attributes = True  # Pydantic v2
        orm_mode = True        # Pydantic v1

class OrganizationOut(BaseModel):
    id: str
    name: str
    plan: str
    created_at: datetime

    class Config:
        from_attributes = True
        orm_mode = True

class AuthResponse(BaseModel):
    user: UserOut
    organization: OrganizationOut
    access_token: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    password: str
