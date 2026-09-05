import os
import uuid
import logging
from datetime import datetime, timedelta, UTC
from typing import Annotated, List, Optional
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import CurrentUser, get_db
from app.models.dispute import Dispute, DisputeEvidence, DisputeTimeline, DisputeReminder
from app.models.transaction import Transaction
from app.schemas.dispute import (
    DisputeCreate,
    DisputeUpdate,
    EvidenceUpdate,
    DisputeDetailResponse,
    DisputeListItemResponse,
    DisputeStatsResponse,
    EvidenceResponse,
    TimelineResponse
)
from app.services.evidence_gatherer import EvidenceGatherer
from app.services.response_generator import ResponseGenerator

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/disputes", tags=["Disputes"])

# Max file size limit: 10MB
MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".txt", ".csv"}


def _get_urgency_and_days(deadline: datetime) -> tuple[str, int]:
    now = datetime.now(UTC)
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=UTC)
    
    diff = deadline - now
    days = diff.days
    
    if diff.total_seconds() < 0:
        return "expired", max(0, days)
    
    if days < 2:
        return "critical", max(0, days)
    elif days < 5:
        return "warning", days
    else:
        return "normal", days


def _get_recommended_action(score: int) -> str:
    if score >= 70:
        return "Strong case! Review response document and submit to dispute center."
    elif score >= 40:
        return "Moderate case. We recommend adding customer conversation logs (WhatsApp/email) to improve win probability."
    else:
        return "Weak case. Consider accepting this dispute to save fees, or upload valid tracking/delivery proof immediately."


@router.post("", response_model=DisputeDetailResponse)
async def create_dispute(
    body: DisputeCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser,
):
    """Logs a new dispute manually, schedules alerts, gathers initial evidence, and matches ML signals."""
    logger.info(f"Creating dispute {body.dispute_reference} for org {user.org_id}")

    # 1. Look up matching transaction if external_transaction_id is provided
    transaction_id = None
    ml_risk_score = None
    ml_fraud_signals = []

    if body.external_transaction_id:
        tx_stmt = select(Transaction).where(
            Transaction.external_id == body.external_transaction_id,
            Transaction.org_id == user.org_id
        )
        tx_res = await db.execute(tx_stmt)
        matched_tx = tx_res.scalar_one_or_none()
        
        if matched_tx:
            transaction_id = matched_tx.id
            ml_risk_score = matched_tx.risk_score
            ml_fraud_signals = matched_tx.fraud_reasons or []

    # 2. Create Dispute
    new_dispute = Dispute(
        org_id=user.org_id,
        dispute_reference=body.dispute_reference,
        transaction_id=transaction_id,
        external_transaction_id=body.external_transaction_id,
        payment_gateway=body.payment_gateway,
        dispute_type=body.dispute_type,
        dispute_reason=body.dispute_reason,
        dispute_amount=body.dispute_amount,
        currency=body.currency,
        customer_name=body.customer_name,
        customer_email=body.customer_email,
        customer_phone=body.customer_phone,
        order_id=body.order_id,
        order_date=body.order_date,
        dispute_raised_at=body.dispute_raised_at,
        response_deadline=body.response_deadline,
        ml_risk_score=ml_risk_score,
        ml_fraud_signals=ml_fraud_signals,
        status="open"
    )
    
    db.add(new_dispute)
    await db.flush()

    # 3. Create DisputeTimeline entry
    timeline_entry = DisputeTimeline(
        dispute_id=new_dispute.id,
        event_type="created",
        event_description="Dispute logged in Flowshield AI.",
        triggered_by="merchant"
    )
    db.add(timeline_entry)

    # 3b. Feed dispute into continuous learning loop if transaction matched
    if matched_tx:
        try:
            from app.models.transaction_outcome import TransactionOutcome
            from app.workers.feedback_learner import FeedbackLearner
            from app.core.redis import get_redis_client

            outcome = TransactionOutcome(
                transaction_id=matched_tx.id,
                org_id=user.org_id,
                original_decision=matched_tx.decision,
                original_risk_score=matched_tx.risk_score,
                outcome_type="dispute_filed",
                outcome_date=datetime.now(UTC),
                days_after_transaction=(datetime.now(UTC) - matched_tx.created_at).days if matched_tx.created_at else 0,
                outcome_source="merchant_dispute_logged",
                feedback_label=None,
                notes=f"Dispute ref {new_dispute.dispute_reference} logged with gateway {new_dispute.payment_gateway}."
            )
            db.add(outcome)
            await db.flush()

            learner = FeedbackLearner(get_redis_client())
            await learner.process_new_outcome(outcome, db=db, tx=matched_tx)
        except Exception as e:
            logger.warning(f"FeedbackLearner notice on dispute create: {e}")

    # 4. Auto-schedule reminders (7, 3, 1 day before deadline, same day at 9am)
    now = datetime.now(UTC)
    deadline = body.response_deadline
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=UTC)

    reminder_configs = [
        (deadline - timedelta(days=7), 7),
        (deadline - timedelta(days=3), 3),
        (deadline - timedelta(days=1), 1),
        (datetime(deadline.year, deadline.month, deadline.day, 9, 0, 0, tzinfo=UTC), 0),
    ]

    for remind_at, days_before in reminder_configs:
        if remind_at > now:
            reminder = DisputeReminder(
                dispute_id=new_dispute.id,
                remind_at=remind_at,
                reminder_type="both",
                days_before_deadline=days_before,
                sent=False
            )
            db.add(reminder)

    await db.flush()

    # 5. Trigger Evidence Gatherer (inline for manual create, commits changes)
    await EvidenceGatherer.gather_evidence(new_dispute, db)

    # Re-fetch with relationships loaded
    stmt = select(Dispute).options(
        selectinload(Dispute.evidence),
        selectinload(Dispute.timeline)
    ).where(Dispute.id == new_dispute.id)
    res = await db.execute(stmt)
    dispute_refreshed = res.scalar_one()

    urgency, days_remaining = _get_urgency_and_days(dispute_refreshed.response_deadline)
    strength_score = EvidenceGatherer.calculate_evidence_strength(dispute_refreshed, dispute_refreshed.evidence)

    return {
        **dispute_refreshed.__dict__,
        "evidence": dispute_refreshed.evidence,
        "timeline": dispute_refreshed.timeline,
        "days_remaining": days_remaining,
        "urgency": urgency,
        "evidence_strength_score": strength_score,
        "recommended_action": _get_recommended_action(strength_score)
    }


