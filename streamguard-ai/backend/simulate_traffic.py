import asyncio
import httpx
import random
import sys
import os

# Configuration
API_URL = os.getenv("API_URL", "https://flowshieldai-backend-production.up.railway.app/api/v1")
USER_EMAIL = os.getenv("USER_EMAIL", "bsvizva@gmail.com")
USER_PASSWORD = os.getenv("USER_PASSWORD", "")

MERCHANTS = ["Amazon", "Apple", "Netflix", "Steam", "Best Buy", "Target", "Walmart", "Spotify"]

async def simulate_traffic():
    if not USER_PASSWORD:
        print("Error: USER_PASSWORD environment variable not set.")
        return

    async with httpx.AsyncClient() as client:
        # Login
        print(f"Logging in as {USER_EMAIL} to {API_URL}...")
        resp = await client.post(f"{API_URL}/auth/login", json={"email": USER_EMAIL, "password": USER_PASSWORD})
        if resp.status_code != 200:
            print("Login failed:", resp.status_code, resp.text)
            return

        cookies = resp.cookies
        print("Successfully logged in. Starting simulation (Ctrl+C to stop)...")

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

            try:
                resp = await client.post(f"{API_URL}/transactions/analyze", json=payload, cookies=cookies)
                if resp.status_code == 200:
                    data = resp.json()
                    print(f"Sent {payload['merchant_name']} ${amount} -> {data.get('risk_label', 'UNKNOWN').upper()} (Score: {data.get('risk_score', 0)})")
                else:
                    print("Failed to send transaction:", resp.status_code, resp.text)
            except Exception as e:
                print(f"Request error: {e}")

            await asyncio.sleep(random.uniform(0.5, 3.0))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        USER_PASSWORD = sys.argv[1]
    
    try:
        asyncio.run(simulate_traffic())
    except KeyboardInterrupt:
        print("\nSimulation stopped.")
