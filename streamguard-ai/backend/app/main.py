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
<div class="integration-path">
  <div class="hero-section">
    <h1 class="hero-title">Core Infrastructure Reference</h1>
    <p class="hero-subtitle">
      Flowshield AI provides an autonomous fraud intelligence layer for modern digital economies. 
      This technical manual details the secure implementation of our real-time inference engine within your stack.
    </p>
  </div>

  <section class="fast-path">
    <h2 class="section-title">Startup Integration Protocol</h2>
    <p class="section-context">Follow this high-velocity path to validate connectivity and deploy the analysis engine in under three minutes.</p>

    <div class="protocol-grid">
      <div class="protocol-card">
        <h3>Step 1: Authentication</h3>
        <p>Generate a production-grade secret key in the Developer Console. Authenticate all requests using a standard Bearer token header.</p>
        <pre class="code-light"><code>Authorization: Bearer fs_live_****************</code></pre>
      </div>

      <div class="protocol-card">
        <h3>Step 2: Environment</h3>
        <p>Inject your credentials into your secure environment configuration to ensure zero-exposure of secrets in your source code.</p>
        <pre class="code-light"><code>FLOWSHIELD_API_KEY=fs_live_your_key_here</code></pre>
      </div>

      <div class="protocol-card">
        <h3>Step 3: Validation</h3>
        <p>Execute the following cURL command to verify real-time handshake with the Flowshield inference cloud.</p>
        <pre class="code-light" id="first-call"><code>curl -X POST https://api.flowshield.ai/v1/analyze \\
  -H "Authorization: Bearer fs_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{"amount": 100.00, "currency": "USD"}'</code></pre>
      </div>
    </div>
  </section>

  <section class="error-handling">
    <h2 class="section-title">System Response Protocols</h2>
    <table class="error-table">
      <thead>
        <tr>
          <th>HTTP Code</th>
          <th>Definition</th>
          <th>Implementation Note</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>200 OK</td>
          <td>Success</td>
          <td>Analysis session was successful. Process the returned risk score.</td>
        </tr>
        <tr>
          <td>400 BAD REQUEST</td>
          <td>Invalid Payload</td>
          <td>Request schema validation failed. Check parameter types and integrity.</td>
        </tr>
        <tr>
          <td>401 UNAUTHORIZED</td>
          <td>Authentication Failed</td>
          <td>Invalid or expired API key. Verify Bearer token in headers.</td>
        </tr>
        <tr>
          <td>429 TOO MANY REQUESTS</td>
          <td>Rate Limit Exceeded</td>
          <td>Concurrency limit reached for your current tier. Implement back-off.</td>
        </tr>
        <tr>
          <td>500 INTERNAL ERROR</td>
          <td>System Fault</td>
          <td>Autonomous failure in the inference engine. Contact support if persistent.</td>
        </tr>
      </tbody>
    </table>
  </section>
