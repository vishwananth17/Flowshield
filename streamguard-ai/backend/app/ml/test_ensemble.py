import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ensemble import get_ensemble

e = get_ensemble()

TEST_CASES = [
    {
        "name": "Normal grocery purchase",
        "features": {
            "amount_inr": 450, "hour_of_day": 13,
            "tx_count_last_1h": 1, "tx_count_last_24h": 3,
            "amount_sum_last_1h": 450,
            "amount_vs_avg_ratio": 0.9,
            "ip_country_match": 1, "card_country_match": 1,
            "is_new_device": 0, "merchant_risk_score": 0.05,
            "mcc_risk_tier": 0, "is_night": 0,
            "device_age_days": 365, "is_weekend": 0,
            "unique_merchants_24h": 2,
            "is_first_transaction": 0,
            "customer_country": "IN",
        },
        "expect_decision": "allow",
        "expect_score_lt": 0.35,
    },
    {
        "name": "High velocity attack",
        "features": {
            "amount_inr": 99, "hour_of_day": 3,
            "tx_count_last_1h": 35, "tx_count_last_24h": 80,
            "amount_sum_last_1h": 3465,
            "amount_vs_avg_ratio": 1.0,
            "ip_country_match": 1, "card_country_match": 1,
            "is_new_device": 1, "merchant_risk_score": 0.3,
            "mcc_risk_tier": 0, "is_night": 1,
            "device_age_days": 0, "is_weekend": 1,
            "unique_merchants_24h": 18,
            "is_first_transaction": 0,
            "customer_country": "IN",
        },
        "expect_decision": "block",
        "expect_score_gt": 0.70,
    },
    {
        "name": "High value foreign transaction",
        "features": {
            "amount_inr": 180000, "hour_of_day": 2,
            "tx_count_last_1h": 1, "tx_count_last_24h": 2,
            "amount_sum_last_1h": 180000,
            "amount_vs_avg_ratio": 18.5,
            "ip_country_match": 0, "card_country_match": 0,
            "is_new_device": 1, "merchant_risk_score": 0.85,
            "mcc_risk_tier": 2, "is_night": 1,
            "device_age_days": 0, "is_weekend": 0,
            "unique_merchants_24h": 1,
            "is_first_transaction": 0,
            "customer_country": "IN",
        },
        "expect_decision": "block",
        "expect_score_gt": 0.80,
    },
    {
        "name": "Suspicious mid-risk",
        "features": {
            "amount_inr": 8500, "hour_of_day": 21,
            "tx_count_last_1h": 3, "tx_count_last_24h": 8,
            "amount_sum_last_1h": 25000,
            "amount_vs_avg_ratio": 3.5,
            "ip_country_match": 1, "card_country_match": 1,
            "is_new_device": 1, "merchant_risk_score": 0.45,
            "mcc_risk_tier": 1, "is_night": 0,
            "device_age_days": 5, "is_weekend": 0,
            "unique_merchants_24h": 4,
            "is_first_transaction": 0,
            "customer_country": "IN",
        },
        "expect_decision": "review",
        "expect_score_gt": 0.35,
    },
]

passed = 0
failed = 0
print("="*60)
print("  Flowshield AI Ensemble - Integration Test")
print("="*60)

for tc in TEST_CASES:
    result = e.predict(tc["features"])
    score  = result["risk_score"]
    decision = result["decision"]

    ok_dec = decision == tc["expect_decision"]
    ok_sc_gt = score > tc.get("expect_score_gt", -1)
    ok_sc_lt = score < tc.get("expect_score_lt", 2)
    ok = ok_dec and ok_sc_gt and ok_sc_lt

    status = "PASS [OK]" if ok else "FAIL [X]"
    if ok: passed += 1
    else:  failed += 1

    print(f"\n  {status} - {tc['name']}")
    print(f"    Score:    {score:.4f}")
    print(f"    Decision: {decision}")
    print(f"    Label:    {result['risk_label']}")
    print(f"    Reasons:  {result['reasons']}")
    print(f"    Scores:   {result['model_scores']}")
    print(f"    Model:    {result['model_version']}")

print(f"\n" + "="*60)
print(f"  Results: {passed}/{len(TEST_CASES)} passed")
if failed == 0:
    print("  SUCCESS: ALL TESTS PASSED - ensemble ready for production")
else:
    print(f"  WARNING: {failed} tests failed - review thresholds")
print("="*60)
