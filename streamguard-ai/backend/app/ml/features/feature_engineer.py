import logging
import numpy as np
import pandas as pd
import time
import re
from datetime import datetime, UTC
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

logger = logging.getLogger(__name__)

class UnifiedFeatureEngineer:
    """
    Unified Feature Engineering and Retrieval Layer.
    Fetches real-time rolling metrics from Redis, batch metrics from PostgreSQL
    materialized views, parses request telemetry, and outputs clean model features.
    """
    
    BASE_FEATURES = [
        'amount_inr', 'is_round_amount', 'amount_log', 'is_micro_upi', 'is_high_value_upi',
        'card_type_risk', 'channel_risk_score', 'is_international_tx', 'mcc_risk_tier',
        'tx_count_1h', 'tx_count_24h', 'amount_sum_1h', 'amount_sum_24h', 
        'distinct_merchants_1h', 'distinct_merchants_24h', 'tx_velocity_ratio_1h_24h', 
        'amount_velocity_ratio', 'distinct_devices_24h', 'is_new_device', 
        'device_tx_count_24h', 'is_webview', 'is_bot_user_agent', 'is_fingerprint_missing',
        'ip_country_match', 'is_vpn_or_hosting', 'ip_asn_risk_tier', 'ip_tx_count_24h',
        'ip_distinct_users_24h', 'ip_region_fraud_rate', 'is_night', 'time_since_last_tx',
        'failed_attempts_10m', 'amount_vs_avg_ratio', 'is_amount_exceeding_avg',
        'email_domain_risk', 'is_temp_email', 'email_digit_ratio', 'is_phone_valid_india',
        'merchant_fraud_rate_30d', 'merchant_age_days', 'merchant_unique_users_24h',
        'customer_ltv', 'customer_age_days', 'avg_tx_size_30d', 'approved_tx_count_lt',
        'fraud_alerts_lifetime', 'declined_tx_ratio_30d',
        
        # New Feature Engineering Additions
        'shipping_billing_address_mismatch', 'account_age_days', 'prior_order_count_with_recipient',
        'historical_return_rate', 'historical_dispute_rate', 'is_first_time_high_value',
        'unique_merchants_5min', 'email_domain_is_disposable', 'device_fingerprint_cluster_size',
        'is_known_vpn_range', 'bin_risk_category', 'transaction_to_signup_time_minutes',

        # 6 Fraud Types Features
        'account_inactive_days', 'geo_mismatch',
        'prior_dispute_count', 'customer_dispute_rate', 'dispute_prone_product', 'is_disposable_email', 'is_pre_holiday_order',
        'ato_new_device', 'ato_impossible_travel', 'ato_password_reset', 'ato_account_modified', 'ato_failed_login_count', 'ato_distance_km',
        'customer_refund_rate', 'customer_refund_count', 'device_refund_count', 'high_refund_category',
        'device_account_count', 'ip_account_count', 'card_account_count', 'has_sequential_email', 'is_new_account', 'account_age_minutes',
        'is_bot_attack', 'requests_per_minute', 'identical_body_count', 'interval_regularity', 'missing_browser_headers'
    ]

    DISPOSABLE_DOMAINS = {"tempmail.com", "mailinator.com", "guerrillamail.com", "yopmail.com"}
    HIGH_RISK_MCC = {'6051', '6211', '7995', '4829', '6012', '5933', '6010', '6011', '5912', '7372', '6540', '6530'}
    MED_RISK_MCC = {'5999', '7011', '4814', '4899', '5734', '5045', '6099', '5411', '5047', '5122'}

    def __init__(self, redis_client):
        self.redis = redis_client

    async def _get_redis_velocity(self, customer_id: str, current_time: int) -> Dict[str, Any]:
        """Fetches sliding window aggregates using Redis Sorted Sets."""
        p = self.redis.pipeline()
        
        # Keys
        cust_tx_key = f"tx_vel:customer:{customer_id}"
        cust_amt_key = f"amt_vel:customer:{customer_id}"
        cust_merch_key = f"merch_vel:customer:{customer_id}"
        cust_dev_key = f"dev_vel:customer:{customer_id}"
        
        # Prune elements older than 24 hours
        cutoff_24h = current_time - 86400
        p.zremrangebyscore(cust_tx_key, 0, cutoff_24h)
        p.zremrangebyscore(cust_amt_key, 0, cutoff_24h)
        p.zremrangebyscore(cust_merch_key, 0, cutoff_24h)
        p.zremrangebyscore(cust_dev_key, 0, cutoff_24h)
        
        # 1 Hour range queries
        cutoff_1h = current_time - 3600
        p.zcount(cust_tx_key, cutoff_1h, current_time)
        p.zrangebyscore(cust_amt_key, cutoff_1h, current_time)
        p.zrangebyscore(cust_merch_key, cutoff_1h, current_time)
        
        # 24 Hour range queries
        p.zcount(cust_tx_key, cutoff_24h, current_time)
        p.zrangebyscore(cust_amt_key, cutoff_24h, current_time)
        p.zrangebyscore(cust_merch_key, cutoff_24h, current_time)
        p.zcard(cust_dev_key)
        
        # 5 Min merchant count
        cutoff_5m = current_time - 300
        p.zrangebyscore(cust_merch_key, cutoff_5m, current_time)
        
        # Execute pipeline
        results = await p.execute()
        
        # Parse output
        tx_count_1h = results[4]
        amt_logs_1h = results[5]
        merch_list_1h = results[6]
        
        tx_count_24h = results[7]
        amt_logs_24h = results[8]
        merch_list_24h = results[9]
        distinct_devices_24h = results[10]
        
        merch_list_5m = results[11]
        
        # Helper to decode bytes if needed
        def decode_val(v):
            if isinstance(v, bytes):
                return v.decode('utf-8')
            return str(v)

        # Calculate sums (Redis values are stored as stringified float representations like "amount:txn_id")
        amt_sum_1h = sum(float(decode_val(x).split(':')[0]) for x in amt_logs_1h)
        amt_sum_24h = sum(float(decode_val(x).split(':')[0]) for x in amt_logs_24h)
        
        # Unpack distinct merchants
        distinct_merch_1h = len(set(decode_val(x) for x in merch_list_1h))
        distinct_merch_24h = len(set(decode_val(x) for x in merch_list_24h))
        distinct_merch_5m = len(set(decode_val(x) for x in merch_list_5m))
        
        # Velocity ratio Calculations
        tx_velocity_ratio = tx_count_1h / (tx_count_24h + 1)
        amt_velocity_ratio = amt_sum_1h / (amt_sum_24h + 1)
        
        return {
            "tx_count_1h": tx_count_1h,
            "tx_count_24h": tx_count_24h,
            "amount_sum_1h": amt_sum_1h,
            "amount_sum_24h": amt_sum_24h,
            "distinct_merchants_1h": distinct_merch_1h,
            "distinct_merchants_24h": distinct_merch_24h,
            "tx_velocity_ratio_1h_24h": tx_velocity_ratio,
            "amount_velocity_ratio": amt_velocity_ratio,
            "distinct_devices_24h": max(1, distinct_devices_24h),
            "unique_merchants_5min": distinct_merch_5m
        }

    async def _get_postgres_historical(self, db: AsyncSession, customer_id: str, merchant_id: str) -> Dict[str, Any]:
        """Queries fast indexed materialized views in PostgreSQL."""
        cust_query = text("""
            SELECT customer_ltv, first_tx_at, last_tx_at, avg_tx_size_30d, 
                   max_amount_approved_30d, approved_tx_count_lt, 
                   fraud_alerts_lifetime, declined_tx_ratio_30d
            FROM customer_historical_aggregates 
            WHERE customer_id = :cust_id LIMIT 1
        """)
        merch_query = text("""
            SELECT merchant_first_seen_at, merchant_tx_volume_30d, 
                   merchant_avg_tx_size_30d, merchant_fraud_rate_30d
            FROM merchant_historical_aggregates
            WHERE merchant_id = :merch_id LIMIT 1
        """)
        
        cust_res = (await db.execute(cust_query, {"cust_id": customer_id})).fetchone()
        merch_res = (await db.execute(merch_query, {"merch_id": merchant_id})).fetchone()
        
        now = datetime.now(UTC)
        
        # Default fallback values for cold start users
        features = {
            "customer_ltv": 0.0,
            "customer_age_days": 0,
            "avg_tx_size_30d": 0.0,
            "approved_tx_count_lt": 0,
            "fraud_alerts_lifetime": 0,
            "declined_tx_ratio_30d": 0.0,
            "merchant_fraud_rate_30d": 0.0,
            "merchant_age_days": 0,
            "merchant_tx_volume_30d": 0,
            "merchant_avg_tx_size_30d": 0.0
        }
        
        if cust_res:
            features["customer_ltv"] = float(cust_res.customer_ltv or 0)
            first_tx = cust_res.first_tx_at
            if first_tx:
                if first_tx.tzinfo is not None:
                    first_tx = first_tx.replace(tzinfo=None)
                features["customer_age_days"] = (now.replace(tzinfo=None) - first_tx).days
            else:
                features["customer_age_days"] = 0
            features["avg_tx_size_30d"] = float(cust_res.avg_tx_size_30d or 0)
            features["approved_tx_count_lt"] = int(cust_res.approved_tx_count_lt or 0)
            features["fraud_alerts_lifetime"] = int(cust_res.fraud_alerts_lifetime or 0)
            features["declined_tx_ratio_30d"] = float(cust_res.declined_tx_ratio_30d or 0)
            
        if merch_res:
            features["merchant_fraud_rate_30d"] = float(merch_res.merchant_fraud_rate_30d or 0)
            first_seen = merch_res.merchant_first_seen_at
            if first_seen:
                if first_seen.tzinfo is not None:
                    first_seen = first_seen.replace(tzinfo=None)
                features["merchant_age_days"] = (now.replace(tzinfo=None) - first_seen).days
            else:
                features["merchant_age_days"] = 0
            features["merchant_tx_volume_30d"] = int(merch_res.merchant_tx_volume_30d or 0)
            features["merchant_avg_tx_size_30d"] = float(merch_res.merchant_avg_tx_size_30d or 0)
            
        return features

    async def compute_inference_vector(self, tx_req: Any, db: AsyncSession) -> Dict[str, Any]:
        """
        Combines real-time telemetry, Redis velocity metrics, and Postgres aggregates
        to output the unified feature vector.
        """
        now_ts = int(time.time())
        now_dt = datetime.now(UTC)
        
        # 1. Resolve values
        amount = float(tx_req.amount)
        currency = tx_req.currency.upper()
        # Scale to INR
        conversion = {'USD': 83.5, 'EUR': 90.2, 'INR': 1.0}.get(currency, 1.0)
        amount_inr = amount * conversion
        
        # 2. Extract real-time fields
        is_round = 1 if (amount_inr % 100 == 0 or amount_inr % 500 == 0) else 0
        is_micro = 1 if (amount_inr < 50 and tx_req.channel.lower() == 'upi') else 0
        is_high_upi = 1 if (amount_inr > 50000 and tx_req.channel.lower() == 'upi') else 0
        
        card_risk = 0.1
        if tx_req.card.type.lower() == 'prepaid':
            card_risk = 0.9
        elif tx_req.card.type.lower() == 'credit':
            card_risk = 0.3
            
        channel_score = {'upi_collect': 0.8, 'imps': 0.6, 'upi': 0.2}.get(tx_req.channel.lower(), 0.3)
        
        mcc = str(tx_req.merchant.category)
        mcc_tier = 2 if mcc in self.HIGH_RISK_MCC else (1 if mcc in self.MED_RISK_MCC else 0)
        
        # Identity logic
        email = tx_req.customer.email or ""
        email_parts = email.split('@')
        email_handle = email_parts[0] if len(email_parts) > 1 else ""
        domain = email_parts[1].lower() if len(email_parts) > 1 else ""
        is_temp = 1 if domain in self.DISPOSABLE_DOMAINS else 0
        email_risk = 0.9 if is_temp else (0.1 if domain in {"gmail.com", "yahoo.com"} else 0.4)
        digit_ratio = sum(c.isdigit() for c in email_handle) / len(email_handle) if email_handle else 0
        
        # Strip phone formatting
        phone_digits = ''.join(filter(str.isdigit, tx_req.customer.id or ""))
        clean_phone = phone_digits[-10:]
        is_phone_valid = 1 if len(clean_phone) == 10 and clean_phone[0] in '6789' else 0
        
        # Browser / UA heuristics
        ua = (tx_req.metadata.get("user_agent") or "").lower()
        is_wv = 1 if ("wv" in ua or "webview" in ua) else 0
        is_bot = 1 if any(b in ua for b in ["headless", "puppeteer", "selenium", "playwright"]) else 0
        is_fp_missing = 1 if not tx_req.customer.device_fingerprint else 0
        
        # Location & Network
        ip_country = tx_req.customer.country.upper() if tx_req.customer.country else ""
        card_country = tx_req.card.issuing_country.upper() if tx_req.card.issuing_country else ""
        ip_match = 1 if ip_country == card_country else 0
        is_vpn = 1 if tx_req.metadata.get("is_vpn") else 0
        asn_risk = int(tx_req.metadata.get("asn_risk_tier", 0))
        
        # Night calculation
        hour = now_dt.hour
        is_night = 1 if (hour < 6 or hour >= 22) else 0
        
        # 3. Pull from Redis Velocity
        try:
            redis_features = await self._get_redis_velocity(tx_req.customer.id, now_ts)
        except Exception as e:
            logger.warning(f"Redis velocity query failed: {e}. Using request-based default velocity features.")
            redis_features = {
                "tx_count_1h": int(getattr(tx_req, 'tx_count_1h', 1)),
                "tx_count_24h": int(getattr(tx_req, 'tx_count_24h', 3)),
                "amount_sum_1h": float(amount_inr),
                "amount_sum_24h": float(amount_inr) * 3,
                "distinct_merchants_1h": 1,
                "distinct_merchants_24h": 1,
                "tx_velocity_ratio_1h_24h": 0.33,
                "amount_velocity_ratio": 0.33,
                "distinct_devices_24h": 1,
                "unique_merchants_5min": 1
            }
        
        # 4. Pull from Postgres Historical Aggregates
        try:
            db_features = await self._get_postgres_historical(db, tx_req.customer.id, tx_req.merchant.id)
        except Exception as e:
            logger.warning(f"Postgres historical query failed: {e}. Using default historical features.")
            db_features = {
                "customer_ltv": 0.0,
                "customer_age_days": 0,
                "avg_tx_size_30d": 0.0,
                "approved_tx_count_lt": 0,
                "fraud_alerts_lifetime": 0,
                "declined_tx_ratio_30d": 0.0,
                "merchant_fraud_rate_30d": 0.0,
                "merchant_age_days": 0,
                "merchant_tx_volume_30d": 0,
                "merchant_avg_tx_size_30d": 0.0
            }
        
        # 5. Inter-transaction calculations
        time_diff = 86400
        dev_tx_count = 1
        dev_cluster_size = 1
        ip_tx_count = 1
        ip_users = 1
        merch_users_24h = 1
        
        try:
            last_tx_ts_key = f"last_tx_ts:{tx_req.customer.id}"
            last_tx_ts_raw = await self.redis.get(last_tx_ts_key)
            
            def decode_val(v):
                if isinstance(v, bytes):
                    return v.decode('utf-8')
                return str(v) if v is not None else None

            last_tx_ts_str = decode_val(last_tx_ts_raw)
            time_diff = now_ts - int(last_tx_ts_str) if last_tx_ts_str else 86400
            
            # Track device velocity
            dev_fingerprint = tx_req.customer.device_fingerprint
            if dev_fingerprint:
                dev_key = f"tx_vel:device:{dev_fingerprint}"
                await self.redis.zadd(dev_key, {f"{tx_req.transaction_id}": now_ts})
                await self.redis.zremrangebyscore(dev_key, 0, now_ts - 86400)
                dev_tx_count = await self.redis.zcard(dev_key)
                await self.redis.expire(dev_key, 86400)
                
                # Associate device to user
                cust_dev_key = f"dev_vel:customer:{tx_req.customer.id}"
                await self.redis.zadd(cust_dev_key, {dev_fingerprint: now_ts})
                await self.redis.expire(cust_dev_key, 86400)
                
                # Fingerprint cluster size (number of accounts on this device)
                dev_users_key = f"dev_users:{dev_fingerprint}"
                await self.redis.zadd(dev_users_key, {tx_req.customer.id: now_ts})
                await self.redis.zremrangebyscore(dev_users_key, 0, now_ts - 86400)
                dev_cluster_size = await self.redis.zcard(dev_users_key)
                await self.redis.expire(dev_users_key, 86400)

            # Track IP velocity
            cust_ip = tx_req.customer.ip
            if cust_ip:
                ip_tx_key = f"tx_vel:ip:{cust_ip}"
                ip_user_key = f"users_vel:ip:{cust_ip}"
                await self.redis.zadd(ip_tx_key, {f"{tx_req.transaction_id}": now_ts})
                await self.redis.zremrangebyscore(ip_tx_key, 0, now_ts - 86400)
                ip_tx_count = await self.redis.zcard(ip_tx_key)
                await self.redis.expire(ip_tx_key, 86400)
                
                await self.redis.zadd(ip_user_key, {tx_req.customer.id: now_ts})
                await self.redis.zremrangebyscore(ip_user_key, 0, now_ts - 86400)
                ip_users = await self.redis.zcard(ip_user_key)
                await self.redis.expire(ip_user_key, 86400)
                
            # Update last tx time in Redis
            await self.redis.setex(last_tx_ts_key, 86400, str(now_ts))
            
            # Add current transaction to Redis rolling counts (pipeline deferred updates)
            cust_tx_key = f"tx_vel:customer:{tx_req.customer.id}"
            cust_amt_key = f"amt_vel:customer:{tx_req.customer.id}"
            cust_merch_key = f"merch_vel:customer:{tx_req.customer.id}"
            
            await self.redis.zadd(cust_tx_key, {str(tx_req.transaction_id): now_ts})
            await self.redis.zadd(cust_amt_key, {f"{amount_inr}:{tx_req.transaction_id}": now_ts})
            await self.redis.zadd(cust_merch_key, {f"{tx_req.merchant.id}": now_ts})
            
            await self.redis.expire(cust_tx_key, 86400)
            await self.redis.expire(cust_amt_key, 86400)
            await self.redis.expire(cust_merch_key, 86400)

            # Track merchant velocity
            merch_user_key = f"users_vel:merchant:{tx_req.merchant.id}"
            await self.redis.zadd(merch_user_key, {tx_req.customer.id: now_ts})
            await self.redis.zremrangebyscore(merch_user_key, 0, now_ts - 86400)
            merch_users_24h = await self.redis.zcard(merch_user_key)
            await self.redis.expire(merch_user_key, 86400)
        except Exception as e:
            logger.warning(f"Redis velocity tracking failed: {e}")

        # Ratio and dynamic aggregates
        avg_amt_30d = db_features["avg_tx_size_30d"]
        amt_vs_avg = amount_inr / (avg_amt_30d + 1.0)
        is_exceeding_avg = 1 if amt_vs_avg > 3.0 else 0
        
        # 6. E-commerce / Subscription features calculations
        meta = tx_req.metadata or {}
        ship_addr = meta.get("shipping_address")
        bill_addr = meta.get("billing_address")
        addr_mismatch = 1 if (ship_addr and bill_addr and ship_addr != bill_addr) else (1 if meta.get("shipping_billing_address_mismatch") == 1 else 0)
        
        prior_orders_with_recipient = int(meta.get("prior_order_count_with_recipient", 0))
        return_rate = float(meta.get("historical_return_rate", 0.0))
        dispute_rate = float(meta.get("historical_dispute_rate", 0.0))
        
        # High value first time flag
        is_first_time_hv = 1 if (db_features["approved_tx_count_lt"] == 0 and amount_inr > 20000) or meta.get("is_first_time_high_value") == 1 else 0
        
        is_known_vpn = 1 if meta.get("is_known_vpn_range") == 1 or is_vpn else 0
        bin_risk = int(meta.get("bin_risk_category", 0))
        tx_signup_diff = int(meta.get("transaction_to_signup_time_minutes", 1440))
        
        # Build unified feature dictionary
        vector = {
            "amount_inr": amount_inr,
            "is_round_amount": is_round,
            "amount_log": float(np.log1p(amount_inr)),
            "is_micro_upi": is_micro,
            "is_high_value_upi": is_high_upi,
            "card_type_risk": card_risk,
            "channel_risk_score": channel_score,
            "is_international_tx": 1 if currency != 'INR' else 0,
            "mcc_risk_tier": mcc_tier,
            
            # Redis Velocity
            "tx_count_1h": redis_features["tx_count_1h"],
            "tx_count_24h": redis_features["tx_count_24h"],
            "amount_sum_1h": redis_features["amount_sum_1h"],
            "amount_sum_24h": redis_features["amount_sum_24h"],
            "distinct_merchants_1h": redis_features["distinct_merchants_1h"],
            "distinct_merchants_24h": redis_features["distinct_merchants_24h"],
            "tx_velocity_ratio_1h_24h": redis_features["tx_velocity_ratio_1h_24h"],
            "amount_velocity_ratio": redis_features["amount_velocity_ratio"],
            "distinct_devices_24h": redis_features["distinct_devices_24h"],
            
            # Hardware/Browser features
            "is_new_device": 1 if db_features["approved_tx_count_lt"] > 0 and is_fp_missing == 0 else 0,
            "device_tx_count_24h": dev_tx_count,
            "is_webview": is_wv,
            "is_bot_user_agent": is_bot,
            "is_fingerprint_missing": is_fp_missing,
            
            # Location/Network
            "ip_country_match": ip_match,
            "is_vpn_or_hosting": is_vpn,
            "ip_asn_risk_tier": asn_risk,
            "ip_tx_count_24h": ip_tx_count,
            "ip_distinct_users_24h": ip_users,
            "ip_region_fraud_rate": 0.05 if ip_country != "IN" else 0.01,
            
            # Behavioral
            "is_night": is_night,
            "time_since_last_tx": time_diff,
            "failed_attempts_10m": 0,
            "amount_vs_avg_ratio": amt_vs_avg,
            "is_amount_exceeding_avg": is_exceeding_avg,
            
            # Identity
            "email_domain_risk": email_risk,
            "is_temp_email": is_temp,
            "email_digit_ratio": digit_ratio,
            "is_phone_valid_india": is_phone_valid,
            
            # Merchant metrics
            "merchant_fraud_rate_30d": db_features["merchant_fraud_rate_30d"],
            "merchant_age_days": db_features["merchant_age_days"],
            "merchant_unique_users_24h": merch_users_24h,
            
            # Postgres Historical
            "customer_ltv": db_features["customer_ltv"],
            "customer_age_days": db_features["customer_age_days"],
            "avg_tx_size_30d": avg_amt_30d,
            "approved_tx_count_lt": db_features["approved_tx_count_lt"],
            "fraud_alerts_lifetime": db_features["fraud_alerts_lifetime"],
            "declined_tx_ratio_30d": db_features["declined_tx_ratio_30d"],
            
            # Upgraded Feature Engineering Additions
            "shipping_billing_address_mismatch": addr_mismatch,
            "account_age_days": db_features["customer_age_days"],
            "prior_order_count_with_recipient": prior_orders_with_recipient,
            "historical_return_rate": return_rate,
            "historical_dispute_rate": dispute_rate,
            "is_first_time_high_value": is_first_time_hv,
            "unique_merchants_5min": redis_features["unique_merchants_5min"],
            "email_domain_is_disposable": is_temp,
            "device_fingerprint_cluster_size": dev_cluster_size,
            "is_known_vpn_range": is_known_vpn,
            "bin_risk_category": bin_risk,
            "transaction_to_signup_time_minutes": tx_signup_diff
        }
        
        return vector

    def build_training_matrix(self, tx_rows: List[Dict[str, Any]]) -> pd.DataFrame:
        """
        Converts historic database records into a training DataFrame.
        Mimics `compute_inference_vector` calculation logic on raw values to prevent train-serve skew.
        """
        df = pd.DataFrame(tx_rows)
        
        # 1. Scaling amount to INR
        def get_amount_inr(row):
            amount = float(row.get('amount_inr') or row.get('amount') or 0.0)
            currency = str(row.get('currency') or 'INR').upper()
            if 'amount_inr' in row and not pd.isna(row['amount_inr']):
                return amount
            conversion = {'USD': 83.5, 'EUR': 90.2, 'INR': 1.0}.get(currency, 1.0)
            return amount * conversion
            
        df['amount_inr'] = df.apply(get_amount_inr, axis=1)
        df['is_round_amount'] = df['amount_inr'].apply(lambda x: 1 if x % 100 == 0 or x % 500 == 0 else 0)
        df['amount_log'] = np.log1p(df['amount_inr'])
        df['is_micro_upi'] = df.apply(lambda r: 1 if r['amount_inr'] < 50 and str(r.get('channel', '')).lower() == 'upi' else 0, axis=1)
        df['is_high_value_upi'] = df.apply(lambda r: 1 if r['amount_inr'] > 50000 and str(r.get('channel', '')).lower() == 'upi' else 0, axis=1)
        
        def get_card_risk(card_type):
            ct = str(card_type).lower()
            if ct == 'prepaid': return 0.9
            if ct == 'credit': return 0.3
            return 0.1
        if 'card_type' in df.columns:
            df['card_type_risk'] = df['card_type'].apply(get_card_risk)
        elif 'card_type_risk' not in df.columns:
            df['card_type_risk'] = 0.1
        
        def get_channel_score(channel):
            ch = str(channel).lower()
            return {'upi_collect': 0.8, 'imps': 0.6, 'upi': 0.2}.get(ch, 0.3)
        if 'channel' in df.columns:
            df['channel_risk_score'] = df['channel'].apply(get_channel_score)
        elif 'channel_risk_score' not in df.columns:
            df['channel_risk_score'] = 0.3
            
        if 'currency' in df.columns:
            df['is_international_tx'] = df['currency'].apply(lambda c: 1 if str(c).upper() != 'INR' else 0)
        elif 'is_international_tx' not in df.columns:
            df['is_international_tx'] = 0
        
        def get_mcc_tier(mcc):
            m = str(mcc)
            return 2 if m in self.HIGH_RISK_MCC else (1 if m in self.MED_RISK_MCC else 0)
        if 'merchant_category' in df.columns:
            df['mcc_risk_tier'] = df['merchant_category'].apply(get_mcc_tier)
        elif 'mcc_risk_tier' not in df.columns:
            df['mcc_risk_tier'] = 0
        
        # Populate velocity with columns if missing
        for col in ['tx_count_1h', 'tx_count_24h', 'amount_sum_1h', 'amount_sum_24h', 
                    'distinct_merchants_1h', 'distinct_merchants_24h', 'distinct_devices_24h', 
                    'device_tx_count_24h', 'ip_tx_count_24h', 'ip_distinct_users_24h', 
                    'merchant_unique_users_24h', 'failed_attempts_10m']:
            if col not in df.columns:
                fallback_mapping = {
                    'tx_count_1h': 'tx_count_last_1h',
                    'tx_count_24h': 'tx_count_last_24h',
                    'amount_sum_1h': 'amount_sum_last_1h',
                    'distinct_merchants_24h': 'unique_merchants_24h',
                }
                fb_col = fallback_mapping.get(col)
                if fb_col in df.columns:
                    df[col] = df[fb_col]
                else:
                    df[col] = 1 if 'count' in col or 'distinct' in col or 'unique' in col or 'attempts' in col else 0.0
        
        df['tx_velocity_ratio_1h_24h'] = df['tx_count_1h'] / (df['tx_count_24h'] + 1)
        df['amount_velocity_ratio'] = df['amount_sum_1h'] / (df['amount_sum_24h'] + 1)
        
        # Fill web/bot/fingerprint
        df['is_webview'] = df.get('is_webview', 0)
        df['is_bot_user_agent'] = df.get('is_bot_user_agent', 0)
        df['is_fingerprint_missing'] = df.get('is_fingerprint_missing', 0)
        
        # Location & Network
        df['ip_country_match'] = df.get('ip_country_match', 1)
        df['is_vpn_or_hosting'] = df.get('is_vpn_or_hosting', 0)
        df['ip_asn_risk_tier'] = df.get('ip_asn_risk_tier', 0)
        df['ip_region_fraud_rate'] = df.get('ip_region_fraud_rate', 0.01)
        
        # Behavioral
        df['is_night'] = df.get('is_night', 0)
        df['time_since_last_tx'] = df.get('time_since_last_tx', 86400)
        df['amount_vs_avg_ratio'] = df.get('amount_vs_avg_ratio', 1.0)
        df['is_amount_exceeding_avg'] = df['amount_vs_avg_ratio'].apply(lambda r: 1 if r > 3.0 else 0)
        
        # Identity
        def parse_email_features(email):
            em = str(email or "")
            parts = em.split('@')
            handle = parts[0] if len(parts) > 1 else ""
            domain = parts[1].lower() if len(parts) > 1 else ""
            is_temp = 1 if domain in self.DISPOSABLE_DOMAINS else 0
            risk = 0.9 if is_temp else (0.1 if domain in {"gmail.com", "yahoo.com"} else 0.4)
            digits = sum(c.isdigit() for c in handle)
            ratio = digits / len(handle) if handle else 0
            return pd.Series([risk, is_temp, ratio])
            
        if 'customer_email' in df.columns:
            df[['email_domain_risk', 'is_temp_email', 'email_digit_ratio']] = df['customer_email'].apply(parse_email_features)
        elif 'email' in df.columns:
            df[['email_domain_risk', 'is_temp_email', 'email_digit_ratio']] = df['email'].apply(parse_email_features)
        else:
            df['email_domain_risk'] = 0.1
            df['is_temp_email'] = 0
            df['email_digit_ratio'] = 0.0
            
        df['is_phone_valid_india'] = df.get('is_phone_valid_india', 1)
        df['is_new_device'] = df.get('is_new_device', 0)
        
        # Merchant & Customer Historical Fallbacks
        for col in ['merchant_fraud_rate_30d', 'merchant_age_days', 'customer_ltv', 'customer_age_days', 
                    'avg_tx_size_30d', 'approved_tx_count_lt', 'fraud_alerts_lifetime', 'declined_tx_ratio_30d']:
            if col not in df.columns:
                df[col] = 0.0
                
        # Upgraded E-commerce & SaaS Features Mapping
        df['shipping_billing_address_mismatch'] = df.get('shipping_billing_address_mismatch', 0)
        df['account_age_days'] = df.get('account_age_days', df['customer_age_days'])
        df['prior_order_count_with_recipient'] = df.get('prior_order_count_with_recipient', 0)
        df['historical_return_rate'] = df.get('historical_return_rate', 0.0)
        df['historical_dispute_rate'] = df.get('historical_dispute_rate', 0.0)
        df['is_first_time_high_value'] = df.get('is_first_time_high_value', 0)
        df['unique_merchants_5min'] = df.get('unique_merchants_5min', 1)
        df['email_domain_is_disposable'] = df.get('email_domain_is_disposable', df['is_temp_email'])
        df['device_fingerprint_cluster_size'] = df.get('device_fingerprint_cluster_size', 1)
        df['is_known_vpn_range'] = df.get('is_known_vpn_range', df['is_vpn_or_hosting'])
        df['bin_risk_category'] = df.get('bin_risk_category', 0)
        df['transaction_to_signup_time_minutes'] = df.get('transaction_to_signup_time_minutes', 1440)

        # 6 Fraud Types features mapping
        df['account_inactive_days'] = df.get('account_inactive_days', 0)
        df['geo_mismatch'] = df.get('geo_mismatch', 0)
        df['prior_dispute_count'] = df.get('prior_dispute_count', 0)
        df['customer_dispute_rate'] = df.get('customer_dispute_rate', 0.0)
        df['dispute_prone_product'] = df.get('dispute_prone_product', 0)
        df['is_disposable_email'] = df.get('is_disposable_email', df['is_temp_email'])
        df['is_pre_holiday_order'] = df.get('is_pre_holiday_order', 0)
        df['ato_new_device'] = df.get('ato_new_device', df['is_new_device'])
        df['ato_impossible_travel'] = df.get('ato_impossible_travel', 0)
        df['ato_password_reset'] = df.get('ato_password_reset', df.get('ato_password_reset_before_purchase', 0))
        df['ato_account_modified'] = df.get('ato_account_modified', 0)
        df['ato_failed_login_count'] = df.get('ato_failed_login_count', 0)
        df['ato_distance_km'] = df.get('ato_distance_km', 0.0)
        df['customer_refund_rate'] = df.get('customer_refund_rate', 0.0)
        df['customer_refund_count'] = df.get('customer_refund_count', 0)
        df['device_refund_count'] = df.get('device_refund_count', 0)
        df['high_refund_category'] = df.get('high_refund_category', 0)
        df['device_account_count'] = df.get('device_account_count', 0)
        df['ip_account_count'] = df.get('ip_account_count', 0)
        df['card_account_count'] = df.get('card_account_count', 0)
        df['has_sequential_email'] = df.get('has_sequential_email', 0)
        df['is_new_account'] = df.get('is_new_account', 0)
        df['account_age_minutes'] = df.get('account_age_minutes', 999.0)
        df['is_bot_attack'] = df.get('is_bot_attack', 0)
        df['requests_per_minute'] = df.get('requests_per_minute', 1)
        df['identical_body_count'] = df.get('identical_body_count', 1)
        df['interval_regularity'] = df.get('interval_regularity', 0.0)
        df['missing_browser_headers'] = df.get('missing_browser_headers', 0)
        
        # Make sure no nan
        df[self.BASE_FEATURES] = df[self.BASE_FEATURES].fillna(0)
        
        return df[self.BASE_FEATURES]

    @staticmethod
    def generate_human_readable_reason(shap_vals, feature_names, feature_values, top_n=3):
        shap_dict = dict(zip(feature_names, shap_vals))
        sorted_by_impact = sorted(shap_dict.items(), key=lambda x: abs(x[1]), reverse=True)

        reasons = []
        for feat, shap_val in sorted_by_impact[:top_n * 2]:
            val = float(feature_values.get(feat, 0))

            if feat == 'amount_vs_avg_ratio' and val > 3:
                reasons.append(f"Amount is {val:.1f}x higher than customer average")
            elif feat == 'ip_country_match' and val == 0:
                reasons.append("IP geolocation does not match card country")
            elif feat == 'tx_count_1h' and val > 5:
                reasons.append(f"High velocity: {int(val)} transactions in last hour")
            elif feat == 'is_new_device' and val == 1:
                reasons.append("Transaction from an unrecognised device")
            elif feat == 'is_night' and val == 1:
                reasons.append("Unusual transaction time — night hours")
            elif feat == 'is_temp_email' and val == 1:
                reasons.append("Disposable/temporary email used for signup")
            elif feat == 'is_vpn_or_hosting' and val == 1:
                reasons.append("Transaction routed through a VPN or cloud hosting service")
            elif feat == 'is_high_value_upi' and val == 1:
                reasons.append("High-value UPI payment exceeds safe profile limits")
            elif feat == 'channel_risk_score' and val > 0.5:
                reasons.append("Transaction channel has elevated fraud incidence")
            elif feat == 'mcc_risk_tier' and val == 2:
                reasons.append("High-risk merchant category (crypto/quasi-cash)")
            elif feat == 'shipping_billing_address_mismatch' and val == 1:
                reasons.append("Shipping address mismatch with billing details")
            elif feat == 'device_fingerprint_cluster_size' and val > 5:
                reasons.append("Multiple distinct user accounts linked to this device fingerprint")
            elif feat == 'historical_dispute_rate' and val > 0.1:
                reasons.append("Customer profile exhibits elevated chargeback dispute history")
            elif feat == 'historical_return_rate' and val > 0.5:
                reasons.append("Unusually high rate of transaction refunds and returns")
            else:
                if len(reasons) < top_n:
                    direction = "elevated" if shap_val > 0 else "reduced"
                    reasons.append(f"Anomalous {feat.replace('_',' ')} pattern ({direction} risk)")

            if len(reasons) >= top_n:
                break

        return reasons[:top_n]