@router.get("", response_model=List[DisputeListItemResponse])
async def list_disputes(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser,
    status: Optional[str] = None,
    payment_gateway: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
):
    """Lists disputes with filters and returns deadline urgency and evidence strength."""
    try:
        stmt = select(Dispute).options(selectinload(Dispute.evidence)).where(Dispute.org_id == user.org_id)

        if status:
            stmt = stmt.where(Dispute.status == status)
        if payment_gateway:
            stmt = stmt.where(Dispute.payment_gateway == payment_gateway)
        if date_from:
            stmt = stmt.where(Dispute.dispute_raised_at >= date_from)
        if date_to:
            stmt = stmt.where(Dispute.dispute_raised_at <= date_to)

        stmt = stmt.order_by(Dispute.response_deadline.asc())
        res = await db.execute(stmt)
        disputes = res.scalars().all()

        out = []
        for d in disputes:
            urgency, _ = _get_urgency_and_days(d.response_deadline)
            strength = EvidenceGatherer.calculate_evidence_strength(d, d.evidence)
            out.append({
                "id": str(d.id),
                "org_id": str(d.org_id),
                "dispute_reference": d.dispute_reference,
                "transaction_id": str(d.transaction_id) if d.transaction_id else None,
                "external_transaction_id": d.external_transaction_id,
                "payment_gateway": d.payment_gateway,
                "dispute_type": d.dispute_type,
                "dispute_reason": d.dispute_reason,
                "dispute_amount": float(d.dispute_amount) if d.dispute_amount else 0.0,
                "currency": d.currency,
                "customer_name": d.customer_name,
                "customer_email": d.customer_email,
                "customer_phone": d.customer_phone,
                "order_id": d.order_id,
                "order_date": d.order_date.isoformat() if d.order_date else None,
                "dispute_raised_at": d.dispute_raised_at.isoformat() if d.dispute_raised_at else None,
                "response_deadline": d.response_deadline.isoformat() if d.response_deadline else None,
                "status": d.status,
                "evidence_strength": d.evidence_strength,
                "win_probability": float(d.win_probability) if d.win_probability else 0.0,
                "recommended_action": d.recommended_action,
                "pdf_package_url": d.pdf_package_url,
                "auto_submitted": d.auto_submitted,
                "created_at": d.created_at.isoformat() if d.created_at else None,
                "updated_at": d.updated_at.isoformat() if d.updated_at else None,
                "urgency": urgency,
                "evidence_strength_score": strength
            })

        return out
    except Exception as e:
        logger.error(f"Failed to list disputes: {e}")
        return []


