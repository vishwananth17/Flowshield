import json
import logging
from sqlalchemy import select
from app.models.customer_refund_history import CustomerRefundHistory

logger = logging.getLogger(__name__)

async def compute_refund_features(
    customer_id: str, customer_email: str,
    device_hash: str, org_id: str,
    transaction: dict, redis_client, db_session=None
) -> dict:
    # 1. Customer-level refund rate
    refund_key = f"refund_history:{org_id}:{customer_email}"
    refund_data = None
    try:
        if redis_client:
            refund_data = await redis_client.get(refund_key)
    except Exception:
        refund_data = None
    customer_refund_rate = 0.0
    customer_refund_count = 0
    if refund_data:
        try:
            data = json.loads(refund_data)
            customer_refund_rate = data.get("refund_rate", 0.0)
            customer_refund_count = data.get("total_refunds", 0)
        except Exception:
            pass
    elif db_session and customer_email:
        try:
            stmt = select(CustomerRefundHistory).where(
                CustomerRefundHistory.org_id == org_id,
                CustomerRefundHistory.customer_email == customer_email
            ).limit(1)
            res = await db_session.execute(stmt)
            row = res.scalar_one_or_none()
            if row:
                customer_refund_rate = float(row.refund_rate)
                customer_refund_count = int(row.total_refunds)
                # Cache in redis
                await redis_client.setex(
                    refund_key,
                    86400,
                    json.dumps({
                        "refund_rate": customer_refund_rate,
                        "total_refunds": customer_refund_count
                    })
                )
        except Exception as e:
            logger.error(f"Error checking refund history from DB: {e}")

    device_refund_count = 0
    try:
        if device_hash and redis_client:
            device_refund_key = f"device_refunds:{org_id}:{device_hash}"
            device_refund_val = await redis_client.get(device_refund_key)
            device_refund_count = int(device_refund_val) if device_refund_val else 0
    except Exception:
        device_refund_count = 0

    # 3. High refund category
    HIGH_REFUND_CATEGORIES = {
        "clothing", "electronics", "shoes", "accessories", "apparel"
    }
    category = transaction.get("product_category") or transaction.get("metadata", {}).get("product_category", "")
    high_refund_category = category in HIGH_REFUND_CATEGORIES

    return {
        "customer_refund_rate": round(customer_refund_rate, 4),
        "customer_refund_count": customer_refund_count,
        "device_refund_count": device_refund_count,
        "high_refund_category": int(high_refund_category),
        "fraud_type_hint": "refund_fraud" if (customer_refund_rate > 0.30 or device_refund_count >= 3) else None
    }
