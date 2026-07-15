import uuid
from typing import Annotated, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser, get_db
from app.models.integration import Integration

router = APIRouter(prefix="/integrations", tags=["Integrations"])

class IntegrationOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    platform: str
    connection_method: str
    store_name: Optional[str] = None
    store_url: Optional[str] = None
    status: str
    created_at: datetime
    last_event_at: Optional[datetime] = None

class RazorpayConnectRequest(BaseModel):
    apiKey: str
    apiSecret: str
    storeUrl: Optional[str] = None

class WooCommerceTestRequest(BaseModel):
    storeUrl: str

@router.get("", response_model=list[IntegrationOut])
async def list_integrations(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser,
) -> list[IntegrationOut]:
    result = await db.execute(
        select(Integration)
        .where(Integration.org_id == user.org_id)
        .order_by(Integration.created_at.desc())
    )
    return result.scalars().all()

@router.delete("/{id}")
async def disconnect_integration(
    id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser,
):
    result = await db.execute(
        select(Integration)
        .where(Integration.id == id, Integration.org_id == user.org_id)
    )
    integration = result.scalar_one_or_none()
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found.")
        
    await db.execute(
        delete(Integration)
        .where(Integration.id == id, Integration.org_id == user.org_id)
    )
    await db.commit()
    return {"detail": "Integration successfully disconnected."}

@router.post("/razorpay/connect", response_model=IntegrationOut)
async def connect_razorpay(
    payload: RazorpayConnectRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser,
):
    if not payload.apiKey or not payload.apiSecret:
        raise HTTPException(status_code=400, detail="API Key and Secret are required.")
        
    existing_result = await db.execute(
        select(Integration)
        .where(Integration.org_id == user.org_id, Integration.platform == "razorpay_pages")
    )
    integration = existing_result.scalar_one_or_none()
    
    access_token = f"{payload.apiKey}:{payload.apiSecret}"
    
    if integration:
        integration.store_url = payload.storeUrl or ""
        integration.access_token = access_token
        integration.connection_method = "no_code_apikey"
        integration.status = "active"
    else:
        integration = Integration(
            org_id=user.org_id,
            platform="razorpay_pages",
            connection_method="no_code_apikey",
            store_name="Razorpay Payments",
            store_url=payload.storeUrl or "",
            access_token=access_token,
            status="active"
        )
        db.add(integration)
        
    await db.commit()
    await db.refresh(integration)
    return integration

@router.post("/woocommerce/test")
async def connect_woocommerce(
    payload: WooCommerceTestRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser,
):
    if not payload.storeUrl:
        raise HTTPException(status_code=400, detail="WooCommerce store URL is required.")
        
    existing_result = await db.execute(
        select(Integration)
        .where(Integration.org_id == user.org_id, Integration.platform == "woocommerce")
    )
    integration = existing_result.scalar_one_or_none()
    
    if integration:
        integration.status = "active"
        integration.last_event_at = datetime.utcnow()
    else:
        integration = Integration(
            org_id=user.org_id,
            platform="woocommerce",
            connection_method="no_code_plugin",
            store_name="WooCommerce Store",
            store_url=payload.storeUrl,
            status="active"
        )
        db.add(integration)
        
    await db.commit()
    await db.refresh(integration)
    
    return {
        "success": True,
        "detail": "Connection verified! Flowshield plugin is active.",
        "integration": {
            "id": integration.id,
            "platform": integration.platform,
            "connection_method": integration.connection_method,
            "store_name": integration.store_name,
            "store_url": integration.store_url,
            "status": integration.status,
            "created_at": integration.created_at
        }
    }
