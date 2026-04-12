import uuid
from datetime import datetime, timedelta
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, Body
from sqlalchemy import select, desc, update, func
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.dependencies import get_db, CurrentUser
from app.models.alert import Alert
from app.models.alert_activity import AlertActivity
from app.models.transaction import Transaction
from app.services.alert_service import AlertService

router = APIRouter(prefix="/alerts", tags=["Alerts"])

# --- Schemas ---

class TransactionSnapshot(BaseModel):
    id: uuid.UUID
    amount: float
    currency: str
    merchant_name: str
    merchant_category: str
    card_last_four: str
    card_type: str
    customer_id: str
    customer_ip: str | None
    customer_country: str | None
    channel: str
    risk_score: float
    risk_label: str
    fraud_reasons: List[str]
    created_at: datetime

    class Config:
        from_attributes = True

class AlertActivityItem(BaseModel):
    id: uuid.UUID
    from_status: Optional[str]
    to_status: str
    changed_by_name: Optional[str] = "System"
    note: Optional[str]
    created_at: datetime

class AlertListItem(BaseModel):
    id: uuid.UUID
    transaction_id: Optional[uuid.UUID]
    severity: str
    status: str
    title: str
    description: str
    created_at: datetime
    amount: float
    currency: str
    merchant_name: str
    risk_score: float

class AlertPaginatedResponse(BaseModel):
    alerts: List[AlertListItem]
    total: int
    page: int
    per_page: int
    unread_count: int

class AlertDetailResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    transaction_id: Optional[uuid.UUID]
    severity: str
    status: str
    title: str
    description: str
    assigned_to: Optional[uuid.UUID]
    resolved_by: Optional[uuid.UUID]
    resolved_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    transaction: Optional[TransactionSnapshot]
    activities: List[AlertActivityItem]

class AlertUpdate(BaseModel):
    status: str
    note: Optional[str] = None

class BulkUpdate(BaseModel):
    alert_ids: List[uuid.UUID]
    action: str

# --- Endpoints ---

@router.get("", response_model=AlertPaginatedResponse)
async def list_alerts(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser,
    status: str = Query("open"),
    severity: str = Query("all"),
    page: int = Query(1, ge=1),
    per_page: int = Query(25, ge=1, le=100)
):
    """
    Returns paginated list of alerts for the authenticated organization.
    Includes flattened transaction data for the table list view.
    """
    # Use Service for core logic
    data = await AlertService.get_alerts_paginated(
        db, user.org_id, status=status, severity=severity, page=page, per_page=per_page
    )
    
    # Flatten alerts with transaction data for the list view
    flat_alerts = []
    for alert in data["alerts"]:
        # Fetch transaction details
        tx_amount = 0.0
        tx_currency = "USD"
        tx_merchant = "Unknown"
        tx_score = 0.0
        
        if alert.transaction_id:
            tx = await db.get(Transaction, alert.transaction_id)
            if tx:
                tx_amount = float(tx.amount)
                tx_currency = tx.currency
                tx_merchant = tx.merchant_name or "Unknown"
                tx_score = float(tx.risk_score or 0.0)

        flat_alerts.append(
            AlertListItem(
                id=alert.id,
                transaction_id=alert.transaction_id,
                severity=alert.severity,
                status=alert.status,
                title=alert.title or "Security Alert",
                description=alert.description or "",
                created_at=alert.created_at,
                amount=tx_amount,
                currency=tx_currency,
                merchant_name=tx_merchant,
                risk_score=tx_score
            )
        )
    
    return {
        "alerts": flat_alerts,
        "total": data["total"],
        "page": page,
        "per_page": per_page,
        "unread_count": data["unread_count"]
    }

@router.get("/{alert_id}", response_model=AlertDetailResponse)
async def get_alert(
    alert_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser
):
    """Fetches full alert details including transaction snapshot and audit timeline."""
    query = select(Alert).where(Alert.id == alert_id, Alert.org_id == user.org_id)
    result = await db.execute(query)
    alert = result.scalar_one_or_none()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    # Fetch transaction
    tx_snapshot = None
    if alert.transaction_id:
        tx = await db.get(Transaction, alert.transaction_id)
        if tx:
            tx_snapshot = TransactionSnapshot.model_validate(tx)
            
    # Fetch activities (audit log)
    act_query = (
        select(AlertActivity)
        .where(AlertActivity.alert_id == alert_id)
        .order_by(AlertActivity.created_at.asc())
    )
    act_result = await db.execute(act_query)
    activities_rows = act_result.scalars().all()
    
    activities = []
    for act in activities_rows:
        activities.append(
            AlertActivityItem(
                id=act.id,
                from_status=act.from_status,
                to_status=act.to_status,
                note=act.note,
                created_at=act.created_at
            )
        )
        
    return {
        **alert.__dict__,
        "transaction": tx_snapshot,
        "activities": activities
    }

@router.patch("/{alert_id}")
async def update_alert(
    alert_id: uuid.UUID,
    payload: AlertUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser
):
    """Updates alert status and records an audit log entry."""
    updated = await AlertService.update_alert_status(
        db, alert_id, user.org_id, payload.status, user.id, payload.note
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"status": "success", "alert_id": alert_id}

@router.post("/bulk")
async def bulk_update_alerts(
    payload: BulkUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser
):
    """Performs batch status updates for multiple alerts in a single organizational context."""
    count = 0
    for aid in payload.alert_ids:
        updated = await AlertService.update_alert_status(
            db, aid, user.org_id, payload.action, user.id
        )
        if updated:
            count += 1
    return {"updated": count, "failed": len(payload.alert_ids) - count}

@router.get("/stats")
async def get_alert_stats(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser
):
    """Aggregates organizational health metrics for the alerts dashboard."""
    return await AlertService.get_alert_stats(db, user.org_id)
