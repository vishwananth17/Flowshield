import requests
import random
import time

API_KEY = "sg_live___B_64wEMOuszKOe94l2y5pj9Piz4WbS"
URL = "http://localhost:8000/api/v1/transactions/analyze"

SCENARIOS = [
    # Normal transactions (should be SAFE)
    {"amount": 499,    "merchant": "Swiggy",        "customer_country": "IN", "channel": "mobile"},
    {"amount": 1299,   "merchant": "Flipkart",       "customer_country": "IN", "channel": "web"},
    {"amount": 680,    "merchant": "Zomato",         "customer_country": "IN", "channel": "mobile"},
    {"amount": 3499,   "merchant": "Amazon IN",      "customer_country": "IN", "channel": "web"},

    # Suspicious transactions (should be SUSPICIOUS)
    {"amount": 15000,  "merchant": "Unknown Merch",  "customer_country": "IN", "channel": "web"},
    {"amount": 22000,  "merchant": "Paytm Mall",     "customer_country": "US", "channel": "api"},

    # Fraud transactions (should be FRAUD / BLOCK)
    {"amount": 95000,  "merchant": "Unknown Intl",   "customer_country": "NG", "channel": "web"},
    {"amount": 120000, "merchant": "Crypto Exchange", "customer_country": "RU", "channel": "api"},
]

print("Flowshield AI \u2014 Live Simulation Starting...\n")

for i in range(50):
    scenario = random.choice(SCENARIOS)
    
    payload = {
        "transaction_id": f"txn_{random.randint(1000000, 9999999)}",
        "amount": scenario["amount"],
        "currency": "INR",
        "merchant": {
            "id": f"m_{scenario['merchant'].lower().replace(' ', '')}",
            "name": scenario["merchant"],
            "category": "5411",
            "country": "IN"
        },
        "card": {
            "last_four": f"{random.randint(1000, 9999)}",
            "type": "credit",
            "issuing_country": "IN"
        },
        "customer": {
            "id": f"cust_{random.randint(1000,9999)}",
            "ip": f"{random.randint(1,255)}.{random.randint(1,255)}.0.1",
            "device_fingerprint": f"dev_{random.randint(1000,9999)}",
            "country": scenario["customer_country"],
            "city": "Mumbai"
        },
        "channel": scenario["channel"],
        "metadata": {}
    }

    try:
        r = requests.post(URL, json=payload, headers={"X-API-Key": API_KEY})
        data = r.json()
        label = data.get("risk_label", "unknown").upper()
        score = data.get("risk_score", 0)
        latency = data.get("detection_latency_ms", 0)
        
        color = "\033[92m" if label == "SAFE" else "\033[93m" if label == "SUSPICIOUS" else "\033[91m"
        reset = "\033[0m"
        
        print(f"[{i+1:02d}] {color}{label:12}{reset} | Score: {score:.2f} | {latency}ms | \u20B9{scenario['amount']:>8,} | {scenario['merchant']}")
    
    except Exception as e:
        print(f"[{i+1:02d}] ERROR \u2014 {e}")
    
    time.sleep(0.5)  # 2 transactions per second

print("\nSimulation complete. Check your dashboard at localhost:5173")
