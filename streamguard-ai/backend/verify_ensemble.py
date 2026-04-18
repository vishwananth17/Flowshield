import requests
import json
import time

# Configuration
API_URL = "https://flowshield-backend-ani8.onrender.com/api/v1"
API_KEY = "fs_live_test_key" # Replace with your real key locally if needed

def run_stress_test():
    print("STARTING: Flowshield Dual-Mode Validation Test...")
    
    # 1. TEST CASE: THE LEGITIMATE SCENARIO (Rules: Safe, ML: Safe)
    legit_tx = {
        "transaction_id": "test_legit_001",
        "amount": 45.00,
        "currency": "USD",
        "merchant": {"id": "m_123", "name": "Global Coffee Store", "category": "5812", "country": "US"},
        "card": {"last_four": "1234", "type": "credit", "issuing_country": "US"},
        "customer": {"id": "c_999", "email": "customer@gmail.com", "country": "US", "ip": "1.1.1.1"},
        "channel": "web"
    }

    # 2. TEST CASE: THE FRAUD SCENARIO (Rules: Risky, ML: Anomaly)
    fraud_tx = {
        "transaction_id": "test_fraud_001",
        "amount": 125000.00, # Extreme high amount
        "currency": "USD",
        "merchant": {"id": "m_999", "name": "Unknown Luxury Outlet", "category": "5944", "country": "KY"}, # Cayman Islands
        "card": {"last_four": "9999", "type": "prepaid", "issuing_country": "UA"}, # Ukraine
        "customer": {"id": "c_001", "email": "bot77@tempmail.com", "country": "NG", "ip": "104.28.1.1"}, # Nigeria + VPN IP
        "channel": "web"
    }

    print("\n--- TEST 1: Legitimate User ---")
    analyze_local(legit_tx)

    print("\n--- TEST 2: Suspicious Activity ---")
    analyze_local(fraud_tx)

def analyze_local(tx):
    # This simulates the logic inside the backend to verify the ensemble.
    # In a real test, we would hit the API, but this verifies the logic logic.
    from app.services.fraud_detection_service import FraudDetectionService
    from app.schemas.transaction import TransactionAnalyzeRequest
    
    svc = FraudDetectionService()
    # Mocking a 'Growth' plan to enable ML
    try:
        req = TransactionAnalyzeRequest(**tx)
        result = svc.analyze(req, plan="growth")
        
        print(f"Decision: {result.decision.upper()}")
        print(f"Score: {result.risk_score}")
        print(f"Confidence: {result.confidence}")
        print(f"Reasoning Layers:")
        for r in result.reasons:
            print(f" - {r}")
        
        # Check if BOTH layers flagged
        ml_flag = any("pattern recognition" in r.lower() for r in result.reasons)
        rule_flag = any(not "pattern recognition" in r.lower() and not "tiers" in r.lower() for r in result.reasons)
        
        if ml_flag and rule_flag:
            print("OK [DUAL-MODE]: Both ML and Rules detected risk.")
        elif ml_flag:
            print("OK [ML-MODE]: Intelligence layer spotted hidden pattern.")
        elif rule_flag:
            print("OK [RULE-MODE]: Sentry layer blocked specific red flag.")
            
    except Exception as e:
        print(f"ERROR: Test Failed: {str(e)}")

if __name__ == "__main__":
    run_stress_test()
