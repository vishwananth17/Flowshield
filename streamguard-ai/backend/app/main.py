import logging
import time
from datetime import UTC, datetime

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

from app.api.v1 import api_router
from app.core.config import get_settings
from app.core.middleware import RequestLoggingMiddleware
from app.core.rate_limiter import RateLimitMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

def create_application() -> FastAPI:
    settings = get_settings()
    
    app = FastAPI(
        title=settings.app_name,
        version="1.0.1-FORENSIC-V3",
        description="Flowshield AI — Real-time high-fidelity fraud detection gateway.",
        docs_url="/docs" if settings.environment != "production" else None,
        redoc_url="/redoc" if settings.environment != "production" else None,
    )

    # Middlewares
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RequestLoggingMiddleware)
    
    if settings.redis_url:
        app.add_middleware(RateLimitMiddleware, redis_url=settings.redis_url)

    # API Router
    app.include_router(api_router, prefix="/api/v1")

    @app.middleware("http")
    async def add_process_time_header(request: Request, call_next):
        start_time = time.perf_counter()
        response = await call_next(request)
        process_time = time.perf_counter() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        return response

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        import traceback
        error_msg = f"GLOBAL_CRASH: {str(exc)} | TRACE: {traceback.format_exc()}"
        logger.error(error_msg)
        
        # FORENSIC MODE: Always reveal error in production until stability is confirmed
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": error_msg,
                    "request_id": request.state.request_id if hasattr(request.state, "request_id") else ""
                }
            }
        )

    @app.get("/", tags=["Health"])
    async def health_check():
        return {
            "name": "Flowshield AI Commercial Gateway",
            "version": "1.0.1-FORENSIC-V3",
            "status": "operational",
            "environment": "production",
            "gateway_id": "ani8-render-ohio"
        }

    return app

app = create_application()
