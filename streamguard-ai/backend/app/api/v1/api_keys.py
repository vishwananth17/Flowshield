import uuid
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser, get_db
from app.core.security import generate_api_key
from app.models.api_key import ApiKey

router = APIRouter(prefix="/api-keys", tags=["API Keys"])

class ApiKeyOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    name: str
    key_prefix: str
    environment: str
    is_active: bool
    last_used_at: datetime | None
    monthly_requests: int
    created_at: datetime

class ApiKeyCreate(BaseModel):
    name: str
    environment: str = "live"

class ApiKeyCreateResponse(BaseModel):
    raw_key: str
    api_key: ApiKeyOut

@router.get("", response_model=list[ApiKeyOut], summary="List all API keys for organization")
async def list_api_keys(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser,
) -> list[ApiKeyOut]:
    result = await db.execute(
        select(ApiKey).where(ApiKey.org_id == user.org_id, ApiKey.is_active.is_(True)).order_by(ApiKey.created_at.desc())
    )
    return result.scalars().all()

@router.post("", response_model=ApiKeyCreateResponse, summary="Create a new API key")
async def create_api_key(
    body: ApiKeyCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser,
) -> ApiKeyCreateResponse:
    env = body.environment.lower()
    if env not in ["live", "test"]:
        env = "live"
    
    raw_key, prefix_display, key_hash = generate_api_key(env)
    new_key = ApiKey(
        org_id=user.org_id,
        name=body.name.strip(),
        key_hash=key_hash,
        key_prefix=prefix_display[:20],
        environment=env,
        created_by=user.id,
    )
    db.add(new_key)
    await db.commit()
    await db.refresh(new_key)

    return ApiKeyCreateResponse(
        raw_key=raw_key,
        api_key=ApiKeyOut.model_validate(new_key),
    )

@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Revoke an API key")
async def revoke_api_key(
    key_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser,
) -> None:
    result = await db.execute(
        select(ApiKey).where(ApiKey.id == key_id, ApiKey.org_id == user.org_id, ApiKey.is_active.is_(True))
    )
    key = result.scalar_one_or_none()
    if not key:
        raise HTTPException(status_code=404, detail="API key not found or already revoked")
    
    key.is_active = False
    await db.commit()