@router.get("/stats", response_model=DisputeStatsResponse)
async def get_dispute_stats(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser,
):
    """Returns analytics summary for the organization's disputes."""
    stmt = select(Dispute).options(selectinload(Dispute.evidence)).where(Dispute.org_id == user.org_id)
    res = await db.execute(stmt)
    disputes = res.scalars().all()

    total = len(disputes)
    open_count = sum(1 for d in disputes if d.status in ("open", "evidence_gathering"))
    won_count = sum(1 for d in disputes if d.status == "won")
    lost_count = sum(1 for d in disputes if d.status == "lost")
    accepted_count = sum(1 for d in disputes if d.status == "accepted")

    decided = won_count + lost_count
    win_rate = (won_count / decided) if decided > 0 else 0.0

    total_at_risk = sum(d.dispute_amount for d in disputes if d.status in ("open", "evidence_gathering", "response_submitted"))
    total_recovered = sum(d.dispute_amount for d in disputes if d.status == "won")

    # Groupings
    by_gateway = {}
    by_reason = {}
    for d in disputes:
        by_gateway[d.payment_gateway] = by_gateway.get(d.payment_gateway, 0) + 1
        reason = d.dispute_reason or "general"
        by_reason[reason] = by_reason.get(reason, 0) + 1

    # Upcoming deadlines
    upcoming = []
    for d in disputes:
        if d.status in ("open", "evidence_gathering"):
            urgency, days = _get_urgency_and_days(d.response_deadline)
            upcoming.append({
                "dispute_id": str(d.id),
                "days_remaining": days,
                "amount": float(d.dispute_amount),
                "urgency": urgency
            })
    upcoming.sort(key=lambda x: x["days_remaining"])

    return {
        "total_disputes": total,
        "open": open_count,
        "won": won_count,
        "lost": lost_count,
        "accepted": accepted_count,
        "win_rate": round(win_rate, 4),
        "total_amount_at_risk": float(total_at_risk),
        "total_amount_recovered": float(total_recovered),
        "avg_response_time_hours": 18.0,  # mock/placeholder
        "disputes_by_gateway": by_gateway,
        "disputes_by_reason": by_reason,
        "upcoming_deadlines": upcoming[:5]
    }


@router.get("/{dispute_id}", response_model=DisputeDetailResponse)
async def get_dispute(
    dispute_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser,
):
    """Retrieves full dispute detail including timeline logs and recommendations."""
    stmt = select(Dispute).options(
        selectinload(Dispute.evidence),
        selectinload(Dispute.timeline)
    ).where(Dispute.id == dispute_id, Dispute.org_id == user.org_id)
    
    res = await db.execute(stmt)
    dispute = res.scalar_one_or_none()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")

    urgency, days_remaining = _get_urgency_and_days(dispute.response_deadline)
    strength_score = EvidenceGatherer.calculate_evidence_strength(dispute, dispute.evidence)

    return {
        **dispute.__dict__,
        "evidence": dispute.evidence,
        "timeline": dispute.timeline,
        "days_remaining": days_remaining,
        "urgency": urgency,
        "evidence_strength_score": strength_score,
        "recommended_action": _get_recommended_action(strength_score)
    }


