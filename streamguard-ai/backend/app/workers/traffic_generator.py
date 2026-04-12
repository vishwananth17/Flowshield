import asyncio
import httpx
import random
import time
import argparse
import sys

MERCHANTS = [
    {"name": "Amazon", "mcc": "5942"},
    {"name": "Apple", "mcc": "5732"},
    {"name": "Netflix", "mcc": "4899"},
    {"name": "Steam", "mcc": "5816"},
    {"name": "Best Buy", "mcc": "5732"},
    {"name": "Walmart", "mcc": "5411"},
    {"name": "Target", "mcc": "5311"},
    {"name": "Spotify", "mcc": "4899"},
    {"name": "Uber", "mcc": "4121"},
    {"name": "Airbnb", "mcc": "7011"}
]

COUNTRIES = ["US", "GB", "CA", "DE", "FR", "JP", "BR", "IN"]

async def fire_transaction(client, api_url, api_key):
    merchant = random.choice(MERCHANTS)
    amount = round(random.uniform(10.0, 1000.0), 2)
    
    # Randomly inject "suspicious" data
    is_suspicious = random.random() < 0.1
    country = random.choice(COUNTRIES)
    if is_suspicious:
        # Cross-border high value
        country = random.choice([c for c in COUNTRIES if c != "US"])
        amount = round(random.uniform(2000.0, 5000.0), 2)

    payload = {
        "external_id": f"order_{random.randint(100000, 999999)}",
        "amount": amount,
        "currency": "USD",
        "merchant_name": merchant["name"],
        "merchant_category_code": merchant["mcc"],
        "card_last_four": str(random.randint(1000, 9999)),
        "card_brand": random.choice(["Visa", "Mastercard", "Amex"]),
        "card_country": country,
        "customer_email": f"user_{random.randint(1,1000)}@example.com",
        "customer_ip": f"{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}",
        "channel": "web",
        "billing_address_match": random.choice([True, True, True, False]) # Usually matches
    }

    try:
        headers = {"X-API-Key": api_key}
        resp = await client.post(f"{api_url}/transactions/analyze", json=payload, headers=headers)
        if resp.status_code == 200:
            data = resp.json()
            print(f"[SUCCESS] {merchant['name']} ${amount} -> {data['decision'].upper()} (Risk: {data['risk_score']})")
        elif resp.status_code == 429:
            print(f"[LIMIT REACHED] {resp.text}")
            return False
        else:
            print(f"[ERROR] {resp.status_code}: {resp.text}")
    except Exception as e:
        print(f"[EXCEPTION] {e}")
    
    return True

async def main():
    parser = argparse.ArgumentParser(description="StreamGuard AI Traffic Generator")
    parser.add_argument("--url", default="http://localhost:8000/api/v1", help="API Base URL")
    parser.add_argument("--key", required=True, help="Your organization API Key")
    parser.add_argument("--rate", type=float, default=1.0, help="Transactions per second")
    parser.add_argument("--count", type=int, default=100, help="Total transactions to send")
    
    args = parser.parse_args()

    print(f"Starting traffic generator to {args.url}...")
    print(f"Target Rate: {args.rate} tx/s")
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        for i in range(args.count):
            active = await fire_transaction(client, args.url, args.key)
            if not active:
                break
            await asyncio.sleep(1.0 / args.rate)

    print("Traffic generation complete.")

if __name__ == "__main__":
    asyncio.run(main())
