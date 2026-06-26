import os
import urllib.parse
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse

router = APIRouter()

@router.get("/integrations/shopify/oauth/start")
async def shopify_oauth_start(shop: str):
    if not shop:
        raise HTTPException(status_code=400, detail="Missing 'shop' parameter")
    client_id = os.getenv("SHOPIFY_API_KEY", "mock_shopify_client_id")
    scopes = "read_orders,write_orders,read_checkouts"
    redirect_uri = "https://flowshield-stdr.onrender.com/api/v1/integrations/shopify/oauth/callback"
    auth_url = f"https://{shop}/admin/oauth/authorize?client_id={client_id}&scope={scopes}&redirect_uri={urllib.parse.quote(redirect_uri)}&state=mock_state"
    return {"auth_url": auth_url}

@router.get("/integrations/shopify/oauth/callback")
async def shopify_oauth_callback(request: Request):
    frontend_url = os.getenv("FRONTEND_URL", "https://flowshield-ai.vercel.app")
    return RedirectResponse(url=f"{frontend_url}/dashboard/integrations?connected=shopify&store=mock")
