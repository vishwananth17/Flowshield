import os
import hmac
import hashlib
import json
import time
from typing import Optional
import redis.asyncio as async_redis

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
async_redis_client = async_redis.from_url(REDIS_URL, decode_responses=True)

# ------------------------------------------------------------
# 10.1 Idempotency Keys
# ------------------------------------------------------------

async def check_idempotency(key: str, org_id: str) -> Optional[dict]:
    """Check if the idempotency key was already processed within 24 hours."""
    cache_key = f"idempotency:{org_id}:{key}"
    cached = await async_redis_client.get(cache_key)
    if cached:
        return json.loads(cached)
    return None

async def store_idempotency(key: str, org_id: str, response: dict):
    """Cache the response with the idempotency key for 24 hours."""
    cache_key = f"idempotency:{org_id}:{key}"
    await async_redis_client.setex(
        cache_key, 86400, json.dumps(response)
    )

# ------------------------------------------------------------
# 10.2 Webhook Signature Verification
# ------------------------------------------------------------

def verify_razorpay_webhook(payload: bytes, signature: str, secret: str) -> bool:
    """Verify incoming Razorpay webhook signature."""
    expected = hmac.new(
        secret.encode(), payload, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)

def sign_webhook_payload(payload: dict, secret: str) -> str:
    """Compute signature for outgoing webhooks."""
    body = json.dumps(payload, sort_keys=True, separators=(',', ':'))
    sig = hmac.new(
        secret.encode(), body.encode(), hashlib.sha256
    ).hexdigest()
    return f"sha256={sig}"

# ------------------------------------------------------------
# 10.3 Request Timestamp Validation
# ------------------------------------------------------------

def validate_webhook_timestamp(timestamp: str, tolerance: int = 300) -> bool:
    """Verify webhook request is not older than tolerance (default 5 minutes)."""
    try:
        ts = int(timestamp)
        diff = abs(int(time.time()) - ts)
        return diff <= tolerance
    except (ValueError, TypeError):
        return False
