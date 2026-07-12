import redis.asyncio as async_redis
from app.core.config import get_settings

_redis_client = None

def get_redis_client() -> async_redis.Redis:
    global _redis_client
    if _redis_client is None:
        settings = get_settings()
        _redis_client = async_redis.from_url(
            settings.redis_url,
            decode_responses=True,
            socket_timeout=2.0,
            socket_connect_timeout=2.0
        )
    return _redis_client
