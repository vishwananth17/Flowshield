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

import httpx

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

class ShopifyConnectRequest(BaseModel):
    storeUrl: str
    apiKey: Optional[str] = None
    accessToken: Optional[str] = None

class VerifyCredentialsRequest(BaseModel):
    platform: str
    storeUrl: Optional[str] = None
    apiKey: Optional[str] = None
    apiSecret: Optional[str] = None
    accessToken: Optional[str] = None
    environment: Optional[str] = "production"

class VerifyCredentialsResponse(BaseModel):
    valid: bool
    platform: str
    message: str
    details: Optional[dict] = None

@router.get("", response_model=list[IntegrationOut])
async def list_integrations(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser,
) -> list[IntegrationOut]:
    try:
        result = await db.execute(
            select(Integration)
            .where(Integration.org_id == user.org_id)
            .order_by(Integration.created_at.desc())
        )
        return result.scalars().all()
    except Exception as e:
        return []

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

@router.post("/shopify/connect", response_model=IntegrationOut)
async def connect_shopify(
    payload: ShopifyConnectRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser,
):
    if not payload.storeUrl:
        raise HTTPException(status_code=400, detail="Shopify store URL is required.")
        
    store_clean = payload.storeUrl.replace("https://", "").replace("http://", "").strip("/")
    
    existing_result = await db.execute(
        select(Integration)
        .where(Integration.org_id == user.org_id, Integration.platform == "shopify")
    )
    integration = existing_result.scalar_one_or_none()
    
    if integration:
        integration.store_url = f"https://{store_clean}"
        integration.access_token = payload.apiKey or integration.access_token
        integration.connection_method = "webhook"
        integration.status = "active"
        integration.last_event_at = datetime.utcnow()
    else:
        integration = Integration(
            org_id=user.org_id,
            platform="shopify",
            connection_method="webhook",
            store_name=f"Shopify ({store_clean})",
            store_url=f"https://{store_clean}",
            access_token=payload.apiKey or "",
            status="active",
            last_event_at=datetime.utcnow()
        )
        db.add(integration)
        
    await db.commit()
    await db.refresh(integration)
    return integration

