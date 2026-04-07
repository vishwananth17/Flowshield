import uuid
from dataclasses import dataclass
from typing import Annotated

from fastapi import Cookie, Depends, Header, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_api_key, safe_decode_token
from app.db.session import get_db
from app.models.api_key import ApiKey
from app.models.user import User

bearer_scheme = HTTPBearer(auto_error=False)


async def get_token_from_request(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    access_token: str | None = Cookie(None, alias="access_token"),
) -> str | None:
    if credentials and credentials.scheme.lower() == "bearer":
        return credentials.credentials
    if access_token:
        return access_token
    return None


async def get_current_user(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    token: Annotated[str | None, Depends(get_token_from_request)],
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    payload = safe_decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token subject",
        )
    try:
        user_id = uuid.UUID(sub)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token subject",
        )
    result = await db.execute(select(User).where(User.id == user_id, User.is_active.is_(True)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    request.state.user_id = str(user.id)
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


@dataclass(frozen=True)
class AnalyzeAuth:
    org_id: uuid.UUID
    api_key: ApiKey | None


async def get_analyze_auth(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    token: Annotated[str | None, Depends(get_token_from_request)],
    x_api_key: Annotated[str | None, Header(alias="X-API-Key")] = None,
) -> AnalyzeAuth:
    """Prefer X-API-Key for programmatic calls; otherwise use JWT (dashboard / testing)."""
    request_id = getattr(request.state, "request_id", "")
    if x_api_key:
        key_hash = hash_api_key(x_api_key.strip())
        result = await db.execute(
            select(ApiKey).where(ApiKey.key_hash == key_hash, ApiKey.is_active.is_(True))
        )
        row = result.scalar_one_or_none()
        if not row:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "code": "INVALID_API_KEY",
                    "message": "The API key provided is invalid or has been revoked.",
                    "request_id": request_id,
                    "docs_url": "https://docs.flowshield.ai/errors#INVALID_API_KEY",
                },
            )
        return AnalyzeAuth(org_id=row.org_id, api_key=row)

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "UNAUTHORIZED",
                "message": "Authentication required (X-API-Key or Bearer token).",
                "request_id": request_id,
                "docs_url": "https://docs.flowshield.ai/errors#UNAUTHORIZED",
            },
        )
    payload = safe_decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    try:
        user_id = uuid.UUID(sub)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    result = await db.execute(select(User).where(User.id == user_id, User.is_active.is_(True)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return AnalyzeAuth(org_id=user.org_id, api_key=None)


AnalyzeAuthDep = Annotated[AnalyzeAuth, Depends(get_analyze_auth)]
