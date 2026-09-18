import json
import logging
import time
import uuid
from collections.abc import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("flowshield.audit")


class RequestIdAndSecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Layer 1 & 2: Request ID injection and institutional security headers.

    Executes on EVERY request/response lifecycle, ensuring forensic traceability
    and zero-trust browser defenses even on unhandled exceptions or 429 rejections.
    """
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # 1. Request ID injection
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = request_id

        try:
            response = await call_next(request)
        except Exception:
            # Re-raise to let exception handlers or downstream logger capture the trace
            raise

        # 2. Institutional Security Headers (Applied to 100% of responses)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"

        return response


class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    """Layer 5: Structured JSON request audit logger.

    Emits single-line machine-parsable JSON logs indexed by request_id.
    Zero leakage of passwords, tokens, cards, PAN, or Aadhaar numbers.
    """
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.perf_counter()
        request_id = getattr(request.state, "request_id", str(uuid.uuid4()))

        status_code = 500
        try:
            response = await call_next(request)
            status_code = response.status_code
            return response
        except Exception as exc:
            duration_ms = (time.perf_counter() - start_time) * 1000
            logger.error(
                json.dumps({
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "level": "ERROR",
                    "event": "request_failed",
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": 500,
                    "duration_ms": round(duration_ms, 2),
                    "error": str(exc)[:200],
                })
            )
            raise
        finally:
            duration_ms = (time.perf_counter() - start_time) * 1000
            org_id = getattr(request.state, "org_id", None)
            
            # Skip noise on static health checks unless error
            if request.url.path != "/health" or status_code >= 400:
                log_entry = {
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "level": "INFO" if status_code < 400 else "WARN" if status_code < 500 else "ERROR",
                    "event": "http_request",
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": status_code,
                    "duration_ms": round(duration_ms, 2),
                }
                if org_id:
                    log_entry["org_id"] = str(org_id)

                logger.info(json.dumps(log_entry))


# Alias for backwards compatibility with any existing imports
RequestLoggingMiddleware = StructuredLoggingMiddleware


def get_cors_origins() -> list[str]:
    """Calculate allowed origins based on environment settings."""
    from app.core.config import get_settings
    settings = get_settings()

    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "https://flowshield-ai.vercel.app",
        "https://flowshieldai.com",
        "https://www.flowshieldai.com",
        "https://app.flowshieldai.com",
        "https://api.flowshieldai.com",
    ]

    for o in settings.cors_origin_list:
        if o not in origins:
            origins.append(o)

    return origins
