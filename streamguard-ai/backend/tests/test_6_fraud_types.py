import pytest
from app.services.fraud_type_classifier import FraudTypeClassifier

def test_fraud_type_classifier_stolen_card():
    classifier = FraudTypeClassifier()
    features = {
        "is_new_device": 1,
        "geo_mismatch": 1,
        "amount_vs_avg_ratio": 4.2,
        "account_inactive_days": 45
    }
    result = classifier.classify(0.65, features)
    assert result["fraud_type"] == "stolen_card"
    assert result["fraud_type_confidence"] >= 0.66

def test_fraud_type_classifier_chargeback():
    classifier = FraudTypeClassifier()
    features = {
        "prior_dispute_count": 3,
        "customer_dispute_rate": 0.25,
        "dispute_prone_product": 1
    }
    result = classifier.classify(0.55, features)
    assert result["fraud_type"] == "chargeback_fraud"
    assert result["fraud_type_confidence"] >= 0.66

def test_fraud_type_classifier_ato():
    classifier = FraudTypeClassifier()
    features = {
        "ato_impossible_travel": 1,
        "ato_password_reset": 1,
        "ato_new_device": 1,
        "ato_account_modified": 1
    }
    result = classifier.classify(0.70, features)
    assert result["fraud_type"] == "account_takeover"
    assert result["fraud_type_confidence"] >= 0.75

def test_fraud_type_classifier_refund():
    classifier = FraudTypeClassifier()
    features = {
        "customer_refund_rate": 0.35,
        "device_refund_count": 4,
        "high_refund_category": 1
    }
    result = classifier.classify(0.60, features)
    assert result["fraud_type"] == "refund_fraud"
    assert result["fraud_type_confidence"] >= 0.66

def test_fraud_type_classifier_promo():
    classifier = FraudTypeClassifier()
    features = {
        "device_account_count": 4,
        "ip_account_count": 6,
        "is_new_account": 1,
        "has_sequential_email": 1
    }
    result = classifier.classify(0.50, features)
    assert result["fraud_type"] == "promo_abuse"
    assert result["fraud_type_confidence"] >= 0.75

def test_fraud_type_classifier_bot():
    classifier = FraudTypeClassifier()
    features = {
        "is_bot_attack": 1,
        "requests_per_minute": 150
    }
    result = classifier.classify(0.99, features)
    assert result["fraud_type"] == "bot_attack"
    assert result["fraud_type_confidence"] >= 0.50
