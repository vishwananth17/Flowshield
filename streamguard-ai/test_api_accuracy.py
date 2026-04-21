import httpx
import asyncio
import json

URL = "https://flowshield-backend-ani8.onrender.com/api/v1/transactions/sandbox"
API_KEY = "sg_live_5rr6HhGRQyM.jkkZyl0Jg5JKuXu5My-L4q-9e0QarJY9oGUETwPkXSQ"

payload = {
    "transaction_id": "COMM_AUDIT_FINAL_999",
    "amount": 2999.00,
    "currency": "INR",
    "merchant": {
        "id": "m_commercial_001",
        "name": "Production Audit",
        "category": "Inst",
        "country": "US"
    },
    "card": {
        "last_four": "9999",
        "type": "credit",
        "issuing_country": "US"
    },
    "customer": {
        "id": "c_premium_user",
        "email": "audit@flowshield.ai",
        "ip": "1.1.1.1",
        "country": "US",
        "city": "Audit City",
        "device_fingerprint": "audit_fp_999"
    },
    "channel": "api"
}

async def test():
    async with httpx.AsyncClient() as client:
        print(f"Propagating Commercial Heartbeat to {URL}...")
        headers = {"X-API-Key": API_KEY}
        resp = await client.post(URL, json=payload, headers=headers)
        if resp.status_code == 200:
            print(f"SUCCESS: API Gateway Authorized. Result: {resp.json()}")
        else:
            print(f"FAILURE ({resp.status_code}): {resp.text}")

if __name__ == "__main__":
    asyncio.run(test())
