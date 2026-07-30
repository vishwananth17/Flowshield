import hmac
import hashlib
import base64
import logging
import uuid
import time
from datetime import datetime, UTC
from typing import Annotated, Optional
from decimal import Decimal

from fastapi import APIRouter, Header, Request, HTTPException, Depends, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.core.security import hash_api_key
from app.models.api_key import ApiKey
from app.models.organization import Organization
from app.models.transaction import Transaction
from app.models.alert import Alert
from app.models.integration import Integration
from app.schemas.transaction import (
    TransactionAnalyzeRequest,
    MerchantIn,
    CardIn,
    CustomerIn
)
from app.services.fraud_detection_service import FraudDetectionService
from app.core.websockets import ws_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks/shopify", tags=["Shopify Webhooks"])
_fraud_service = FraudDetectionService()


def verify_shopify_hmac(body_bytes: bytes, hmac_header: str, secret: str) -> bool:
    """Verifies HMAC-SHA256 signature from Shopify."""
    if not hmac_header or not secret:
        return False
    digest = hmac.new(secret.encode("utf-8"), body_bytes, hashlib.sha256).digest()
    computed_hmac = base64.b64encode(digest).decode("utf-8")
    return hmac.compare_digest(computed_hmac, hmac_header)


async def tag_shopify_order(
    shop_domain: str,
    access_token: str,
    shopify_order_id: str,
    risk_score: float,
    risk_label: str
):
    """Calls Shopify Admin REST API to automatically tag high-risk orders with FlowShield risk telemetry."""
    if not shop_domain or not access_token or not shopify_order_id:
        return
    import httpx
    tag_str = f"FlowShield: Risk {int(risk_score * 100)}/100 ({risk_label.upper()})"
    url = f"https://{shop_domain.replace('https://', '').strip('/')}/admin/api/2024-01/orders/{shopify_order_id}.json"
    headers = {
        "X-Shopify-Access-Token": access_token,
        "Content-Type": "application/json"
    }
    payload = {
        "order": {
            "id": shopify_order_id,
            "tags": tag_str
        }
    }
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.put(url, json=payload, headers=headers)
            if res.status_code in [200, 201]:
                logger.info(f"✅ Shopify Order {shopify_order_id} tagged successfully: '{tag_str}'")
            else:
                logger.warning(f"Shopify Tagging API responded with status {res.status_code}")
    except Exception as e:
        logger.error(f"Failed to tag Shopify order {shopify_order_id}: {e}")


async def resolve_organization_from_request(
    db: AsyncSession,
    api_key: Optional[str] = None,
    x_api_key: Optional[str] = None,
    shop_domain: Optional[str] = None,
    payload: Optional[dict] = None
) -> tuple[Organization, Optional[ApiKey]]:
    """Resolves Organization using API key, shop domain, customer email, or fallback."""
    from app.models.user import User

    key_str = api_key or x_api_key
    if key_str:
        key_hash = hash_api_key(key_str.strip())
        res = await db.execute(select(ApiKey).where(ApiKey.key_hash == key_hash, ApiKey.is_active.is_(True)))
        api_key_obj = res.scalar_one_or_none()
        if api_key_obj:
            org_res = await db.execute(select(Organization).where(Organization.id == api_key_obj.org_id))
            org = org_res.scalar_one_or_none()
            if org:
                return org, api_key_obj

    # Extract shop domain from payload if omitted in header
    domain = shop_domain
    if not domain and payload:
        domain = payload.get("shop_domain") or payload.get("domain")
        if not domain and payload.get("order_status_url"):
            import urllib.parse
            parsed = urllib.parse.urlparse(payload.get("order_status_url"))
            domain = parsed.netloc

    if domain:
        clean_domain = domain.replace("https://", "").replace("http://", "").split("/")[0]
        integ_res = await db.execute(
            select(Integration).where(
                Integration.platform == "shopify",
                Integration.store_url.ilike(f"%{clean_domain}%")
            )
        )
        integ = integ_res.scalar_one_or_none()
        if integ:
            org_res = await db.execute(select(Organization).where(Organization.id == integ.org_id))
            org = org_res.scalar_one_or_none()
            if org:
                return org, None

    # Check if payload customer/contact email matches a registered user's organization
    if payload:
        cust = payload.get("customer") or {}
        email = cust.get("email") or payload.get("email") or payload.get("contact_email")
        if email:
            user_res = await db.execute(select(User).where(User.email.ilike(email.strip())))
            matched_user = user_res.scalar_one_or_none()
            if matched_user:
                org_res = await db.execute(select(Organization).where(Organization.id == matched_user.org_id))
                org = org_res.scalar_one_or_none()
                if org:
                    return org, None

    # Fallback to latest organization if any exists
    org_res = await db.execute(select(Organization).order_by(Organization.created_at.desc()).limit(1))
    default_org = org_res.scalar_one_or_none()
    if default_org:
        return default_org, None

    raise HTTPException(status_code=401, detail="Could not resolve organization for Shopify webhook")


