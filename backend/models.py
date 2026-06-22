import uuid
import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, JSON, ForeignKey
from database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, unique=True, index=True)
    user_id = Column(String, index=True)
    org_id = Column(String, index=True, nullable=True)  # RLS Tenant Isolation
    amount = Column(Float)
    currency = Column(String)
    location = Column(String)
    device_id = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    fraud_risk_score = Column(Float, nullable=True)
    status = Column(String, nullable=True)
    recommendation = Column(String, nullable=True)

class APIKey(Base):
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True)
    key_hash = Column(String, unique=True, index=True, nullable=False)
    key_prefix = Column(String, nullable=False)
    org_id = Column(String, index=True, nullable=True)  # RLS Tenant Isolation
    is_active = Column(Boolean, default=True, nullable=False)
    environment = Column(String, nullable=False)  # "live" or "test"
    status = Column(String, default="active", nullable=False)  # "active", "rotating", "revoked"
    scopes = Column(JSON, default=list, nullable=True)  # Scope field (Layer 3.4)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    last_used_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True, nullable=False)
    actor_id = Column(String, nullable=True, index=True)
    actor_type = Column(String, nullable=True)  # user, api_key, system
    actor_email = Column(String, nullable=True)
    org_id = Column(String, nullable=True, index=True)
    action = Column(String, nullable=False, index=True)
    resource_type = Column(String, nullable=True)
    resource_id = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    request_id = Column(String, nullable=True)
    result = Column(String, nullable=True)  # success, failure, error
    metadata = Column(JSON, nullable=True)
    severity = Column(String, default="info", index=True, nullable=False)  # info, warning, critical

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default="member")  # owner, admin, member
    org_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    last_login_at = Column(DateTime, nullable=True)
    password_history = Column(String, nullable=True)  # Comma separated password hashes
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    plan = Column(String, default="free")  # free, basic, standard, premium
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, nullable=False, index=True)
    token_hash = Column(String, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
