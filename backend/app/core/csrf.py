import hmac
import secrets
# pyrefly: ignore [missing-import]
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

class CSRFMiddleware(BaseHTTPMiddleware):
    SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}
    EXEMPT_PATHS = {
        "/api/v1/auth/login",
        "/api/v1/auth/register",
        "/api/v1/auth/forgot-password",
        "/api/v1/auth/reset-password",
        "/api/v1/billing/webhook",
        "/api/v1/integrations/shopify/webhook",
        "/generate_mock_traffic"
    }

    async def dispatch(self, request: Request, call_next):
        
        # 1. Exempt safe methods
        if request.method in self.SAFE_METHODS:
            response = await call_next(request)
            
            # Ensure the CSRF cookie is set if not already present
            if "flowshield_csrf" not in request.cookies:
                csrf_token = secrets.token_urlsafe(32)
                # Max-Age: 86400 (1 day), HttpOnly: False (so JS can read it), Secure: True, SameSite: Strict
                response.set_cookie(
                    "flowshield_csrf",
                    csrf_token,
                    max_age=86400,
                    samesite="strict",
                    secure=True,
                    httponly=False
                )
            return response

        # 2. Exempt paths that don't require CSRF validation (e.g. webhooks or registration)
        if request.url.path in self.EXEMPT_PATHS:
            return await call_next(request)

        # 3. API key auth doesn't need CSRF (as it is not cookie-based)
        if request.headers.get("X-API-Key"):
            return await call_next(request)

        # 4. Perform CSRF verification
        csrf_cookie = request.cookies.get("flowshield_csrf")
        csrf_header = request.headers.get("X-CSRF-Token")

        if not csrf_cookie or not csrf_header:
            from app.core.monitoring import increment_security_metric
            await increment_security_metric("flowshield_csrf_violations_total")
            return JSONResponse(
                status_code=403,
                content={
                    "error": {
                        "code": "CSRF_MISSING",
                        "message": "CSRF token required"
                    }
                }
            )

        if not hmac.compare_digest(csrf_cookie, csrf_header):
            from app.core.monitoring import increment_security_metric
            await increment_security_metric("flowshield_csrf_violations_total")
            return JSONResponse(
                status_code=403,
                content={
                    "error": {
                        "code": "CSRF_INVALID",
                        "message": "Invalid CSRF token"
                    }
                }
            )

        return await call_next(request)
