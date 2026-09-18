import socket
import sys

sys.dont_write_bytecode = True

# Force IPv4 resolution first to prevent ENETUNREACH / NameResolutionError on IPv6-disabled hosts (e.g. Render/Docker)
orig_getaddrinfo = socket.getaddrinfo
def custom_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    if family == socket.AF_UNSPEC:
        family = socket.AF_INET
    return orig_getaddrinfo(host, port, family, type, proto, flags)
socket.getaddrinfo = custom_getaddrinfo

import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.middleware import RequestLoggingMiddleware, get_cors_origins
from app.core.rate_limiter import RateLimitMiddleware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Validate required secrets & entropy before accepting any traffic
    from app.core.config import validate_secrets
    validate_secrets()
    logger.info("SECURITY_AUDIT: Startup secret entropy verification PASSED")

    # 2. Initialize singleton Redis client
    from app.core.redis import get_redis_client
    get_redis_client()
    yield
    # Close Redis client connection gracefully on shutdown
    client = get_redis_client()
    await client.close()


def create_application() -> FastAPI:
    settings = get_settings()
    
    app = FastAPI(
        title=settings.app_name,
        version="1.0.1",
        description="Flowshield AI — Real-time high-fidelity fraud detection gateway.",
        docs_url=None if settings.environment == "production" else "/docs",
        redoc_url=None,
        lifespan=lifespan,
    )

    # Middlewares (Starlette executes in reverse order of addition; last added executes first)
    # 5. Innermost: GZip compression on responses > 1000 bytes
    app.add_middleware(GZipMiddleware, minimum_size=1000)

    # 4. Layer 5: Structured JSON Request Audit Logging
    from app.core.middleware import (
        RequestIdAndSecurityHeadersMiddleware,
        StructuredLoggingMiddleware,
        get_cors_origins,
    )
    app.add_middleware(StructuredLoggingMiddleware)

    # 3. Layer 3: Strict Whitelisted CORS (No wildcard reflection with credentials)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=get_cors_origins(),
        allow_origin_regex=r"https://.*\.vercel\.app",
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=["Content-Type", "Authorization", "X-CSRF-Token", "X-Requested-With", "Accept", "X-API-Key", "X-Request-ID"],
        expose_headers=["X-Request-ID", "X-Process-Time", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset", "X-RateLimit-Plan", "Retry-After"],
    )

    # 2. Layer 1 & 4: Global IP & Endpoint Rate Limiting (rejection before application logic)
    if settings.redis_url:
        app.add_middleware(RateLimitMiddleware, redis_url=settings.redis_url)

    # 1. Layer 1: Request ID Injection & Institutional Security Headers (Outermost: wraps 100% of responses)
    app.add_middleware(RequestIdAndSecurityHeadersMiddleware)

    # API Router - Lazy import to avoid circular deadlock
    from app.api.v1.router import api_router
    app.include_router(api_router, prefix="/api/v1")

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        import traceback
        tb_str = traceback.format_exc()
        request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
        logger.error(f"GLOBAL_CRASH: {str(exc)} | REQUEST_ID: {request_id} | TRACE: {tb_str}")
        
        # In production, never leak internal stack traces to client
        is_dev = settings.environment == "development" and not settings.debug is False
        error_msg = str(exc) if is_dev else "An internal server error occurred. Please quote the request_id."
        
        err_content = {
            "error": {
                "code": "INTERNAL_ERROR",
                "message": error_msg,
                "request_id": request_id,
            }
        }
        if is_dev:
            err_content["error"]["traceback"] = tb_str[-1000:]

        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=err_content
        )


    @app.get("/", tags=["Health"])
    async def index_root():
        return {
            "name": "Flowshield AI Commercial Gateway",
            "version": "1.0.2-live",
            "status": "operational",
            "environment": settings.environment
        }

    @app.get("/health", tags=["Health"])
    async def health_check():
        from sqlalchemy import text
        from app.db.session import AsyncSessionLocal
        from app.core.redis import get_redis_client
        from app.ml.ensemble import get_ensemble
        from app.core.kafka import kafka_streamer
        
        services = {}
        overall_ok = True
        
        # 1. Database Check
        try:
            async with AsyncSessionLocal() as db:
                await db.execute(text("SELECT 1"))
            services["database"] = "ok"
        except Exception as e:
            services["database"] = f"error: {str(e)}"
            overall_ok = False
            
        # 2. Redis Check
        try:
            client = get_redis_client()
            await client.ping()
            services["redis"] = "ok"
        except Exception as e:
            services["redis"] = f"error: {str(e)}"
            # Redis is not hard-blocking for overall system health check if optional
            
        # 3. Kafka Check
        try:
            if kafka_streamer.producer:
                services["kafka"] = "ok"
            else:
                services["kafka"] = "warning: no broker connection"
        except Exception:
            services["kafka"] = "error"
            
        # 4. ML Ensemble Check
        try:
            ensemble = get_ensemble()
            if ensemble._mvi_available or ensemble._xgb_available:
                services["ml_model"] = "ok"
            else:
                services["ml_model"] = "error: models not loaded"
                overall_ok = False
        except Exception as e:
            services["ml_model"] = f"error: {str(e)}"
            overall_ok = False
            
        status_code = status.HTTP_200_OK if overall_ok else status.HTTP_503_SERVICE_UNAVAILABLE
        return JSONResponse(
            status_code=status_code,
            content={
                "status": "ok" if overall_ok else "degraded",
                "services": services
            }
        )

    return app

app = create_application()

