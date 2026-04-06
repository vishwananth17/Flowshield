import secrets
import uuid
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import get_settings
from app.core.dependencies import CurrentUser, get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    generate_api_key,
    hash_password,
    safe_decode_token,
    verify_password,
)
from app.models.api_key import ApiKey
from app.models.organization import Organization
from app.models.user import User
from app.schemas.auth import (
    AuthMeResponse,
    LoginRequest,
    OrganizationOut,
    RegisterRequest,
    RegisterResponse,
    UserOut,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

ACCESS_COOKIE = "access_token"
REFRESH_COOKIE = "refresh_token"


def _cookie_args() -> dict:
    settings = get_settings()
    args: dict = {
        "httponly": True,
        "secure": settings.cookie_secure,
        "samesite": "lax",
        "path": "/",
    }
    if settings.cookie_domain:
        args["domain"] = settings.cookie_domain
    return args


def _set_auth_cookies(response: Response, user_id: uuid.UUID) -> None:
    settings = get_settings()
    access = create_access_token(str(user_id))
    jti = secrets.token_urlsafe(32)
    refresh = create_refresh_token(str(user_id), jti=jti)
    max_age_access = settings.access_token_expire_minutes * 60
    max_age_refresh = settings.refresh_token_expire_days * 24 * 3600
    kw = _cookie_args()
    response.set_cookie(ACCESS_COOKIE, access, max_age=max_age_access, **kw)
    response.set_cookie(REFRESH_COOKIE, refresh, max_age=max_age_refresh, **kw)


def _clear_auth_cookies(response: Response) -> None:
    kw = _cookie_args()
    response.delete_cookie(ACCESS_COOKIE, **kw)
    response.delete_cookie(REFRESH_COOKIE, **kw)


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create account and organization",
)
async def register(
    body: RegisterRequest,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> RegisterResponse:
    org = Organization(name=body.organization_name.strip())
    db.add(org)
    await db.flush()

    user = User(
        org_id=org.id,
        email=str(body.email).lower().strip(),
        password_hash=hash_password(body.password),
        full_name=body.full_name.strip() if body.full_name else None,
        role="owner",
    )
    db.add(user)
    await db.flush()

    raw_key, prefix_display, key_hash = generate_api_key("live")
    api_row = ApiKey(
        org_id=org.id,
        name="Default",
        key_hash=key_hash,
        key_prefix=prefix_display[:20],
        environment="live",
        created_by=user.id,
    )
    db.add(api_row)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    await db.refresh(org)
    await db.refresh(user)

    _set_auth_cookies(response, user.id)

    return RegisterResponse(
        user=UserOut.model_validate(user),
        organization=OrganizationOut.model_validate(org),
        api_key=raw_key,
    )


@router.post("/login", summary="Email/password login (sets httpOnly cookies)")
async def login(
    body: LoginRequest,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, UserOut]:
    result = await db.execute(select(User).where(User.email == str(body.email).lower().strip()))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")

    user.last_login_at = datetime.now(UTC)
    _set_auth_cookies(response, user.id)
    await db.commit()
    return {"user": UserOut.model_validate(user)}


@router.post("/refresh", summary="Rotate access token using refresh cookie")
async def refresh_session(
    request: Request,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, str]:
    token = request.cookies.get(REFRESH_COOKIE)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing refresh token")
    payload = safe_decode_token(token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    try:
        user_id = uuid.UUID(sub)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    result = await db.execute(select(User).where(User.id == user_id, User.is_active.is_(True)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    _set_auth_cookies(response, user.id)
    await db.commit()
    return {"status": "ok"}


@router.post("/logout", summary="Clear auth cookies")
async def logout(response: Response) -> dict[str, str]:
    _clear_auth_cookies(response)
    return {"status": "ok"}


@router.get("/me", response_model=AuthMeResponse)
async def me(
    user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AuthMeResponse:
    org = await db.get(Organization, user.org_id)
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    return AuthMeResponse(
        user=UserOut.model_validate(user),
        organization=OrganizationOut.model_validate(org),
    )
