import os
import urllib.parse
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse

router = APIRouter()

@router.get("/integrations/shopify/oauth/start")
async def shopify_oauth_start(shop: str):
    if not shop:
        raise HTTPException(status_code=400, detail="Missing 'shop' parameter")
    
    # Sanitize shop string (remove protocols, trailing slashes)
    shop = shop.strip().lower()
    if shop.startswith("https://"):
        shop = shop[8:]
    elif shop.startswith("http://"):
        shop = shop[7:]
    shop = shop.rstrip("/")
    
    # Automatically append .myshopify.com if not present
    if not shop.endswith(".myshopify.com"):
        shop = f"{shop}.myshopify.com"

    client_id = os.getenv("SHOPIFY_API_KEY", "mock_shopify_client_id")
    scopes = "read_orders,write_orders,read_checkouts"
    redirect_uri = "https://flowshield-stdr.onrender.com/api/v1/integrations/shopify/oauth/callback"
    auth_url = f"https://{shop}/admin/oauth/authorize?client_id={client_id}&scope={scopes}&redirect_uri={urllib.parse.quote(redirect_uri)}&state=mock_state"
    return {"auth_url": auth_url, "shop": shop}

@router.get("/integrations/shopify/oauth/callback")
async def shopify_oauth_callback(request: Request):
    frontend_url = os.getenv("FRONTEND_URL", "https://flowshield-ai.vercel.app")
    return RedirectResponse(url=f"{frontend_url}/dashboard/integrations?connected=shopify&store=mock")
