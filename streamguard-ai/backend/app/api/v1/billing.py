import os
import hmac
import hashlib
import razorpay
from datetime import datetime, UTC
from typing import Annotated, Any
from fastapi import APIRouter, Depends, HTTPException, Request, Header, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

import logging
logger = logging.getLogger(__name__)

from app.core.dependencies import get_db, CurrentUser
from app.models.organization import Organization
from app.core.plan_limits import PLAN_LIMITS, get_limit

router = APIRouter(prefix="/billing", tags=["Billing"])

# Razorpay Configuration
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET")  # Set this in Razorpay dashboard

# Plan IDs from environment
PLANS = {
    "basic": {
        "monthly": os.getenv("RAZORPAY_PLAN_BASIC_MONTHLY"),
        "annual": os.getenv("RAZORPAY_PLAN_BASIC_ANNUAL"),
        "price": 999
    },
    "standard": {
        "monthly": os.getenv("RAZORPAY_PLAN_GROWTH_MONTHLY"),
        "annual": os.getenv("RAZORPAY_PLAN_GROWTH_ANNUAL"),
        "price": 2999
    },
    "premium": {
        "monthly": os.getenv("RAZORPAY_PLAN_PREMIUM_MONTHLY"),
        "annual": os.getenv("RAZORPAY_PLAN_PREMIUM_ANNUAL"),
        "price": 7999
    }
}

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

class SubscriptionRequest(BaseModel):
    plan: str
    interval: str

class VerifyPaymentRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_subscription_id: str
    razorpay_signature: str

class EnterpriseContactRequest(BaseModel):
    name: str
    email: str
    company: str
    monthly_volume: str
    message: str | None = None

