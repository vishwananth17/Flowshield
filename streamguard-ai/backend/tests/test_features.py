import pytest
from app.schemas.transaction import TransactionAnalyzeRequest
from app.ml.features.feature_engineer import UnifiedFeatureEngineer

@pytest.mark.asyncio
async def test_feature_extraction():
    # Construct a mock transaction analyze request
    req = {
        "transaction_id": "test_tx_123",
        "amount": 100.00,
        "currency": "INR",
        "merchant": {
            "id": "m_123",
            "name": "Coffee Shop",
            "category": "5812",
            "country": "IN"
        },
        "card": {
            "last_four": "1111",
            "type": "debit",
            "issuing_country": "IN"
        },
        "customer": {
            "id": "c_123",
            "email": "test@gmail.com",
            "ip": "1.1.1.1",
            "country": "IN"
        },
        "channel": "upi"
    }
    tx = TransactionAnalyzeRequest(**req)
    
    # Instantiate feature engineer in offline fallback mode
    engineer = UnifiedFeatureEngineer(redis_client=None)
    
    vector = await engineer.compute_inference_vector(tx, db=None)
    
    # Assertions
    assert isinstance(vector, dict)
    assert "amount_inr" in vector
    assert vector["amount_inr"] == 100.00
    assert "is_night" in vector
    assert "email_domain_risk" in vector
    assert "shipping_billing_address_mismatch" in vector
    assert "device_fingerprint_cluster_size" in vector
    assert len(vector) >= 50
