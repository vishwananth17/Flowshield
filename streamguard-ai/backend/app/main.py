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
<div class="executive-header">
  <div class="header-content">
    <h1 class="main-title">Guardian of Finance</h1>
    <p class="main-subtitle">
      Flowshield AI is an enterprise-grade, autonomous fraud intelligence layer designed to protect digital economies. 
      Intercept threats, mitigate risk, and secure every transaction with sub-100ms precision.
    </p>
    <div class="protocol-steps">
       <div class="step"><span>01</span> Provision Credentials</div>
       <div class="step"><span>02</span> Initialize Handshake</div>
       <div class="step"><span>03</span> Deploy Analysis</div>
    </div>
  </div>
  <div class="header-featured">
    <div class="mac-window-featured">
       <div class="mac-dots"><span></span><span></span><span></span></div>
       <div class="mac-copy" onclick="copyFeaturedCode()">DOCS</div>
       <pre id="featured-code"><code># Analyze a transaction
curl -X POST https://api.flowshield.ai/v1/analyze \\
  -H "X-API-Key: fs_live_xxx" \\
  -d {
    "amount": 149.99,
    "currency": "USD",
    "customer_ip": "1.2.3.4"
  }</code></pre>
    </div>
  </div>
</div>

---

## Technical Integration Suite
Examine our low-latency connectivity logic across all major platforms.

### 🌐 1. Modern Web & Node.js
```javascript
const response = await fetch('/api/v1/transactions/analyze', {
  method: 'POST',
  headers: { 'X-API-Key': 'YOUR_API_KEY' },
  body: JSON.stringify({ amount: 149.99, currency: 'USD' })
});
```

### 🍎 2. iOS / Swift
```swift
let url = URL(string: "https://api.flowshield.ai/v1/analyze")!
var request = URLRequest(url: url)
request.setValue("YOUR_API_KEY", forHTTPHeaderField: "X-API-Key")
```

---

## Intelligent Decision Engine
Our neural patterns analyze velocity, geography, and fingerprint consistency to return:
- **`allow`**: Safe to process.
- **`review`**: Manual audit required.
- **`block`**: Fraud detected.
"""

    app = FastAPI(
        title="Flowshield AI | Technical Reference",
        description=description,
        version="5.0.0",
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
        
        # Inject custom premium theme (CoderPro Master Edition V2)
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
            
            /* Executive 2-Column Landing */
            .executive-header { display: grid; grid-template-columns: 1.2fr 1fr; gap: 60px; margin: 80px auto !important; max-width: 1200px !important; align-items: center; }
            @media (max-width: 1024px) { .executive-header { grid-template-columns: 1fr; } }
            
            .main-title { color: white !important; font-size: 64px !important; font-weight: 800 !important; letter-spacing: -0.05em !important; margin: 0 0 20px 0 !important; border: none !important; line-height: 1 !important; }
            .main-subtitle { font-size: 18px !important; line-height: 1.6 !important; color: var(--text-muted) !important; margin-bottom: 40px !important; }
            
            .protocol-steps { display: flex; flex-direction: column; gap: 12px; }
            .step { display: flex; items-center: center; gap: 12px; font-size: 14px; font-weight: 700; color: white; opacity: 0.8; }
            .step span { color: var(--primary); font-family: 'JetBrains Mono'; }

            /* Featured Mac Window */
            .header-featured { position: relative; }
            .mac-window-featured { background: #0f172a; border: 1px solid var(--border); border-radius: 24px; padding: 60px 24px 24px 24px; position: relative; box-shadow: 0 40px 80px -20px rgba(0,0,0,0.5); }
            .mac-dots { position: absolute; top: 24px; left: 24px; display: flex; gap: 8px; }
            .mac-dots span { width: 12px; height: 12px; border-radius: 50%; }
            .mac-dots span:nth-child(1) { background: #ff5f56; }
            .mac-dots span:nth-child(2) { background: #ffbd2e; }
            .mac-dots span:nth-child(3) { background: #27c93f; }
            .mac-copy { position: absolute; top: 20px; right: 24px; background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2); color: var(--primary); padding: 4px 12px; border-radius: 10px; font-size: 10px; font-weight: 800; cursor: pointer; transition: all 0.2s; }
            .mac-copy:hover { background: var(--primary); color: white; }
            
            .header-featured pre { background: transparent !important; border: none !important; padding: 0 !important; margin: 0 !important; box-shadow: none !important; }
            .header-featured code { font-family: 'JetBrains Mono', monospace !important; font-size: 14px !important; color: var(--text-main) !important; line-height: 1.6 !important; }

            /* Standard Pre Blocks */
            .swagger-ui pre { background: var(--bg-surface) !important; border: 1px solid var(--border) !important; border-radius: 12px !important; padding: 40px 20px 20px 20px !important; position: relative; margin: 20px 0 !important; }
            .swagger-ui pre::before { content: ''; position: absolute; top: 16px; left: 16px; width: 8px; height: 8px; border-radius: 50%; background: #ff5f56; box-shadow: 14px 0 0 #ffbd2e, 28px 0 0 #27c93f; }

            .swagger-ui .scheme-container { background: var(--bg-deep) !important; border-top: 1px solid var(--border) !important; box-shadow: none !important; }
            .swagger-ui .btn.authorize { color: var(--secondary) !important; border-color: var(--secondary) !important; border-radius: 12px !important; }
            .swagger-ui section.models { background: var(--bg-surface) !important; border-radius: 20px !important; border: 1px solid var(--border) !important; }
            
            body { background-color: var(--bg-deep) !important; margin: 0; }
        </style>
        
        <script>
            function copyFeaturedCode() {
                const code = document.getElementById('featured-code').innerText;
                navigator.clipboard.writeText(code);
                const btn = document.querySelector('.mac-copy');
                btn.innerText = 'COPIED!';
                setTimeout(() => { btn.innerText = 'DOCS'; }, 2000);
            }
            
            function addGlobalCopyButtons() {
                const blocks = document.querySelectorAll('pre:not(#featured-code)');
                blocks.forEach((block) => {
                    if (block.querySelector('.copy-btn')) return;
                    const button = document.createElement('button');
                    button.innerText = 'Copy';
                    button.className = 'copy-btn';
                    button.style.cssText = "position:absolute; top:12px; right:12px; background:rgba(255,255,255,0.05); border:1px solid var(--border); color:var(--text-muted); padding:4px 10px; border-radius:8px; font-size:10px; font-weight:700; cursor:pointer;";
                    button.onclick = (e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(block.innerText.replace('Copy', '').trim());
                        button.innerText = 'Copied!';
                        setTimeout(() => { button.innerText = 'Copy'; }, 2000);
                    };
                    block.appendChild(button);
                });
            }
            const observer = new MutationObserver(() => addGlobalCopyButtons());
            observer.observe(document.body, { childList: true, subtree: true });
            window.onload = () => { addGlobalCopyButtons(); };
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
