import re
import hashlib
import logging
from datetime import datetime, UTC

logger = logging.getLogger(__name__)

async def compute_promo_abuse_features(
    transaction: dict, org_id: str, redis_client
) -> dict:
    device_hash = transaction.get("device_fingerprint_hash") or ""
    ip = transaction.get("customer", {}).get("ip") or transaction.get("customer_ip") or ""
    card_last4 = transaction.get("card", {}).get("last_four") or transaction.get("card_last_four") or ""
    customer_id = transaction.get("customer", {}).get("id") or transaction.get("customer_id") or ""

    ip_hash = hashlib.sha256(ip.encode()).hexdigest() if ip else ""
    card_hash = hashlib.sha256(card_last4.encode()).hexdigest() if card_last4 else ""

    # How many accounts have used this device?
    device_key = f"device_accounts:{org_id}:{device_hash}" if device_hash else None
    device_account_count = 0
    if device_key:
        device_account_count = int(await redis_client.get(device_key) or 0)

    # How many accounts have used this IP?
    ip_key = f"ip_accounts:{org_id}:{ip_hash}" if ip_hash else None
    ip_account_count = 0
    if ip_key:
        ip_account_count = int(await redis_client.get(ip_key) or 0)

    # How many accounts have used this card?
    card_key = f"card_accounts:{org_id}:{card_hash}" if card_hash else None
    card_account_count = 0
    if card_key:
        card_account_count = int(await redis_client.get(card_key) or 0)

    # Is the email sequential/patterned?
    email = transaction.get("customer_email") or transaction.get("customer", {}).get("email") or ""
    has_sequential_email = bool(re.search(r'\d+@', email))

    # Account age
    account_created_at = transaction.get("metadata", {}).get("account_created_at")
    account_age_minutes = 999.0
    if account_created_at:
        try:
            created = datetime.fromisoformat(account_created_at.replace("Z", "+00:00"))
            account_age_minutes = (datetime.now(created.tzinfo) - created).total_seconds() / 60
        except Exception:
            pass

    # Update counters (increment device/IP/card usage)
    if device_key:
        await redis_client.incr(device_key)
        await redis_client.expire(device_key, 86400 * 30)
    if ip_key:
        await redis_client.incr(ip_key)
        await redis_client.expire(ip_key, 86400 * 30)
    if card_key:
        await redis_client.incr(card_key)
        await redis_client.expire(card_key, 86400 * 30)

    return {
        "device_account_count": device_account_count,
        "ip_account_count": ip_account_count,
        "card_account_count": card_account_count,
        "has_sequential_email": int(has_sequential_email),
        "account_age_minutes": min(account_age_minutes, 9999.0),
        "is_new_account": int(account_age_minutes < 60),
        "fraud_type_hint": "promo_abuse" if (device_account_count >= 3 or ip_account_count >= 5) else None
    }
