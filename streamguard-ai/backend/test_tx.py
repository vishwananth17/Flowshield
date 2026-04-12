import asyncio
import httpx
import sys

async def test():
    API_URL = "https://flowshieldai-backend-production.up.railway.app/api/v1"
    email = "bsvishwananth@gmail.com"
    password = sys.argv[1]

    async with httpx.AsyncClient() as client:
        # 1. Login
        login_resp = await client.post(f"{API_URL}/auth/login", json={"email": email, "password": password})
        if login_resp.status_code != 200:
            print(f"Login failed: {login_resp.status_code} {login_resp.text}")
            return
        
        cookies = login_resp.cookies
        print("Logged in successfully.")

        # 2. Send transaction
        payload = {
            "transaction_id": "test_id_123",
            "amount": 100.00,
            "currency": "USD",
            "merchant": {
                "id": "m_test",
                "name": "Test Store",
                "category": "5411",
                "country": "US"
            },
            "card": {
                "last_four": "1234",
                "type": "credit",
                "issuing_country": "US"
            },
            "customer": {
                "id": "c_test",
                "email": "tester@example.com",
                "ip": "1.1.1.1",
                "country": "US"
            },
            "channel": "web"
        }

        resp = await client.post(f"{API_URL}/transactions/analyze", json=payload, cookies=cookies)
        print(f"Transaction status: {resp.status_code}")
        print(f"Response: {resp.text}")

if __name__ == "__main__":
    asyncio.run(test())
