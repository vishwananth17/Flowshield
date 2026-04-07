from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import stripe
import os

from app.core.dependencies import get_db, get_current_user
from app.models.user import User

router = APIRouter(prefix="/billing", tags=["Billing"])

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_dummy")

@router.post("/create-checkout-session")
async def create_checkout_session(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': 'Flowshield AI - Pro Tier',
                        'description': '100,000 requests/month',
                    },
                    'unit_amount': 9900, # $99.00
                },
                'quantity': 1,
            }],
            mode='subscription',
            success_url=os.getenv("FRONTEND_URL", "http://localhost:5173") + "/dashboard/settings?success=true",
            cancel_url=os.getenv("FRONTEND_URL", "http://localhost:5173") + "/dashboard/settings?canceled=true",
            client_reference_id=str(current_user.organization_id)
        )
        return {"url": session.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        # Mock logic or real webhook logic
        event = stripe.Webhook.construct_event(
            payload, sig_header, os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_dummy")
        )
    except Exception:
        # For prototype usage, we will accept any structure locally if keys aren't set
        event = {"type": "checkout.session.completed", "data": {"object": {"client_reference_id": "dummy"}}}
        
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        org_id = session.get("client_reference_id")
        
        if org_id and org_id != "dummy":
            # Upgrade the organization
            from sqlalchemy import select
            from app.models.organization import Organization
            
            result = await db.execute(select(Organization).filter(Organization.id == org_id))
            org = result.scalar_one_or_none()
            if org:
                org.plan = "pro"
                org.monthly_tx_limit = 100000
                await db.commit()

    return {"status": "success"}
