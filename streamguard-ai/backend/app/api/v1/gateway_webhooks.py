"""
FlowShield AI - Indian Payment Gateway Webhook Receivers
Standardizes incoming webhooks from Razorpay, Cashfree, and PhonePe PG
directly into FlowShield's native risk detection engine.
"""

import json
import base64
import hashlib
import hmac
import logging
from typing import Any, Dict
from decimal import Decimal

from fastapi import APIRouter, Request, Header, HTTPException, status, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.transaction import (
    TransactionAnalyzeRequest,
    MerchantIn,
    CustomerIn,
    UpiIn,
    DeliveryIn
)
from app.services.fraud_detection_service import FraudDetectionService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks/gateways", tags=["Gateway Webhooks"])
fraud_service = FraudDetectionService()


# ─────────────────────────────────────────────────────────────
# 1. PARSER UTILITIES (GATEWAY NORMALIZATION)
# ─────────────────────────────────────────────────────────────
def parse_razorpay_payload(payload: dict, client_ip: str = "127.0.0.1") -> TransactionAnalyzeRequest | None:
    payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
    if not payment_entity:
        return None

    payment_id = payment_entity.get("id", "pay_unknown")
    amount_inr = Decimal(str(payment_entity.get("amount", 0))) / Decimal("100.0")  # Razorpay sends paise
    currency = payment_entity.get("currency", "INR")
    method = payment_entity.get("method", "upi")
    email = payment_entity.get("email") or "guest@merchant.in"
    contact = payment_entity.get("contact") or ""
    vpa = payment_entity.get("vpa")
    acquirer_data = payment_entity.get("acquirer_data", {})
    rrn = acquirer_data.get("rrn") or acquirer_data.get("upi_transaction_id")

    return TransactionAnalyzeRequest(
        transaction_id=payment_id,
        amount=amount_inr,
        currency=currency,
        merchant=MerchantIn(
            id=payment_entity.get("merchant_id", "m_razorpay_default"),
            name="Razorpay Store",
            category="5411",
            country="IN"
        ),
        customer=CustomerIn(
            id=f"cust_{contact[-10:] if len(contact) >= 10 else payment_id[-8:]}",
            email=email,
            ip=payment_entity.get("ip") or client_ip,
            country="IN",
            city="Domestic"
        ),
        payment_method=method,
        gateway="razorpay",
        upi=UpiIn(
            vpa=vpa,
            app="gpay" if vpa and "okhdfc" in vpa else ("phonepe" if vpa and "ybl" in vpa else "upi"),
            flow_type="intent" if not payment_entity.get("description", "").startswith("collect") else "collect",
            bank_ref_no=rrn
        ) if method == "upi" else None,
        metadata={"raw_razorpay_event": payload.get("event", "")}
    )


def parse_cashfree_payload(payload: dict, client_ip: str = "127.0.0.1") -> TransactionAnalyzeRequest | None:
    data = payload.get("data", {})
    payment = data.get("payment", {})
    order = data.get("order", {})
    customer = data.get("customer_details", {})

    cf_payment_id = str(payment.get("cf_payment_id") or order.get("order_id", "cf_unknown"))
    amount_inr = Decimal(str(payment.get("payment_amount") or order.get("order_amount", 0)))
    currency = payment.get("payment_currency") or order.get("order_currency", "INR")
    payment_group = payment.get("payment_group", "upi").lower()

    upi_details = payment.get("payment_method", {}).get("upi", {})
    vpa = upi_details.get("upi_id")
    flow_type = upi_details.get("channel", "intent")

    return TransactionAnalyzeRequest(
        transaction_id=cf_payment_id,
        amount=amount_inr,
        currency=currency,
        merchant=MerchantIn(
            id="m_cashfree_default",
            name="Cashfree Merchant",
            category="5411",
            country="IN"
        ),
        customer=CustomerIn(
            id=customer.get("customer_id") or f"cust_{cf_payment_id[-8:]}",
            email=customer.get("customer_email"),
            ip=client_ip,
            country="IN"
        ),
        payment_method=payment_group,
        gateway="cashfree",
        upi=UpiIn(
            vpa=vpa,
            app="phonepe" if vpa and "ybl" in vpa else ("gpay" if vpa and "okhdfc" in vpa else "upi"),
            flow_type=flow_type
        ) if payment_group == "upi" else None,
        metadata={"raw_cashfree_type": payload.get("type", "")}
    )


