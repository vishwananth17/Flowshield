import os
import uuid
import secrets
import hashlib
import time
import json
import logging
from datetime import datetime, timedelta, UTC
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, Request, Response, status
from fastapi.security import APIKeyHeader, HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc, text, select

from database import get_db, engine, Base
import models
import schemas

from ml_service import calculate_fraud_risk, evaluate_transaction, model
from streaming_service import publish_transaction, redis_client

# Log setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Migration helper for backward compatibility
def run_migrations(db: Session):
    # Check if org_id column is missing in transactions
    try:
        db.execute(text("SELECT org_id FROM transactions LIMIT 1"))
    except Exception:
        db.rollback()
        try:
            db.execute(text("ALTER TABLE transactions ADD COLUMN org_id VARCHAR"))
            db.commit()
            logger.info("Added org_id to transactions table")
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to add org_id to transactions: {e}")

    # Check if org_id column is missing in api_keys
    try:
        db.execute(text("SELECT org_id FROM api_keys LIMIT 1"))
    except Exception:
        db.rollback()
        try:
            db.execute(text("ALTER TABLE api_keys ADD COLUMN org_id VARCHAR"))
            db.commit()
            logger.info("Added org_id to api_keys table")
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to add org_id to api_keys: {e}")

    # Check if scopes column is missing in api_keys
    try:
        db.execute(text("SELECT scopes FROM api_keys LIMIT 1"))
    except Exception:
        db.rollback()
        try:
            dialect = db.bind.dialect.name
            col_type = "JSON" if dialect == "postgresql" else "TEXT"
            db.execute(text(f"ALTER TABLE api_keys ADD COLUMN scopes {col_type}"))
            db.commit()
            logger.info("Added scopes to api_keys table")
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to add scopes to api_keys: {e}")

# Startup and Lifespan (Layer 14.1)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Create DB tables
    Base.metadata.create_all(bind=engine)
    
    # 2. Run migrations for custom columns
    db = next(get_db())
    try:
        run_migrations(db)
    finally:
        db.close()
        
    # 3. Validate env secrets
    from app.core.secrets import validate_all_secrets
    validate_all_secrets()
    
    yield

# Main FastAPI instantiation
app = FastAPI(
    title="Flowshield AI - Fraud Detection API",
    description="Real-time fraud detection using ML and sovereign security layers.",
    lifespan=lifespan
)

# Imports for middlewares
from app.core.middleware import SecurityHeadersMiddleware, AuditMiddleware
from app.core.rate_limiter import RateLimitMiddleware
from app.core.csrf import CSRFMiddleware
from app.services.api_key_service import validate_api_key, create_db_api_key, rotate_api_key
from app.core.security import (
    validate_password_strength, get_password_hash, verify_password,
    create_access_token, create_refresh_token, decode_token,
    add_to_blocklist, is_blocklisted, create_session, verify_session,
    invalidate_user_sessions, check_account_lockout, record_failed_login,
    reset_failed_logins, send_security_alert
)
from app.core.validation import TransactionAnalyzeRequest, detect_pii, sanitize_string, detect_sql_injection
from app.core.audit_log import audit_logger

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# LAYER 6 — CORS SECURITY
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALLOWED_ORIGINS_PRODUCTION = [
    "https://flowshieldai.com",
    "https://www.flowshieldai.com",
    "https://app.flowshieldai.com",
]

ALLOWED_ORIGINS_DEV = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
ALLOWED_ORIGINS = (
    ALLOWED_ORIGINS_PRODUCTION
    if ENVIRONMENT == "production"
    else ALLOWED_ORIGINS_PRODUCTION + ALLOWED_ORIGINS_DEV
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=[
        "Authorization", "Content-Type", "X-API-Key",
        "X-Request-ID", "X-Idempotency-Key"
    ],
    expose_headers=[
        "X-RateLimit-Limit", "X-RateLimit-Remaining",
        "X-RateLimit-Reset", "X-Request-ID"
    ],
    max_age=86400,
)

# Other Middlewares (added in order wrapping around app)
app.add_middleware(SecurityHeadersMiddleware)  # Innermost runs on every response
app.add_middleware(RateLimitMiddleware)
app.add_middleware(CSRFMiddleware)
app.add_middleware(AuditMiddleware)

# Security Dependencies
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
security_bearer = HTTPBearer(auto_error=False)