async def process_shopify_order(
    payload: dict,
    db: AsyncSession,
    org: Organization,
    shop_domain: Optional[str] = None
) -> dict:
    """Core pipeline to transform Shopify order, run ML fraud scoring, save transaction & trigger alerts."""
    start_time = time.perf_counter()

    # Extract Shopify order details safely
    order_id = str(payload.get("id") or payload.get("order_id") or f"shopify_{uuid.uuid4().hex[:8]}")
    order_name = str(payload.get("name") or payload.get("order_number") or order_id)
    total_price = float(payload.get("total_price") or payload.get("amount") or 0.0)
    currency = str(payload.get("currency") or "INR").upper()

    customer = payload.get("customer") or {}
    customer_id = str(customer.get("id") or payload.get("customer_id") or "cust_shopify_unknown")
    customer_email = customer.get("email") or payload.get("email") or ""

    billing_address = payload.get("billing_address") or payload.get("shipping_address") or {}
    country_code = billing_address.get("country_code") or "IN"
    city = billing_address.get("city") or "Mumbai"

    payment_details = payload.get("payment_details") or {}
    card_last_four = str(payment_details.get("credit_card_bin") or "4242")
    gateways = payload.get("payment_gateway_names") or ["shopify_payments"]
    card_type = str(gateways[0]) if gateways else "credit_card"
    customer_ip = str(payload.get("browser_ip") or "127.0.0.1")

    # 1. Transform to TransactionAnalyzeRequest schema
    analyze_req = TransactionAnalyzeRequest(
        transaction_id=order_name,
        amount=Decimal(str(total_price)),
        currency=currency if len(currency) == 3 else "INR",
        merchant=MerchantIn(
            id=shop_domain or "shopify_store",
            name=shop_domain or f"Shopify Order {order_name}",
            category="5999",
            country=country_code[:2] if len(country_code) >= 2 else "IN"
        ),
        card=CardIn(
            last_four=card_last_four[-4:] if len(card_last_four) >= 4 else "4242",
            type=card_type[:50],
            issuing_country=country_code[:2] if len(country_code) >= 2 else "IN"
        ),
        customer=CustomerIn(
            id=customer_id,
            email=customer_email or "unknown@shopify.com",
            ip=customer_ip if len(customer_ip) <= 45 else "127.0.0.1",
            device_fingerprint=(payload.get("token") or f"fp_{uuid.uuid4().hex[:12]}")[:255],
            country=country_code[:2] if len(country_code) >= 2 else "IN",
            city=city[:100]
        ),
        channel="shopify_webhook"
    )

    # 2. Execute Ensemble ML & Heuristics Fraud Service
    fraud_result = await _fraud_service.analyze(
        tx=analyze_req,
        plan=org.plan or "free",
        db=db,
        org_id=org.id
    )

    latency_ms = int((time.perf_counter() - start_time) * 1000)

    # 3. Create & save Transaction record in DB
    tx_record = Transaction(
        id=uuid.uuid4(),
        org_id=org.id,
        external_id=order_name,
        amount=Decimal(str(total_price)),
        currency=analyze_req.currency,
        merchant_id=analyze_req.merchant.id,
        merchant_name=analyze_req.merchant.name,
        merchant_category="ecommerce",
        card_last_four=analyze_req.card.last_four,
        card_type=analyze_req.card.type,
        customer_id=analyze_req.customer.id,
        customer_ip=analyze_req.customer.ip,
        customer_country=analyze_req.customer.country,
        customer_city=analyze_req.customer.city,
        device_fingerprint=analyze_req.customer.device_fingerprint,
        channel="shopify_webhook",
        risk_score=Decimal(str(round(fraud_result.risk_score, 4))),
        risk_label=fraud_result.risk_label,
        decision=fraud_result.decision,
        fraud_reasons=fraud_result.reasons,
        model_version=fraud_result.model_version,
        detection_latency_ms=latency_ms,
        created_at=datetime.now(UTC)
    )
    db.add(tx_record)

    # 4. If high risk, create Alert record
    alert_created = False
    if fraud_result.risk_score >= 0.70 or fraud_result.risk_label in ["fraud", "review"]:
        alert_record = Alert(
            id=uuid.uuid4(),
            org_id=org.id,
            transaction_id=tx_record.id,
            severity="CRITICAL" if fraud_result.risk_score >= 0.85 else "HIGH",
            title=f"Shopify Order {order_name} Flagged ({fraud_result.risk_label.upper()})",
            description=f"Automated risk score {int(fraud_result.risk_score * 100)}/100 detected. Reasons: {', '.join(fraud_result.reasons[:2])}",
            status="open",
            created_at=datetime.now(UTC)
        )
        db.add(alert_record)
        alert_created = True
        
        # Dispatch instant email alert to organization email / admin
        from app.services.email import email_service
        notify_email = customer_email or getattr(org, "billing_email", None) or "admin@flowshield.ai"
        asyncio.create_task(
            email_service.send_fraud_alert_email(
                to_email=notify_email,
                tx_id=str(tx_record.id),
                external_id=order_name,
                amount=str(total_price),
                currency=analyze_req.currency,
                merchant_name=analyze_req.merchant.name,
                risk_score=fraud_result.risk_score,
                risk_label=fraud_result.risk_label,
                reasons=fraud_result.reasons
            )
        )

    # 5. Automatically create/update Integration record if shop_domain is provided
    if shop_domain:
        integ_res = await db.execute(
            select(Integration).where(
                Integration.org_id == org.id,
                Integration.platform == "shopify"
            )
        )
        integ = integ_res.scalar_one_or_none()
        if integ:
            integ.last_event_at = datetime.now(UTC)
            integ.status = "active"
            # Trigger automated active defense order tagging in Shopify Admin
            if integ.access_token and fraud_result.risk_score >= 0.70:
                asyncio.create_task(
                    tag_shopify_order(
                        shop_domain=shop_domain,
                        access_token=integ.access_token,
                        shopify_order_id=order_id,
                        risk_score=fraud_result.risk_score,
                        risk_label=fraud_result.risk_label
                    )
                )
        else:
            new_integ = Integration(
                id=uuid.uuid4(),
                org_id=org.id,
                platform="shopify",
                connection_method="webhook",
                store_name=f"Shopify Store ({shop_domain})",
                store_url=f"https://{shop_domain}",
                status="active",
                last_event_at=datetime.now(UTC)
            )
            db.add(new_integ)

    await db.commit()
    await db.refresh(tx_record)

    # 6. Broadcast Real-time Event via WebSockets
    ws_event = {
        "type": "NEW_TRANSACTION",
        "data": {
            "id": str(tx_record.id),
            "external_id": tx_record.external_id,
            "amount": float(tx_record.amount),
            "currency": tx_record.currency,
            "merchant_name": tx_record.merchant_name,
            "risk_score": float(tx_record.risk_score),
            "risk_label": tx_record.risk_label,
            "decision": tx_record.decision,
            "reasons": fraud_result.reasons,
            "created_at": tx_record.created_at.isoformat()
        }
    }
    try:
        await ws_manager.broadcast(str(org.id), ws_event)
    except Exception as e:
        logger.warning(f"WebSocket broadcast skipped: {e}")

    return {
        "status": "success",
        "order_id": order_name,
        "shopify_order_id": order_id,
        "transaction_id": str(tx_record.id),
        "risk_score": round(fraud_result.risk_score, 4),
        "risk_label": fraud_result.risk_label,
        "decision": fraud_result.decision,
        "confidence": fraud_result.confidence,
        "reasons": fraud_result.reasons,
        "latency_ms": latency_ms,
        "alert_triggered": alert_created
    }


