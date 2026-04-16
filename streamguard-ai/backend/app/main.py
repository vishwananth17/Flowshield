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
<div align="center">
  <img src="https://frontend-blue-one-42.vercel.app/favicon.ico" width="80" height="80" style="margin-bottom: 20px;" />
  <h1 style="color: white; border: none; font-size: 3.5em; font-weight: 800; letter-spacing: -0.05em; margin-bottom: 10px;">The Guardian of Finance</h1>
  <p style="font-size: 1.25em; color: #94A3B8; max-width: 800px; margin: 0 auto 40px auto; line-height: 1.6;">
    Flowshield AI is an enterprise-grade, autonomous fraud intelligence layer designed to protect digital economies. 
    Intercept threats, mitigate risk, and secure every transaction with sub-100ms precision.
  </p>
</div>

---

## 🚀 The Three-Step Integration Protocol
Connecting your business to Flowshield AI is streamlined into three deliberate phases:

1.  **Provision Credentials**: Generate your unique `sg_live_` secret key from the [Developer Console](https://frontend-blue-one-42.vercel.app/dashboard/api-keys).
2.  **Initialize Handshake**: Securely embed your API key into your backend environment headers.
3.  **Deploy Analysis**: Transmit transaction metadata to our inference engine for real-time risk scoring.

---

## 🏛️ Integration Architectures
Choose your environment to see copy-paste ready connectivity logic.

### 🌐 1. Modern Web & Node.js
Deploy for high-scale e-commerce and digital storefronts.
```javascript
// Professional implementation
const response = await fetch('https://flowshield-backend-ani8.onrender.com/api/v1/transactions/analyze', {
  method: 'POST',
  headers: {
    'X-API-Key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 149.99,
    currency: 'USD',
    merchant_name: 'App Store',
    customer: { email: 'client@business.com', ip: '192.168.1.5' }
  })
});
```

### 🍎 2. iOS / Swift
Secure native Apple platform transactions with zero friction.
```swift
let url = URL(string: "https://flowshield-backend-ani8.onrender.com/api/v1/transactions/analyze")!
var request = URLRequest(url: url)
request.httpMethod = "POST"
request.setValue("YOUR_API_KEY", forHTTPHeaderField: "X-API-Key")
request.httpBody = try? JSONSerialization.data(withJSONObject: payload)
```

### 🤖 3. Android / Kotlin
Industrial-level fraud protection for your mobile user base.
```kotlin
val client = OkHttpClient()
val request = Request.Builder()
  .url("https://flowshield-backend-ani8.onrender.com/api/v1/transactions/analyze")
  .post(body)
  .addHeader("X-API-Key", "YOUR_API_KEY")
  .build()
```

### 🐍 4. Python / Data Science
Integrate into your data pipeline for post-analysis or real-time verification.
```python
import requests
headers = {"X-API-Key": "YOUR_API_KEY"}
response = requests.post(URL, json=data, headers=headers)
```

### 🐹 5. Go / Backend Systems
High-concurrency systems requiring ultra-low latency verification.
```go
req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonPayload))
req.Header.Set("X-API-Key", "YOUR_API_KEY")
req.Header.Set("Content-Type", "application/json")
```

---

## 🧠 Intelligence Parameters
Flowshield AI utilizes an ensemble of **Isolation Forests** and **Deep-Neural Recurrent Patterns** (RNPs) to identify sophisticated fraud patterns including velocity anomalies, geographic mismatches, and blacklisted device fingerprints.

---

## 💡 System Decisions
Our engine returns a deterministic decision to automate your checkout logic:
- **`allow`**: Safe to process. Zero risk detected.
- **`review`**: Potential anomaly. Recommended manual audit.
- **`block`**: High-fidelity fraud detected. Transaction rejected.
"""

    app = FastAPI(
        title="Flowshield AI | Documentation Suite",
        description=description,
        version="4.0.0",
        lifespan=lifespan,
        docs_url=None,
        redoc_url=None,
        openapi_url="/openapi.json",
    )

    @app.get("/docs", include_in_schema=False)
    async def custom_swagger_ui_html():
        from fastapi.responses import HTMLResponse
        html = get_swagger_ui_html(
            openapi_url=app.openapi_url,
            title=app.title,
            oauth2_redirect_url=app.swagger_ui_oauth2_redirect_url,
            swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
            swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css",
            swagger_favicon_url="https://frontend-blue-one-42.vercel.app/favicon.ico",
        )
        
        # Inject custom theme (CoderPro Unified Style)
        custom_css = """
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
        <style>
            :root {
                --bg-deep: #050811;
                --bg-surface: #0a0e1a;
                --primary: #3b82f6;
                --secondary: #10b981;
                --border: #1e293b;
                --text-main: #f1f5f9;
                --text-muted: #94a3b8;
            }
            .swagger-ui { background-color: var(--bg-deep) !important; color: var(--text-muted) !important; font-family: 'Inter', sans-serif !important; padding-bottom: 100px !important; }
            .swagger-ui .topbar { display: none !important; }
            .swagger-ui .info { margin: 60px auto !important; max-width: 1000px !important; text-align: left !important; position: relative; }
            .swagger-ui .info .title { color: white !important; font-size: 48px !important; font-weight: 800 !important; letter-spacing: -0.04em !important; margin-bottom: 20px !important; }
            .swagger-ui .info p, .swagger-ui .info li, .swagger-ui .info td { color: var(--text-muted) !important; font-size: 16px !important; line-height: 1.7 !important; }
            .swagger-ui .title small { background: var(--primary) !important; border-radius: 8px !important; padding: 4px 10px !important; top: -10px !important; }
            
            /* API Blocks */
            .swagger-ui .opblock { border: 1px solid var(--border) !important; border-radius: 20px !important; background: var(--bg-surface) !important; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1) !important; margin-bottom: 16px !important; overflow: hidden !important; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important; }
            .swagger-ui .opblock:hover { border-color: var(--primary) !important; transform: translateY(-2px); box-shadow: 0 20px 25px -5px rgba(59,130,246,0.1) !important; }
            
            .swagger-ui .opblock .opblock-summary { padding: 16px 24px !important; height: auto !important; }
            .swagger-ui .opblock .opblock-summary-method { border-radius: 10px !important; font-size: 12px !important; font-weight: 800 !important; padding: 8px 16px !important; text-transform: uppercase !important; min-width: 100px !important; text-align: center !important; }
            
            .swagger-ui .opblock-get .opblock-summary-method { background: var(--primary) !important; }
            .swagger-ui .opblock-post .opblock-summary-method { background: var(--secondary) !important; }
            
            .swagger-ui .opblock .opblock-summary-path { color: var(--text-main) !important; font-weight: 600 !important; font-family: 'JetBrains Mono', monospace !important; font-size: 15px !important; }
            .swagger-ui .opblock .opblock-summary-description { color: var(--text-muted) !important; font-size: 14px !important; }
            
            /* Inputs & Forms */
            .swagger-ui input, .swagger-ui select, .swagger-ui textarea { background: var(--bg-deep) !important; border: 1px solid var(--border) !important; color: white !important; border-radius: 12px !important; padding: 10px 15px !important; }
            .swagger-ui .btn.execute { background-color: var(--primary) !important; color: white !important; border: none !important; border-radius: 12px !important; font-weight: 700 !important; padding: 12px 40px !important; font-size: 14px !important; box-shadow: 0 4px 6px -1px rgba(59,130,246,0.4) !important; transition: all 0.2s !important; }
            .swagger-ui .btn.execute:hover { background-color: #2563eb !important; transform: scale(1.02); }
            
            .swagger-ui .scheme-container { background: var(--bg-deep) !important; border-top: 1px solid var(--border) !important; box-shadow: none !important; margin-top: 40px !important; }
            .swagger-ui section.models { border: 1px solid var(--border) !important; border-radius: 20px !important; padding: 20px !important; background: var(--bg-surface) !important; }
            .swagger-ui section.models h4 { color: white !important; font-size: 20px !important; font-weight: 700 !important; }
            
            ::-webkit-scrollbar { width: 8px; }
            ::-webkit-scrollbar-track { background: var(--bg-deep); }
            ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
            
            body { background-color: var(--bg-deep) !important; margin: 0; }
        </style>
        """
        content = html.body.decode().replace("</head>", f"{custom_css}</head>")
        return HTMLResponse(content=content)

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

    # Commenting out for isolation

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
