import asyncio
import traceback
import uuid
from decimal import Decimal
from datetime import datetime, UTC

from app.api.v1.shopify_webhooks import process_shopify_order
from app.models.organization import Organization

async def test():
    org = Organization(id=uuid.uuid4(), name="Test Org", plan="free")
    payload = {
        "id": "1001",
        "name": "#MWE8LVEE0",
        "total_price": "1.00",
        "currency": "INR",
        "customer": {"id": "99", "email": "bsvishwananth@gmail.com"},
        "billing_address": {"country_code": "IN", "city": "Chennai"}
    }
    print("Test script loaded successfully without NameError!")

if __name__ == "__main__":
    test()
