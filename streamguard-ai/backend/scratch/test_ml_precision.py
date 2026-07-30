import asyncio
import uuid
from decimal import Decimal
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.organization import Organization
from app.schemas.transaction import TransactionAnalyzeRequest, MerchantIn, CardIn, CustomerIn
from app.services.fraud_detection_service import FraudDetectionService

async def main():
    service = FraudDetectionService()
    async with AsyncSessionLocal() as session:
        org_res = await session.execute(
            select(Organization).order_by(Organization.created_at.desc()).limit(1)
        )
        org = org_res.scalar_one_or_none()
        
        # Test Case 1: High-Risk Order (Disposable Email + High Amount + VPN/Proxy)
        req_fraud = TransactionAnalyzeRequest(
            transaction_id=f"test_ml_{uuid.uuid4().hex[:6]}",
            amount=Decimal("14999.00"),
            currency="INR",
            merchant=MerchantIn(id="a5hm61-z0.myshopify.com", name="Shopify Store", category="5999", country="IN"),
            card=CardIn(last_four="4242", type="cash_on_delivery", issuing_country="IN"),
            customer=CustomerIn(
                id="c_fraud_99",
                email="scammer8877@yopmail.com",
                ip="185.220.101.5", # Known TOR Exit Node / Proxy
                device_fingerprint="fp_disposable_99",
                country="US", # Geo mismatch: shipping IN, IP US
                city="Chennai"
            ),
            channel="shopify_webhook"
        )
        
        result = await service.analyze(req_fraud, plan="pro", db=session, org_id=org.id if org else None)
        print("=== TEST CASE 1: HIGH RISK DISPOSABLE EMAIL & GEO MISMATCH ===")
        print(f"Risk Score: {result.risk_score}")
        print(f"Risk Label: {result.risk_label}")
        print(f"Decision:   {result.decision}")
        print(f"Reasons:    {result.reasons}")
        print(f"Model Ver:  {result.model_version}")
        print(f"Scores:     {result.model_scores}")
        print(f"Fraud Type: {result.fraud_type} (conf: {result.fraud_type_confidence})")

if __name__ == "__main__":
    asyncio.run(main())
