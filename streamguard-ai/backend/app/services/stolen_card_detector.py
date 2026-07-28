import logging
from datetime import datetime, UTC

logger = logging.getLogger(__name__)

async def compute_stolen_card_features(
    customer_id: str, org_id: str,
    transaction: dict, redis_client
) -> dict:
    device_hash = transaction.get("device_fingerprint_hash")
    is_new_device = True
    try:
        if device_hash:
            device_key = f"device:{org_id}:{customer_id}:{device_hash}"
            is_new_device = not await redis_client.exists(device_key)
            if is_new_device:
                await redis_client.setex(device_key, 86400 * 90, "1")
    except Exception:
        is_new_device = True

    avg_amount = 0.0
    try:
        avg_key = f"avg_amount:{org_id}:{customer_id}"
        avg_amount_str = await redis_client.get(avg_key)
        avg_amount = float(avg_amount_str) if avg_amount_str else 0.0
    except Exception:
        avg_amount = 0.0
    current_amount = float(transaction.get("amount", 0.0))
    amount_ratio = (current_amount / avg_amount if avg_amount > 0.0 else 1.0)

    inactive_days = 0
    try:
        last_tx_key = f"last_tx:{org_id}:{customer_id}"
        last_tx_ts = await redis_client.get(last_tx_key)
        if last_tx_ts:
            inactive_days = (
                datetime.now() -
                datetime.fromtimestamp(float(last_tx_ts))
            ).days
    except Exception:
        inactive_days = 0

    # Feature 4: Geographic mismatch
    ip_country = transaction.get("customer", {}).get("country", "IN")
    card_country = transaction.get("card", {}).get("issuing_country", "IN")
    geo_mismatch = ip_country != card_country

    # Feature 5: Hour of day (customer's local time)
    hour = datetime.now(UTC).hour

    # Feature 6: MCC risk tier
    HIGH_RISK_MCC = {
        "6051",  # Crypto/quasi-cash
        "5945",  # Electronics
        "5947",  # Gift shops
        "7995",  # Gambling
        "6211",  # Securities
        "6530",  # Money transfer
    }
    mcc = transaction.get("merchant", {}).get("category", "")
    high_risk_merchant = mcc in HIGH_RISK_MCC

    return {
        "is_new_device": int(is_new_device),
        "amount_vs_avg_ratio": round(amount_ratio, 4),
        "account_inactive_days": inactive_days,
        "geo_mismatch": int(geo_mismatch),
        "is_night": int(hour < 6 or hour >= 22),
        "high_risk_merchant": int(high_risk_merchant),
        "fraud_type_hint": "stolen_card" if (is_new_device and geo_mismatch and amount_ratio > 3) else None
    }
