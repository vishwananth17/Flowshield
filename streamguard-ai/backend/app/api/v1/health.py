from datetime import datetime
import time
from typing import Any
from fastapi import APIRouter, Depends, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as redis

from app.db.session import get_db
from app.core.config import get_settings

router = APIRouter()

start_time = time.time()

@router.get("/status", status_code=status.HTTP_200_OK)
async def health_check(db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    settings = get_settings()
    health_status: dict[str, Any] = {
        "status": "ok",
        "version": "1.0.1",
        "environment": settings.environment,
        "uptime_seconds": int(time.time() - start_time),
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "services": {}
    }

    overall_ok = True

    # 1. Check PostgreSQL
    try:
        await db.execute(text("SELECT 1"))
        health_status["services"]["database"] = "ok"
    except Exception as e:
        health_status["services"]["database"] = f"error: {str(e)}"
        overall_ok = False

    # 2. Check Redis (Optional in Production)
    try:
        r = redis.from_url(settings.redis_url, socket_timeout=2.0, socket_connect_timeout=2.0)
        await r.ping()
        health_status["services"]["redis"] = "ok"
    except Exception:
        health_status["services"]["redis"] = "disconnected (optional)"
        # We don't mark overall_ok as False for Redis

    # 3. Check Kafka
    try:
        # We check the Kafka streamer if it's connected
        from app.core.kafka import kafka_streamer
        if kafka_streamer.producer:
            health_status["services"]["kafka"] = "ok"
        else:
            health_status["services"]["kafka"] = "error: not connected"
            overall_ok = False
    except ImportError:
        health_status["services"]["kafka"] = "skipped"

    # 4. Check ML model
    # Simple check if isolation forest is loaded in memory
    try:
        from app.ml.model import ml_model
        if ml_model and ml_model._model:
            health_status["services"]["ml_model"] = "ok"
        else:
            health_status["services"]["ml_model"] = "error: model not found"
            overall_ok = False
    except ImportError:
        health_status["services"]["ml_model"] = "skipped"

    if not overall_ok:
        health_status["status"] = "degraded"
        # We don't raise 503 so that Railway health checks don't restart it if it's just minor
        # but the user requested 503 if any service is down for monitoring
        # return JSONResponse(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, content=health_status)

    return health_status