def parse_phonepe_payload(payload: dict, client_ip: str = "127.0.0.1") -> TransactionAnalyzeRequest | None:
    encoded_response = payload.get("response", "")
    data = {}
    if encoded_response:
        try:
            decoded_json = base64.b64decode(encoded_response).decode("utf-8")
            data = json.loads(decoded_json).get("data", {})
        except Exception as e:
            logger.warning(f"Could not decode PhonePe base64 response: {e}")

    txn_id = data.get("merchantTransactionId") or payload.get("transactionId", "ph_unknown")
    amount_inr = Decimal(str(data.get("amount", 0))) / Decimal("100.0") if data.get("amount") else Decimal("0")
    instrument = data.get("paymentInstrument", {})
    instrument_type = instrument.get("type", "UPI_INTENT")
    vpa = instrument.get("vpa")

    return TransactionAnalyzeRequest(
        transaction_id=txn_id,
        amount=amount_inr,
        currency="INR",
        merchant=MerchantIn(
            id=data.get("merchantId", "m_phonepe_default"),
            name="PhonePe Merchant Store",
            category="5411",
            country="IN"
        ),
        customer=CustomerIn(
            id=f"cust_{txn_id[-8:]}",
            country="IN",
            ip=client_ip
        ),
        payment_method="upi",
        gateway="phonepe",
        upi=UpiIn(
            vpa=vpa,
            app="phonepe",
            flow_type="collect" if "COLLECT" in instrument_type else "intent",
            bank_ref_no=instrument.get("bankTransactionId")
        )
    )


# ─────────────────────────────────────────────────────────────
# 2. FASTAPI WEBHOOK ENDPOINTS
# ─────────────────────────────────────────────────────────────
@router.post("/razorpay", summary="Ingest Razorpay webhook (payment.authorized, order.paid)")
async def ingest_razorpay_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_razorpay_signature: str | None = Header(None, alias="X-Razorpay-Signature")
):
    try:
        body_bytes = await request.body()
        payload = json.loads(body_bytes.decode("utf-8"))
    except Exception as e:
        logger.error(f"Invalid Razorpay webhook payload: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Malformed JSON")

    client_ip = request.client.host if request.client else "127.0.0.1"
    analyze_req = parse_razorpay_payload(payload, client_ip=client_ip)
    if not analyze_req:
        return {"status": "acknowledged", "event": payload.get("event", "")}

    result = await fraud_service.analyze(analyze_req, plan="growth", db=db)
    
    return {
        "status": "evaluated",
        "gateway": "razorpay",
        "payment_id": analyze_req.transaction_id,
        "risk_score": result.risk_score,
        "risk_label": result.risk_label,
        "decision": result.decision,
        "reasons": result.reasons,
        "rto_risk_score": result.rto_risk_score,
        "cod_recommendation": result.cod_recommendation
    }


@router.post("/cashfree", summary="Ingest Cashfree webhook (PAYMENT_SUCCESS_WEBHOOK)")
async def ingest_cashfree_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    try:
        body_bytes = await request.body()
        payload = json.loads(body_bytes.decode("utf-8"))
    except Exception as e:
        logger.error(f"Invalid Cashfree webhook payload: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Malformed JSON")

    client_ip = request.client.host if request.client else "127.0.0.1"
    analyze_req = parse_cashfree_payload(payload, client_ip=client_ip)
    if not analyze_req:
        return {"status": "acknowledged"}

    result = await fraud_service.analyze(analyze_req, plan="growth", db=db)

    return {
        "status": "evaluated",
        "gateway": "cashfree",
        "payment_id": analyze_req.transaction_id,
        "risk_score": result.risk_score,
        "decision": result.decision,
        "reasons": result.reasons,
        "rto_risk_score": result.rto_risk_score,
        "cod_recommendation": result.cod_recommendation
    }


@router.post("/phonepe", summary="Ingest PhonePe Payment Gateway S2S callback")
async def ingest_phonepe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_verify: str | None = Header(None, alias="X-VERIFY")
):
    try:
        body_bytes = await request.body()
        payload = json.loads(body_bytes.decode("utf-8"))
    except Exception as e:
        logger.error(f"Invalid PhonePe webhook payload: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Malformed JSON")

    client_ip = request.client.host if request.client else "127.0.0.1"
    analyze_req = parse_phonepe_payload(payload, client_ip=client_ip)
    if not analyze_req:
        return {"status": "acknowledged"}

    result = await fraud_service.analyze(analyze_req, plan="growth", db=db)

    return {
        "status": "evaluated",
        "gateway": "phonepe",
        "transaction_id": analyze_req.transaction_id,
        "risk_score": result.risk_score,
        "decision": result.decision,
        "reasons": result.reasons,
        "rto_risk_score": result.rto_risk_score,
        "cod_recommendation": result.cod_recommendation
    }
