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

## The Three-Step Integration Protocol
Connecting your business to Flowshield AI is streamlined into three deliberate phases:

1.  **Provision Credentials**: Generate your unique `sg_live_` secret key from the [Developer Console](https://frontend-blue-one-42.vercel.app/dashboard/api-keys).
2.  **Initialize Handshake**: Securely embed your API key into your backend environment headers.
3.  **Deploy Analysis**: Transmit transaction metadata to our inference engine for real-time risk scoring.

---

## Integration Architectures
Choose your environment to see copy-paste ready connectivity logic.

### 1. Modern Web & Node.js
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

### 2. iOS / Swift
Secure native Apple platform transactions with zero friction.
```swift
let url = URL(string: "https://flowshield-backend-ani8.onrender.com/api/v1/transactions/analyze")!
var request = URLRequest(url: url)
request.httpMethod = "POST"
request.setValue("YOUR_API_KEY", forHTTPHeaderField: "X-API-Key")
request.httpBody = try? JSONSerialization.data(withJSONObject: payload)
```

### 3. Android / Kotlin
Industrial-level fraud protection for your mobile user base.
```kotlin
val client = OkHttpClient()
val request = Request.Builder()
  .url("https://flowshield-backend-ani8.onrender.com/api/v1/transactions/analyze")
  .post(body)
  .addHeader("X-API-Key", "YOUR_API_KEY")
  .build()
```

### 4. Python / Data Science
Integrate into your data pipeline for post-analysis or real-time verification.
```python
import requests
headers = {"X-API-Key": "YOUR_API_KEY"}
response = requests.post(URL, json=data, headers=headers)
```

### 5. Go / Backend Systems
High-concurrency systems requiring ultra-low latency verification.
```go
req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonPayload))
req.Header.Set("X-API-Key", "YOUR_API_KEY")
req.Header.Set("Content-Type", "application/json")
```

---

## Intelligence Parameters
Flowshield AI utilizes an ensemble of **Isolation Forests** and **Deep-Neural Recurrent Patterns** (RNPs) to identify sophisticated fraud patterns including velocity anomalies, geographic mismatches, and blacklisted device fingerprints.

---

## System Decisions
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
        
        # Inject custom premium theme (CoderPro Master Edition)
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
            
            /* The Authorize/Scheme Container Fix */
            .swagger-ui .scheme-container { background: var(--bg-deep) !important; border-top: 1px solid var(--border) !important; box-shadow: none !important; margin-top: 40px !important; padding: 30px 0 !important; }
            .swagger-ui .auth-wrapper { justify-content: flex-end !important; }
            .swagger-ui .btn.authorize { background-color: transparent !important; color: var(--secondary) !important; border: 2px solid var(--secondary) !important; border-radius: 12px !important; font-weight: 700 !important; transition: all 0.2s !important; }
            .swagger-ui .btn.authorize:hover { background-color: var(--secondary) !important; color: white !important; }
            .swagger-ui .btn.authorize svg { fill: var(--secondary) !important; }
            .swagger-ui .btn.authorize:hover svg { fill: white !important; }

            /* Mac-Style Code Blocks */
            .swagger-ui pre { 
                background: #0f172a !important; 
                border: 1px solid var(--border) !important; 
                border-radius: 16px !important; 
                padding: 50px 20px 20px 20px !important; 
                position: relative !important;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important;
                margin: 24px 0 !important;
            }
            .swagger-ui pre::before {
                content: '';
                position: absolute;
                top: 18px;
                left: 18px;
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: #ff5f56;
                box-shadow: 18px 0 0 #ffbd2e, 36px 0 0 #27c93f;
            }
            .swagger-ui code { font-family: 'JetBrains Mono', monospace !important; font-size: 14px !important; color: #3b82f6 !important; }
            
            /* Copy Button */
            .copy-btn {
                position: absolute;
                top: 12px;
                right: 12px;
                background: rgba(255,255,255,0.05);
                border: 1px solid var(--border);
                color: var(--text-muted);
                padding: 4px 12px;
                border-radius: 8px;
                font-size: 10px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s;
            }
            .copy-btn:hover { background: var(--primary); color: white; border-color: var(--primary); }

            /* API Blocks & Operations */
            .swagger-ui .opblock { border: 1px solid var(--border) !important; border-radius: 20px !important; background: var(--bg-surface) !important; margin-bottom: 20px !important; overflow: hidden !important; transition: border-color 0.2s !important; }
            .swagger-ui .opblock:hover { border-color: var(--primary) !important; }
            .swagger-ui .opblock-summary { padding: 16px 24px !important; border-bottom: none !important; }
            .swagger-ui .opblock-summary-method { border-radius: 10px !important; }
            
            /* Inputs & Dialogs */
            .swagger-ui input, .swagger-ui select, .swagger-ui textarea { background: var(--bg-deep) !important; border: 1px solid var(--border) !important; color: white !important; border-radius: 12px !important; }
            .swagger-ui .dialog-ux .modal-ux { background: var(--bg-surface) !important; border: 1px solid var(--border) !important; border-radius: 24px !important; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5) !important; }
            .swagger-ui .dialog-ux .modal-ux-header { border-bottom: 1px solid var(--border) !important; padding: 20px !important; }
            .swagger-ui .dialog-ux .modal-ux-header h3 { color: white !important; font-weight: 800 !important; }
            .swagger-ui .dialog-ux .modal-ux-content { padding: 20px !important; }

            /* Schemas & Models Fix */
            .swagger-ui section.models { border: 1px solid var(--border) !important; border-radius: 20px !important; background: var(--bg-surface) !important; margin-top: 40px !important; }
            .swagger-ui section.models h4 { color: white !important; border-bottom: 1px solid var(--border) !important; padding: 20px !important; }
            .swagger-ui .model-box { background: transparent !important; }
            .swagger-ui .model { color: var(--text-muted) !important; }
            .swagger-ui .model-title { color: var(--text-main) !important; font-weight: 700 !important; }
            .swagger-ui .prop-type { color: var(--primary) !important; }
            .swagger-ui .prop-format { color: var(--text-muted) !important; }
            
            /* Scrollbar */
            ::-webkit-scrollbar { width: 10px; }
            ::-webkit-scrollbar-track { background: var(--bg-deep); }
            ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
            ::-webkit-scrollbar-thumb:hover { background: #334155; }
            
            body { background-color: var(--bg-deep) !important; margin: 0; }
        </style>
        
        <script>
            function addCopyButtons() {
                const blocks = document.querySelectorAll('pre');
                blocks.forEach((block) => {
                    if (block.querySelector('.copy-btn')) return;
                    const button = document.createElement('button');
                    button.innerText = 'Copy';
                    button.className = 'copy-btn';
                    button.onclick = (e) => {
                        e.stopPropagation();
                        const code = block.innerText.replace('Copy', '').trim();
                        navigator.clipboard.writeText(code).then(() => {
                            button.innerText = 'Copied!';
                            setTimeout(() => { button.innerText = 'Copy'; }, 2000);
                        });
                    };
                    block.appendChild(button);
                });
            }
            const observer = new MutationObserver(() => addCopyButtons());
            observer.observe(document.body, { childList: true, subtree: true });
            window.onload = addCopyButtons;
        </script>
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
