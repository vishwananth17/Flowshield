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
            amount = round(random.uniform(5.0, 1500.0), 2)
            if random.random() > 0.9:
                amount *= 10  # Occasional high value
            
            payload = {
                "transaction_id": f"sim_{random.randint(100000, 999999)}",
                "amount": amount,
                "currency": "USD",
                "merchant": {
                    "id": f"m_{random.randint(1,100)}",
                    "name": random.choice(MERCHANTS),
                    "category": "5411",
                    "country": "US"
                },
                "card": {
                    "last_four": str(random.randint(1000, 9999)),
                    "type": "credit",
                    "issuing_country": random.choice(["US", "US", "US", "CA", "GB"])
                },
                "customer": {
                    "id": f"c_{random.randint(1000, 9999)}",
                    "email": f"user_{random.randint(1,1000)}@example.com",
                    "ip": f"{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}",
                    "country": random.choice(["US", "US", "CA", "GB", "RU", "NG"]),
                    "city": "SimCity",
                    "device_fingerprint": f"fp_{random.randint(1000, 9999)}"
                },
                "channel": "web"
            }

            try:
                resp = await client.post(f"{API_URL}/transactions/analyze", json=payload, cookies=cookies)
                if resp.status_code == 200:
                    data = resp.json()
                    print(f"Sent: {payload['merchant']['name']} ${amount} | Result: {data.get('risk_label').upper()} (Score: {data.get('risk_score')})")
                else:
                    print(f"Failed ({resp.status_code}): {resp.text}")
            except Exception as e:
                print(f"Request error: {e}")

            await asyncio.sleep(random.uniform(1.0, 3.0))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        USER_PASSWORD = sys.argv[1]
    
    try:
        asyncio.run(simulate_traffic())
    except KeyboardInterrupt:
        print("\nSimulation stopped.")
