from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)

        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # XSS protection (legacy browsers)
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Referrer policy
        response.headers["Referrer-Policy"] = (
            "strict-origin-when-cross-origin"
        )

        # Permissions policy
        response.headers["Permissions-Policy"] = (
            "geolocation=(), microphone=(), camera=(), "
            "payment=(), usb=(), bluetooth=(), "
            "accelerometer=(), gyroscope=()"
        )

        # HSTS (force HTTPS for 1 year)
        response.headers["Strict-Transport-Security"] = \
            "max-age=31536000; includeSubDomains; preload"

        # Content Security Policy
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' "
            "https://checkout.razorpay.com; "
            "style-src 'self' 'unsafe-inline' "
            "https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https:; "
            "connect-src 'self' "
            "https://api.flowshieldai.com "
            "wss://api.flowshieldai.com; "
            "frame-src https://api.razorpay.com; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self'"
        )

        # Prevent caching of sensitive responses
        if request.url.path.startswith("/api/"):
            response.headers["Cache-Control"] = \
                "no-store, no-cache, must-revalidate"
            response.headers["Pragma"] = "no-cache"

        # Remove server identification
        response.headers.pop("server", None)
        response.headers.pop("x-powered-by", None)

        # Request ID for audit trail
        request_id = getattr(
            request.state, "request_id", "unknown"
        )
        response.headers["X-Request-ID"] = request_id

        return response

from starlette.requests import Request
from database import SessionLocal
from app.core.audit_log import audit_logger

class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Attach request_id to request.state on incoming request if not set
        if not hasattr(request.state, "request_id"):
            import uuid
            request.state.request_id = str(uuid.uuid4())

        response = await call_next(request)
        
        if request.url.path not in {"/docs", "/redoc", "/openapi.json"}:
            db = SessionLocal()
            try:
                user_id = getattr(request.state, "user_id", None)
                org_id = getattr(request.state, "org_id", None)
                email = getattr(request.state, "email", None)
                
                action = f"api.{request.method.lower()}{request.url.path.replace('/', '.')}"
                result = "success" if response.status_code < 400 else "failure"
                
                severity = "info"
                if response.status_code >= 500:
                    severity = "critical"
                elif response.status_code >= 400:
                    severity = "warning"

                class SimpleActor:
                    def __init__(self, id, email, org_id):
                        self.id = id
                        self.email = email
                        self.org_id = org_id

                actor = None
                if user_id:
                    actor = SimpleActor(user_id, email, org_id)

                await audit_logger.log(
                    db=db,
                    action=action,
                    result=result,
                    actor=actor,
                    resource_type="api_endpoint",
                    resource_id=request.url.path,
                    metadata={
                        "status_code": response.status_code,
                        "query_params": dict(request.query_params)
                    },
                    severity=severity,
                    request=request
                )
            except Exception as e:
                print(f"Error in AuditMiddleware: {e}")
            finally:
                db.close()
                
        return response

