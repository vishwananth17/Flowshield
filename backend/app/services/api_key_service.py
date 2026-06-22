import secrets
import hashlib
import time
import json
import random
import logging
import asyncio
from datetime import datetime, timedelta
from typing import Optional, Tuple, List
from sqlalchemy.orm import Session
from models import APIKey
from streaming_service import redis_client
import redis.asyncio as async_redis

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
async_redis_client = async_redis.from_url(REDIS_URL, decode_responses=True)

def send_security_email(subject: str, body: str, recipient: str = "admin@flowshieldai.com"):
    """Stub function to send critical security alerts or key rotation emails."""
    print(f"[SECURITY ALERT EMAIL] To: {recipient} | Subject: {subject} | Body: {body}")

# ------------------------------------------------------------
# 3.1 API Key Generation
# ------------------------------------------------------------

def generate_api_key(environment: str) -> Tuple[str, str, str]:
    """Generate a new API key format.
    Returns: (full_key, key_hash, key_prefix)
    """
    prefix = f"fs_{environment}_"
    raw = secrets.token_hex(32)
    full_key = prefix + raw
    key_hash = hashlib.sha256(full_key.encode()).hexdigest()
    key_prefix = full_key[:16] + "..."
    return full_key, key_hash, key_prefix

def create_db_api_key(db: Session, environment: str, org_id: str, scopes: List[str] = None) -> Tuple[str, APIKey]:
    """Create and persist a new API key in the database."""
    if environment not in {"live", "test"}:
        raise ValueError("environment must be 'live' or 'test'")
        
    full_key, key_hash, key_prefix = generate_api_key(environment)
    
    if scopes is None:
        scopes = ["transactions:analyze"]

    db_key = APIKey(
        key_hash=key_hash,
        key_prefix=key_prefix,
        is_active=True,
        environment=environment,
        status="active",
        org_id=org_id,
        scopes=scopes,
        created_at=datetime.utcnow()
    )
    db.add(db_key)
    db.commit()
    db.refresh(db_key)
    
    send_security_email(
        subject="New API Key Generated",
        body=f"A new {environment} API key has been created with prefix {key_prefix} for organization {org_id}."
    )
    
    return full_key, db_key

# ------------------------------------------------------------
# 3.2 API Key Validation
# ------------------------------------------------------------

async def update_key_last_used(key_id: int):
    """Asynchronously update API key last used timestamp."""
    from database import SessionLocal
    # We do a brief sleep to simulate async separation
    await asyncio.sleep(0.01)
    db = SessionLocal()
    try:
        db_key = db.query(APIKey).filter(APIKey.id == key_id).first()
        if db_key:
            db_key.last_used_at = datetime.utcnow()
            db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to update last_used_at: {e}")
    finally:
        db.close()

async def validate_api_key(db: Session, key: str) -> Optional[APIKey]:
    """Validate an incoming API key against Redis cache or database."""
    if not key:
        return None
        
    key_hash = hashlib.sha256(key.encode()).hexdigest()
    
    # 1. Check Redis cache first (5 min TTL)
    try:
        cached = await async_redis_client.get(f"apikey:{key_hash}")
        if cached:
            data = json.loads(cached)
            # Reconstruct model from dict
            key_obj = APIKey(
                id=data["id"],
                key_hash=key_hash,
                key_prefix=data["key_prefix"],
                is_active=data["is_active"],
                environment=data["environment"],
                status=data["status"],
                org_id=data.get("org_id"),
                scopes=data.get("scopes", ["transactions:analyze"])
            )
            if data.get("expires_at"):
                key_obj.expires_at = datetime.fromisoformat(data["expires_at"])
                
            # Verify rotating expiry
            if key_obj.status == "rotating" and key_obj.expires_at:
                if datetime.utcnow() > key_obj.expires_at:
                    return None
            return key_obj
    except Exception as e:
        logger.error(f"Redis cache lookup failed: {e}")
        
    # 2. Database lookup
    db_key = db.query(APIKey).filter(APIKey.key_hash == key_hash, APIKey.is_active == True).first()
    
    if not db_key:
        # Timing-safe: sleep to prevent timing attacks
        await asyncio.sleep(secrets.randbelow(50) / 1000)
        return None
        
    # Check rotating expiry
    if db_key.status == "rotating" and db_key.expires_at:
        if datetime.utcnow() > db_key.expires_at:
            return None

    # Cache for 5 minutes in Redis
    try:
        cache_data = {
            "id": db_key.id,
            "key_prefix": db_key.key_prefix,
            "is_active": db_key.is_active,
            "environment": db_key.environment,
            "status": db_key.status,
            "org_id": db_key.org_id,
            "scopes": db_key.scopes,
            "expires_at": db_key.expires_at.isoformat() if db_key.expires_at else None
        }
        await async_redis_client.setex(
            f"apikey:{key_hash}", 300, json.dumps(cache_data)
        )
    except Exception as e:
        logger.error(f"Failed to cache API key in Redis: {e}")

    # Update last_used_at asynchronously
    asyncio.create_task(update_key_last_used(db_key.id))
    
    return db_key

# ------------------------------------------------------------
# 3.3 API Key Rotation
# ------------------------------------------------------------

def rotate_api_key(db: Session, old_key_id: int, environment: str, org_id: str) -> Tuple[str, APIKey]:
    """Rotate API key: mark old as rotating for 24 hours and generate new key."""
    old_key = db.query(APIKey).filter(APIKey.id == old_key_id, APIKey.org_id == org_id).first()
    if not old_key:
        raise ValueError("Old API key not found")
        
    # Mark old key as rotating (still valid for 24 hours)
    old_key.status = "rotating"
    old_key.expires_at = datetime.utcnow() + timedelta(hours=24)
    
    # Invalidate cache for the old key
    try:
        # Using a async loop run helper since we are in a sync function
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.create_task(async_redis_client.delete(f"apikey:{old_key.key_hash}"))
        else:
            asyncio.run(async_redis_client.delete(f"apikey:{old_key.key_hash}"))
    except Exception as e:
        logger.error(f"Failed to delete API key cache: {e}")
        
    # Generate new key
    full_key, new_key = create_db_api_key(db, environment, org_id, scopes=old_key.scopes)
    db.commit()
    
    send_security_email(
        subject="API Key Rotated",
        body=f"API key with ID {old_key_id} has been marked as rotating for 24 hours. A new one has been created."
    )
    
    return full_key, new_key
