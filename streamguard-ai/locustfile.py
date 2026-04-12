import random
import uuid
from locust import HttpUser, task, between

class FlowshieldTrafficGenerator(HttpUser):
    wait_time = between(1, 5)
    
    # Replace with a real API key from your dashboard if you have one, 
    # or use this placeholder which the dev backend should accept
    headers = {
        "X-API-Key": "fs_live_dev_test_key_123",
        "Content-Type": "application/json"
    }

    @task(8)
    def simulate_legit_transaction(self):
        """Simulates normal, low-risk user behavior."""
        payload = {
            "transaction_id": f"tx_{uuid.uuid4().hex[:8]}",
            "amount": round(random.uniform(10.0, 150.0), 2),
            "currency": "USD",
            "card": {
                "last_four": str(random.randint(1000, 9999)),
                "type": random.choice(["visa", "mastercard"]),
                "issuing_country": "US"
            },
            "customer": {
                "id": f"cust_{random.randint(1, 1000)}",
                "ip": f"192.168.1.{random.randint(1, 254)}",
                "country": "US"
            },
            "merchant": {"category": "5000"},
            "channel": "web"
        }
        self.client.post("/api/v1/transactions/analyze", json=payload, headers=self.headers)

    @task(2)
    def simulate_fraud_attack(self):
        """Simulates high-risk, suspicious behavior."""
        payload = {
            "transaction_id": f"atck_{uuid.uuid4().hex[:8]}",
            "amount": round(random.uniform(5000.0, 25000.0), 2), # Unusually high amount
            "currency": "USD",
            "card": {
                "last_four": "4242", 
                "type": "visa",
                "issuing_country": "UNKNOWN" # Suspicious country
            },
            "customer": {
                "id": "anon_attacker",
                "ip": f"{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}",
                "country": "KP" # High-risk origin
            },
            "merchant": {"category": "9999"},
            "channel": "api"
        }
        self.client.post("/api/v1/transactions/analyze", json=payload, headers=self.headers)
