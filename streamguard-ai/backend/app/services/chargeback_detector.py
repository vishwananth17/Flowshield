import json
import logging
from datetime import datetime
from sqlalchemy import select
from app.models.customer_dispute_history import CustomerDisputeHistory

logger = logging.getLogger(__name__)

async def compute_chargeback_features(
    customer_id: str, customer_email: str,
    transaction: dict, redis_client, db_session=None
) -> dict:
    history_key = f"dispute_history:{customer_email}"
    history_raw = await redis_client.get(history_key)
    dispute_rate = 0.0
    prior_dispute_count = 0

    if history_raw:
        try:
            data = json.loads(history_raw)
            dispute_rate = data.get("dispute_rate", 0.0)
            prior_dispute_count = data.get("dispute_count", 0)
        except Exception:
            pass
    elif db_session and customer_email:
        # DB query fallback
        try:
            stmt = select(CustomerDisputeHistory).where(
                CustomerDisputeHistory.customer_email == customer_email
            ).limit(1)
            result = await db_session.execute(stmt)
            row = result.scalar_one_or_none()
            if row:
                dispute_rate = float(row.dispute_rate)
                prior_dispute_count = int(row.dispute_count)
                # Cache in redis
                await redis_client.setex(
                    history_key,
                    86400,
                    json.dumps({
                        "dispute_rate": dispute_rate,
                        "dispute_count": prior_dispute_count
                    })
                )
        except Exception as e:
            logger.error(f"Error checking dispute history from DB: {e}")

    # Feature 2: Is product category dispute-prone?
    DISPUTE_PRONE_CATEGORIES = {
        "digital_goods", "software", "gift_cards",
        "travel", "event_tickets", "subscriptions"
    }
    category = transaction.get("product_category") or transaction.get("metadata", {}).get("product_category", "")
    dispute_prone_product = category in DISPUTE_PRONE_CATEGORIES

    # Feature 3: Is email disposable/free domain?
    DISPOSABLE_DOMAINS = {
        "mailinator.com", "guerrillamail.com", "temp-mail.org",
        "throwaway.email", "yopmail.com", "sharklasers.com",
        "10minutemail.com", "trashmail.com"
    }
    email_domain = ""
    if customer_email and "@" in customer_email:
        email_domain = customer_email.split("@")[-1].lower()
    is_disposable_email = email_domain in DISPOSABLE_DOMAINS

    # Feature 4: Order timing (near holiday/weekend)
    today = datetime.now()
    days_to_weekend = (5 - today.weekday()) % 7
    is_pre_holiday = days_to_weekend <= 1

    # Feature 5: Order amount is unusually round number
    amount = float(transaction.get("amount", 0.0))
    is_round_amount = amount % 1000 == 0 and amount >= 5000

    return {
        "prior_dispute_count": prior_dispute_count,
        "customer_dispute_rate": round(dispute_rate, 4),
        "dispute_prone_product": int(dispute_prone_product),
        "is_disposable_email": int(is_disposable_email),
        "is_pre_holiday_order": int(is_pre_holiday),
        "is_round_amount": int(is_round_amount),
        "fraud_type_hint": "chargeback_fraud" if (prior_dispute_count >= 2 or dispute_rate > 0.15) else None
    }
