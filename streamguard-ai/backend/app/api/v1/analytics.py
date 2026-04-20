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
    user: CurrentUser,
    range: str = Query("24h", pattern="^(1h|24h|30d|60d|1y|all|custom)$"),
    start: datetime | None = None,
    end: datetime | None = None
):
    check_analytics_access(user.plan)
    
    # ── Temporal Logic Synthesis ──────────────────────────────────────────
    now = datetime.utcnow()
    filter_date = None
    
    if range == "1h":
        filter_date = now - timedelta(hours=1)
    elif range == "24h":
        filter_date = now - timedelta(days=1)
    elif range == "30d":
        filter_date = now - timedelta(days=30)
    elif range == "60d":
        filter_date = now - timedelta(days=60)
    elif range == "1y":
        filter_date = now - timedelta(days=365)
    elif range == "custom" and start:
        filter_date = start
        # If custom, we use the 'start' as the lower bound
    
    def _apply_temporal(query):
        q = query.where(Transaction.org_id == user.org_id)
        if filter_date and range != "all":
            q = q.where(Transaction.created_at >= filter_date)
        if range == "custom" and end:
            q = q.where(Transaction.created_at <= end)
        return q

    # 1. Total analyzed
    total_result = await db.execute(_apply_temporal(select(func.count(Transaction.id))))
    total_analyzed = total_result.scalar() or 0
    
    # 2. Fraud blocked
    fraud_result = await db.execute(
        _apply_temporal(select(func.count(Transaction.id)).where(Transaction.decision == "block"))
    )
    fraud_blocked = fraud_result.scalar() or 0
    
    # 3. Safe transactions
    safe_result = await db.execute(
        _apply_temporal(select(func.count(Transaction.id)).where(Transaction.decision == "allow"))
    )
    safe_transactions = safe_result.scalar() or 0
    
    # 4. Avg latency
    latency_result = await db.execute(
        _apply_temporal(select(func.avg(Transaction.detection_latency_ms)))
    )
    avg_latency = float(latency_result.scalar() or 0)
    
    # 5. Amount Protected (sum of BLOCKED amounts)
    volume_result = await db.execute(
        _apply_temporal(select(func.sum(Transaction.amount)).where(Transaction.decision == "block"))
    )
    protected_volume = float(volume_result.scalar() or 0)

    # 6. Risk by country
    country_result = await db.execute(
        _apply_temporal(
            select(Transaction.customer_country, func.count(Transaction.id))
            .where(Transaction.decision == "block")
            .group_by(Transaction.customer_country)
        )
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
    "/export",
    summary="Institutional Data Extraction",
    description="Export organizational transaction data in CSV format for offline forensic analysis and accounting."
)
async def export_analytics(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser,
    range: str = Query("24h", pattern="^(1h|24h|30d|60d|1y|all|custom)$"),
):
    check_analytics_access(user.plan)
    
    now = datetime.utcnow()
    filter_date = None
    if range == "1h": filter_date = now - timedelta(hours=1)
    elif range == "24h": filter_date = now - timedelta(days=1)
    elif range == "30d": filter_date = now - timedelta(days=30)
    elif range == "60d": filter_date = now - timedelta(days=60)
    elif range == "1y": filter_date = now - timedelta(days=365)
    
    query = select(Transaction).where(Transaction.org_id == user.org_id)
    if filter_date and range != "all":
        query = query.where(Transaction.created_at >= filter_date)
    
    result = await db.execute(query.order_by(desc(Transaction.created_at)).limit(5000))
    transactions = result.scalars().all()
    
    import csv
    import io
    from fastapi.responses import StreamingResponse
    
    def generate_csv():
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "ID", "External ID", "Timestamp", "Amount", "Currency", 
            "Merchant", "Country", "Risk Score", "Label", "Decision"
        ])
        
        for tx in transactions:
            writer.writerow([
                str(tx.id), tx.external_id, tx.created_at.isoformat(), 
                tx.amount, tx.currency, tx.merchant_name, tx.customer_country,
                tx.risk_score, tx.risk_label, tx.decision
            ])
            yield output.getvalue()
            output.seek(0)
            output.truncate(0)
            
    filename = f"flowshield_export_{range}_{datetime.now().strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        generate_csv(), 
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
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
