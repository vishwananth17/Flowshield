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
    app = FastAPI(
        title="Flowshield AI API",
        description="""
## Flowshield AI — Real-Time Fraud Detection API

Protect your payments with sub-100ms ML-powered fraud detection.
Works with any payment gateway — Razorpay, Stripe, Adyen, or custom.

### Base URL
`https://api.flowshieldai.com/v1`

### Authentication
All requests require an API key in the header:
`X-API-Key: fs_live_your_key_here`

### Rate Limits
- Free: 1,000 requests/month
- Basic: 25,000 requests/month
- Growth: 1,00,000 requests/month
- Enterprise: Unlimited
        """,
        version="1.0.0",
        contact={
          "name": "Flowshield AI Support",
          "email": "support@flowshieldai.com",
          "url": "https://flowshieldai.com"
        },
        license_info={
          "name": "Commercial License",
          "url": "https://flowshieldai.com/terms"
        },
        lifespan=lifespan,
        docs_url=None, # Keep None because we use custom HTML
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json"
    )

    @app.get("/docs", include_in_schema=False)
    @app.get("/api/reference", include_in_schema=False)
    def custom_swagger_ui_html():
        from fastapi.responses import HTMLResponse
        from fastapi.openapi.docs import get_swagger_ui_html
        
        logger.info("🛠️ [DOCS] Commencing high-fidelity documentation assembly...")
        
        # High-fidelity design suite
        master_html = """
<div class="master-elite-reference">
  <div class="header-hero" style="animation: fadeInUp 0.8s ease-out forwards; opacity: 0; padding: 40px 0 80px 0;">
    <h1 style="color: #FFFFFF !important; font-size: 64px !important; font-weight: 800 !important; letter-spacing: -0.06em !important; margin-bottom: 24px; line-height: 1.05 !important; border: none !important;">Core Infrastructure Reference</h1>
    <p style="color: #94A3B8 !important; font-size: 20px !important; max-width: 800px; line-height: 1.7; margin-bottom: 0;">
      Flowshield AI provides an autonomous, sub-100ms fraud intelligence layer. This manual details the protocol for secure, real-time connectivity between your transaction stack and our inference core.
    </p>
  </div>

  <section class="suite-container" style="animation: fadeInUp 0.8s ease-out 0.2s forwards; opacity: 0;">
    <h2 style="color: #FFFFFF !important; font-size: 28px !important; font-weight: 700 !important; margin-bottom: 40px; letter-spacing: -0.03em;">Integration Protocol</h2>
    
    <div class="protocol-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 32px; margin-bottom: 100px;">
      <div class="protocol-card" style="background: rgba(10,14,26,0.8); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 40px; transition: 0.3s cubic-bezier(0.16, 1, 0.3, 1);">
        <span style="color: #3b82f6; font-family: 'JetBrains Mono'; font-weight: 800; font-size: 14px; margin-bottom: 16px; display: block; letter-spacing: 0.1em;">[01] PROVISION</span>
        <h3 style="color: white !important; font-size: 20px !important; font-weight: 700 !important; margin-bottom: 12px !important;">Authentication Key</h3>
        <p style="font-size: 15px !important; color: #94A3B8 !important; line-height: 1.6 !important; margin-bottom: 24px !important;">Generate an enterprise-grade secret key and authenticate all requests via standard Bearer token implementation.</p>
        <div class="mac-inline"><code>Authorization: Bearer fs_live_secret</code></div>
      </div>

      <div class="protocol-card" style="background: rgba(10,14,26,0.8); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 40px; transition: 0.3s cubic-bezier(0.16, 1, 0.3, 1);">
        <span style="color: #3b82f6; font-family: 'JetBrains Mono'; font-weight: 800; font-size: 14px; margin-bottom: 16px; display: block; letter-spacing: 0.1em;">[02] INITIALIZE</span>
        <h3 style="color: white !important; font-size: 20px !important; font-weight: 700 !important; margin-bottom: 12px !important;">Environment Layer</h3>
        <p style="font-size: 15px !important; color: #94A3B8 !important; line-height: 1.6 !important; margin-bottom: 24px !important;">Establish your secure environment layer. Ensure credential isolation to prevent upstream exposure.</p>
        <div class="mac-inline"><code>FLOWSHIELD_API_KEY=fs_live_***</code></div>
      </div>

      <div class="protocol-card" style="background: rgba(10,14,26,0.8); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 40px; transition: 0.3s cubic-bezier(0.16, 1, 0.3, 1);">
        <span style="color: #3b82f6; font-family: 'JetBrains Mono'; font-weight: 800; font-size: 14px; margin-bottom: 16px; display: block; letter-spacing: 0.1em;">[03] VALIDATE</span>
        <h3 style="color: white !important; font-size: 20px !important; font-weight: 700 !important; margin-bottom: 12px !important;">Production Handshake</h3>
        <p style="font-size: 15px !important; color: #94A3B8 !important; line-height: 1.6 !important; margin-bottom: 24px !important;">Validate real-time connectivity with the inference cloud via our health-check or sample analysis endpoint.</p>
        <div class="mac-inline"><code>curl -X POST /api/v1/analyze</code></div>
      </div>
    </div>
  </section>

  <section class="response-grid" style="animation: fadeInUp 0.8s ease-out 0.4s forwards; opacity: 0;">
    <h2 style="color: #FFFFFF !important; font-size: 28px !important; font-weight: 700 !important; margin-bottom: 32px; letter-spacing: -0.03em;">System Response Protocols</h2>
    <table class="protocol-table">
      <thead>
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
          <th style="padding: 20px; text-align: left; color: white; font-weight: 700;">HTTP Code</th>
          <th style="padding: 20px; text-align: left; color: white; font-weight: 700;">Definition</th>
          <th style="padding: 20px; text-align: left; color: white; font-weight: 700;">Logic Note</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>200 OK</td><td>SUCCESS</td><td>Operation validated. Risk score returned.</td></tr>
        <tr><td>401 UNAUTHORIZED</td><td>AUTH_ERROR</td><td>Invalid API Credentials.</td></tr>
        <tr><td>429 TOO MANY</td><td>RATE_ERROR</td><td>Tier concurrency limit exceeded.</td></tr>
      </tbody>
    </table>
  </section>
</div>
"""
        master_js_safe = master_html.replace('`', '\\`').replace('$', '\\$')
        
        custom_css = """
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
        <style>
            :root { --bg-deep: #050811; --bg-surface: #0a0e1a; --primary: #3b82f6; --border: #1e293b; --text-muted: #94a3b8; }
            body { background-color: var(--bg-deep) !important; margin: 0; }
            .swagger-ui { background-color: var(--bg-deep) !important; color: var(--text-muted) !important; font-family: 'Inter', sans-serif !important; }
            .swagger-ui .topbar { display: none !important; }
            .swagger-ui .info { margin: 80px auto !important; max-width: 1100px !important; }
            .swagger-ui .info .title { color: white !important; font-size: 48px !important; font-weight: 800 !important; border: none !important; }
            .swagger-ui .opblock { border-radius: 20px !important; border: 1px solid var(--border) !important; background: var(--bg-surface) !important; margin-bottom: 24px !important; }
            .swagger-ui .scheme-container { background: transparent !important; border-top: 1px solid var(--border) !important; box-shadow: none !important; }
            .swagger-ui .btn.authorize { background: var(--primary) !important; color: white !important; border-radius: 12px !important; font-weight: 700 !important; }
            .copy-btn-elite { position: absolute; top: 12px; right: 12px; background: rgba(255,255,255,0.08); border: 1px solid var(--border); color: #94A3B8; padding: 4px 12px; border-radius: 8px; font-size: 10px; cursor: pointer; }
            style { display: none; }
        </style>
        """

        injection_script = """
        <script>
            function injectEliteDesign() {
                const desc = document.querySelector('.info .description') || document.querySelector('.info .markdown');
                if (desc && !desc.getAttribute('data-elite-injected')) {
                    desc.innerHTML = `[[MASTER_JS]]`;
                    desc.setAttribute('data-elite-injected', 'true');
                    console.log('✅ [ELITE] Documentation suite successfully injected.');
                }
            }
            
            function addCopyButtons() {
                const blocks = document.querySelectorAll('pre');
                blocks.forEach((block) => {
                    if (block.querySelector('.copy-btn-elite')) return;
                    const button = document.createElement('button');
                    button.innerText = 'Copy';
                    button.className = 'copy-btn-elite';
                    button.onclick = (e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(block.innerText.replace('Copy', '').trim());
                        button.innerText = 'Copied';
                        setTimeout(() => { button.innerText = 'Copy'; }, 2000);
                    };
                    block.appendChild(button);
                });
            }

            const observer = new MutationObserver(() => {
                addCopyButtons();
                injectEliteDesign();
            });
            
            observer.observe(document.body, { childList: true, subtree: true });
            window.addEventListener('load', () => {
                injectEliteDesign();
                setTimeout(injectEliteDesign, 1000);
                setTimeout(injectEliteDesign, 3000);
            });
        </script>
        """.replace('[[MASTER_JS]]', master_js_safe)
        
        logger.info(f"DEBUG: CSS length: {len(custom_css)}, JS length: {len(injection_script)}")
        
        html_res = get_swagger_ui_html(
            openapi_url=app.openapi_url,
            title=app.title,
            swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
            swagger_css_url="/static/swagger-dark.css",
            swagger_favicon_url="/static/favicon.ico",
        )
        
        final_body = html_res.body.decode().replace("</head>", custom_css + injection_script + "</head>")
        logger.info(f"✅ [DOCS] Assembly complete. Body length: {len(final_body)}")
        return HTMLResponse(content=final_body)

    @app.get("/", include_in_schema=False)
    async def root_health_check():
        return {"status": "healthy", "service": "Flowshield AI Inference Core", "version": "1.0.0"}

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
        allow_origin_regex=r"https://.*\-.*\.vercel\.app",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix="/api/v1")
    
    from fastapi.staticfiles import StaticFiles
    import os
    if os.path.exists(os.path.join(os.path.dirname(__file__), "..", "static")):
        app.mount("/static", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "..", "static")), name="static")

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