@router.patch("/{dispute_id}", response_model=DisputeDetailResponse)
async def update_dispute(
    dispute_id: uuid.UUID,
    body: DisputeUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser,
):
    """Updates dispute metadata, notes, status, and logs event changes to timeline."""
    stmt = select(Dispute).options(
        selectinload(Dispute.evidence),
        selectinload(Dispute.timeline)
    ).where(Dispute.id == dispute_id, Dispute.org_id == user.org_id)

    res = await db.execute(stmt)
    dispute = res.scalar_one_or_none()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")

    if body.status is not None:
        old_status = dispute.status
        dispute.status = body.status
        timeline = DisputeTimeline(
            dispute_id=dispute.id,
            event_type="status_changed",
            event_description=f"Status changed from '{old_status}' to '{body.status}'.",
            triggered_by="merchant"
        )
        db.add(timeline)
        
    if body.outcome is not None:
        dispute.outcome = body.outcome
        dispute.outcome_date = datetime.now(UTC)
        dispute.status = body.outcome  # Sync won/lost status
        
        timeline_outcome = DisputeTimeline(
            dispute_id=dispute.id,
            event_type=body.outcome,
            event_description=f"Dispute outcome marked as '{body.outcome}'.",
            triggered_by="merchant"
        )
        db.add(timeline_outcome)

        # Trigger feedback learning if transaction is linked
        if dispute.transaction_id:
            try:
                from app.models.transaction_outcome import TransactionOutcome
                from app.workers.feedback_learner import FeedbackLearner
                from app.core.redis import get_redis_client

                tx_stmt = select(Transaction).where(Transaction.id == dispute.transaction_id)
                tx_res = await db.execute(tx_stmt)
                tx = tx_res.scalar_one_or_none()

                outcome_type = "chargeback_received" if body.outcome == "lost" else ("fraud_cleared" if body.outcome == "won" else "dispute_resolved")
                feedback_label = 1 if body.outcome == "lost" else (0 if body.outcome == "won" else None)

                outcome = TransactionOutcome(
                    transaction_id=dispute.transaction_id,
                    org_id=user.org_id,
                    original_decision=tx.decision if tx else None,
                    original_risk_score=tx.risk_score if tx else None,
                    outcome_type=outcome_type,
                    outcome_date=datetime.now(UTC),
                    days_after_transaction=(datetime.now(UTC) - tx.created_at).days if tx and tx.created_at else 0,
                    outcome_source="dispute_resolution",
                    feedback_label=feedback_label,
                    notes=f"Dispute {dispute.dispute_reference} marked as {body.outcome}."
                )
                db.add(outcome)
                await db.flush()

                learner = FeedbackLearner(get_redis_client())
                await learner.process_new_outcome(outcome, db=db, tx=tx)
            except Exception as e:
                logger.warning(f"FeedbackLearner notice on dispute outcome update: {e}")

    if body.merchant_notes is not None:
        dispute.merchant_notes = body.merchant_notes

    await db.commit()

    urgency, days_remaining = _get_urgency_and_days(dispute.response_deadline)
    strength_score = EvidenceGatherer.calculate_evidence_strength(dispute, dispute.evidence)

    return {
        **dispute.__dict__,
        "evidence": dispute.evidence,
        "timeline": dispute.timeline,
        "days_remaining": days_remaining,
        "urgency": urgency,
        "evidence_strength_score": strength_score,
        "recommended_action": _get_recommended_action(strength_score)
    }


@router.post("/{dispute_id}/evidence", response_model=EvidenceResponse)
async def upload_evidence(
    dispute_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser,
    evidence_type: str = Form(...),
    content_text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    """Uploads document or text evidence files for dispute case packages."""
    stmt = select(Dispute).where(Dispute.id == dispute_id, Dispute.org_id == user.org_id)
    res = await db.execute(stmt)
    dispute = res.scalar_one_or_none()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")

    file_url = None
    if file:
        # Validate file size
        file.file.seek(0, 2)
        size = file.file.tell()
        file.file.seek(0)
        
        if size > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File size exceeds maximum 10MB limit.")

        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"Unsupported file format {ext}. Allowed: PDF, PNG, JPG, JPEG, TXT, CSV")

        # Save file to static storage
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        upload_dir = os.path.join(base_dir, "static", "evidence_files", str(dispute_id))
        os.makedirs(upload_dir, exist_ok=True)
        
        safe_filename = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(upload_dir, safe_filename)
        
        with open(file_path, "wb") as f:
            f.write(await file.read())
            
        file_url = f"/static/evidence_files/{dispute_id}/{safe_filename}"

    evidence = DisputeEvidence(
        dispute_id=dispute_id,
        evidence_type=evidence_type,
        evidence_source="merchant_uploaded",
        file_url=file_url,
        content_text=content_text,
        is_included_in_response=True
    )
    db.add(evidence)

    # Log timeline event
    timeline = DisputeTimeline(
        dispute_id=dispute_id,
        event_type="evidence_added",
        event_description=f"Evidence document ({evidence_type}) uploaded by merchant.",
        triggered_by="merchant"
    )
    db.add(timeline)

    await db.commit()
    return evidence


