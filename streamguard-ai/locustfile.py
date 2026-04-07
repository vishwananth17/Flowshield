from locust import HttpUser, task, between
import random

class FraudAPIUser(HttpUser):
    wait_time = between(0.1, 0.5)
    
    def on_start(self):
        self.api_key = "sg_live___B_64wEMOuszKOe94l2y5pj9Piz4WbS"
        self.headers = {
            "X-API-Key": self.api_key,
            "Content-Type": "application/json"
        }
    
    @task(7)  # 70% normal transactions
    def normal_transaction(self):
        self.client.post("/api/v1/transactions/analyze", json={
            "transaction_id": f"txn_{random.randint(1000, 99999)}",
            "amount": random.randint(200, 5000),
            "currency": "INR",
            "merchant": {"id": "m1", "name": random.choice(["Swiggy", "Flipkart", "Zomato"]), "category": "5411", "country": "IN"},
            "card": {"last_four": "1234", "type": "credit", "issuing_country": "IN"},
            "customer": {"id": f"cust_{random.randint(1,1000)}", "ip": "1.1.1.1", "device_fingerprint": "dev_1", "country": "IN", "city": "Mumbai"},
            "channel": "mobile"
        }, headers=self.headers)
    
    @task(2)  # 20% suspicious
    def suspicious_transaction(self):
        self.client.post("/api/v1/transactions/analyze", json={
            "transaction_id": f"txn_{random.randint(1000, 99999)}",
            "amount": random.randint(10000, 50000),
            "currency": "INR",
            "merchant": {"id": "m2", "name": "Unknown Merchant", "category": "5411", "country": "US"},
            "card": {"last_four": "1234", "type": "credit", "issuing_country": "US"},
            "customer": {"id": f"cust_{random.randint(1,1000)}", "ip": "2.2.2.2", "device_fingerprint": "dev_2", "country": "US", "city": "NY"},
            "channel": "web"
        }, headers=self.headers)
    
    @task(1)  # 10% fraud attempts
    def fraud_transaction(self):
        self.client.post("/api/v1/transactions/analyze", json={
            "transaction_id": f"txn_{random.randint(1000, 99999)}",
            "amount": random.randint(80000, 200000),
            "currency": "INR",
            "merchant": {"id": "m3", "name": "Crypto Exchange", "category": "6051", "country": "RU"},
            "card": {"last_four": "9999", "type": "debit", "issuing_country": "RU"},
            "customer": {"id": f"cust_{random.randint(1,1000)}", "ip": "3.3.3.3", "device_fingerprint": "dev_3", "country": "NG", "city": "Lagos"},
            "channel": "api"
        }, headers=self.headers)
