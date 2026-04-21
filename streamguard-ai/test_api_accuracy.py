import httpx
import asyncio
import json

URL = "https://flowshield-backend-ani8.onrender.com/api/v1/transactions/analyze"
API_KEY = "sg_live_5rr6HhGRQyM.jkkZyl0Jg5JKuXu5My-L4q-9e0QarJY9oGUETwPkXSQ"

payload = {
    "transaction_id": "TX_LIVE_998877",
    "amount": 45000.0,
    "currency": "INR",
    "merchant": {
        "id": "m_123",
        "name": "Reliance Digital",
        "category": "5732",
        "country": "IN"
    },
    "card": {
        "last_four": "4455",
        "type": "debit",
        "issuing_country": "IN"
    },
    "customer": {
        "id": "cust_8899",
        "email": "vishwa@live.in",
        "country": "IN",
        "ip": "106.201.12.45"
    },
    "channel": "web"
}

async def pulse():
    print(f"Propagating Commercial Heartbeat to {URL}...")
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "X-API-Key": API_KEY,
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(URL, json=payload, headers=headers)
            if response.status_code == 200:
                print(f"SUCCESS: API Gateway Authorized. Result: {response.json()}")
            else:
                print(f"FAILURE ({response.status_code}): {response.text}")
        except Exception as e:
            print(f"COMM_PULSE_CRITICAL: {e}")

if __name__ == "__main__":
    asyncio.run(pulse())
