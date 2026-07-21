import sys
import os

# Ensure backend package paths are reachable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
from app.ml.ensemble import get_ensemble

async def verify():
    ensemble = get_ensemble()
    print("="*60)
    print("Verifying 6-Type Multiclass Ensemble Model B Classification")
    print("="*60)

    # 1. Safe Edge Case
    features_safe = {
        "amount_inr": 150.0,
        "is_round_amount": 0,
        "is_new_device": 0,
        "ip_country_match": 1,
        "mcc_risk_tier": 0,
        "tx_count_last_1h": 1,
        "is_night": 0,
        "customer_country": "IN",
        "card_issuing_country": "IN",
        "account_inactive_days": 1,
        "geo_mismatch": 0
    }
    pred_safe = ensemble.predict(features_safe)
    print(f"Safe case prediction: risk={pred_safe['risk_score']} label={pred_safe['risk_label']} type={pred_safe['fraud_type']}")
    assert pred_safe["fraud_type"] == "legitimate"

    # 2. Stolen Card case
    features_stolen = {
        "amount_inr": 30000.0,
        "is_new_device": 1,
        "ip_country_match": 0,
        "customer_country": "IN",
        "card_issuing_country": "US",
        "geo_mismatch": 1,
        "amount_vs_avg_ratio": 4.5,
        "account_inactive_days": 60,
        "is_night": 1
    }
    pred_stolen = ensemble.predict(features_stolen)
    print(f"Stolen Card prediction: risk={pred_stolen['risk_score']} label={pred_stolen['risk_label']} type={pred_stolen['fraud_type']}")

    # 3. Chargeback case
    features_chargeback = {
        "amount_inr": 5000.0,
        "is_round_amount": 1,
        "prior_dispute_count": 4,
        "customer_dispute_rate": 0.35,
        "dispute_prone_product": 1,
        "is_disposable_email": 1,
        "is_pre_holiday_order": 1
    }
    pred_cb = ensemble.predict(features_chargeback)
    print(f"Chargeback prediction: risk={pred_cb['risk_score']} label={pred_cb['risk_label']} type={pred_cb['fraud_type']}")

    # 4. ATO case
    features_ato = {
        "amount_inr": 45000.0,
        "ato_new_device": 1,
        "is_new_device": 1,
        "ato_impossible_travel": 1,
        "ato_password_reset": 1,
        "ato_account_modified": 1,
        "ato_failed_login_count": 5,
        "ato_distance_km": 4500.0
    }
    pred_ato = ensemble.predict(features_ato)
    print(f"ATO prediction: risk={pred_ato['risk_score']} label={pred_ato['risk_label']} type={pred_ato['fraud_type']}")

    # 5. Refund case
    features_refund = {
        "amount_inr": 25000.0,
        "customer_refund_rate": 0.45,
        "device_refund_count": 4,
        "customer_refund_count": 6,
        "high_refund_category": 1,
        "is_new_device": 1
    }
    pred_refund = ensemble.predict(features_refund)
    print(f"Refund prediction: risk={pred_refund['risk_score']} label={pred_refund['risk_label']} type={pred_refund['fraud_type']}")

    # 6. Promo case
    features_promo = {
        "amount_inr": 1200.0,
        "device_account_count": 5,
        "ip_account_count": 7,
        "is_new_account": 1,
        "has_sequential_email": 1
    }
    pred_promo = ensemble.predict(features_promo)
    print(f"Promo prediction: risk={pred_promo['risk_score']} label={pred_promo['risk_label']} type={pred_promo['fraud_type']}")

    # 7. Bot case
    features_bot = {
        "amount_inr": 100.0,
        "is_bot_attack": 1,
        "is_bot_user_agent": 1,
        "requests_per_minute": 150,
        "identical_body_count": 25,
        "interval_regularity": 0.99,
        "missing_browser_headers": 1
    }
    pred_bot = ensemble.predict(features_bot)
    print(f"Bot prediction: risk={pred_bot['risk_score']} label={pred_bot['risk_label']} type={pred_bot['fraud_type']}")

    print("="*60)
    print("All multiclass prediction flows completed successfully!")
    print("="*60)

if __name__ == "__main__":
    asyncio.run(verify())