@router.post("/orders/create", status_code=200)
@router.post("/orders/paid", status_code=200)
@router.post("", status_code=200)
async def shopify_order_webhook(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    api_key: Optional[str] = Query(default=None),
    x_api_key: Optional[str] = Header(alias="X-API-Key", default=None),
    x_shopify_shop_domain: Optional[str] = Header(alias="X-Shopify-Shop-Domain", default=None),
    x_shopify_hmac: Optional[str] = Header(alias="X-Shopify-Hmac-Sha256", default=None),
):
    """Receives Shopify order webhooks, runs full ML fraud scoring, and stores real-time telemetry."""
    try:
        payload = await request.json()
        org, _ = await resolve_organization_from_request(db, api_key, x_api_key, x_shopify_shop_domain, payload=payload)
        
        result = await process_shopify_order(
            payload=payload,
            db=db,
            org=org,
            shop_domain=x_shopify_shop_domain
        )
        return result
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        logger.error(f"SHOPIFY_WEBHOOK_ERROR: {e}\n{tb}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "error_message": str(e), "traceback": tb[-1000:]}
        )


@router.post("/test", status_code=200)
async def shopify_test_webhook(
    db: Annotated[AsyncSession, Depends(get_db)],
    api_key: Optional[str] = Query(default=None),
):
    """Generates a synthetic test Shopify order to verify end-to-end webhook integration."""
    org, _ = await resolve_organization_from_request(db, api_key)
    synthetic_payload = {
        "id": f"test_sp_{uuid.uuid4().hex[:6]}",
        "name": f"#TEST-{int(time.time()) % 10000}",
        "total_price": "8999.00",
        "currency": "INR",
        "browser_ip": "103.211.55.12",
        "customer": {
            "id": "cust_test_99",
            "email": "test_merchant@shopify.com",
            "first_name": "Test",
            "last_name": "Customer"
        },
        "billing_address": {
            "country_code": "IN",
            "city": "Bengaluru"
        },
        "payment_gateway_names": ["razorpay"]
    }
    return await process_shopify_order(payload=synthetic_payload, db=db, org=org, shop_domain="savor-store.myshopify.com")
