import os
from datetime import datetime, UTC
from typing import Annotated

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, CurrentUser
from app.models.organization import Organization

router = APIRouter(prefix="/billing", tags=["Billing"])

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
GROWTH_PRICE_ID = os.getenv("STRIPE_GROWTH_PRICE_ID")
WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


@router.post("/create-checkout-session")
async def create_checkout_session(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser
):
    """
    Creates a Stripe Checkout session for the Growth plan ($99/mo).
    """
    # Fetch organization
    org = await db.get(Organization, user.org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    try:
        # Create or retrieve customer
        if not org.stripe_customer_id:
            customer = stripe.Customer.create(
                email=user.email,
                metadata={"org_id": str(org.id), "org_name": org.name}
            )
            org.stripe_customer_id = customer.id
            await db.commit()
        else:
            customer_id = org.stripe_customer_id

        session = stripe.checkout.Session.create(
            customer=org.stripe_customer_id,
            payment_method_types=["card"],
            line_items=[
                {
                    "price": GROWTH_PRICE_ID,
                    "quantity": 1,
                },
            ],
            mode="subscription",
            success_url=f"{FRONTEND_URL}/dashboard/billing?success=true&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}/dashboard/billing?canceled=true",
            client_reference_id=str(org.id),
            metadata={"org_id": str(org.id)},
            subscription_data={
                "metadata": {"org_id": str(org.id)}
            },
        )
        return {"checkout_url": session.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    stripe_signature: str = Header(None)
):
    """
    Stripe webhook listener to handle subscription lifecycle events.
    """
    if not stripe_signature:
        raise HTTPException(status_code=400, detail="Missing stripe-signature header")

    payload = await request.body()
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    event_type = event["type"]
    data_object = event["data"]["object"]

    if event_type == "checkout.session.completed":
        # Upgrade organization to 'growth'
        org_id = data_object.get("client_reference_id") or data_object.get("metadata", {}).get("org_id")
        
        if not org_id:
            # Fallback to customer lookup if metadata is missing in the session itself
            # The subscription object might have it
            subscription_id = data_object.get("subscription")
            if subscription_id:
                subscription = stripe.Subscription.retrieve(subscription_id)
                org_id = subscription.get("metadata", {}).get("org_id")

        if org_id:
            result = await db.execute(select(Organization).filter(Organization.id == org_id))
            org = result.scalar_one_or_none()
            if org:
                org.plan = "growth"
                org.monthly_request_limit = 100000
                org.stripe_subscription_id = data_object.get("subscription")
                org.billing_period_start = datetime.now(UTC)
                await db.commit()

    elif event_type == "customer.subscription.deleted":
        # Downgrade organization back to 'starter'
        org_id = data_object.get("metadata", {}).get("org_id")
        if org_id:
            result = await db.execute(select(Organization).filter(Organization.id == org_id))
            org = result.scalar_one_or_none()
            if org:
                org.plan = "starter"
                org.monthly_request_limit = 1000
                org.stripe_subscription_id = None
                await db.commit()

    elif event_type == "invoice.payment_failed":
        # Log payment failure
        customer_id = data_object.get("customer")
        print(f"PAYMENT FAILED for customer {customer_id}")

    return {"status": "success"}


@router.get("/subscription")
async def get_subscription(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser
):
    """
    Returns current subscription details and a management portal link.
    """
    org = await db.get(Organization, user.org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    portal_url = None
    if org.stripe_customer_id:
        try:
            portal_session = stripe.billing_portal.Session.create(
                customer=org.stripe_customer_id,
                return_url=f"{FRONTEND_URL}/dashboard/billing"
            )
            portal_url = portal_session.url
        except Exception:
            portal_url = None

    return {
        "plan": org.plan,
        "monthly_request_count": org.monthly_request_count,
        "monthly_request_limit": org.monthly_request_limit,
        "percentage_used": round((org.monthly_request_count / org.monthly_request_limit) * 100, 2) if org.monthly_request_limit > 0 else 0,
        "billing_period_start": org.billing_period_start,
        "stripe_portal_url": portal_url
    }
