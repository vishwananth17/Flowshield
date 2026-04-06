import redis
import json
import os
from typing import Dict, Any
import asyncio

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
STREAM_KEY = "transactions:stream"

# Setup sync redis client for basic usage (FastAPI background tasks or simple publishing)
try:
    redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)
except Exception as e:
    redis_client = None

def publish_transaction(tx_data: Dict[str, Any]):
    """Publish a transaction to the Redis stream for real-time processing"""
    if redis_client:
        try:
            # redis_client.xadd takes a dictionary of string keys and string values
            stringified_data = {k: str(v) for k, v in tx_data.items()}
            redis_client.xadd(STREAM_KEY, stringified_data)
        except Exception as e:
            print(f"Error publishing to redis: {e}")

# In a real heavy production app, we would have a separate worker script pulling from this stream.
# For our API, we'll demonstrate using a background task in FastAPI directly or simply simulating stream passing.
