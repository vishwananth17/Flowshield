import sys
import os
import json
import base64
from decimal import Decimal

# Add backend directory to sys.path
backend_dir = r"c:\Users\vishw\Flowshieldai\streamguard-ai\backend"
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.schemas.transaction import (
    TransactionAnalyzeRequest,
    MerchantIn,
    CustomerIn,
    UpiIn,
    DeliveryIn,
)
from app.services.fraud_detection_service import FraudDetectionService
from app.ml.ensemble import FlowshieldEnsemble
from app.api.v1.gateway_webhooks import (
    parse_razorpay_payload,
    parse_cashfree_payload,
    parse_phonepe_payload,
)

def run_tests():
    print("=== 1. TESTING SCHEMA PARSING (CARDLESS UPI) ===")
    upi_payload = {
        "transaction_id": "order_rp_9921",
        "amount": Decimal("48500.00"),
        "currency": "INR",
        "payment_method": "upi",
        "gateway": "razorpay",
        "merchant": {
            "id": "merch_10",
            "name": "CryptoExchange India",
            "category": "6051",
            "country": "IN"
        },
        "customer": {
            "id": "cust_in_882",
            "email": "sharma@test.in",
            "country": "IN"
        },
        "upi": {
            "vpa": "refund.claim88@ybl",
            "app": "Google Pay",
            "flow_type": "collect",
            "payer_name": "R Sharma",
            "bank_ref_no": "410293819283"
        },
        "delivery": {
            "pincode": "800001",
            "city": "Patna",
            "state": "Bihar",
            "is_cod": False
        }
    }
    tx_in = TransactionAnalyzeRequest(**upi_payload)
    assert tx_in.card is None, "Expected card to be None for cardless UPI"
    assert tx_in.upi is not None, "Expected upi payload to be present"
    assert tx_in.upi.vpa == "refund.claim88@ybl"
    assert tx_in.delivery.pincode == "800001"
    print("[PASS] Schema parsing for cardless UPI passed.")

    print("\n=== 2. TESTING RAZORPAY WEBHOOK NORMALIZATION ===")
    rp_webhook_payload = {
        "event": "payment.authorized",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_OXYZ123456",
                    "amount": 250000, # paise (₹2,500)
                    "currency": "INR",
                    "status": "authorized",
                    "method": "upi",
                    "vpa": "customer@okhdfcbank",
                    "email": "customer@gmail.com",
                    "contact": "+919988776655",
                    "acquirer_data": {
                        "rrn": "419823719283",
                        "upi_transaction_id": "YESB0019283"
                    }
                }
            }
        }
    }
    norm_rp = parse_razorpay_payload(rp_webhook_payload)
    assert norm_rp.amount == Decimal("2500.0"), f"Expected amount 2500.0, got {norm_rp.amount}"
    assert norm_rp.payment_method == "upi"
    assert norm_rp.upi.vpa == "customer@okhdfcbank"
    assert norm_rp.upi.bank_ref_no == "419823719283"
    print(f"[PASS] Razorpay normalization passed: ₹{norm_rp.amount} via {norm_rp.upi.vpa} (RRN {norm_rp.upi.bank_ref_no})")

    print("\n=== 3. TESTING CASHFREE WEBHOOK NORMALIZATION ===")
    cf_webhook_payload = {
        "data": {
            "order": {
                "order_id": "cf_ord_77182",
                "order_amount": 1499.00,
                "order_currency": "INR"
            },
            "payment": {
                "cf_payment_id": 98218731,
                "payment_status": "SUCCESS",
                "payment_amount": 1499.00,
                "payment_group": "upi",
                "payment_method": {
                    "upi": {
                        "channel": "intent",
                        "upi_id": "buyer@ybl"
                    }
                }
            },
            "customer_details": {
                "customer_id": "cf_cust_112",
                "customer_email": "buyer@example.com",
                "customer_phone": "9876543210"
            }
        }
    }
    norm_cf = parse_cashfree_payload(cf_webhook_payload)
    assert norm_cf.amount == Decimal("1499.00")
    assert norm_cf.upi.vpa == "buyer@ybl"
    assert norm_cf.upi.flow_type == "intent"
    print(f"[PASS] Cashfree normalization passed: ₹{norm_cf.amount} via {norm_cf.upi.vpa} ({norm_cf.upi.flow_type})")

    print("\n=== 4. TESTING PHONEPE S2S WEBHOOK NORMALIZATION ===")
    phonepe_inner = {
        "success": True,
        "code": "PAYMENT_SUCCESS",
        "data": {
            "merchantTransactionId": "TXN_PH_99182",
            "transactionId": "T24091012345678",
            "amount": 899000, # paise (₹8,990)
            "paymentInstrument": {
                "type": "UPI_INTENT",
                "vpa": "user@axl",
                "bankTransactionId": "41928371928"
            }
        }
    }
    b64_response = base64.b64encode(json.dumps(phonepe_inner).encode('utf-8')).decode('utf-8')
    norm_ph = parse_phonepe_payload({"response": b64_response})
    assert norm_ph.amount == Decimal("8990.00")
    assert norm_ph.upi.vpa == "user@axl"
    assert norm_ph.upi.flow_type == "intent"
    print(f"[PASS] PhonePe S2S decoding passed: ₹{norm_ph.amount} via {norm_ph.upi.vpa} ({norm_ph.upi.flow_type})")

    print("\n=== 5. TESTING RTO RISK SCORING & COD RECOMMENDATIONS ===")
    service = FraudDetectionService()
    
    # High risk RTO: COD to 800001 (Patna) with amount ₹8,990
    cod_high_rto = TransactionAnalyzeRequest(
        transaction_id="d2c_cod_001",
        amount=Decimal("8990.00"),
        currency="INR",
        payment_method="cod",
        merchant=MerchantIn(id="m1", name="StyleStreet D2C", category="5651", country="IN"),
        delivery=DeliveryIn(
            pincode="800001",
            city="Patna",
            state="Bihar",
            is_cod=True,
            address_hash="generic_market_road"
        ),
        customer=CustomerIn(id="c1", email="test@d2c.in", country="IN")
    )
    rto_score_1 = service.compute_rto_risk(cod_high_rto)
    cod_rec_1 = service.get_cod_recommendation(rto_score_1, cod_high_rto)
    print(f"Patna COD (INR 8,990) -> RTO Score: {rto_score_1}, Recommendation: {cod_rec_1}")
    assert rto_score_1 >= 70, f"Expected high RTO score, got {rto_score_1}"
    assert cod_rec_1 in ["REQUIRE_PREPAID_UPI", "BLOCK"], f"Expected REQUIRE_PREPAID_UPI or BLOCK, got {cod_rec_1}"

    # Low risk prepaid to Mumbai
    prepaid_low_rto = TransactionAnalyzeRequest(
        transaction_id="d2c_prepaid_002",
        amount=Decimal("1200.00"),
        currency="INR",
        payment_method="upi",
        merchant=MerchantIn(id="m2", name="StyleStreet D2C", category="5651", country="IN"),
        delivery=DeliveryIn(
            pincode="400001",
            city="Mumbai",
            state="Maharashtra",
            is_cod=False
        ),
        customer=CustomerIn(id="c2", email="mumbai@d2c.in", country="IN")
    )
    rto_score_2 = service.compute_rto_risk(prepaid_low_rto)
    cod_rec_2 = service.get_cod_recommendation(rto_score_2, prepaid_low_rto)
    print(f"Mumbai Prepaid (INR 1,200) -> RTO Score: {rto_score_2}, Recommendation: {cod_rec_2}")
    assert rto_score_2 < 30, f"Expected low RTO score, got {rto_score_2}"
    assert cod_rec_2 == "ALLOW_COD"

    print("\n=== 6. TESTING INDIA THREAT HARD RULES ===")
    ensemble = FlowshieldEnsemble.__new__(FlowshieldEnsemble)
    
    # 1. Cybercrime 1930 Account Freeze Defense
    features_1930 = {
        "channel": "upi_collect",
        "is_upi_collect": 1,
        "is_new_device": 1,
        "amount_inr": 25000
    }
    score_1930, reasons_1930 = ensemble._apply_hard_rules(features_1930)
    assert score_1930 >= 0.90, f"Expected score >= 0.90, got {score_1930}"
    assert any("1930" in r for r in reasons_1930), "Expected 1930 reason in output"
    print(f"[PASS] Cybercrime 1930 Defense -> Score: {score_1930}, Reasons: {reasons_1930}")

    # 2. Burner VPA Cycling
    features_vpa = {
        "channel": "upi",
        "device_vpa_count": 5
    }
    score_vpa, reasons_vpa = ensemble._apply_hard_rules(features_vpa)
    assert score_vpa >= 0.85
    assert any("Burner VPA" in r for r in reasons_vpa)
    print(f"[PASS] Burner VPA Cycling -> Score: {score_vpa}, Reasons: {reasons_vpa}")

    # 3. Micro-UPI Card Testing Probe
    features_probing = {
        "channel": "upi",
        "is_upi": 1,
        "tx_count_last_1h": 14,
        "amount_inr": 1.0
    }
    score_probing, reasons_probing = ensemble._apply_hard_rules(features_probing)
    assert score_probing >= 0.85
    assert any("Micro-amount UPI" in r for r in reasons_probing)
    print(f"[PASS] Micro-UPI Probing Rule -> Score: {score_probing}, Reasons: {reasons_probing}")

    # 4. High-RTO Delivery Cluster
    features_rto = {
        "is_cod": 1,
        "delivery_pincode": "800001"
    }
    score_rto, reasons_rto = ensemble._apply_hard_rules(features_rto)
    assert score_rto >= 0.70
    assert any("high-RTO" in r for r in reasons_rto)
    print(f"[PASS] High-RTO Pincode Rule -> Score: {score_rto}, Reasons: {reasons_rto}")

    print("\n=======================================================")
    print("ALL INDIA-FIRST PAYMENT & THREAT TESTS PASSED (100%)!")
    print("=======================================================")

if __name__ == "__main__":
    run_tests()
