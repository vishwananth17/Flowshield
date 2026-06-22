import re
import time
import secrets
import os
import logging
from typing import Set, Tuple, Optional, List
import jwt
from passlib.context import CryptContext
import redis.asyncio as async_redis
import httpx

logger = logging.getLogger(__name__)

# Bcrypt with cost factor 12
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12
)

# JWT config
JWT_SECRET = os.getenv("JWT_SECRET") or secrets.token_hex(32)
JWT_ALGORITHM = "HS256"

# Setup async redis client
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
async_redis_client = async_redis.from_url(REDIS_URL, decode_responses=True)

# Common passwords list caching
COMMON_PASSWORDS_SET: Set[str] = set()
try:
    dir_path = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(dir_path, "common_passwords.txt")
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                p = line.strip().lower()
                if p:
                    COMMON_PASSWORDS_SET.add(p)
except Exception as e:
    logger.error(f"Error loading common passwords file: {e}")

def get_password_hash(password: str) -> str:
    """Hash password using bcrypt with cost factor 12."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password."""
    return pwd_context.verify(plain_password, hashed_password)

def validate_password_strength(password: str, email: Optional[str] = None, username: Optional[str] = None, password_history: Optional[List[str]] = None) -> None:
    """Validate password strength rules (Layer 2.1).
    Raises ValueError if validation fails.
    """
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long.")
        
    if not any(c.isupper() for c in password):
        raise ValueError("Password must contain at least one uppercase letter.")
        
    if not any(c.islower() for c in password):
        raise ValueError("Password must contain at least one lowercase letter.")
        
    if not any(c.isdigit() for c in password):
        raise ValueError("Password must contain at least one number.")
        
    if not any(c in "!@#$%^&*" for c in password):
        raise ValueError("Password must contain at least one special character (!@#$%^&*).")

    if email:
        email_lower = email.lower()
        if email_lower in password.lower():
            raise ValueError("Password cannot contain your email or username.")
        email_prefix = email_lower.split("@")[0]
        if len(email_prefix) >= 3 and email_prefix in password.lower():
            raise ValueError("Password cannot contain your email or username.")

    if username and username.lower() in password.lower():
        raise ValueError("Password cannot contain your email or username.")

    if password.lower() in COMMON_PASSWORDS_SET:
        raise ValueError("Password is a common password and is not secure.")

    if password_history:
        for old_hash in password_history:
            if verify_password(password, old_hash):
                raise ValueError("Password cannot be same as any of your last 5 passwords.")

# ------------------------------------------------------------
# JWT Token Security (Layer 2.2)
# ------------------------------------------------------------

