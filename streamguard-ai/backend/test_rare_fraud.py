import os
import sys

# Ensure backend package paths are reachable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.schemas.transaction import TransactionAnalyzeRequest
from app.services.fraud_detection_service import FraudDetectionService

import asyncio

async def run_rare_fraud_tests():
    print("====================================================")
    print("RUNNING RARE FRAUD PATTERN INGESTION & SCORING TESTS")
    print("====================================================\n")

    service = FraudDetectionService()

    # Rare Pattern 1: Extremely High Velocity + Sanctioned Jurisdiction + Large Amount
    pattern_1 = {
        "transaction_id": "rare_fraud_pattern_001",
        "amount": 750000.00,  # Extreme amount (INR 7.5 Lakhs)
        "currency": "INR",
        "merchant": {
            "id": "m_crypto_exchange",
            "name": "Binance India Off-Ramp",
            "category": "6051",  # High-risk MCC (Quasi-Cash / Crypto Wallets)
            "country": "KP"      # North Korea (Sanctioned country)
        },
        "card": {
            "last_four": "9988",
            "type": "prepaid",
            "issuing_country": "UA" # Ukraine card country mismatch
        },
        "customer": {
            "id": "c_whale_bot",
            "email": "blackhat_runner@tempmail.com",
            "ip": "175.45.176.80", # North Korea IP
            "country": "KP",
            "city": "Pyongyang"
        },
        "channel": "upi_collect", # High-risk UPI Collect channel
        "metadata": {}
    }

    # Injecting velocity properties dynamically
    request_1 = TransactionAnalyzeRequest(**pattern_1)
    request_1.__dict__['tx_count_1h'] = 58 # Velocity: 58 tx/hour (Impossible velocity trigger)
    request_1.__dict__['tx_count_24h'] = 140

    print("--- INGESTING RARE PATTERN 1: Sanctioned Country + High Velocity UPI Collect ---")
    result_1 = await service.analyze(request_1, plan="growth")
    print(f"Risk Score:    {result_1.risk_score * 100:.2f}%")
    print(f"Risk Label:    {result_1.risk_label.upper()}")
    print(f"Decision:      {result_1.decision.upper()}")
    print(f"Confidence:    {result_1.confidence * 100:.2f}%")
    print(f"Reasoning:")
    for reason in result_1.reasons:
        print(f"  - {reason.replace('₹', 'INR')}")
    print(f"Model Scores Detail: {result_1.model_scores}")
    print("-" * 60)

    # Rare Pattern 2: Card Testing Micro-Velocity + Mismatch Countries
    pattern_2 = {
        "transaction_id": "rare_fraud_pattern_002",
        "amount": 10.00, # Card testing micro-amount
        "currency": "INR",
        "merchant": {
            "id": "m_micro_pay",
            "name": "Unusual Micro Store",
            "category": "5999", # Misc Retail
            "country": "US"
        },
        "card": {
            "last_four": "1111",
            "type": "credit",
            "issuing_country": "GB"
        },
        "customer": {
            "id": "c_card_tester",
            "email": "tester@domain.com",
            "ip": "203.0.113.1",
            "country": "IN"
        },
        "channel": "upi"
    }

    request_2 = TransactionAnalyzeRequest(**pattern_2)
    request_2.__dict__['tx_count_1h'] = 35 # High velocity testing 35 tx/hour

    print("\n--- INGESTING RARE PATTERN 2: High Velocity Micro-amount UPI Testing ---")
    result_2 = await service.analyze(request_2, plan="growth")
    print(f"Risk Score:    {result_2.risk_score * 100:.2f}%")
    print(f"Risk Label:    {result_2.risk_label.upper()}")
    print(f"Decision:      {result_2.decision.upper()}")
    print(f"Confidence:    {result_2.confidence * 100:.2f}%")
    print(f"Reasoning:")
    for reason in result_2.reasons:
        print(f"  - {reason.replace('₹', 'INR')}")
    print(f"Model Scores Detail: {result_2.model_scores}")
    print("-" * 60)

if __name__ == "__main__":
    asyncio.run(run_rare_fraud_tests())
