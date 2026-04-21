import subprocess
import json
import random
import time
import os

API_KEY = "sg_live_BTgUphDPHZu5ekm1fIJhl_cMaVINVkOl"
URL = "https://flowshield-backend-ani8.onrender.com/api/v1/transactions/analyze"

SCENARIOS = [
    {"merchant": "Amazon IN", "amount": 3499, "category": "5311", "country": "IN", "risk": "low"},
    {"merchant": "Flipkart", "amount": 1299, "category": "5311", "country": "IN", "risk": "low"},
    {"merchant": "International Gaming", "amount": 45000, "category": "5816", "country": "US", "risk": "high"},
    {"merchant": "Crypto Exchange", "amount": 120000, "category": "6012", "country": "KY", "risk": "high"},
    {"merchant": "Unknown Intl", "amount": 95000, "category": "5999", "country": "NG", "risk": "high"},
    {"merchant": "Swiggy", "amount": 499, "category": "5812", "country": "IN", "risk": "low"},
    {"merchant": "Zomato", "amount": 680, "category": "5812", "country": "IN", "risk": "low"},
    {"merchant": "Paytm Mall", "amount": 22000, "category": "5311", "country": "IN", "risk": "low"},
]

def run_curl_simulation(count=20):
    print(f"Flowshield AI \u2014 Initiating High-Fidelity Data Pump ({count} cycles)...\n")
    
    for i in range(count):
        scenario = random.choice(SCENARIOS)
        txn_id = f"live_pump_{int(time.time())}_{i}"
        
        payload = {
            "transaction_id": txn_id,
            "amount": scenario["amount"],
            "currency": "INR",
            "merchant": {
                "id": f"m_{i}",
                "name": scenario["merchant"],
                "category": scenario["category"],
                "country": scenario["country"]
            },
            "card": {
                "last_four": str(random.randint(1000, 9999)),
                "type": "credit",
                "issuing_country": "IN"
            },
            "customer": {
                "id": f"c_{i}",
                "email": f"user_{i}@example.com",
                "ip": f"{random.randint(1,255)}.{random.randint(1,255)}.1.1",
                "country": "IN",
                "device_fingerprint": f"dev_{i}"
            },
            "channel": "web"
        }
        
        # Write payload to file to bypass Windows CLI quoting madness
        with open("payload.json", "w") as f:
            json.dump(payload, f)
        
        cmd = [
            "curl.exe", "-s", "-X", "POST", URL,
            "-H", f"X-API-Key: {API_KEY}",
            "-H", "Content-Type: application/json",
            "-d", "@payload.json"
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                try:
                    data = json.loads(result.stdout)
                    if "error" in data:
                        print(f"[{i+1:02d}] AUTH ERROR: {data['error']['code']} - {data['error'].get('message')}")
                    else:
                        label = data.get("risk_label", "unknown").upper()
                        score = data.get("risk_score", 0.0)
                        print(f"[{i+1:02d}] {label:10} | Score: {score:.2f} | {scenario['merchant']}")
                except:
                    print(f"[{i+1:02d}] RESPONSE ERROR: {result.stdout[:50]}")
            else:
                print(f"[{i+1:02d}] CURL ERROR: {result.stderr}")
        except Exception as e:
            print(f"[{i+1:02d}] SYSTEM ERROR: {e}")
            
        time.sleep(0.5)

    if os.path.exists("payload.json"):
        os.remove("payload.json")

if __name__ == "__main__":
    run_curl_simulation(30)
