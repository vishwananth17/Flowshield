import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)
    organization_name: str = Field(min_length=1, max_length=255)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    email: str
    full_name: str | None
    role: str
    org_id: uuid.UUID
    created_at: datetime


class OrganizationOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    name: str
    plan: str


class AuthMeResponse(BaseModel):
    user: UserOut
    organization: OrganizationOut


class RegisterResponse(BaseModel):
    user: UserOut
    organization: OrganizationOut
    api_key: str = Field(
        description="Shown once. Store securely. Use as X-API-Key for /transactions/analyze."
    )