</div>
"""

    app = FastAPI(
        title="Flowshield AI Technical Documentation",
        description=description,
        version="8.0.0",
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
                --zinc-50: #fafafa;
                --zinc-100: #f4f4f5;
                --zinc-200: #e4e4e7;
                --zinc-500: #71717a;
                --zinc-900: #09090b;
                --emerald-600: #059669;
                --blue-600: #2563eb;
                --border: #e4e4e7;
                --bg: #ffffff;
                --text: #09090b;
                --text-muted: #71717a;
            }
            body { background-color: var(--bg) !important; margin: 0; scroll-behavior: smooth; }
            .swagger-ui { background-color: var(--bg) !important; color: var(--text) !important; font-family: 'Inter', sans-serif !important; opacity: 0; transition: opacity 0.5s ease-in; }
            .swagger-ui .topbar { display: none !important; }
            .swagger-ui .info { max-width: 900px !important; margin: 0 auto !important; padding: 100px 24px !important; }
            .swagger-ui .info .title { font-size: 48px !important; font-weight: 800 !important; letter-spacing: -0.05em !important; color: var(--zinc-900) !important; margin-bottom: 24px !important; border: none !important; }
            .swagger-ui .info .title small { background: var(--zinc-100) !important; border: 1px solid var(--zinc-200) !important; border-radius: 99px !important; color: var(--zinc-900) !important; padding: 4px 12px !important; font-size: 11px !important; font-weight: 700 !important; position: static !important; display: inline-block !important; margin-left: 12px !important; }

            .hero-title { font-size: 48px; font-weight: 800; letter-spacing: -0.05em; color: var(--zinc-900); margin-bottom: 12px; }
            .hero-subtitle { font-size: 18px; color: var(--text-muted); line-height: 1.6; max-width: 700px; margin-bottom: 60px; }
            .section-title { font-size: 24px; font-weight: 700; color: var(--zinc-900); margin: 60px 0 16px 0; letter-spacing: -0.02em; }
            .section-context { color: var(--text-muted); margin-bottom: 32px; font-size: 15px; }

            /* Three-Step Protocol */
            .protocol-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-bottom: 80px; }
            .protocol-card { background: var(--zinc-50); border: 1px solid var(--zinc-200); border-radius: 12px; padding: 24px; transition: all 150ms; }
            .protocol-card:hover { border-color: var(--zinc-900); }
            .protocol-card h3 { font-size: 16px; font-weight: 700; margin-bottom: 12px; color: var(--zinc-900); }
            .protocol-card p { font-size: 14px; color: var(--text-muted); line-height: 1.5; margin-bottom: 16px; }

            /* Code Blocks Minimal */
            pre.code-light { background: #18181b !important; border-radius: 8px !important; padding: 16px !important; position: relative !important; width: 100% !important; overflow-x: auto !important; }
            pre.code-light code { font-family: 'JetBrains Mono', monospace !important; font-size: 13px !important; color: #e4e4e7 !important; line-height: 1.6 !important; }
            
            .copy-btn-minimal { position: absolute; top: 12px; right: 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #a1a1aa; padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 600; cursor: pointer; transition: 150ms; }
            .copy-btn-minimal:hover { background: #FFFFFF; color: #000000; }

            /* Error Table */
            .error-table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 14px; border: 1px solid var(--zinc-200); border-radius: 12px; overflow: hidden; }
            .error-table th { background: var(--zinc-50); border-bottom: 1px solid var(--zinc-200); padding: 16px; text-align: left; font-weight: 700; color: var(--zinc-900); }
            .error-table td { padding: 16px; border-bottom: 1px solid var(--zinc-200); color: var(--text-muted); }
            .error-table tr:last-child td { border-bottom: none; }

            /* Operations */
            .swagger-ui .opblock { border-radius: 12px !important; border: 1px solid var(--zinc-200) !important; background: var(--bg) !important; margin-bottom: 16px !important; box-shadow: none !important; scroll-margin-top: 100px; }
            .swagger-ui .opblock-summary { padding: 12px 16px !important; }
            .swagger-ui .opblock .opblock-summary-path { color: var(--zinc-900) !important; font-weight: 600 !important; }
            .swagger-ui .opblock-summary-method { border-radius: 6px !important; font-weight: 700 !important; font-size: 11px !important; }
            .swagger-ui .opblock-get .opblock-summary-method { background: #ecfdf5 !important; color: #059669 !important; border: 1px solid #d1fae5 !important; }
            .swagger-ui .opblock-post .opblock-summary-method { background: #eff6ff !important; color: #2563eb !important; border: 1px solid #dbeafe !important; }

            .swagger-ui .scheme-container { background: transparent !important; border-top: 1px solid var(--zinc-200) !important; box-shadow: none !important; padding: 40px 0 !important; }
            .swagger-ui .btn.authorize { background: var(--zinc-900) !important; color: white !important; border: none !important; border-radius: 8px !important; font-weight: 700 !important; font-size: 14px !important; }

            /* Models & Schemas: Industrial Fidelity Update */
            .swagger-ui section.models { border: 1px solid var(--zinc-200) !important; border-radius: 12px !important; background: transparent !important; margin-top: 80px !important; padding: 0 !important; overflow: hidden !important; box-shadow: 0 1px 3px rgba(0,0,0,0.02) !important; }
            .swagger-ui section.models h4 { color: var(--zinc-900) !important; padding: 24px !important; font-size: 18px !important; font-weight: 800 !important; border-bottom: 1px solid var(--zinc-200) !important; margin: 0 !important; display: flex !important; justify-content: space-between !important; align-items: center !important; }
            .swagger-ui section.models h4 svg { fill: var(--zinc-500) !important; }

            .swagger-ui .model-container { background: white !important; padding: 20px !important; border-bottom: 1px solid var(--zinc-100) !important; transition: background 150ms !important; }
            .swagger-ui .model-container:last-child { border-bottom: none !important; }
            .swagger-ui .model-container:hover { background: var(--zinc-50) !important; }
            
            .swagger-ui .model-box { background: transparent !important; padding: 0 !important; }
            .swagger-ui .model-title { color: var(--zinc-900) !important; font-weight: 700 !important; font-size: 14px !important; }
            .swagger-ui .model-hint { color: var(--zinc-500) !important; font-size: 12px !important; }
            
            /* High-Contrast Actions */
            .swagger-ui .expand-all { color: var(--zinc-500) !important; font-weight: 600 !important; font-size: 12px !important; text-decoration: none !important; }
            .swagger-ui .expand-all:hover { color: var(--zinc-900) !important; }
            .swagger-ui .model-toggle::after { background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") no-repeat center !important; display: inline-block !important; width: 14px !important; height: 14px !important; }

            ::-webkit-scrollbar { width: 8px; }
            ::-webkit-scrollbar-track { background: var(--bg); }
            ::-webkit-scrollbar-thumb { background: var(--zinc-200); border-radius: 4px; }
            ::-webkit-scrollbar-thumb:hover { background: var(--zinc-500); }
        </style>
        
        <script>
            function addCopyButtons() {
                const blocks = document.querySelectorAll('pre');
                blocks.forEach((block) => {
                    if (block.querySelector('.copy-btn-minimal')) return;
                    const button = document.createElement('button');
                    button.innerText = 'Copy';
                    button.className = 'copy-btn-minimal';
                    button.onclick = (e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(block.innerText.replace('Copy', '').trim());
                        button.innerText = 'Copied';
                        setTimeout(() => { button.innerText = 'Copy'; }, 2000);
                    };
                    block.appendChild(button);
                });
            }
            window.onload = () => {
                document.querySelector('.swagger-ui').style.opacity = '1';
                addCopyButtons();
            };
            const observer = new MutationObserver(() => addCopyButtons());
            observer.observe(document.body, { childList: true, subtree: true });
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