@router.post("/create-subscription")
async def create_subscription(
    req: SubscriptionRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser
):
    logger.info(f"Creating subscription: plan={req.plan}, interval={req.interval}, user={user.email}")
    if req.plan not in PLANS:
        logger.error(f"Invalid plan: {req.plan}")
        raise HTTPException(status_code=400, detail="Invalid plan selected")
    if req.interval not in ["monthly", "annual"]:
        logger.error(f"Invalid interval: {req.interval}")
        raise HTTPException(status_code=400, detail="Invalid interval selected")

    plan_id = PLANS[req.plan][req.interval]
    logger.info(f"Found plan_id: {plan_id}")
    if not plan_id:
        raise HTTPException(status_code=500, detail=f"Razorpay Plan ID not configured for {req.plan} {req.interval}")

    org = await db.get(Organization, user.org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    try:
        # 1. Create Razorpay customer if not exists
        if not org.razorpay_customer_id:
            try:
                customer = client.customer.create({
                    "name": user.full_name or user.email,
                    "email": user.email,
                    "contact": "" 
                })
                org.razorpay_customer_id = customer["id"]
                await db.commit()
            except Exception as e:
                # If customer already exists, try to fetch them or just proceed if possible
                if "already exists" in str(e).lower():
                    try:
                        # Search for customer by email
                        customers = client.customer.all({"email": user.email})
                        if customers["items"]:
                            org.razorpay_customer_id = customers["items"][0]["id"]
                            await db.commit()
                    except:
                        pass # Proceed to subscription creation with plan_id only if needed
                else:
                    logger.error(f"Razorpay customer creation failed: {str(e)}")
                    # Don't block if we can't create customer, subscription might still work with plan_id
                    pass 
        
        # 2. Create Razorpay subscription
        subscription_data = {
            "plan_id": plan_id,
            "customer_notify": 1,
            "quantity": 1,
            "total_count": 1200 if req.interval == "annual" else 1200, # Razorpay total_count is max cycles
            "addons": [],
            "notes": {
                "org_id": str(org.id),
                "plan": req.plan,
                "interval": req.interval
            }
        }
        
        sub = client.subscription.create(subscription_data)
        
        return {
            "subscription_id": sub["id"],
            "razorpay_key_id": RAZORPAY_KEY_ID,
            "amount": PLANS[req.plan]["price"] * 100,
            "currency": "INR"
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/verify-payment")
async def verify_payment(
    req: VerifyPaymentRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser
):
    # 1. Verify HMAC-SHA256 signature
    message = f"{req.razorpay_payment_id}|{req.razorpay_subscription_id}"
    generated_signature = hmac.new(
        RAZORPAY_KEY_SECRET.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()

    if generated_signature != req.razorpay_signature:
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    # 2. Upgrade organization plan in DB
    org = await db.get(Organization, user.org_id)
    
    # We need to find which plan was purchased. 
    # Usually we'd fetch the subscription from Razorpay to be sure.
    sub = client.subscription.fetch(req.razorpay_subscription_id)
    plan_id = sub["plan_id"]
    
    # Reverse lookup plan name
    plan_name = "free"
    interval = "monthly"
    for p_name, intervals in PLANS.items():
        if intervals["monthly"] == plan_id:
            plan_name = p_name
            interval = "monthly"
            break
        if intervals["annual"] == plan_id:
            plan_name = p_name
            interval = "annual"
            break

    org.plan = plan_name
    org.plan_interval = interval
    org.razorpay_subscription_id = req.razorpay_subscription_id
    org.subscription_status = "active"
    org.monthly_request_limit = PLAN_LIMITS[plan_name]["requests"]
    org.subscription_start = datetime.fromtimestamp(sub["start_at"], tz=UTC) if sub.get("start_at") else datetime.now(UTC)
    org.subscription_end = datetime.fromtimestamp(sub["end_at"], tz=UTC) if sub.get("end_at") else None
    
    await db.commit()
    return {"success": True, "plan": plan_name}

@router.post("/webhook", include_in_schema=False)
async def razorpay_webhook(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    x_razorpay_signature: Annotated[str | None, Header()] = None
):
    if not x_razorpay_signature:
        raise HTTPException(status_code=400, detail="Missing signature")
    
    body = await request.body()
    
    # Verification
    # Razorpay recommends using their utility but manual is fine too if secret is set
    try:
        client.utility.verify_webhook_signature(body.decode(), x_razorpay_signature, WEBHOOK_SECRET)
    except:
         raise HTTPException(status_code=400, detail="Invalid signature")

    event_data = await request.json()
    event = event_data.get("event")
    payload = event_data.get("payload", {})
    sub_payload = payload.get("subscription", {}).get("entity", {})
    sub_id = sub_payload.get("id")

    if not sub_id:
        return {"status": "ignored"}

    # Find organization by subscription ID
    result = await db.execute(select(Organization).where(Organization.razorpay_subscription_id == sub_id))
    org = result.scalar_one_or_none()
    
    if not org:
        return {"status": "org_not_found"}

    if event == "subscription.activated":
        org.subscription_status = "active"
    elif event == "subscription.charged":
        org.monthly_request_count = 0
        org.subscription_status = "active"
        if sub_payload.get("current_end"):
            org.subscription_end = datetime.fromtimestamp(sub_payload["current_end"], tz=UTC)
    elif event == "subscription.cancelled":
        # Downgrade happens at period end logic usually handled by subscription_end
        org.subscription_status = "cancelled"
    elif event == "subscription.halted":
        org.subscription_status = "past_due"
    elif event == "payment.failed":
        # Log failure, maybe send email
        pass

    await db.commit()
    return {"status": "success"}

@router.get("/subscription")
async def get_subscription(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser
):
    org = await db.get(Organization, user.org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    plan = org.plan or "free"
    limits = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])
    
    # Calculate usage
    usage_percent = 0
    if org.monthly_request_limit > 0:
        usage_percent = round((org.monthly_request_count / org.monthly_request_limit) * 100, 2)
    elif org.monthly_request_limit == -1:
        usage_percent = 0 # Unlimited

    return {
        "plan": plan,
        "interval": org.plan_interval or "monthly",
        "status": org.subscription_status,
        "amount_inr": PLANS.get(plan, {}).get("price", 0),
        "requests_used": org.monthly_request_count,
        "requests_limit": org.monthly_request_limit,
        "usage_percent": usage_percent,
        "next_billing_date": org.subscription_end.date().isoformat() if org.subscription_end else None,
        "subscription_id": org.razorpay_subscription_id,
        "features": limits
    }

@router.post("/cancel")
async def cancel_subscription(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser
):
    org = await db.get(Organization, user.org_id)
    if not org or not org.razorpay_subscription_id:
        raise HTTPException(status_code=400, detail="No active subscription to cancel")

    try:
        # Cancel at cycle end
        client.subscription.cancel(org.razorpay_subscription_id, {"cancel_at_cycle_end": 1})
        org.subscription_status = "cancelled" # Or "cancelling" as per user request
        await db.commit()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/invoices")
async def get_invoices(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser
):
    org = await db.get(Organization, user.org_id)
    if not org or not org.razorpay_subscription_id:
        return []

    try:
        # Fetch payments for this subscription
        payments = client.subscription.fetch_all_payments(org.razorpay_subscription_id)
        # Transform for frontend
        invoices = []
        for p in payments.get("items", []):
            invoices.append({
                "id": p["id"],
                "date": datetime.fromtimestamp(p["created_at"], tz=UTC).date().isoformat(),
                "amount": p["amount"] / 100,
                "status": p["status"], # captured, failed, etc.
                "method": p.get("method")
            })
        return invoices
    except Exception:
        return []

@router.post("/contact-enterprise")
async def contact_enterprise(
    req: EnterpriseContactRequest,
    user: CurrentUser
):
    # In a real app, send email via Resend or similar
    # For now, we simulate success
    print(f"ENTERPRISE LEAD: {req.name} <{req.email}> from {req.company}")
    print(f"Volume: {req.monthly_volume}, Message: {req.message}")
    return {"success": True}