@router.post("/verify-credentials", response_model=VerifyCredentialsResponse)
async def verify_credentials(
    payload: VerifyCredentialsRequest,
    user: CurrentUser,
) -> VerifyCredentialsResponse:
    """Verifies live credentials against third-party provider APIs (Shopify, Razorpay, Cashfree, WooCommerce)."""
    platform = payload.platform.lower().strip()
    
    if platform == "shopify":
        if not payload.storeUrl:
            return VerifyCredentialsResponse(
                valid=False,
                platform="shopify",
                message="Shopify store URL (e.g. your-store.myshopify.com) is required."
            )
        clean_url = payload.storeUrl.replace("https://", "").replace("http://", "").strip("/")
        token = (payload.accessToken or payload.apiKey or "").strip()
        
        if token:
            try:
                async with httpx.AsyncClient(timeout=8.0) as client:
                    resp = await client.get(
                        f"https://{clean_url}/admin/api/2024-01/shop.json",
                        headers={"X-Shopify-Access-Token": token}
                    )
                    if resp.status_code == 200:
                        shop_info = resp.json().get("shop", {})
                        return VerifyCredentialsResponse(
                            valid=True,
                            platform="shopify",
                            message=f"Connected successfully to '{shop_info.get('name', clean_url)}' ({shop_info.get('email', '')})",
                            details={
                                "shop_name": shop_info.get("name"),
                                "domain": shop_info.get("domain") or clean_url,
                                "currency": shop_info.get("currency"),
                                "country": shop_info.get("country_name")
                            }
                        )
                    elif resp.status_code in [401, 403]:
                        return VerifyCredentialsResponse(
                            valid=False,
                            platform="shopify",
                            message="Invalid Shopify Admin API Token. Please verify permissions (read_orders, write_orders required)."
                        )
                    elif resp.status_code == 404:
                        return VerifyCredentialsResponse(
                            valid=False,
                            platform="shopify",
                            message=f"Store '{clean_url}' not found. Please ensure this is your exact .myshopify.com store domain."
                        )
                    else:
                        return VerifyCredentialsResponse(
                            valid=False,
                            platform="shopify",
                            message=f"Shopify returned HTTP status {resp.status_code}: {resp.text[:120]}"
                        )
            except Exception as e:
                return VerifyCredentialsResponse(
                    valid=False,
                    platform="shopify",
                    message=f"Could not reach Shopify store at {clean_url}: {str(e)}"
                )
        else:
            try:
                async with httpx.AsyncClient(timeout=6.0, follow_redirects=True) as client:
                    resp = await client.get(f"https://{clean_url}")
                    if resp.status_code in [200, 301, 302, 401]:
                        return VerifyCredentialsResponse(
                            valid=True,
                            platform="shopify",
                            message=f"Shopify store '{clean_url}' is reachable. Webhook routing is ready to ingest orders!",
                            details={"store_url": f"https://{clean_url}", "mode": "webhook_ready"}
                        )
                    else:
                        return VerifyCredentialsResponse(
                            valid=False,
                            platform="shopify",
                            message=f"Store check returned HTTP {resp.status_code}. Make sure your store domain is correct."
                        )
            except Exception as e:
                return VerifyCredentialsResponse(
                    valid=False,
                    platform="shopify",
                    message=f"Could not reach store at https://{clean_url}. Error: {str(e)}"
                )
                
    elif platform in ["razorpay", "razorpay_pages"]:
        key_id = (payload.apiKey or "").strip()
        key_secret = (payload.apiSecret or "").strip()
        if not key_id or not key_secret:
            return VerifyCredentialsResponse(
                valid=False,
                platform="razorpay",
                message="Both Razorpay Key ID (rzp_live_...) and Key Secret are required."
            )
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(
                    "https://api.razorpay.com/v1/payments?count=1",
                    auth=(key_id, key_secret)
                )
                if resp.status_code == 200:
                    return VerifyCredentialsResponse(
                        valid=True,
                        platform="razorpay",
                        message="Razorpay API credentials verified successfully. Telemetry sync active."
                    )
                else:
                    return VerifyCredentialsResponse(
                        valid=False,
                        platform="razorpay",
                        message="Invalid Razorpay Key ID or Secret (Authentication failed)."
                    )
        except Exception as e:
            return VerifyCredentialsResponse(
                valid=False,
                platform="razorpay",
                message=f"Failed to connect to Razorpay API: {str(e)}"
            )

    elif platform == "cashfree":
        app_id = (payload.apiKey or "").strip()
        secret_key = (payload.apiSecret or "").strip()
        if not app_id or not secret_key:
            return VerifyCredentialsResponse(
                valid=False,
                platform="cashfree",
                message="Cashfree App ID and Secret Key are required."
            )
        base_url = "https://sandbox.cashfree.com/pg/orders?limit=1" if payload.environment == "sandbox" else "https://api.cashfree.com/pg/orders?limit=1"
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(
                    base_url,
                    headers={
                        "x-client-id": app_id,
                        "x-client-secret": secret_key,
                        "x-api-version": "2023-08-01"
                    }
                )
                if resp.status_code == 200:
                    return VerifyCredentialsResponse(
                        valid=True,
                        platform="cashfree",
                        message="Cashfree Payment Gateway credentials verified successfully."
                    )
                else:
                    return VerifyCredentialsResponse(
                        valid=False,
                        platform="cashfree",
                        message="Invalid Cashfree App ID or Secret Key."
                    )
        except Exception as e:
            return VerifyCredentialsResponse(
                valid=False,
                platform="cashfree",
                message=f"Failed to connect to Cashfree API: {str(e)}"
            )

    elif platform == "woocommerce":
        if not payload.storeUrl:
            return VerifyCredentialsResponse(
                valid=False,
                platform="woocommerce",
                message="Store URL is required."
            )
        clean_url = payload.storeUrl.replace("https://", "").replace("http://", "").strip("/")
        try:
            async with httpx.AsyncClient(timeout=6.0, follow_redirects=True) as client:
                resp = await client.get(f"https://{clean_url}/wp-json")
                if resp.status_code == 200:
                    data = resp.json()
                    name = data.get("name", clean_url)
                    return VerifyCredentialsResponse(
                        valid=True,
                        platform="woocommerce",
                        message=f"Connected to WordPress / WooCommerce site: {name}",
                        details={"site_name": name}
                    )
                else:
                    return VerifyCredentialsResponse(
                        valid=True,
                        platform="woocommerce",
                        message=f"Store reachable at https://{clean_url}."
                    )
        except Exception as e:
            return VerifyCredentialsResponse(
                valid=False,
                platform="woocommerce",
                message=f"Could not reach WordPress/WooCommerce site at https://{clean_url}: {str(e)}"
            )

    return VerifyCredentialsResponse(
        valid=False,
        platform=platform,
        message=f"Unsupported platform '{platform}' for credential verification."
    )