def create_access_token(user_id: str, org_id: str, role: str) -> Tuple[str, str]:
    """Create a signed JWT access token.
    Returns: (token_str, jti)
    """
    jti = secrets.token_urlsafe(32)
    iat = int(time.time())
    exp = iat + (15 * 60)  # 15 minutes
    
    payload = {
        "user_id": user_id,
        "org_id": org_id,
        "role": role,
        "jti": jti,
        "iat": iat,
        "exp": exp
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token, jti

def create_refresh_token(user_id: str, org_id: str, role: str) -> Tuple[str, str]:
    """Create a signed JWT refresh token.
    Returns: (token_str, jti)
    """
    jti = secrets.token_urlsafe(32)
    iat = int(time.time())
    exp = iat + (7 * 24 * 3600)  # 7 days
    
    payload = {
        "user_id": user_id,
        "org_id": org_id,
        "role": role,
        "jti": jti,
        "iat": iat,
        "exp": exp,
        "type": "refresh"
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token, jti

def decode_token(token: str) -> Optional[dict]:
    """Decode and verify token. Returns payload dict or None if invalid/expired."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

async def add_to_blocklist(jti: str, exp: int):
    """Store blacklisted token JTI in Redis."""
    ttl = exp - int(time.time())
    if ttl > 0:
        await async_redis_client.setex(f"blocklist:jti:{jti}", ttl, "1")

async def is_blocklisted(jti: str) -> bool:
    """Check if token JTI is blocklisted."""
    return await async_redis_client.exists(f"blocklist:jti:{jti}") > 0

# ------------------------------------------------------------
# Session Security (Layer 2.3)
# ------------------------------------------------------------

async def get_ip_country(ip: str) -> str:
    """Fetch country code from IP address."""
    if ip in ("127.0.0.1", "localhost", "::1", "unknown"):
        return "IN"
    try:
        async with httpx.AsyncClient(timeout=1.0) as client:
            resp = await client.get(f"https://ipapi.co/{ip}/country/")
            if resp.status_code == 200:
                return resp.text.strip().upper()
    except Exception:
        pass
    return "IN"

async def create_session(user_id: str, ip: str, user_agent: str) -> str:
    """Regenerate session ID and store metadata in Redis."""
    session_id = secrets.token_urlsafe(32)
    country = await get_ip_country(ip)
    
    metadata = {
        "ip": ip,
        "country": country,
        "user_agent": user_agent,
        "created_at": int(time.time()),
        "last_active": int(time.time())
    }
    
    # Store session details in Redis
    session_key = f"session:{user_id}:{session_id}"
    await async_redis_client.hset(session_key, mapping={k: str(v) for k, v in metadata.items()})
    await async_redis_client.expire(session_key, 7 * 24 * 3600)  # 7 days
    
    return session_id

async def verify_session(user_id: str, session_id: str, current_ip: str, current_ua: str) -> bool:
    """Verify session is active, update last_active, detect IP geolocation anomalies."""
    session_key = f"session:{user_id}:{session_id}"
    
    # Check if session exists in Redis
    exists = await async_redis_client.exists(session_key)
    if not exists:
        return False
        
    # Get metadata
    meta = await async_redis_client.hgetall(session_key)
    if not meta:
        return False
        
    # Check IP change anomaly (geolocation)
    origin_country = meta.get("country", "IN")
    current_country = await get_ip_country(current_ip)
    
    if origin_country != current_country and origin_country != "IN" and current_country != "IN":
        # Force re-authentication if country changed dramatically
        logger.warning(f"Session anomaly detected for User {user_id}. Origin country: {origin_country}, current: {current_country}")
        await async_redis_client.delete(session_key)
        return False
        
    # Update last_active
    await async_redis_client.hset(session_key, "last_active", str(int(time.time())))
    await async_redis_client.expire(session_key, 7 * 24 * 3600)  # Refresh TTL to 7 days
    return True

async def invalidate_user_sessions(user_id: str):
    """Invalidate all active sessions for a user."""
    pattern = f"session:{user_id}:*"
    async for key in async_redis_client.scan_iter(match=pattern):
        await async_redis_client.delete(key)

# ------------------------------------------------------------
# Account Lockout Helper Functions (Layer 2.4)
# ------------------------------------------------------------

def send_security_alert(subject: str, body: str, recipient: str = "admin@flowshieldai.com"):
    """Stub function to send critical security alerts or key rotation emails."""
    print(f"[SECURITY ALERT EMAIL] To: {recipient} | Subject: {subject} | Body: {body}")

async def check_account_lockout(email: str) -> bool:
    """Check if the email account is temporarily or permanently locked."""
    # Check permanent lock
    perm_locked = await async_redis_client.get(f"permanent_lock:{email}")
    if perm_locked is not None:
        return True
        
    # Check temporary lock
    locked = await async_redis_client.get(f"lockout:{email}")
    return locked is not None

async def record_failed_login(email: str) -> int:
    """Record a failed login attempt for the email."""
    failed_key = f"failed_login:{email}"
    count = await async_redis_client.incr(failed_key)
    await async_redis_client.expire(failed_key, 86400)  # 24h expiration
    
    if count >= 10:
        # Permanent lockout
        await async_redis_client.set(f"permanent_lock:{email}", "1")
        send_security_alert(
            subject="[Suspicious login activity detected]",
            body=f"Account for {email} has been permanently locked after 10 failed login attempts in 24 hours."
        )
    elif count >= 5:
        # Lock account for 15 minutes
        await async_redis_client.setex(f"lockout:{email}", 900, "1")
        send_security_alert(
            subject="Account Locked Temporarily",
            body=f"Account for {email} has been locked for 15 minutes due to 5 failed login attempts."
        )
        
    return count

async def reset_failed_logins(email: str) -> None:
    """Reset failed login attempts counter on successful login."""
    await async_redis_client.delete(f"failed_login:{email}")
    await async_redis_client.delete(f"lockout:{email}")
