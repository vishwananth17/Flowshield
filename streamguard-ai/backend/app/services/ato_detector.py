import math
import logging
from datetime import datetime, timedelta, UTC
from sqlalchemy import select
from app.models.customer_session import CustomerSession
from app.models.account_event import AccountEvent

logger = logging.getLogger(__name__)

def detect_impossible_travel(
    current_ip_country: str,
    current_ip_city: str,
    current_timestamp: datetime,
    previous_sessions: list
) -> dict:
    """
    Checks if the customer could physically travel from
    their last known location to the current one given
    the time elapsed.

    Maximum realistic travel speed: 900 km/h (commercial flight)
    We use country-level distance as an approximation.
    """
    COUNTRY_COORDINATES = {
        "IN": (20.5937, 78.9629),
        "US": (37.0902, -95.7129),
        "GB": (55.3781, -3.4360),
        "NG": (9.0820, 8.6753),
        "RO": (45.9432, 24.9668),
        "SG": (1.3521, 103.8198),
    }

    if not previous_sessions:
        return {"impossible_travel": False, "distance_km": 0}

    last_session = previous_sessions[0]
    last_country = last_session.get("ip_country")
    last_time = last_session.get("login_at")

    if not last_country or not last_time:
        return {"impossible_travel": False, "distance_km": 0}

    # Ensure times are naive or aware consistently
    t1 = current_timestamp.replace(tzinfo=None)
    t2 = last_time.replace(tzinfo=None)
    time_diff_hours = abs((t1 - t2).total_seconds()) / 3600

    # Get coordinates
    current_coords = COUNTRY_COORDINATES.get(current_ip_country)
    last_coords = COUNTRY_COORDINATES.get(last_country)

    if not current_coords or not last_coords:
        return {"impossible_travel": False, "distance_km": 0}

    # Haversine distance
    R = 6371  # Earth radius km
    lat1, lon1 = math.radians(last_coords[0]), math.radians(last_coords[1])
    lat2, lon2 = math.radians(current_coords[0]), math.radians(current_coords[1])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    distance_km = 2 * R * math.asin(math.sqrt(a))

    # Maximum possible distance given time elapsed
    max_possible_km = time_diff_hours * 900

    impossible = (distance_km > max_possible_km and distance_km > 500)

    return {
        "impossible_travel": impossible,
        "distance_km": round(distance_km),
        "time_diff_hours": round(time_diff_hours, 2),
        "last_country": last_country,
        "current_country": current_ip_country,
    }

async def compute_ato_features(
    customer_id: str, org_id: str,
    transaction: dict, db
) -> dict:
    if not db:
        return {
            "ato_new_device": 0,
            "ato_impossible_travel": 0,
            "ato_password_reset_before_purchase": 0,
            "ato_account_modified": 0,
            "ato_failed_login_count": 0,
            "ato_distance_km": 0,
            "fraud_type_hint": None
        }

    # Get last 5 sessions from DB
    recent_sessions_result = await db.execute(
        select(CustomerSession)
        .where(CustomerSession.customer_id == customer_id)
        .order_by(CustomerSession.login_at.desc())
        .limit(5)
    )
    recent_sessions = recent_sessions_result.scalars().all()

    # Get recent account events in last 30 minutes
    thirty_min_ago = datetime.now(UTC) - timedelta(minutes=30)
    recent_events_result = await db.execute(
        select(AccountEvent)
        .where(
            AccountEvent.customer_id == customer_id,
            AccountEvent.created_at >= thirty_min_ago
        )
        .order_by(AccountEvent.created_at.desc())
    )
    events = recent_events_result.scalars().all()
    event_types = [e.event_type for e in events]

    # Feature: password reset → purchase pattern
    password_reset_then_purchase = (
        "password_reset" in event_types
        and len(event_types) > 0
    )

    # Feature: account details changed before purchase
    account_modified_before_purchase = any(
        e in event_types for e in
        ["email_change", "phone_change",
         "payment_method_change", "address_change"]
    )

    # Feature: failed logins before success
    failed_login_count = event_types.count("failed_login")

    # Feature: new device for this account
    current_device = transaction.get("device_fingerprint_hash")
    known_devices = {s.device_fingerprint_hash for s in recent_sessions if s.device_fingerprint_hash}
    is_new_device = current_device not in known_devices if current_device else True

    # Feature: impossible travel
    travel_result = detect_impossible_travel(
        transaction.get("customer", {}).get("country", "IN"),
        transaction.get("customer", {}).get("city", ""),
        datetime.now(UTC),
        [{"ip_country": s.ip_country, "login_at": s.login_at} for s in recent_sessions]
    )

    return {
        "ato_new_device": int(is_new_device),
        "ato_impossible_travel": int(travel_result["impossible_travel"]),
        "ato_password_reset_before_purchase": int(password_reset_then_purchase),
        "ato_account_modified": int(account_modified_before_purchase),
        "ato_failed_login_count": failed_login_count,
        "ato_distance_km": travel_result["distance_km"],
        "fraud_type_hint": "account_takeover" if (travel_result["impossible_travel"] or password_reset_then_purchase) else None
    }
