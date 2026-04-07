import asyncio
import httpx
import random
import time

API_URL = "http://localhost:8000/api/v1"

MERCHANTS = ["Amazon", "Apple", "Netflix", "Steam", "Best Buy", "Target", "Walmart", "Spotify"]

async def simulate_traffic(email: str, password: str):
    async with httpx.AsyncClient() as client:
        # Login
        print("Logging in...")
        resp = await client.post(f"{API_URL}/auth/login", json={"email": email, "password": password})
        if resp.status_code != 200:
            print("Login failed:", resp.text)
            return

        cookies = resp.cookies
        print("Successfully logged in. Starting simulation...")

        while True:
            # Generate random transaction
            amount = round(random.uniform(5.0, 500.0), 2)
            if random.random() > 0.8:
                amount *= 10  # Occasional large transaction to trigger rules
            
            payload = {
                "amount": amount,
                "currency": "USD",
                "merchant_name": random.choice(MERCHANTS),
                "merchant_category_code": "5411",
                "card_last_four": str(random.randint(1000, 9999)),
                "card_brand": "Visa",
                "card_country": "US",
                "customer_ip": f"192.168.1.{random.randint(1,255)}",
                "device_id": f"dev_{random.randint(1000,9999)}",
                "channel": "web",
                "billing_address_match": random.choice([True, False])
            }

            resp = await client.post(f"{API_URL}/transactions/analyze", json=payload, cookies=cookies)
            if resp.status_code == 200:
                data = resp.json()
                print(f"Sent {payload['merchant_name']} ${amount} -> {data.get('risk_label').upper()} ({data.get('risk_score')})")
            else:
                print("Failed to send transaction:", resp.status_code, resp.text)

            await asyncio.sleep(random.uniform(0.5, 3.0))

if __name__ == "__main__":
    # Assuming user's password could be standard test password
    # For now, let's ask user to try it or execute it if we know the password
    pass
