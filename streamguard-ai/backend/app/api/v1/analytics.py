from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated
import uuid
from datetime import datetime, timedelta

from app.core.dependencies import get_db, CurrentUser
from app.models.transaction import Transaction
from app.models.organization import Organization
from pydantic import BaseModel
from app.core.plan_limits import check_feature_access

router = APIRouter(prefix="/analytics", tags=["Analytics"])

def check_analytics_access(plan: str):
    if not check_feature_access(plan, "analytics"):
        raise HTTPException(
            status_code=403,
            detail={
                "error": {
                    "code": "PLAN_LIMIT",
                    "message": "Analytics is available on Growth plan and above.",
                    "upgrade_url": "/billing"
                }
            }
        )

class AnalyticsStats(BaseModel):
    total_analyzed: int
    fraud_blocked: int
    safe_transactions: int
    avg_latency_ms: float
    total_volume: float
    risk_by_country: dict[str, int]

@router.get(
    "/stats", 
    response_model=AnalyticsStats,
    summary="Core Performance Analytics",
    description="Retrieve high-level organizational heuristics including total inference volume, blocked fraud capital, and system-wide latency averages."
)
async def get_stats(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser
):
    check_analytics_access(user.plan)
    
    # Total analyzed
    total_result = await db.execute(
        select(func.count(Transaction.id))
        .where(Transaction.org_id == user.org_id)
    )
    total_analyzed = total_result.scalar() or 0
    
    # Fraud blocked
    fraud_result = await db.execute(
        select(func.count(Transaction.id))
        .where(Transaction.org_id == user.org_id)
        .where(Transaction.decision == "block")
    )
    fraud_blocked = fraud_result.scalar() or 0
    
    # Safe transactions
    safe_result = await db.execute(
        select(func.count(Transaction.id))
        .where(Transaction.org_id == user.org_id)
        .where(Transaction.decision == "allow")
    )
    safe_transactions = safe_result.scalar() or 0
    
    # Avg latency
    latency_result = await db.execute(
        select(func.avg(Transaction.detection_latency_ms))
        .where(Transaction.org_id == user.org_id)
    )
    avg_latency = float(latency_result.scalar() or 0)
    
    # Amount Protected (sum of BLOCKED amounts)
    volume_result = await db.execute(
        select(func.sum(Transaction.amount))
        .where(Transaction.org_id == user.org_id)
        .where(Transaction.decision == "block")
    )
    protected_volume = float(volume_result.scalar() or 0)

    # Risk by country
    country_result = await db.execute(
        select(Transaction.customer_country, func.count(Transaction.id))
        .where(Transaction.org_id == user.org_id)
        .where(Transaction.decision == "block")
        .group_by(Transaction.customer_country)
    )
    risk_by_country = {row[0]: row[1] for row in country_result}
    
    return AnalyticsStats(
        total_analyzed=total_analyzed,
        fraud_blocked=fraud_blocked,
        safe_transactions=safe_transactions,
        avg_latency_ms=avg_latency,
        total_volume=protected_volume,
        risk_by_country=risk_by_country
    )


@router.get(
    "/time-series",
    summary="Temporal Risk Trends",
    description="Retrieve a historical time-series of transaction volume for trend analysis and growth forecasting."
)
async def get_time_series(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser,
    days: int = Query(7, ge=1, le=90)
):
    check_analytics_access(user.organization.plan)
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Group by day
    result = await db.execute(
        select(
            func.date_trunc('day', Transaction.created_at).label('day'),
            func.count(Transaction.id).label('count')
        )
        .where(Transaction.org_id == user.org_id)
        .where(Transaction.created_at >= start_date)
        .group_by('day')
        .order_by('day')
    )
    
    data = [{"date": row.day.isoformat(), "count": row.count} for row in result]
    return data
