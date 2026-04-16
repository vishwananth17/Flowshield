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
<div class="master-dark-path">
  <div class="hero-section">
    <h1 style="color: #FFFFFF !important; font-size: 56px !important; font-weight: 800 !important; letter-spacing: -0.05em !important; margin-bottom: 16px; border: none !important;">Core Infrastructure Reference</h1>
    <p style="color: #94A3B8 !important; font-size: 18px !important; max-width: 750px; line-height: 1.7; margin-bottom: 60px;">
      Flowshield AI provides an autonomous fraud intelligence layer for modern digital economies. 
      This technical manual details the secure implementation of our real-time inference engine within your stack.
    </p>
  </div>

  <section class="integration-suite">
    <h2 style="color: #FFFFFF !important; font-size: 24px !important; font-weight: 700 !important; margin-bottom: 32px; letter-spacing: -0.02em;">Integration Protocol</h2>
    
    <div class="protocol-grid">
      <div class="protocol-card">
        <span class="step-label">01</span>
        <h3>Provision</h3>
        <p>Generate production credentials in the Developer Console. Authenticate via Bearer token.</p>
        <pre class="mac-code"><code>Authorization: Bearer fs_live_***</code></pre>
      </div>

      <div class="protocol-card">
        <span class="step-label">02</span>
        <h3>Initialize</h3>
        <p>Inject credentials into your environment. Zero-exposure implementation required.</p>
        <pre class="mac-code"><code>FLOWSHIELD_API_KEY=fs_live_***</code></pre>
      </div>

      <div class="protocol-card">
        <span class="step-label">03</span>
        <h3>Deploy</h3>
        <p>Execute validation handshake with the Flowshield inference cloud.</p>
        <pre class="mac-code"><code>curl -X POST https://api.flowshield.ai/v1/analyze \\
  -H "Authorization: Bearer fs_live_xxx"</code></pre>
      </div>
    </div>
  </section>

  <section class="system-responses">
    <h2 style="color: #FFFFFF !important; font-size: 24px !important; font-weight: 700 !important; margin-bottom: 24px;">Response Protocols</h2>
    <table class="dark-table">
      <thead>
        <tr><th>HTTP Code</th><th>Definition</th><th>Implementation Note</th></tr>
      </thead>
      <tbody>
        <tr><td>200 OK</td><td>Success</td><td>Session successful. Process risk score.</td></tr>
        <tr><td>401 UNAUTHORIZED</td><td>Auth Failure</td><td>Invalid key. Check Bearer token.</td></tr>
        <tr><td>429 TOO MANY</td><td>Limit Exceeded</td><td>Tier limit reached. Implement back-off.</td></tr>
        <tr><td>500 FAULT</td><td>System Error</td><td>Autonomous fault. Contact support.</td></tr>
      </tbody>
    </table>
  </section>
</div>
"""

    app = FastAPI(
        title="Flowshield AI | Technical Reference",
        description=description,
        version="9.0.0",
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
        
        custom_css = """
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
        <style>
            :root {
                --bg-deep: #050811;
                --bg-surface: #0a0e1a;
                --primary: #3b82f6;
                --border: #1e293b;
                --text-main: #f1f5f9;
                --text-muted: #94a3b8;
            }
            body { background-color: var(--bg-deep) !important; margin: 0; }
            .swagger-ui { background-color: var(--bg-deep) !important; color: var(--text-muted) !important; font-family: 'Inter', sans-serif !important; padding-bottom: 100px !important; }
            .swagger-ui .topbar { display: none !important; }
            .swagger-ui .info { margin: 80px auto !important; max-width: 1000px !important; text-align: left !important; }
            .swagger-ui .info .title { color: white !important; font-size: 48px !important; font-weight: 800 !important; letter-spacing: -0.05em !important; margin-bottom: 24px !important; border: none !important; }
            .swagger-ui .info .title small { background: var(--primary) !important; border-radius: 99px !important; color: white !important; padding: 4px 12px !important; font-size: 11px !important; font-weight: 700 !important; position: static !important; display: inline-block !important; margin-left: 12px !important; }

            /* Detailed Protocol Styles */
            .protocol-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 32px; margin-bottom: 80px; }
            .protocol-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 20px; padding: 32px; position: relative; }
            .step-label { color: var(--primary); font-family: 'JetBrains Mono'; font-weight: 800; font-size: 14px; margin-bottom: 12px; display: block; opacity: 0.8; }
            .protocol-card h3 { color: white !important; font-size: 18px !important; font-weight: 700 !important; margin-bottom: 12px !important; }
            .protocol-card p { font-size: 15px !important; color: var(--text-muted) !important; line-height: 1.6 !important; }

            /* Mac Code Windows */
            .mac-code { background: #000000 !important; border-radius: 12px !important; padding: 40px 16px 16px 16px !important; position: relative !important; margin-top: 20px !important; }
            .mac-code::before { content: ''; position: absolute; top: 14px; left: 14px; width: 8px; height: 8px; border-radius: 50%; background: #ff5f56; box-shadow: 14px 0 0 #ffbd2e, 28px 0 0 #27c93f; }
            .mac-code code { font-family: 'JetBrains Mono', monospace !important; font-size: 12px !important; color: #60a5fa !important; }

            /* Response Table */
            .dark-table { width: 100%; border-collapse: collapse; background: var(--bg-surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
            .dark-table th { background: rgba(59,130,246,0.05); padding: 16px; text-align: left; color: white; border-bottom: 1px solid var(--border); }
            .dark-table td { padding: 16px; border-bottom: 1px solid var(--border); color: var(--text-muted); font-size: 14px; }

            /* API Blocks */
            .swagger-ui .opblock { border-radius: 16px !important; border: 1px solid var(--border) !important; background: var(--bg-surface) !important; margin-bottom: 24px !important; overflow: hidden !important; }
            .swagger-ui .opblock .opblock-summary-path { color: white !important; font-weight: 600 !important; }
            .swagger-ui .opblock-summary-method { border-radius: 10px !important; font-weight: 800 !important; }

            .swagger-ui .scheme-container { background: transparent !important; border-top: 1px solid var(--border) !important; box-shadow: none !important; padding: 40px 0 !important; }
            .swagger-ui .btn.authorize { background: var(--primary) !important; color: white !important; border: none !important; border-radius: 12px !important; font-weight: 700 !important; }

            /* Models */
            .swagger-ui section.models { border: 1px solid var(--border) !important; border-radius: 20px !important; background: var(--bg-surface) !important; margin-top: 60px !important; }
            .swagger-ui section.models h4 { color: white !important; padding: 20px !important; border-bottom: 1px solid var(--border) !important; }
            .swagger-ui .model-title { color: white !important; font-weight: 700 !important; }

            .copy-btn-master { position: absolute; top: 12px; right: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: var(--text-muted); padding: 4px 10px; border-radius: 8px; font-size: 10px; font-weight: 700; cursor: pointer; transition: 0.2s; }
            .copy-btn-master:hover { background: var(--primary); color: white; }

            ::-webkit-scrollbar { width: 10px; }
            ::-webkit-scrollbar-track { background: var(--bg-deep); }
            ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
        </style>
        
        <script>
            function addCopyButtons() {
                const blocks = document.querySelectorAll('pre');
                blocks.forEach((block) => {
                    if (block.querySelector('.copy-btn-master')) return;
                    const button = document.createElement('button');
                    button.innerText = 'Copy';
                    button.className = 'copy-btn-master';
                    button.onclick = (e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(block.innerText.replace('Copy', '').trim());
                        button.innerText = 'Copied';
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
