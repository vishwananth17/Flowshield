import requests
import json
API_KEY = "sg_live_BTgUphDPHZu5ekm1fIJhl_cMaVINVkOl"
URL = "https://flowshield-backend-ani8.onrender.com/api/v1/transactions/analyze"

payload = {
    "transaction_id": "test_connection_123",
    "amount": 100,
    "currency": "INR",
    "merchant": {"id": "m_test", "name": "Test Store", "category": "5411", "country": "IN"},
    "card": {"last_four": "1234", "type": "credit", "issuing_country": "IN"},
    "customer": {"id": "c_test", "email": "test@example.com", "ip": "1.1.1.1", "country": "IN"},
    "channel": "web"
}

try:
    print("Testing connection to Render Cloud...")
    r = requests.post(URL, json=payload, headers={"X-API-Key": API_KEY}, timeout=30)
    print(f"Status: {r.status_code}")
    print(f"Response: {json.dumps(r.json(), indent=2)}")
except Exception as e:
    print(f"CONNECTION FAILED: {e}")
