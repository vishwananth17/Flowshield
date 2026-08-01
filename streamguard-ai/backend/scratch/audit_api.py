import urllib.request
import json
import urllib.error

# First check Express auth vs FastAPI auth
login_url = 'https://flowshield-backend-ani8.onrender.com/api/v1/auth/login'
req = urllib.request.Request(
    login_url,
    headers={'Content-Type': 'application/json'},
    data=json.dumps({'email': 'bsvishwananth@gmail.com', 'password': 'password123'}).encode('utf-8')
)

try:
    res = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    token = res.get('access_token') or res.get('token')
    print(f"[OK] LOGGED IN to Express backend. User: {res.get('user', {}).get('email')}")
except Exception as e:
    print(f"[FAIL] Express login failed: {e}")
    # Try FastAPI login
    login_url2 = 'https://flowshield-stdr.onrender.com/api/v1/auth/login'
    req2 = urllib.request.Request(
        login_url2,
        headers={'Content-Type': 'application/json'},
        data=json.dumps({'email': 'bsvishwananth@gmail.com', 'password': 'password123'}).encode('utf-8')
    )
    try:
        res2 = json.loads(urllib.request.urlopen(req2).read().decode('utf-8'))
        token = res2.get('access_token')
        print(f"[OK] LOGGED IN to FastAPI backend. User: {res2.get('user', {}).get('email')}")
    except Exception as e2:
        print(f"[FAIL] FastAPI login failed: {e2}")
        token = None

if not token:
    print("Could not obtain auth token.")
    exit(1)

endpoints = [
    '/auth/me',
    '/analytics/stats?range=24h',
    '/disputes',
    '/transactions',
    '/alerts',
    '/analytics/charts',
    '/api-keys',
    '/integrations',
    '/team/members',
    '/billing/subscription'
]

print("\n--- TESTING EXPRESS BACKEND ENDPOINTS ---")
for ep in endpoints:
    url = f"https://flowshield-backend-ani8.onrender.com/api/v1{ep}"
    req_ep = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
    try:
        raw = urllib.request.urlopen(req_ep).read().decode('utf-8')
        data = json.loads(raw)
        cnt = len(data) if isinstance(data, (list, dict)) else 1
        print(f"[OK] Express {ep:<30} SUCCESS (keys/items: {cnt})")
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode('utf-8', errors='ignore')[:120]
        print(f"[ERR] Express {ep:<30} HTTP {e.code}: {err_msg}")
    except Exception as e:
        print(f"[ERR] Express {ep:<30} EXCEPTION: {e}")

print("\n--- TESTING FASTAPI BACKEND ENDPOINTS ---")
for ep in endpoints:
    url = f"https://flowshield-stdr.onrender.com/api/v1{ep}"
    req_ep = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
    try:
        raw = urllib.request.urlopen(req_ep).read().decode('utf-8')
        data = json.loads(raw)
        cnt = len(data) if isinstance(data, (list, dict)) else 1
        print(f"[OK] FastAPI {ep:<30} SUCCESS (keys/items: {cnt})")
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode('utf-8', errors='ignore')[:120]
        print(f"[ERR] FastAPI {ep:<30} HTTP {e.code}: {err_msg}")
    except Exception as e:
        print(f"[ERR] FastAPI {ep:<30} EXCEPTION: {e}")
