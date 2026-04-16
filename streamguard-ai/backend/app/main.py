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
    description = """
<div align="center" style="margin-bottom: 80px; padding: 40px 0;">
  <h1 style="color: #FFFFFF !important; font-size: 64px !important; font-weight: 800 !important; letter-spacing: -0.05em !important; margin-bottom: 24px; border: none !important; line-height: 1.1 !important;">The Guardian of Finance</h1>
  <p style="color: #94A3B8 !important; font-size: 20px !important; max-width: 800px; line-height: 1.7; margin: 0 auto 48px auto;">
    Flowshield AI is an enterprise-grade, autonomous fraud intelligence layer. 
    Intercept threats, mitigate risk, and secure every transaction with sub-100ms precision.
  </p>
  
  <div style="display: flex; justify-content: center; gap: 60px; margin-top: 40px;">
     <div style="text-align: left;"><span style="color: #3b82f6; font-family: monospace; font-weight: 800; font-size: 15px; margin-right: 8px;">[01]</span> <span style="color: #F8FAFC; font-weight: 600; font-size: 15px; letter-spacing: 0.05em;">PROVISION</span></div>
     <div style="text-align: left;"><span style="color: #3b82f6; font-family: monospace; font-weight: 800; font-size: 15px; margin-right: 8px;">[02]</span> <span style="color: #F8FAFC; font-weight: 600; font-size: 15px; letter-spacing: 0.05em;">INITIALIZE</span></div>
     <div style="text-align: left;"><span style="color: #3b82f6; font-family: monospace; font-weight: 800; font-size: 15px; margin-right: 8px;">[03]</span> <span style="color: #F8FAFC; font-weight: 600; font-size: 15px; letter-spacing: 0.05em;">DEPLOY</span></div>
  </div>
</div>

---

## Integration Architectures
Examine our low-latency connectivity logic across all major platforms. Manage your keys in the [Developer Console](https://frontend-blue-one-42.vercel.app/dashboard/api-keys).

### Web & Node.js
```javascript
const response = await fetch('/api/v1/transactions/analyze', {
  method: 'POST',
  headers: { 'X-API-Key': 'YOUR_API_KEY' },
  body: JSON.stringify({ amount: 149.99, currency: 'USD' })
});
```

### iOS / Swift
```swift
let url = URL(string: "https://api.flowshield.ai/v1/analyze")!
var request = URLRequest(url: url)
request.setValue("YOUR_API_KEY", forHTTPHeaderField: "X-API-Key")
```

---

## Intelligence Signals
Automate your checkout logic with high-fidelity system signals:
- **allow**: Safe to process. Zero risk detected.
- **review**: Manual verification recommended. Anomaly detected.
- **block**: High risk detected. Transaction rejected autonomously.
"""

    app = FastAPI(
        title="Flowshield AI | Technical Reference",
        description=description,
        version="7.0.0",
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
        
        # Inject custom ultra-premium theme (Surgical Master Edition)
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
            .swagger-ui .info { margin: 80px auto !important; max-width: 1000px !important; text-align: left !important; position: relative; }
            .swagger-ui .info .title { color: #FFFFFF !important; font-size: 42px !important; font-weight: 800 !important; letter-spacing: -0.04em !important; margin-bottom: 40px !important; border: none !important; display: flex !important; align-items: center !important; }
            
            /* SURGICAL FIX: Isolate Version Badges */
            .swagger-ui .info .title small { line-height: 1 !important; height: auto !important; width: auto !important; background: var(--border) !important; border-radius: 8px !important; padding: 6px 12px !important; color: white !important; font-size: 12px !important; position: static !important; display: inline-block !important; margin-left: 12px !important; border: none !important; box-shadow: none !important; }
            .swagger-ui .info .title small::before, .swagger-ui .info .title small::after { content: none !important; display: none !important; }
            .swagger-ui .info .title small.version-stamp { background: var(--primary) !important; }

            .swagger-ui .info p, .swagger-ui .info li, .swagger-ui .info td { color: var(--text-muted) !important; font-size: 16px !important; line-height: 1.7 !important; }
            .swagger-ui h2, .swagger-ui h3 { color: #FFFFFF !important; font-weight: 800 !important; margin-top: 50px !important; border-bottom: none !important; letter-spacing: -0.02em !important; }
            
            /* The Authorize Bar Fix */
            .swagger-ui .scheme-container { background: var(--bg-deep) !important; border-top: 1px solid var(--border) !important; box-shadow: none !important; padding: 40px 0 !important; }
            .swagger-ui .btn.authorize { color: var(--secondary) !important; border-color: var(--secondary) !important; border-radius: 8px !important; background: transparent !important; height: 40px !important; font-weight: 700 !important; }
            .swagger-ui .btn.authorize svg { fill: var(--secondary) !important; }

            /* SURGICAL FIX: Re-certified Mac Blocks */
            .swagger-ui pre { 
                background: #0f172a !important; 
                border: 1px solid var(--border) !important; 
                border-radius: 16px !important; 
                padding: 48px 24px 24px 24px !important; 
                position: relative !important;
                box-shadow: 0 10px 40px rgba(0,0,0,0.6) !important;
                margin: 32px 0 !important;
                overflow: hidden !important;
            }
            /* Strictly target only code window dots */
            .swagger-ui pre::before {
                content: '';
                position: absolute;
                top: 20px;
                left: 20px;
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: #ff5f56;
                box-shadow: 20px 0 0 #ffbd2e, 40px 0 0 #27c93f;
                z-index: 50 !important;
            }
            .swagger-ui code { font-family: 'JetBrains Mono', monospace !important; font-size: 14px !important; color: #60a5fa !important; }
            
            /* Copy Button */
            .copy-btn {
                position: absolute;
                top: 14px;
                right: 20px;
                background: rgba(255,255,255,0.05);
                border: 1px solid var(--border);
                color: var(--text-muted);
                padding: 5px 12px;
                border-radius: 6px;
                font-size: 10px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s;
            }
            .copy-btn:hover { background: var(--primary); color: white; border-color: var(--primary); }

            /* Operations & Schemas */
            .swagger-ui .opblock { border: 1px solid var(--border) !important; border-radius: 14px !important; background: var(--bg-surface) !important; margin-bottom: 20px !important; overflow: hidden !important; }
            .swagger-ui .opblock .opblock-summary-path { color: #FFFFFF !important; font-weight: 600 !important; }
            .swagger-ui section.models { background: var(--bg-surface) !important; border-radius: 16px !important; border: 1px solid var(--border) !important; margin-top: 60px !important; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1) !important; }
            .swagger-ui section.models h4 { color: #FFFFFF !important; padding: 20px !important; font-weight: 800 !important; border-bottom: 1px solid var(--border) !important; }
            .swagger-ui .model-title { color: #FFFFFF !important; }

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
                        navigator.clipboard.writeText(block.innerText.replace('Copy', '').trim());
                        button.innerText = 'Copied!';
                        setTimeout(() => { button.innerText = 'Copy'; }, 2000);
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

    # Global Middleware & CORS Consistency Configuration
    origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://flowshieldai.com",
        "https://www.flowshieldai.com",
        "https://frontend-blue-one-42.vercel.app",
    ]
    
    app.add_middleware(GZipMiddleware, minimum_size=500)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_origin_regex="https://.*\-.*\.vercel\.app",
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
