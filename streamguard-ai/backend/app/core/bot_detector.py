import time
import logging
import hashlib
from fastapi import Request

logger = logging.getLogger(__name__)

class BotDetector:
    BOT_USER_AGENTS = [
        "python-requests", "curl/", "wget/",
        "go-http-client", "okhttp", "java/",
        "axios/", "node-fetch", "aiohttp",
        "scrapy", "libwww-perl", "httpie",
    ]

    def __init__(self, redis_client):
        self.redis = redis_client

    def _get_client_ip(self, request: Request) -> str:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "127.0.0.1"

    async def analyze_request(self, request: Request, org_id: str) -> dict:
        if not self.redis:
            return {
                "is_bot_user_agent": 0,
                "requests_per_minute": 1,
                "identical_body_count": 1,
                "interval_regularity": 0.0,
                "missing_browser_headers": 0,
                "is_bot_attack": 0,
                "fraud_type_hint": None
            }

        ua = request.headers.get("user-agent", "").lower()
        ip = self._get_client_ip(request)

        # Feature 1: Bot user agent
        is_bot_ua = any(bot in ua for bot in self.BOT_USER_AGENTS)

        # Feature 2: Request velocity (requests per minute)
        velocity_key = f"request_velocity:{org_id}:{ip}:{int(time.time() // 60)}"
        request_count = await self.redis.incr(velocity_key)
        await self.redis.expire(velocity_key, 120)

        # Feature 3: Identical request body detection
        body_hash = "empty"
        try:
            body_bytes = await request.body()
            if body_bytes:
                body_hash = hashlib.md5(body_bytes).hexdigest()
        except Exception:
            pass

        body_key = f"body_hash:{org_id}:{body_hash}:{int(time.time() // 300)}"
        identical_count = await self.redis.incr(body_key)
        await self.redis.expire(body_key, 600)

        # Feature 4: Timing regularity (bots are too precise)
        timing_key = f"request_times:{org_id}:{ip}"
        current_time = time.time()
        last_times = await self.redis.lrange(timing_key, 0, 9)
        await self.redis.lpush(timing_key, str(current_time))
        await self.redis.ltrim(timing_key, 0, 9)
        await self.redis.expire(timing_key, 300)

        interval_regularity = 0.0
        if len(last_times) >= 3:
            try:
                intervals = [
                    float(last_times[i]) - float(last_times[i+1])
                    for i in range(len(last_times) - 1)
                ]
                if len(intervals) > 1:
                    import statistics
                    mean_interval = statistics.mean(intervals)
                    stdev = statistics.stdev(intervals)
                    interval_regularity = (
                        1.0 - min(stdev / max(mean_interval, 0.001), 1.0)
                    )
            except Exception:
                pass

        # Feature 5: Missing browser headers
        headers_keys = {k.lower() for k in request.headers.keys()}
        has_accept_header = "accept" in headers_keys
        has_accept_language = "accept-language" in headers_keys
        missing_browser_headers = not (has_accept_header and has_accept_language)

        is_bot_attack = (
            request_count > 100
            or (is_bot_ua and identical_count > 10)
            or (interval_regularity > 0.95 and request_count > 20)
        )

        return {
            "is_bot_user_agent": int(is_bot_ua),
            "requests_per_minute": request_count,
            "identical_body_count": identical_count,
            "interval_regularity": round(interval_regularity, 4),
            "missing_browser_headers": int(missing_browser_headers),
            "is_bot_attack": int(is_bot_attack),
            "fraud_type_hint": "bot_attack" if is_bot_attack else None
        }