async def get_api_key(request: Request, api_key: str = Depends(api_key_header), db: Session = Depends(get_db)):
    if not api_key:
        raise HTTPException(status_code=401, detail="X-API-Key header is missing")
    db_key = await validate_api_key(db, api_key)
    if not db_key:
        raise HTTPException(status_code=401, detail="Invalid or inactive API Key")
    request.state.api_key_prefix = db_key.key_prefix
    request.state.org_id = db_key.org_id
    return db_key

async def get_current_user(request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer), db: Session = Depends(get_db)) -> models.User:
    token = None
    if credentials:
        token = credentials.credentials
    else:
        token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    jti = payload.get("jti")
    if jti and await is_blocklisted(jti):
        raise HTTPException(status_code=401, detail="Token has been revoked")

    user_id = payload.get("user_id")
    
    # 2.3 Session verification helper
    session_id = request.cookies.get("session_id")
    if session_id:
        ip = request.client.host if request.client else "unknown"
        ua = request.headers.get("user-agent", "")
        is_valid = await verify_session(user_id, session_id, ip, ua)
        if not is_valid:
            raise HTTPException(status_code=401, detail="Session expired or anomalous GeoIP change.")

    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user or not db_user.is_active:
        raise HTTPException(status_code=401, detail="User disabled or not found")

    request.state.user_id = db_user.id
    request.state.org_id = db_user.org_id
    request.state.email = db_user.email
    return db_user

