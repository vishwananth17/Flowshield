import re
import os
import httpx
import logging
from typing import List
import redis.asyncio as async_redis

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
async_redis_client = async_redis.from_url(REDIS_URL, decode_responses=True)

TOR_EXIT_NODES_KEY = "security:tor_exit_nodes"
BLOCKED_IPS_KEY = "security:blocked_ips"
SUSPICIOUS_IPS_KEY = "security:suspicious_ips"

# ------------------------------------------------------------
# 11.1 IP Reputation Checking
# ------------------------------------------------------------

async def check_ip_reputation(ip: str) -> str:
    """Check IP against reputation sets in Redis."""
    if await async_redis_client.sismember(BLOCKED_IPS_KEY, ip):
        return "blocked"
    if await async_redis_client.sismember(TOR_EXIT_NODES_KEY, ip):
        return "tor"
    if await async_redis_client.sismember(SUSPICIOUS_IPS_KEY, ip):
        return "suspicious"
    return "clean"

async def update_tor_exit_nodes():
    """Download and refresh Tor exit node list in Redis."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get("https://check.torproject.org/torbulkexitlist")
            if resp.status_code == 200:
                ips = [line.strip() for line in resp.text.split("\n") if line.strip()]
                # Clear and reload set in Redis
                await async_redis_client.delete(TOR_EXIT_NODES_KEY)
                if ips:
                    await async_redis_client.sadd(TOR_EXIT_NODES_KEY, *ips)
                logger.info("Successfully refreshed Tor exit nodes in Redis.")
    except Exception as e:
        logger.error(f"Failed to refresh Tor exit nodes: {e}")

# ------------------------------------------------------------
# 11.2 User Agent Analysis
# ------------------------------------------------------------

BOT_UA_PATTERNS = [
    r'python-requests', r'curl/', r'wget/',
    r'Go-http-client', r'okhttp', r'axios/',
    r'node-fetch', r'bot', r'crawler', r'spider'
]

def is_bot_user_agent(user_agent: str) -> bool:
    """Analyze if user agent matches typical bot frameworks."""
    if not user_agent:
        return False
    ua = user_agent.lower()
    return any(
        re.search(p, ua, re.IGNORECASE)
        for p in BOT_UA_PATTERNS
    )

# ------------------------------------------------------------
# 11.3 Behavioral Anomaly Detection
# ------------------------------------------------------------

async def record_registration_attempt(ip: str) -> bool:
    """Flag if same IP registers > 3 accounts in 1 hour."""
    key = f"reg_attempts:{ip}"
    count = await async_redis_client.incr(key)
    if count == 1:
        await async_redis_client.expire(key, 3600)
    return count <= 3

async def record_api_key_attempt(ip: str) -> bool:
    """Flag sequential invalid key attempts (BIN attack pattern)."""
    key = f"invalid_keys:{ip}"
    count = await async_redis_client.incr(key)
    if count == 1:
        await async_redis_client.expire(key, 300)  # 5 min window
    return count <= 5

async def record_account_login_attempts(ip: str, email: str) -> bool:
    """Flag if IP attempts login across > 10 different accounts."""
    key = f"ip_logins:{ip}"
    await async_redis_client.sadd(key, email)
    await async_redis_client.expire(key, 300)
    count = await async_redis_client.scard(key)
    return count <= 10

async def record_repeated_body(ip: str, body_hash: str) -> bool:
    """Flag if identical request bodies repeated > 5 times."""
    key = f"repeated_body:{ip}:{body_hash}"
    count = await async_redis_client.incr(key)
    if count == 1:
        await async_redis_client.expire(key, 60)  # 1 min window
    return count <= 5

# ------------------------------------------------------------
# 11.4 Geo-blocking
# ------------------------------------------------------------

async def check_geo_blocking(ip: str, blocked_countries: List[str]) -> bool:
    """Verify if IP country is blocked by organization config."""
    if not blocked_countries:
        return False
    from app.core.security import get_ip_country
    country = await get_ip_country(ip)
    return country in blocked_countries
