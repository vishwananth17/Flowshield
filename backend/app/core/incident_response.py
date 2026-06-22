import os
import time
import logging
from typing import Optional
from sqlalchemy.orm import Session
from models import APIKey, User, Transaction
from app.services.api_key_service import send_security_email
import redis.asyncio as async_redis
from database import SessionLocal

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
async_redis_client = async_redis.from_url(REDIS_URL, decode_responses=True)

# ------------------------------------------------------------
# 16.1 Automated Threat Detection
# ------------------------------------------------------------

async def run_automated_threat_checks():
    """Runs every minute to check audit/logs and trigger actions."""
    db = SessionLocal()
    try:
        # 1. Brute Force (check failed logins from same IP)
        # In a real environment, we'd query audit_logs or Redis counters.
        # Let's check our Redis logs or mock checking.
        pass
    except Exception as e:
        logger.error(f"Threat check error: {e}")
    finally:
        db.close()

async def block_ip_address(ip: str, duration: int = 86400):
    """Add IP to blocked list in Redis."""
    await async_redis_client.sadd("security:blocked_ips", ip)
    await async_redis_client.setex(f"ip_block_ttl:{ip}", duration, "1")
    send_security_email(
        subject="[SECURITY ALERT] IP Address Blocked",
        body=f"IP address {ip} has been blocked automatically for {duration} seconds due to high threat index."
    )

# ------------------------------------------------------------
# 16.2 Emergency Lockdown Mode
# ------------------------------------------------------------

async def trigger_emergency_lockdown(db: Session) -> dict:
    """Temporarily suspend all API keys, invalidate all active sessions, and enable maintenance mode."""
    # 1. Suspend all API keys
    db.query(APIKey).update({APIKey.is_active: False})
    db.commit()
    
    # 2. Invalidate all Redis sessions
    # Scan and delete all key/session caches
    async for key in async_redis_client.scan_iter("session:*"):
        await async_redis_client.delete(key)
    async for key in async_redis_client.scan_iter("apikey:*"):
        await async_redis_client.delete(key)
        
    # 3. Set maintenance mode flag
    await async_redis_client.set("maintenance_mode", "1")
    
    # Send email alert
    send_security_email(
        subject="[CRITICAL] EMERGENCY SYSTEM LOCKDOWN TRIGGERED",
        body="All API keys have been suspended. All active dashboard sessions have been terminated. Maintenance mode is active.",
        recipient="legal@flowshieldai.com"
    )
    
    return {"status": "lockdown_active", "message": "Emergency system lockdown successfully activated."}

async def disable_emergency_lockdown(db: Session) -> dict:
    """Re-enable all API keys and lift maintenance mode."""
    db.query(APIKey).update({APIKey.is_active: True})
    db.commit()
    
    await async_redis_client.delete("maintenance_mode")
    
    send_security_email(
        subject="[INFO] Emergency System Lockdown Lifted",
        body="Emergency lockdown lifted. API keys have been re-enabled and dashboard operations restored.",
        recipient="legal@flowshieldai.com"
    )
    
    return {"status": "lockdown_inactive", "message": "System lockdown successfully deactivated."}
