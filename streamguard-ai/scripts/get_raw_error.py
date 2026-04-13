import requests
import json
import sys

BASE_URL = "https://flowshieldai-backend-production.up.railway.app/api/v1"
EMAIL = "bsvishwananth@gmail.com"
PASSWORD = "#vishwananth17"

def get_error():
    print(f"Logging in as {EMAIL}...")
    try:
        login_res = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": EMAIL, "password": PASSWORD}
        )
        login_res.raise_for_status()
        token = login_res.json()["access_token"]
        print("Login successful.")
    except Exception as e:
        print(f"Login failed: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Response: {e.response.text}")
        return

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    payload = {
        "transaction_id": "tx_req_123456",
        "amount": 1500.0,
        "currency": "USD",
        "merchant": {
            "id": "m_001",
            "name": "Global Tech Shop",
            "category": "5732",
            "country": "US"
        },
        "card": {
            "last_four": "4242",
            "type": "credit",
            "issuing_country": "US"
        },
        "customer": {
            "id": "c_9988",
            "email": "customer@example.com",
            "ip": "1.2.3.4",
            "country": "US"
        },
        "channel": "web",
        "metadata": {"test": True}
    }

    print("\nSending transaction to /analyze...")
    res = requests.post(f"{BASE_URL}/transactions/analyze", headers=headers, json=payload)
    
    print(f"Status Code: {res.status_code}")
    try:
        # Try to parse as JSON for the traceback
        data = res.json()
        print("\nResponse Body (JSON):")
        print(json.dumps(data, indent=2))
    except:
        print("\nResponse Body (Raw):")
        print(res.text)

if __name__ == "__main__":
    get_error()
