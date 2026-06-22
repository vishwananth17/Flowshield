import time
import re
import logging
from datetime import datetime
from typing import Optional, Tuple
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import redis.asyncio as async_redis
from app.services.api_key_service import validate_api_key, send_security_email
from database import SessionLocal

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
async_redis_client = async_redis.from_url(REDIS_URL, decode_responses=True)

BOT_UA_PATTERNS = [
    r'python-requests', r'curl/', r'wget/',
    r'Go-http-client', r'okhttp', r'axios/',
    r'node-fetch', r'bot', r'crawler', r'spider'
]

def is_bot_user_agent(user_agent: str) -> bool:
    if not user_agent:
        return False
    ua = user_agent.lower()
    return any(
        re.search(p, ua, re.IGNORECASE)
        for p in BOT_UA_PATTERNS
    )

# ------------------------------------------------------------
# 4.3 Plan-Based Monthly Limits
# ------------------------------------------------------------

async def check_monthly_limit(org_id: str, plan: str) -> Tuple[bool, int, int]:
    LIMITS = {
        "free":     1000,
        "basic":    25000,
        "standard": 100000,
        "premium":  -1
    }
    limit = LIMITS.get(plan, 1000)
    if limit == -1:
        return True, 0, -1

    year_month = datetime.now().strftime("%Y-%m")
    key = f"usage:{org_id}:{year_month}"
    count_val = await async_redis_client.get(key)
    count = int(count_val or 0)

    if count >= limit:
        return False, count, limit

    # Increment usage
    pipe = async_redis_client.pipeline()
    pipe.incr(key)
    # Expire at end of month
    now = datetime.now()
    if now.month == 12:
        next_month = now.replace(year=now.year + 1, month=1, day=1)
    else:
        next_month = now.replace(month=now.month + 1, day=1)
    days_remaining = (next_month - now).days + 1
    pipe.expire(key, days_remaining * 86400)
    await pipe.execute()

    return True, count + 1, limit

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Exclude documentation or asset paths
        path = request.url.path
        if path in {"/docs", "/redoc", "/openapi.json", "/health"}:
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "")
        now = time.time()
        minute_bucket = int(now // 60)

        # Establish concurrency keys
        concurrency_ip_key = f"concurrency:ip:{client_ip}"
        concurrency_key_key = None

        # ------------------------------------------------------------
        # 4.4 Concurrent Request Limiting (Inbound)
        # ------------------------------------------------------------
        try:
            ip_concurrency = await async_redis_client.incr(concurrency_ip_key)
            if ip_concurrency == 1:
                await async_redis_client.expire(concurrency_ip_key, 10)
            
            if ip_concurrency > 50:
                await async_redis_client.decr(concurrency_ip_key)
                return JSONResponse(
                    status_code=429,
                    content={"error": {"code": "CONCURRENCY_LIMIT_EXCEEDED", "message": "Max 50 concurrent requests per IP exceeded."}},
                    headers={"Retry-After": "5"}
                )
        except Exception as e:
            logger.error(f"IP concurrency tracker failed: {e}")

        # Extract API key or token if available
        x_api_key = request.headers.get("X-API-Key")
        db_key = None
        org_id = "unknown"
        plan = "free"
        key_hash = None

        if x_api_key:
            db = SessionLocal()
            try:
                db_key = await validate_api_key(db, x_api_key)
                if db_key:
                    org_id = db_key.org_id or "unknown"
                    plan = db_key.environment  # Map to "live" / "test"
                    key_hash = db_key.key_hash
                    concurrency_key_key = f"concurrency:key:{key_hash}"
                    
                    # 4.4 Concurrent Request Limiting (Per Key)
                    key_concurrency = await async_redis_client.incr(concurrency_key_key)
                    if key_concurrency == 1:
                        await async_redis_client.expire(concurrency_key_key, 10)
                    if key_concurrency > 10:
                        await async_redis_client.decr(concurrency_key_key)
                        await async_redis_client.decr(concurrency_ip_key)
                        return JSONResponse(
                            status_code=429,
                            content={"error": {"code": "CONCURRENCY_LIMIT_EXCEEDED", "message": "Max 10 concurrent requests per API key exceeded."}},
                            headers={"Retry-After": "5"}
                        )
            except Exception as e:
                logger.error(f"API key auth in rate limiter failed: {e}")
            finally:
                db.close()

        # ------------------------------------------------------------
        # 4.1 Global IP Rate Limit
        # ------------------------------------------------------------
        # Check IP reputation first (Tor exit nodes)
        is_tor = await async_redis_client.sismember("security:tor_exit_nodes", client_ip)
        is_bot = is_bot_user_agent(user_agent)

        global_limit = 1000
        limit_reason = "IP Global Limit"
        if is_tor:
            global_limit = 10
            limit_reason = "Tor Exit Node Limit"
        elif is_bot and not x_api_key:  # SDK calls are legitimate bots
            global_limit = 100
            limit_reason = "Bot/Script Limit"

        try:
            ip_bucket_key = f"ratelimit:global_ip:{client_ip}:{minute_bucket}"
            ip_count = await async_redis_client.incr(ip_bucket_key)
            if ip_count == 1:
                await async_redis_client.expire(ip_bucket_key, 120)
            
            if ip_count > global_limit:
                if concurrency_key_key:
                    await async_redis_client.decr(concurrency_key_key)
                await async_redis_client.decr(concurrency_ip_key)
                return JSONResponse(
                    status_code=429,
                    content={"error": {"code": "RATE_LIMIT_EXCEEDED", "message": f"{limit_reason} exceeded ({global_limit} req/min)."}},
                    headers={"Retry-After": "60"}
                )
        except Exception as e:
            logger.error(f"Global IP rate limit check failed: {e}")

        # ------------------------------------------------------------
        # 4.2 Endpoint-Specific Rate Limits
        # ------------------------------------------------------------
        endpoint_limit = None
        endpoint_bucket_key = None
        
        # Auth Endpoints
        if path == "/api/v1/auth/login":
            endpoint_limit = 10
            endpoint_bucket_key = f"ratelimit:auth_login:{client_ip}:{minute_bucket}"
        elif path == "/api/v1/auth/register":
            endpoint_limit = 5
            endpoint_bucket_key = f"ratelimit:auth_register:{client_ip}:{minute_bucket}"
        elif path in {"/api/v1/auth/forgot-password", "/api/v1/auth/reset-password"}:
            endpoint_limit = 3
            endpoint_bucket_key = f"ratelimit:auth_reset:{client_ip}:{minute_bucket}"
            
        # API Endpoints
        elif path in {"/analyze_transaction", "/api/v1/transactions/analyze"}:
            # Handled per plan in Monthly Limits, but let's enforce a per-minute bucket too
            endpoint_limit = 600 if plan == "live" else 60
            if key_hash:
                endpoint_bucket_key = f"ratelimit:analyze:{key_hash}:{minute_bucket}"
        elif path == "/api/v1/transactions" or path == "/transactions":
            endpoint_limit = 100
            endpoint_bucket_key = f"ratelimit:tx_list:{org_id}:{minute_bucket}"
        elif path == "/api/v1/alerts" or path == "/fraud_alerts":
            endpoint_limit = 100
            endpoint_bucket_key = f"ratelimit:alerts:{org_id}:{minute_bucket}"
        elif path.startswith("/api/v1/analytics") or path.startswith("/analytics"):
            endpoint_limit = 20
            endpoint_bucket_key = f"ratelimit:analytics:{org_id}:{minute_bucket}"
            
        # Webhooks
        elif path == "/api/v1/billing/webhook":
            endpoint_limit = 1000
            endpoint_bucket_key = f"ratelimit:razorpay_webhook:{minute_bucket}"
        elif path.startswith("/api/v1/integrations/") and path.endswith("/webhook"):
            endpoint_limit = 500
            endpoint_bucket_key = f"ratelimit:integration_webhook:{minute_bucket}"

        if endpoint_limit and endpoint_bucket_key:
            try:
                ep_count = await async_redis_client.incr(endpoint_bucket_key)
                if ep_count == 1:
                    await async_redis_client.expire(endpoint_bucket_key, 60)
                if ep_count > endpoint_limit:
                    if concurrency_key_key:
                        await async_redis_client.decr(concurrency_key_key)
                    await async_redis_client.decr(concurrency_ip_key)
                    return JSONResponse(
                        status_code=429,
                        content={"error": {"code": "RATE_LIMIT_EXCEEDED", "message": f"Endpoint rate limit exceeded ({endpoint_limit} req/min)."}},
                        headers={"Retry-After": "60"}
                    )
            except Exception as e:
                logger.error(f"Endpoint rate limit check failed: {e}")

        # ------------------------------------------------------------
        # 4.3 Monthly Plan limits
        # ------------------------------------------------------------
        if x_api_key and db_key:
            allowed, usage_count, plan_max = await check_monthly_limit(org_id, plan)
            if not allowed:
                if concurrency_key_key:
                    await async_redis_client.decr(concurrency_key_key)
                await async_redis_client.decr(concurrency_ip_key)
                return JSONResponse(
                    status_code=429,
                    content={"error": {"code": "MONTHLY_QUOTA_EXCEEDED", "message": f"Monthly limit reached ({plan_max}). Upgrade plan."}},
                    headers={"Retry-After": "3600"}
                )

            # 4.6 Rate Limit Bypass Detection (API Key sharing)
            try:
                ip_share_key = f"apikey_ips:{key_hash}:{datetime.now().strftime('%Y-%m-%d-%H')}"
                await async_redis_client.sadd(ip_share_key, client_ip)
                await async_redis_client.expire(ip_share_key, 3600)
                distinct_ips = await async_redis_client.scard(ip_share_key)
                if distinct_ips > 10:
                    send_security_email(
                        subject="[SECURITY WARNING] API Key Sharing Detected",
                        body=f"Your API key with prefix {db_key.key_prefix} has been accessed from {distinct_ips} different IPs in the last hour. Please rotate your API keys."
                    )
                    logger.warning(f"API key sharing detected: key {db_key.key_prefix} from {distinct_ips} IPs.")
            except Exception as e:
                logger.error(f"Bypass sharing detector failed: {e}")

        # Execute the request
        try:
            response: Response = await call_next(request)
        finally:
            # Decrement concurrency counters
            try:
                await async_redis_client.decr(concurrency_ip_key)
                if concurrency_key_key:
                    await async_redis_client.decr(concurrency_key_key)
            except Exception:
                pass

        # ------------------------------------------------------------
        # 4.5 Rate Limit Response Headers
        # ------------------------------------------------------------
        try:
            # Add headers
            response.headers["X-RateLimit-Limit"] = str(global_limit)
            
            # Estimate remaining requests for the current bucket
            global_ip_val = await async_redis_client.get(f"ratelimit:global_ip:{client_ip}:{minute_bucket}")
            global_ip_count = int(global_ip_val or 0)
            response.headers["X-RateLimit-Remaining"] = str(max(0, global_limit - global_ip_count))
            
            # Next bucket reset timestamp
            reset_time = (minute_bucket + 1) * 60
            response.headers["X-RateLimit-Reset"] = str(reset_time)
            response.headers["X-RateLimit-Plan"] = plan
        except Exception:
            pass

        return response
