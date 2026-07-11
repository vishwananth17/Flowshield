import hmac
import hashlib
import logging
import uuid
import asyncio
from datetime import datetime, UTC, timezone
from typing import Annotated

from fastapi import APIRouter, Header, Request, HTTPException, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.core.config import get_settings
from app.models.dispute import Dispute, DisputeTimeline, DisputeReminder
from app.models.transaction import Transaction
from app.models.organization import Organization
from app.services.evidence_gatherer import EvidenceGatherer

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhooks/razorpay", tags=["Dispute Webhooks"])

# Background tasks set to prevent garbage collection
_bg_tasks = set()


def verify_razorpay_signature(body_bytes: bytes, signature: str, secret: str) -> bool:
    """Verifies HMAC-SHA256 signature from Razorpay."""
    if not signature or not secret:
        return False
    expected = hmac.new(
        secret.encode("utf-8"),
        body_bytes,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


async def _async_evidence_gathering(dispute_id: uuid.UUID, db_session_maker):
    """Background runner to perform gathering without blocking webhook response."""
    # Create a new session for background execution
    async with db_session_maker() as db:
        try:
            stmt = select(Dispute).where(Dispute.id == dispute_id)
            res = await db.execute(stmt)
            dispute = res.scalar_one_or_none()
            if dispute:
                await EvidenceGatherer.gather_evidence(dispute, db)
        except Exception as e:
            logger.error(f"Async evidence gathering failed: {e}", exc_info=True)


@router.post("/disputes", status_code=200)
async def razorpay_dispute_webhook(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    x_razorpay_signature: Annotated[str | None, Header(alias="X-Razorpay-Signature")] = None,
):
    """Receives and processes Razorpay dispute webhook events with HMAC verification."""
    body_bytes = await request.body()
    settings = get_settings()
    
    # 1. Signature Verification
    webhook_secret = settings.razorpay_webhook_secret or "your_webhook_secret_here"
    
    # Allow bypass during development if signature header is missing and environment is not production
    is_dev = settings.environment != "production"
    if not is_dev or x_razorpay_signature:
        if not x_razorpay_signature or not verify_razorpay_signature(body_bytes, x_razorpay_signature, webhook_secret):
            logger.warning("SSRF/Security Alert: Invalid Razorpay webhook signature received.")
            raise HTTPException(status_code=400, detail="Invalid webhook signature")

    # 2. Parse Payload
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    event = payload.get("event")
    logger.info(f"Received Razorpay webhook event: {event}")
    
    event_data = payload.get("payload", {})
    dispute_payload = event_data.get("dispute", {}).get("entity", {})
    payment_payload = event_data.get("payment", {}).get("entity", {})
    
    if not dispute_payload:
        return {"status": "ignored", "message": "No dispute entity details found"}

    dispute_ref = dispute_payload.get("id")
    payment_id = dispute_payload.get("payment_id") or payment_payload.get("id")
    
    if not dispute_ref:
        return {"status": "ignored", "message": "Missing dispute reference ID"}

    if event == "payment.dispute.created":
        # Check if already processed
        stmt_exist = select(Dispute).where(Dispute.dispute_reference == dispute_ref)
        res_exist = await db.execute(stmt_exist)
        if res_exist.scalar_one_or_none():
            return {"status": "duplicate", "message": "Dispute already exists"}

        # 3. Resolve Organization org_id
        # Method A: Try to match with an existing Transaction we analyzed
        org_id = None
        transaction_id = None
        ml_risk_score = None
        ml_fraud_signals = []

        if payment_id:
            tx_stmt = select(Transaction).where(Transaction.external_id == payment_id)
            tx_res = await db.execute(tx_stmt)
            matched_tx = tx_res.scalar_one_or_none()
            if matched_tx:
                org_id = matched_tx.org_id
                transaction_id = matched_tx.id
                ml_risk_score = matched_tx.risk_score
                ml_fraud_signals = matched_tx.fraud_reasons or []

        # Method B: Fallback to first available organization if no transaction matched (so webhook works in demo)
        if not org_id:
            org_stmt = select(Organization).limit(1)
            org_res = await db.execute(org_stmt)
            fallback_org = org_res.scalar_one_or_none()
            if fallback_org:
                org_id = fallback_org.id
            else:
                # Create a temporary org if DB is completely empty (very rare edge case)
                temp_org = Organization(name="Demo Shop Org", plan="starter")
                db.add(temp_org)
                await db.flush()
                org_id = temp_org.id

        # Parse amounts & deadlines
        raw_amt = dispute_payload.get("amount", 0)  # Razorpay amount is in paise
        dispute_amt = Decimal(str(raw_amt)) / 100
        
        # Convert respond_by unix timestamp
        respond_by_ts = dispute_payload.get("respond_by")
        if respond_by_ts:
            response_deadline = datetime.fromtimestamp(respond_by_ts, tz=timezone.utc)
        else:
            response_deadline = datetime.now(UTC) + timedelta(days=10) # Razorpay standard is 10 days
            
        dispute_created_ts = dispute_payload.get("created_at")
        if dispute_created_ts:
            dispute_raised_at = datetime.fromtimestamp(dispute_created_ts, tz=timezone.utc)
        else:
            dispute_raised_at = datetime.now(UTC)

        customer_email = payment_payload.get("email") or dispute_payload.get("email")
        customer_phone = payment_payload.get("contact") or dispute_payload.get("contact")
        
        # Create Dispute
        new_dispute = Dispute(
            org_id=org_id,
            dispute_reference=dispute_ref,
            transaction_id=transaction_id,
            external_transaction_id=payment_id,
            payment_gateway="razorpay",
            dispute_type="chargeback" if dispute_payload.get("amount_deducted") else "dispute",
            dispute_reason=dispute_payload.get("reason_code"),
            dispute_amount=dispute_amt,
            currency=dispute_payload.get("currency", "INR"),
            customer_name=payment_payload.get("card", {}).get("name") or "Razorpay Customer",
            customer_email=customer_email,
            customer_phone=customer_phone,
            order_id=payment_payload.get("order_id"),
            order_date=dispute_raised_at - timedelta(days=1), # estimation
            dispute_raised_at=dispute_raised_at,
            response_deadline=response_deadline,
            ml_risk_score=ml_risk_score,
            ml_fraud_signals=ml_fraud_signals,
            status="open"
        )
        db.add(new_dispute)
        await db.flush()

        # Add Timeline Log
        db.add(DisputeTimeline(
            dispute_id=new_dispute.id,
            event_type="created",
            event_description="Dispute created automatically via Razorpay webhook alert.",
            triggered_by="auto"
        ))

        # Schedule reminders
        now = datetime.now(UTC)
        reminder_configs = [
            (response_deadline - timedelta(days=7), 7),
            (response_deadline - timedelta(days=3), 3),
            (response_deadline - timedelta(days=1), 1),
            (datetime(response_deadline.year, response_deadline.month, response_deadline.day, 9, 0, 0, tzinfo=timezone.utc), 0),
        ]
        
        for remind_at, days_before in reminder_configs:
            if remind_at > now:
                db.add(DisputeReminder(
                    dispute_id=new_dispute.id,
                    remind_at=remind_at,
                    reminder_type="both",
                    days_before_deadline=days_before,
                    sent=False
                ))

        await db.commit()

        # 4. Asynchronously trigger automated evidence gathering
        # Create sessionmaker dynamically to pass to background task
        from sqlalchemy.orm import sessionmaker
        engine = db.bind
        async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        
        task = asyncio.create_task(_async_evidence_gathering(new_dispute.id, async_session_maker))
        _bg_tasks.add(task)
        task.add_done_callback(_bg_tasks.discard)

        return {"status": "success", "message": "Dispute auto-created successfully", "dispute_id": str(new_dispute.id)}

    elif event in ("payment.dispute.won", "payment.dispute.lost", "payment.dispute.closed"):
        stmt = select(Dispute).where(Dispute.dispute_reference == dispute_ref)
        res = await db.execute(stmt)
        dispute = res.scalar_one_or_none()
        
        if not dispute:
            return {"status": "ignored", "message": "Matching dispute not found in database"}

        outcome = "won" if event == "payment.dispute.won" else ("lost" if event == "payment.dispute.lost" else "accepted")
        dispute.outcome = outcome
        dispute.outcome_date = datetime.now(UTC)
        dispute.status = outcome

        db.add(DisputeTimeline(
            dispute_id=dispute.id,
            event_type=outcome,
            event_description=f"Dispute resolved and marked as '{outcome}' via Razorpay webhook.",
            triggered_by="auto"
        ))
        
        await db.commit()
        return {"status": "success", "message": f"Dispute status updated to {outcome}"}

    return {"status": "ignored", "message": f"Event type {event} ignored"}
