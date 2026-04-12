import requests
import sys

URL = "https://flowshieldai-backend-production.up.railway.app/api/v1/auth/login"
EMAIL = "bsvishwananth@gmail.com"
PASSWORD = sys.argv[1] if len(sys.argv) > 1 else "#vishwananth17"

session = requests.Session()
login_resp = session.post(URL, json={"email": EMAIL, "password": PASSWORD})
print(f"Login status: {login_resp.status_code}")
print(f"Login body: {login_resp.text}")
if login_resp.status_code != 200:
    sys.exit(1)

token = login_resp.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

ANALYZE_URL = "https://flowshieldai-backend-production.up.railway.app/api/v1/transactions/analyze"
payload = {
    "transaction_id": "raw_test_123",
    "amount": 100.0,
    "currency": "USD",
    "merchant": {"id": "m1", "name": "Test", "category": "1234", "country": "US"},
    "card": {"last_four": "1234", "type": "visa", "issuing_country": "US"},
    "customer": {"id": "c1", "email": "test@test.com", "country": "US", "ip": "127.0.0.1"},
    "channel": "web"
}

print(f"Sending request to {ANALYZE_URL}...")
resp = session.post(ANALYZE_URL, json=payload, headers=headers)
print(f"Status: {resp.status_code}")
print("--- RESPONSE START ---")
print(resp.text)
print("--- RESPONSE END ---")
