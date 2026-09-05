"""
Flowshield AI — Signal Collector Service
Gathers multi-signal inputs across 6 categories (Card, Device, Network, Velocity, Account, Context)
along with reliability metadata for calibrated probability scoring.
"""

import re
import time
import hashlib
import logging
from typing import Any, Dict, Optional
from datetime import datetime, timezone
import math

logger = logging.getLogger(__name__)

# Curated high-frequency disposable email domain blacklist
DISPOSABLE_EMAIL_DOMAINS = {
    "mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com",
    "throwawaymail.com", "trashmail.com", "yopmail.com", "getairmail.com",
    "sharklasers.com", "guerrillamail.info", "grr.la", "guerrillamail.biz",
    "guerrillamail.de", "guerrillamail.net", "guerrillamail.org", "fakeinbox.com",
    "dispostable.com", "maildrop.cc", "temp-mail.org", "inboxkitten.com",
    "burnermail.io", "crazymailing.com", "mohmal.com", "dropmail.me",
    "nada.ltd", "getnada.com", "emailondeck.com", "tempail.com",
    "mytemp.email", "fakemailgenerator.com", "generator.email", "throwaway.email",
    "mintemail.com", "mytempemail.com", "spamgourmet.com", "jetable.org",
    "spambox.us", "trashmail.net", "trashmail.org", "trashmail.me",
    "mailcatch.com", "deadaddress.com", "mailnull.com", "tempinbox.com",
    "fastmail.fm", "discard.email", "discardmail.com", "spambog.com",
    "tempmailaddress.com", "mailnesia.com", "eyepaste.com", "mailscrap.com",
    "harakirimail.com", "anonymbox.com", "fakemail.net", "zillamail.com",
    "bouncr.com", "trash-mail.com", "tempemail.co", "tempmail.net",
    "temporary-mail.net", "disposablemail.com", "trashcanmail.com", "tmailor.com",
    "guerrillamailblock.com", "pokemail.net", "spamfree24.org", "superrito.com"
}

DATACENTER_ASN_KEYWORDS = [
    "amazon", "aws", "google", "digitalocean", "linode", "ovh", "hetzner",
    "microsoft", "azure", "cloudflare", "vultr", "alibaba", "leaseweb", "choopa", "fastly"
]

SANCTIONED_COUNTRIES = {"CU", "IR", "KP", "SY", "RU"}


