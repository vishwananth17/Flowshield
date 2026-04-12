import json
from datetime import datetime
from typing import Callable, Coroutine

from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import redis.asyncio as redis

from app.core.config import get_settings
from app.core.dependencies import get_analyze_auth
from app.db.session import AsyncSessionLocal
from app.models.organization import Organization

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, redis_url: str):
        super().__init__(app)
        self.redis = redis.from_url(redis_url, decode_responses=True)

    async def dispatch(self, request: Request, call_next: Callable[[Request], Coroutine[None, None, Response]]) -> Response:
        # Only apply to the analyze endpoint
        if request.url.path != "/api/v1/transactions/analyze" or request.method != "POST":
            return await call_next(request)

        # 1. Identify organization
        # We need to manually perform auth here because middleware runs before dependencies
        # Fortunately, the get_analyze_auth logic is accessible
        # But calling it requires a db session
        
        org_id = None
        limit = 1000
        
        async with AsyncSessionLocal() as db:
            try:
                # We reuse the existing auth dependency logic by calling it manually
                # Mocking a proper dependency injection call in middleware is complex, 
                # so we extract the core logic
                from app.core.security import hash_api_key, safe_decode_token
                from app.models.api_key import ApiKey
                from sqlalchemy import select
                import uuid

                x_api_key = request.headers.get("X-API-Key")
                token = request.cookies.get("access_token") 
                if not token:
                    auth_header = request.headers.get("Authorization")
                    if auth_header and auth_header.startswith("Bearer "):
                        token = auth_header[7:]

                if x_api_key:
                    key_hash = hash_api_key(x_api_key.strip())
                    stmt = select(ApiKey).where(ApiKey.key_hash == key_hash, ApiKey.is_active == True)
                    result = await db.execute(stmt)
                    api_key = result.scalar_one_or_none()
                    if api_key:
                        org_id = api_key.org_id
                elif token:
                    payload = safe_decode_token(token)
                    if payload and payload.get("sub"):
                        user_id = uuid.UUID(payload["sub"])
                        from app.models.user import User
                        stmt = select(User).where(User.id == user_id)
                        result = await db.execute(stmt)
                        user = result.scalar_one_or_none()
                        if user:
                            org_id = user.org_id

                if not org_id:
                    # Let the normal auth dependency handle the 401 later if we can't find it here
                    return await call_next(request)

                # Fetch org limits
                org_stmt = select(Organization).where(Organization.id == org_id)
                org_result = await db.execute(org_stmt)
                org = org_result.scalar_one_or_none()
                if not org:
                    return await call_next(request)
                
                limit = org.monthly_request_limit
                
            except Exception as e:
                # Log error and continue to avoid breaking the app
                print(f"Rate Limiter Auth Error: {e}")
                return await call_next(request)

        # 2. Check Redis for usage
        now = datetime.now()
        month_key = f"usage:{org_id}:{now.year}-{now.month:02d}"
        
        current_usage = await self.redis.get(month_key)
        current_count = int(current_usage) if current_usage else 0
        
        if current_count >= limit:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": f"Monthly request limit reached. Upgrade to Growth for 100,000 requests/month.",
                        "upgrade_url": "https://flowshieldai.com/settings/billing"
                    }
                }
            )

        # 3. Increment and set headers
        new_count = await self.redis.incr(month_key)
        if new_count == 1:
            # Set TTL for the end of the month
            import calendar
            last_day = calendar.monthrange(now.year, now.month)[1]
            expire_at = datetime(now.year, now.month, last_day, 23, 59, 59)
            await self.redis.expireat(month_key, int(expire_at.timestamp()))

        # 4. Async update DB every 100 increments
        if new_count % 100 == 0:
            async def update_db():
                async with AsyncSessionLocal() as db:
                    stmt = select(Organization).where(Organization.id == org_id)
                    result = await db.execute(stmt)
                    org = result.scalar_one_or_none()
                    if org:
                        org.monthly_request_count = new_count
                        await db.commit()
            import asyncio
            asyncio.create_task(update_db())

        response = await call_next(request)
        
        # Add headers
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(max(0, limit - new_count))
        
        import calendar
        last_day = calendar.monthrange(now.year, now.month)[1]
        reset_time = datetime(now.year, now.month, last_day, 23, 59, 59).timestamp()
        response.headers["X-RateLimit-Reset"] = str(int(reset_time))
        
        return response