@router.patch("/{dispute_id}/evidence/{evidence_id}", response_model=EvidenceResponse)
async def update_evidence(
    dispute_id: uuid.UUID,
    evidence_id: uuid.UUID,
    body: EvidenceUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser,
):
    """Updates evidence metadata (e.g. toggle inclusion in dispute response packages)."""
    stmt = select(Dispute).where(Dispute.id == dispute_id, Dispute.org_id == user.org_id)
    res = await db.execute(stmt)
    dispute = res.scalar_one_or_none()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")

    ev_stmt = select(DisputeEvidence).where(
        DisputeEvidence.id == evidence_id,
        DisputeEvidence.dispute_id == dispute_id
    )
    ev_res = await db.execute(ev_stmt)
    evidence = ev_res.scalar_one_or_none()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence item not found")

    if body.is_included_in_response is not None:
        evidence.is_included_in_response = body.is_included_in_response

    await db.commit()
    return evidence


@router.delete("/{dispute_id}/evidence/{evidence_id}", status_code=204)
async def delete_evidence(
    dispute_id: uuid.UUID,
    evidence_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser,
):
    """Deletes uploaded evidence document and clears stored file blocks."""
    stmt = select(Dispute).where(Dispute.id == dispute_id, Dispute.org_id == user.org_id)
    res = await db.execute(stmt)
    dispute = res.scalar_one_or_none()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")

    ev_stmt = select(DisputeEvidence).where(
        DisputeEvidence.id == evidence_id,
        DisputeEvidence.dispute_id == dispute_id
    )
    ev_res = await db.execute(ev_stmt)
    evidence = ev_res.scalar_one_or_none()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence item not found")

    # Delete physical file if present
    if evidence.file_url:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        relative_path = evidence.file_url.lstrip("/")
        full_path = os.path.join(base_dir, relative_path)
        if os.path.exists(full_path):
            try:
                os.remove(full_path)
            except Exception as e:
                logger.warning(f"Failed to delete file {full_path}: {e}")

    await db.delete(evidence)

    timeline = DisputeTimeline(
        dispute_id=dispute_id,
        event_type="evidence_removed",
        event_description=f"Evidence document ({evidence.evidence_type}) removed by merchant.",
        triggered_by="merchant"
    )
    db.add(timeline)

    await db.commit()


@router.post("/{dispute_id}/generate-response")
async def generate_dispute_pdf(
    dispute_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser,
):
    """Triggers reportlab compilation of the defense case file document."""
    stmt = select(Dispute).where(Dispute.id == dispute_id, Dispute.org_id == user.org_id)
    res = await db.execute(stmt)
    dispute = res.scalar_one_or_none()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")

    pdf_url = await ResponseGenerator.generate_response_pdf(dispute, db)
    return {"status": "success", "pdf_url": pdf_url}


@router.get("/{dispute_id}/response-document")
async def download_dispute_pdf(
    dispute_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser,
):
    """Serves the generated PDF response document."""
    stmt = select(Dispute).where(Dispute.id == dispute_id, Dispute.org_id == user.org_id)
    res = await db.execute(stmt)
    dispute = res.scalar_one_or_none()
    if not dispute or not dispute.response_document_url:
        raise HTTPException(status_code=404, detail="Response document not generated yet")

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    relative_path = dispute.response_document_url.lstrip("/")
    full_path = os.path.join(base_dir, relative_path)
    
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="Response PDF file missing from storage")

    return FileResponse(
        path=full_path,
        media_type="application/pdf",
        filename=f"dispute_defense_{dispute.dispute_reference}.pdf"
    )