class SignalCollector:
    """
    Collects transaction data, queries Redis real-time velocity states,
    and returns standardized feature payloads with reliability contexts.
    """

    def __init__(self, redis_client=None):
        self.redis = redis_client

    async def collect_signals(
        self,
        tx_data: Dict[str, Any],
        org_id: str = "default_org",
        db_session=None
    ) -> Dict[str, Any]:
        """
        Gathers all signal groups A through F and packages them with reliability context.
        """
        signals: Dict[str, Any] = {}
        reliability: Dict[str, Dict[str, Any]] = {}

        # -------------------------------------------------------------
        # Extract base fields from payload
        # -------------------------------------------------------------
        amount = float(tx_data.get("amount") or tx_data.get("amount_inr") or 0.0)
        customer_id = str(tx_data.get("customer_id") or tx_data.get("user_id") or "anonymous")
        customer_name = str(tx_data.get("customer_name") or tx_data.get("name") or "").strip()
        card_holder_name = str(tx_data.get("card_holder_name") or tx_data.get("cardholder_name") or customer_name).strip()
        card_last_four = str(tx_data.get("card_last_four") or tx_data.get("card_number_last4") or "0000")
        card_bin = str(tx_data.get("card_bin") or tx_data.get("bin") or "")
        card_type = str(tx_data.get("card_type") or "credit").lower()
        is_virtual = bool(tx_data.get("is_virtual_card", False))
        is_corporate = bool(tx_data.get("is_corporate_card", False) or "corp" in card_type)
        card_issuing_country = str(tx_data.get("card_issuing_country") or "IN").upper()
        billing_country = str(tx_data.get("billing_country") or "IN").upper()
        
        ip_address = str(tx_data.get("ip_address") or tx_data.get("customer_ip") or "127.0.0.1")
        ip_country = str(tx_data.get("ip_country") or billing_country).upper()
        ip_city = str(tx_data.get("ip_city") or "Mumbai")
        ip_timezone = str(tx_data.get("ip_timezone") or "Asia/Kolkata")
        
        device_fingerprint = str(tx_data.get("device_fingerprint") or tx_data.get("device_id") or f"dev_{customer_id}")
        device_hash = hashlib.sha256(device_fingerprint.encode()).hexdigest()
        card_hash = hashlib.sha256(f"{card_bin}_{card_last_four}".encode()).hexdigest()

        # -------------------------------------------------------------
        # SIGNAL GROUP A — Card Signals
        # -------------------------------------------------------------
        # 1. card_issuing_country
        signals["card_issuing_country"] = card_issuing_country
        reliability["card_issuing_country"] = {
            "level": "MEDIUM",
            "reason": "Legitimate users travel and use foreign cards. Trust increases if history exists."
        }

        # 2. card_history_with_merchant (Single strongest legitimacy signal)
        card_history = int(tx_data.get("card_history_with_merchant") or 0)
        if self.redis and card_history == 0:
            try:
                hist_val = await self.redis.get(f"card_hist:{org_id}:{card_hash}")
                if hist_val:
                    card_history = int(hist_val)
            except Exception as e:
                logger.debug(f"Redis card_history lookup failed: {e}")
        signals["card_history_with_merchant"] = card_history
        reliability["card_history_with_merchant"] = {
            "level": "HIGH",
            "reason": "Strongest legitimacy indicator: >5 prior payments reduces base risk by 0.20."
        }

        # 3. card_recent_multi_account_use
        multi_account_use = int(tx_data.get("card_recent_multi_account_use") or tx_data.get("card_multi_account_use") or 1)
        if self.redis and multi_account_use == 1:
            try:
                key = f"card_accounts:10m:{card_hash}"
                await self.redis.sadd(key, customer_id)
                await self.redis.expire(key, 600)
                multi_account_use = await self.redis.scard(key)
            except Exception as e:
                logger.debug(f"Redis card_accounts check failed: {e}")
        signals["card_multi_account_use"] = multi_account_use
        reliability["card_multi_account_use"] = {
            "level": "VERY HIGH",
            "threshold_review": 2,
            "threshold_block": 4,
            "reason": "One card used across multiple accounts in 10 mins indicates card testing ring."
        }

        # 4. card_network_signals
        signals["card_network_signals"] = {
            "issuer_risk_flag": bool(tx_data.get("issuer_risk_flag", False)),
            "card_type": card_type,
            "is_virtual_card": is_virtual,
            "is_corporate_card": is_corporate,
        }
        signals["is_virtual_card"] = is_virtual
        signals["is_corporate_card"] = is_corporate

        # 5. name_match_score (Fuzzy match: low reliability, max weight 0.05)
        name_match = self._fuzzy_name_match(customer_name, card_holder_name)
        # If virtual or corporate, ignore minor name mismatches
        if is_virtual or is_corporate:
            name_match = max(name_match, 0.85)
        signals["name_match_score"] = round(name_match, 2)
        signals["name_mismatch"] = round(1.0 - name_match, 2)
        reliability["name_match_score"] = {
            "level": "LOW",
            "reason": "Spouse cards, company cards, virtual cards differ. Used only as a tie-breaker."
        }

        # -------------------------------------------------------------
        # SIGNAL GROUP B — Device Signals
        # -------------------------------------------------------------
        signals["device_fingerprint_hash"] = device_hash
        known_device_count = int(tx_data.get("device_seen_count", 1))
        is_known_device = bool(tx_data.get("known_device", known_device_count > 2))
        signals["known_device"] = is_known_device
        signals["device_first_seen"] = not is_known_device

        # Device cluster size (how many accounts share this device)
        device_cluster_size = int(tx_data.get("device_fingerprint_cluster_size") or tx_data.get("device_cluster_size") or 1)
        if self.redis and device_cluster_size == 1:
            try:
                d_key = f"device_accounts:24h:{device_hash}"
                await self.redis.sadd(d_key, customer_id)
                await self.redis.expire(d_key, 86400)
                device_cluster_size = await self.redis.scard(d_key)
            except Exception as e:
                logger.debug(f"Redis device cluster check failed: {e}")
        signals["device_cluster_size"] = device_cluster_size

        is_headless = bool(tx_data.get("is_headless_browser", False))
        signals["is_headless_browser"] = is_headless
        signals["browser_language"] = str(tx_data.get("browser_language") or "en-US")
        signals["browser_timezone"] = str(tx_data.get("browser_timezone") or ip_timezone)
        signals["ip_timezone"] = ip_timezone
        signals["timezone_mismatch"] = signals["browser_timezone"] != signals["ip_timezone"]

        screen_resolution = str(tx_data.get("screen_resolution") or "1920x1080")
        signals["screen_resolution"] = screen_resolution
        signals["has_touch_screen"] = bool(tx_data.get("has_touch_screen", False))
        signals["device_memory_gb"] = float(tx_data.get("device_memory_gb") or 8.0)
        signals["hardware_concurrency"] = int(tx_data.get("hardware_concurrency") or 8)

        # Datacenter bot ensemble check: high ram + high cores + no touch + headless
        if is_headless and signals["device_memory_gb"] >= 32 and signals["hardware_concurrency"] >= 16:
            signals["bot_hardware_signature"] = True
        else:
            signals["bot_hardware_signature"] = False

        # -------------------------------------------------------------
        # SIGNAL GROUP C — Network / IP Signals
        # -------------------------------------------------------------
        signals["ip_address"] = ip_address
        signals["ip_country"] = ip_country
        signals["ip_city"] = ip_city
        signals["is_vpn"] = bool(tx_data.get("is_vpn", False))
        signals["is_proxy"] = bool(tx_data.get("is_proxy", False))
        signals["is_tor"] = bool(tx_data.get("is_tor", False))
        signals["is_datacenter_ip"] = bool(tx_data.get("is_datacenter_ip", False))
        signals["ip_country_mismatch"] = (ip_country != billing_country)
        signals["ip_reputation_score"] = float(tx_data.get("ip_reputation_score") or 0.05)
        
        asn_name = str(tx_data.get("asn_name") or tx_data.get("isp") or "Unknown").lower()
        asn_type = str(tx_data.get("asn_type") or ("hosting" if any(k in asn_name for k in DATACENTER_ASN_KEYWORDS) else "residential"))
        signals["asn_type"] = asn_type
        if asn_type == "hosting":
            signals["is_datacenter_ip"] = True

        # Check cross-merchant network flagged device or card (Stripe Radar effect)
        signals["is_network_flagged"] = False
        if self.redis:
            try:
                flagged_dev = await self.redis.sismember("network:flagged_devices", device_hash)
                flagged_card = await self.redis.sismember("network:flagged_cards", card_hash)
                if flagged_dev or flagged_card:
                    signals["is_network_flagged"] = True
            except Exception as e:
                logger.debug(f"Redis network flag check failed: {e}")

        # -------------------------------------------------------------
        # SIGNAL GROUP D — Velocity / Pattern Signals
        # -------------------------------------------------------------
        # Card velocity counters
        v_1m = int(tx_data.get("tx_count_same_card_1min") or tx_data.get("velocity_card_1min") or 1)
        v_10m = int(tx_data.get("tx_count_same_card_10min") or 1)
        v_1h = int(tx_data.get("tx_count_same_card_1hour") or 1)
        ip_v_1h = int(tx_data.get("tx_count_same_ip_1hour") or 1)

        if self.redis:
            try:
                k_1m = f"vel:card:1m:{card_hash}"
                k_10m = f"vel:card:10m:{card_hash}"
                k_1h = f"vel:card:1h:{card_hash}"
                k_ip = f"vel:ip:1h:{ip_address}"

                v_1m = await self.redis.incr(k_1m)
                if v_1m == 1:
                    await self.redis.expire(k_1m, 60)

                v_10m = await self.redis.incr(k_10m)
                if v_10m == 1:
                    await self.redis.expire(k_10m, 600)

                v_1h = await self.redis.incr(k_1h)
                if v_1h == 1:
                    await self.redis.expire(k_1h, 3600)

                ip_v_1h = await self.redis.incr(k_ip)
                if ip_v_1h == 1:
                    await self.redis.expire(k_ip, 3600)
            except Exception as e:
                logger.debug(f"Redis velocity update failed: {e}")

        signals["velocity_card_1min"] = v_1m
        signals["velocity_card_10min"] = v_10m
        signals["velocity_card_1hour"] = v_1h
        signals["velocity_ip_1hour"] = ip_v_1h

        # Spend pattern: tx amount vs customer average ratio
        account_avg = float(tx_data.get("account_avg_spend_30d") or tx_data.get("customer_avg_amount_30d") or 1000.0)
        ratio = amount / max(1.0, account_avg)
        signals["amount_vs_average_ratio"] = round(ratio, 2)
        signals["account_avg_spend_30d"] = account_avg

        failed_attempts = int(tx_data.get("failed_payment_attempts_before_success") or tx_data.get("failed_attempts", 0))
        signals["failed_attempts_before_success"] = failed_attempts

        # -------------------------------------------------------------
        # SIGNAL GROUP E — Account / Identity Signals
        # -------------------------------------------------------------
        account_age_days = int(tx_data.get("account_age_days") or 30)
        signals["account_age_days"] = account_age_days
        signals["new_account_high_amount"] = (account_age_days < 7 and ratio > 5.0)

        prior_disputes = int(tx_data.get("account_prior_dispute_count") or tx_data.get("account_prior_disputes", 0))
        signals["account_prior_disputes"] = prior_disputes

        email = str(tx_data.get("email") or tx_data.get("customer_email") or "").lower().strip()
        email_domain = email.split("@")[-1] if "@" in email else ""
        signals["is_disposable_email"] = email_domain in DISPOSABLE_EMAIL_DOMAINS
        
        # Suspicious email prefix format: 8+ random alphanumeric characters before standard provider
        is_suspicious_email = bool(re.match(r"^[a-z0-9]{8,}@(gmail|yahoo|hotmail|outlook)\.com$", email))
        signals["email_format_suspicious"] = is_suspicious_email

        signals["phone_verified"] = bool(tx_data.get("phone_verified", True))
        signals["phone_country_matches_billing"] = bool(tx_data.get("phone_country_matches_billing", True))

        # -------------------------------------------------------------
        # SIGNAL GROUP F — Transaction Context Signals
        # -------------------------------------------------------------
        signals["amount"] = amount
        signals["amount_inr"] = amount
        signals["currency"] = str(tx_data.get("currency") or "INR").upper()
        signals["product_category"] = str(tx_data.get("product_category") or tx_data.get("merchant_category") or "general")
        signals["is_digital_goods"] = bool(tx_data.get("is_digital_goods", False) or "digital" in signals["product_category"].lower())
        signals["shipping_address_equals_billing"] = bool(tx_data.get("shipping_address_equals_billing", True))

        now_hour = datetime.now(timezone.utc).hour
        signals["time_of_day_local"] = int(tx_data.get("time_of_day_local", (now_hour + 5) % 24))  # Default IST approx
        signals["days_since_last_transaction"] = int(tx_data.get("days_since_last_transaction", 5))
        signals["password_reset_before_purchase"] = bool(tx_data.get("password_reset_before_purchase", False))

        # 3DS result: authenticated | challenged | not_enrolled | failed
        three_ds = str(tx_data.get("3ds_result") or tx_data.get("three_ds_result") or "not_enrolled").lower()
        signals["three_ds_result"] = three_ds
        signals["3ds_authenticated"] = (three_ds == "authenticated")
        signals["3ds_failed"] = (three_ds == "failed")
        signals["3ds_available"] = three_ds in ["authenticated", "challenged", "enrolled"]

        return {
            "signals": signals,
            "reliability": reliability,
            "metadata": {
                "collected_at": datetime.now(timezone.utc).isoformat(),
                "customer_id": customer_id,
                "org_id": org_id,
                "card_hash": card_hash,
                "device_hash": device_hash
            }
        }

    def _fuzzy_name_match(self, name_a: str, name_b: str) -> float:
        """Lightweight Levenshtein / Token similarity between card and customer name."""
        if not name_a or not name_b:
            return 0.5
        a_clean = re.sub(r"[^a-zA-Z0-9\s]", "", name_a.lower()).split()
        b_clean = re.sub(r"[^a-zA-Z0-9\s]", "", name_b.lower()).split()
        if not a_clean or not b_clean:
            return 0.5
        
        # Token overlap
        set_a, set_b = set(a_clean), set(b_clean)
        intersection = len(set_a.intersection(set_b))
        union = len(set_a.union(set_b))
        if union == 0:
            return 0.5
        jaccard = intersection / union
        
        # Exact match or contains
        if " ".join(a_clean) == " ".join(b_clean):
            return 1.0
        if set_a.issubset(set_b) or set_b.issubset(set_a):
            return 0.90
        return max(0.2, min(1.0, jaccard))