def process_and_save_transaction(db: Session, tx: schemas.TransactionRequest, org_id: Optional[str] = None):
    score_samples = calculate_fraud_risk(tx.amount, tx.location, tx.user_id)
    score, status, recommendation = evaluate_transaction(tx.amount, tx.location, tx.user_id)
    
    db_tx = models.Transaction(
        transaction_id=tx.transaction_id,
        user_id=tx.user_id,
        org_id=org_id,
        amount=tx.amount,
        currency=tx.currency,
        location=tx.location,
        device_id=tx.device_id,
        timestamp=tx.timestamp,
        fraud_risk_score=score,
        status=status,
        recommendation=recommendation
    )
    db.add(db_tx)
    try:
        db.commit()
    except Exception as e:
        db.rollback()

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# LAYER 2 — AUTHENTICATION ROUTERS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.post("/api/v1/auth/register", status_code=201, response_model=schemas.AuthResponse)
async def register(req: schemas.UserRegisterRequest, response: Response, db: Session = Depends(get_db)):
    # 1. Validate password strength
    try:
        validate_password_strength(req.password, email=req.email)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 2. Check if user already exists
    existing = db.query(models.User).filter(models.User.email == req.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # 3. Create Org and User
    org = models.Organization(id=str(uuid.uuid4()), name=req.organization_name, plan="free")
    db.add(org)
    db.flush()

    user = models.User(
        id=str(uuid.uuid4()),
        email=req.email.lower(),
        password_hash=get_password_hash(req.password),
        full_name=req.full_name,
        role="owner",
        org_id=org.id,
        password_history=get_password_hash(req.password)  # Initialize history
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Log successful registration
    await audit_logger.log(
        db=db,
        action="auth.register.success",
        result="success",
        actor=user,
        resource_type="user",
        resource_id=user.id,
        severity="info"
    )

    # Create session and JWT tokens
    access, _ = create_access_token(user.id, org.id, user.role)
    refresh, _ = create_refresh_token(user.id, org.id, user.role)

    # Set httpOnly Secure refresh cookie
    response.set_cookie(
        "refresh_token",
        refresh,
        max_age=7*24*3600,
        httponly=True,
        secure=True,
        samesite="strict",
        path="/"
    )

    return {
        "user": user,
        "organization": org,
        "access_token": access
    }

@app.post("/api/v1/auth/login")
async def login(req: schemas.UserLoginRequest, response: Response, request: Request, db: Session = Depends(get_db)):
    # 2.4 Check Account Lockout
    is_locked = await check_account_lockout(req.email.lower())
    if is_locked:
        await audit_logger.log(
            db=db,
            action="auth.login.locked",
            result="failure",
            resource_type="user",
            resource_id=req.email,
            severity="warning",
            request=request
        )
        raise HTTPException(status_code=403, detail="Account locked. Please try again later or contact support.")

    user = db.query(models.User).filter(models.User.email == req.email.lower()).first()

    if not user or not verify_password(req.password, user.password_hash):
        # Record failed login
        await record_failed_login(req.email.lower())
        await audit_logger.log(
            db=db,
            action="auth.login.failure",
            result="failure",
            resource_type="user",
            resource_id=req.email,
            severity="warning",
            request=request
        )
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    # Reset failed login counts
    await reset_failed_logins(user.email)
    user.last_login_at = datetime.utcnow()
    db.commit()

    # Session generation (Layer 2.3)
    ip = request.client.host if request.client else "unknown"
    ua = request.headers.get("user-agent", "")
    session_id = await create_session(user.id, ip, ua)

    org = db.query(models.Organization).filter(models.Organization.id == user.org_id).first()

    access, _ = create_access_token(user.id, user.org_id, user.role)
    refresh, _ = create_refresh_token(user.id, user.org_id, user.role)

    # Set httpOnly Secure refresh cookie
    response.set_cookie(
        "refresh_token",
        refresh,
        max_age=7*24*3600,
        httponly=True,
        secure=True,
        samesite="strict",
        path="/"
    )
    
    # Store session id in cookie for tracking
    response.set_cookie(
        "session_id",
        session_id,
        max_age=7*24*3600,
        httponly=True,
        secure=True,
        samesite="strict",
        path="/"
    )

    await audit_logger.log(
        db=db,
        action="auth.login.success",
        result="success",
        actor=user,
        resource_type="user",
        resource_id=user.id,
        severity="info",
        request=request
    )

    return {
        "user": schemas.UserOut.model_validate(user),
        "organization": schemas.OrganizationOut.model_validate(org) if org else None,
        "access_token": access
    }

@app.post("/api/v1/auth/refresh")
async def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="Missing refresh token")

    payload = decode_token(token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    jti = payload.get("jti")
    if jti and await is_blocklisted(jti):
        raise HTTPException(status_code=401, detail="Refresh token has been blocklisted")

    # Rotate refresh token (Layer 2.2)
    # Blocklist old JTI
    exp = payload.get("exp")
    if jti and exp:
        await add_to_blocklist(jti, exp)

    user_id = payload.get("user_id")
    user = db.query(models.User).filter(models.User.id == user_id, models.User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    access, _ = create_access_token(user.id, user.org_id, user.role)
    new_refresh, _ = create_refresh_token(user.id, user.org_id, user.role)

    # Set new rotated cookie
    response.set_cookie(
        "refresh_token",
        new_refresh,
        max_age=7*24*3600,
        httponly=True,
        secure=True,
        samesite="strict",
        path="/"
    )

    await audit_logger.log(
        db=db,
        action="auth.token.refresh",
        result="success",
        actor=user,
        resource_type="user",
        resource_id=user.id,
        severity="info"
    )

    return {
        "access_token": access
    }

@app.post("/api/v1/auth/logout")
async def logout(response: Response, request: Request, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Blocklist the refresh token JTI
    ref_token = request.cookies.get("refresh_token")
    if ref_token:
        payload = decode_token(ref_token)
        if payload:
            jti = payload.get("jti")
            exp = payload.get("exp")
            if jti and exp:
                await add_to_blocklist(jti, exp)

    # Invalidate all user sessions
    await invalidate_user_sessions(current_user.id)

    # Clear cookies
    response.delete_cookie("refresh_token")
    response.delete_cookie("session_id")

    await audit_logger.log(
        db=db,
        action="auth.logout",
        result="success",
        actor=current_user,
        resource_type="user",
        resource_id=current_user.id,
        severity="info"
    )

    return {"status": "ok"}

@app.get("/api/v1/auth/me", response_model=schemas.AuthResponse)
async def get_me(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    org = db.query(models.Organization).filter(models.Organization.id == current_user.org_id).first()
    access, _ = create_access_token(current_user.id, current_user.org_id, current_user.role)
    return {
        "user": current_user,
        "organization": org,
        "access_token": access
    }

@app.post("/api/v1/auth/forgot-password")
async def forgot_password(req: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = req.email.lower()
    
    # Rate limit: max 3 reset requests per hour per email (Layer 2.5)
    rate_key = f"pwd_reset_rate:{email}"
    requests_count = int(await redis_client.get(rate_key) or 0) if redis_client else 0
    if requests_count >= 3:
        raise HTTPException(status_code=429, detail="Too many password reset requests. Max 3 per hour.")

    if redis_client:
        pipe = redis_client.pipeline()
        pipe.incr(rate_key)
        pipe.expire(rate_key, 3600)
        pipe.execute()

    user = db.query(models.User).filter(models.User.email == email).first()
    
    # Always return 200 (do not reveal if email exists)
    if user:
        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        expires_at = datetime.utcnow() + timedelta(minutes=30)
        
        db_token = models.PasswordResetToken(
            email=email,
            token_hash=token_hash,
            expires_at=expires_at
        )
        db.add(db_token)
        db.commit()
        
        # Send security email with plain token
        send_security_alert(
            subject="Password Reset Requested",
            body=f"Click here to reset your password: flowshieldai.com/reset-password?token={token}. Expiring in 30 minutes.",
            recipient=email
        )
        
        await audit_logger.log(
            db=db,
            action="auth.password.reset",
            result="success",
            actor=user,
            resource_type="user",
            resource_id=user.id,
            severity="info"
        )
    
    return {"message": "If this email exists, a password reset link has been sent."}

@app.post("/api/v1/auth/reset-password")
async def reset_password(req: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(req.token.encode()).hexdigest()
    
    db_token = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token_hash == token_hash,
        models.PasswordResetToken.used == False,
        models.PasswordResetToken.expires_at > datetime.utcnow()
    ).first()
    
    if not db_token:
        raise HTTPException(status_code=400, detail="Invalid, expired, or already used token.")
        
    user = db.query(models.User).filter(models.User.email == db_token.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Check password strength and past 5 password history (Layer 2.1)
    history = []
    if user.password_history:
        history = user.password_history.split(",")
        
    try:
        validate_password_strength(req.password, email=user.email, password_history=history)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    # Update password
    new_hash = get_password_hash(req.password)
    user.password_hash = new_hash
    
    # Prepend new hash, keep only last 5 in comma-separated history list
    new_history = [new_hash] + history
    user.password_history = ",".join(new_history[:5])
    
    db_token.used = True
    db.commit()
    
    # Invalidate sessions & refresh tokens
    await invalidate_user_sessions(user.id)
    
    # Send confirmation email
    send_security_alert(
        subject="Password Changed Successfully",
        body="Your Flowshield AI account password has been changed successfully. All other sessions have been logged out.",
        recipient=user.email
    )
    
    await audit_logger.log(
        db=db,
        action="auth.password.changed",
        result="success",
        actor=user,
        resource_type="user",
        resource_id=user.id,
        severity="info"
    )
    
    return {"status": "ok", "message": "Password updated successfully."}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# LAYER 3 — API KEY ROUTERS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.post("/api/v1/api-keys", status_code=201)
def create_key(req: schemas.APIKeyCreateRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    try:
        full_key, db_key = create_db_api_key(db, req.environment, current_user.org_id)
        
        # Log key generation
        db.commit()
        return {
            "api_key": full_key,
            "prefix": db_key.key_prefix,
            "environment": db_key.environment,
            "status": db_key.status,
            "id": db_key.id
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/api-keys/{key_id}/rotate")
def rotate_key(key_id: int, req: schemas.APIKeyCreateRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    try:
        full_key, db_key = rotate_api_key(db, key_id, req.environment, current_user.org_id)
        return {
            "api_key": full_key,
            "prefix": db_key.key_prefix,
            "environment": db_key.environment,
            "status": db_key.status,
            "id": db_key.id
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CORE INFERENCE & ALERT ROUTERS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.post("/analyze_transaction", response_model=schemas.TransactionResponse)
async def analyze_transaction(
    tx: TransactionAnalyzeRequest,  # Layer 5.1 Hardened validation schema
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    api_key: models.APIKey = Depends(get_api_key)):
    
    # 5.3 SQL Injection Prevention Check on text values
    if tx.transaction_id and detect_sql_injection(tx.transaction_id):
        raise HTTPException(status_code=400, detail="SQL injection attempt detected")
    if tx.merchant and detect_sql_injection(tx.merchant.name):
        raise HTTPException(status_code=400, detail="SQL injection attempt detected")
        
    # Standard inference logic
    score, status_result, recommendation = evaluate_transaction(tx.amount, tx.merchant.name if tx.merchant else "unknown", tx.customer.id if tx.customer else "unknown")
    
    # Mapping request body back to schemas.TransactionRequest for publish/processing
    tx_req = schemas.TransactionRequest(
        transaction_id=tx.transaction_id or f"TXN-{uuid.uuid4().hex[:8]}",
        user_id=tx.customer.id if tx.customer else "unknown",
        amount=tx.amount,
        currency=tx.currency,
        location=tx.customer.city if tx.customer and tx.customer.city else "unknown",
        device_id="unknown",
        timestamp=datetime.utcnow()
    )
    
    # Publish to streams & DB
    publish_transaction(tx_req.model_dump())
    background_tasks.add_task(process_and_save_transaction, db, tx_req, api_key.org_id)
    
    # Log analysis
    await audit_logger.log(
        db=db,
        action="transaction.analyzed",
        result="success",
        actor=None,
        resource_type="transaction",
        resource_id=tx_req.transaction_id,
        metadata={"fraud_risk_score": score, "decision": status_result},
        severity="info",
        request=request
    )
    
    return schemas.TransactionResponse(
        transaction_id=tx_req.transaction_id,
        fraud_risk_score=score,
        status=status_result,
        recommendation=recommendation
    )

@app.get("/fraud_alerts", response_model=list[schemas.AlertResponse])
def get_fraud_alerts(limit: int = 50, db: Session = Depends(get_db), api_key: models.APIKey = Depends(get_api_key)):
    try:
        # Layer 12.3 statement limit rows check (max 1000)
        limit = min(limit, 1000)
        
        # Row level tenant isolation policy enforced by querying on org_id
        alerts = db.query(models.Transaction)\
                   .filter(models.Transaction.org_id == api_key.org_id)\
                   .filter((models.Transaction.status == "high_risk") | (models.Transaction.status == "medium_risk"))\
                   .order_by(desc(models.Transaction.timestamp))\
                   .limit(limit).all()
        return alerts
    except Exception as e:
        logger.error(f"Failed to fetch fraud alerts: {e}")
        return []

@app.get("/model_status", response_model=schemas.ModelStatusResponse)
def get_model_status():
    status_str = "healthy" if model is not None else "degraded (fallback simple rules)"
    return schemas.ModelStatusResponse(
        model_name="Isolation Forest Anomaly Detector",
        status=status_str,
        version="v1.0.0",
        accuracy_estimate=0.92
    )

@app.post("/generate_mock_traffic")
async def generate_mock_traffic(background_tasks: BackgroundTasks, count: int = 10, db: Session = Depends(get_db)):
    import random
    # Select or create a default organization to map transactions
    org = db.query(models.Organization).first()
    org_id = org.id if org else str(uuid.uuid4())
    
    for i in range(count):
        amount = random.uniform(10.0, 500.0)
        if random.random() < 0.1:
            amount = random.uniform(1000.0, 10000.0)
            
        tx = schemas.TransactionRequest(
            transaction_id=f"TXN-{uuid.uuid4().hex[:8]}",
            user_id=f"U-{random.randint(100, 999)}",
            amount=amount,
            currency="USD",
            location=random.choice(["New York", "London", "San Francisco", "Tokyo", "Unknown"]),
            device_id=f"device-{random.randint(100, 999)}",
            timestamp=datetime.utcnow()
        )
    return {"message": f"Generated {count} mock transactions"}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# LAYER 17 — MONITORING & HEALTH CHECK
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.get("/health")
async def health_check(request: Request, db: Session = Depends(get_db)):
    health_data = {
        "status": "ok"
    }
    
    # Check if they are authenticated admin/owner to see security details
    auth_header = request.headers.get("Authorization") or request.cookies.get("access_token")
    if auth_header:
        try:
            token = auth_header.replace("Bearer ", "") if "Bearer " in auth_header else auth_header
            payload = decode_token(token)
            if payload and payload.get("role") in ("owner", "admin"):
                from app.core.monitoring import get_security_health_status
                health_data["security"] = await get_security_health_status()
        except Exception:
            pass
            
    return health_data

@app.get("/metrics")
async def prometheus_metrics():
    from app.core.monitoring import get_metrics_prometheus_format
    metrics_str = await get_metrics_prometheus_format()
    return Response(content=metrics_str, media_type="text/plain")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# LAYER 16 — EMERGENCY LOCKDOWN ROUTERS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.post("/api/v1/admin/emergency-lockdown")
async def admin_emergency_lockdown(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "owner":
        raise HTTPException(status_code=403, detail="Only the organization owner can trigger emergency lockdown.")
    
    from app.core.incident_response import trigger_emergency_lockdown
    res = await trigger_emergency_lockdown(db)
    return res

@app.post("/api/v1/admin/disable-lockdown")
async def admin_disable_lockdown(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "owner":
        raise HTTPException(status_code=403, detail="Only the organization owner can lift emergency lockdown.")
    
    from app.core.incident_response import disable_emergency_lockdown
    res = await disable_emergency_lockdown(db)
    return res

