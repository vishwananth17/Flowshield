import logging
import json
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.middleware import RequestLoggingMiddleware
from app.core.rate_limiter import RateLimitMiddleware
from app.db.session import AsyncSessionLocal, engine

logger = logging.getLogger("streamguard")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database Tables for Render
    from app.models.base import Base
    from app.models.waitlist import Waitlist # Ensure models are registered
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("✅ Database tables successfully initialized")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {str(e)}")

    yield
    await engine.dispose()


def create_app() -> FastAPI:
    settings = get_settings()
    is_prod = settings.environment == "production"

    description = """
# 🛡️ Flowshield AI Integration Guide

Welcome to the **Flowshield AI Real-Time Fraud Detection API**. 
Integrate enterprise-grade security into your business in minutes.

---

## 🔑 Authentication
All requests must include your API Key in the `X-API-Key` header.
Get your key from the **[Flowshield Dashboard](https://frontend-blue-one-42.vercel.app/dashboard/api-keys)**.

```bash
X-API-Key: sg_live_xxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🚀 Integration Examples

### 1. Web / Backend (Node.js/Javascript)
Ideal for marketplaces and e-commerce checkouts.

```javascript
// Example analysis call
const response = await fetch('https://flowshield-backend-ani8.onrender.com/api/v1/transactions/analyze', {
  method: 'POST',
  headers: {
    'X-API-Key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 99.99,
    currency: 'USD',
    merchant_name: 'Store Name',
    customer: { email: 'user@example.com', ip: '1.2.3.4' }
  })
});

const result = await response.json();
if (result.decision === 'block') {
  alert('Payment declined by fraud protection.');
}
```

### 2. Mobile App (Python/Swift/Kotlin)
Connect your fintech app directly to the shield.

```python
import requests

def verify_transaction(tx_data):
    headers = {"X-API-Key": "YOUR_API_KEY"}
    url = "https://flowshield-backend-ani8.onrender.com/api/v1/transactions/analyze"
    
    response = requests.post(url, json=tx_data, headers=headers)
    return response.json()
```

### 3. Terminal/cURL
Test your integration instantly from the command line.

```bash
curl -X POST https://flowshield-backend-ani8.onrender.com/api/v1/transactions/analyze \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"amount": 50.0, "currency": "USD", "merchant_name": "Terminal Test"}'
```

---

## 🏦 Banking & Compliance
Use Flowshield to monitor internal bank-to-bank transfers or cross-border payments. 
Our ML models specialized in **High-Lump-Sum (HLS)** detection.

---

## 📈 Response Model
Each analysis returns a `risk_score` (0-1) and a `decision`:
- `allow`: Proceed with transaction.
- `review`: Manual verification recommended.
- `block`: Stop transaction (High risk detected).
"""

    app = FastAPI(
        title="🛡️ Flowshield AI | Developer Documentation",
        description=description,
        version="2.1.0",
        lifespan=lifespan,
        docs_url=None,
        redoc_url=None,
        openapi_url="/openapi.json",
    )

    @app.get("/docs", include_in_schema=False)
    async def custom_swagger_ui_html():
        return get_swagger_ui_html(
            openapi_url=app.openapi_url,
            title=app.title + " - API Docs",
            oauth2_redirect_url=app.swagger_ui_oauth2_redirect_url,
            swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
            swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-themes@3.0.1/themes/3.x/theme-material.css",
            swagger_favicon_url="https://fastapi.tiangolo.com/img/favicon.png",
        )

    # TEMPORARY: Simplified middleware stack to isolate CORS issue
    app.add_middleware(GZipMiddleware, minimum_size=500)
    
    # CORS Configuration
    origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://flowshieldai.com",
        "https://www.flowshieldai.com",
        "https://frontend-blue-one-42.vercel.app",
    ]
    
    # Allow all vercel subdomains for preview deployments
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_origin_regex="https://.*\-.*\.vercel\.app", # Corrected regex for vercel subdomains
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/cors-test")
    def cors_test():
        return {"status": "CORS should be working if you can see this from the frontend"}

    # Commenting out for isolation
    # app.add_middleware(RequestLoggingMiddleware)
    # app.add_middleware(RateLimitMiddleware, redis_url=settings.redis_url)

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        rid = getattr(request.state, "request_id", "")
        detail = exc.detail
        if isinstance(detail, dict) and "code" in detail:
            err = dict(detail)
            if not err.get("request_id"):
                err["request_id"] = rid
            return JSONResponse(status_code=exc.status_code, content={"error": err})
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": "HTTP_ERROR",
                    "message": str(detail),
                    "request_id": rid,
                    "docs_url": "https://docs.flowshield.ai/errors",
                }
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        rid = getattr(request.state, "request_id", "")
        
        # Sanitize errors to ensure they are JSON serializable
        try:
            errors = json.loads(json.dumps(exc.errors(), default=lambda x: str(x)))
        except:
            errors = str(exc.errors())

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Request validation failed",
                    "request_id": rid,
                    "details": errors,
                    "docs_url": "https://docs.flowshield.ai/errors#VALIDATION_ERROR",
                }
            },
        )

    @app.get("/api/docs", include_in_schema=False)
    async def api_docs_redirect():
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url="/docs")

    @app.get("/health", summary="Railway health check")
    async def railway_health():
        return {"status": "ok"}

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        rid = getattr(request.state, "request_id", "")
        import traceback
        logger.error(f"Global error {rid}: {exc}\n{traceback.format_exc()}")
        settings = get_settings()
        content = {
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "Internal Server Error" if settings.environment == "production" else str(exc),
                "request_id": rid,
            }
        }
        if settings.environment != "production":
            content["error"]["traceback"] = traceback.format_exc()
            
        return JSONResponse(
            status_code=500,
            content=content,
        )

    app.include_router(api_router, prefix="/api/v1")
    return app


app = create_app()
