import requests
import sys

BASE_URL = "http://localhost:10000"
if len(sys.argv) > 1:
    BASE_URL = sys.argv[1]

EMAIL = "bsvishwananth@gmail.com"
PASSWORD = "#vishwananth17"

def run_no_code_tests():
    print(f"=== TESTING NO-CODE INTEGRATIONS ON {BASE_URL} ===")
    
    # 1. Login to get token
    login_res = requests.post(f"{BASE_URL}/api/v1/auth/login", json={"email": EMAIL, "password": PASSWORD})
    if login_res.status_code != 200:
        print("[FAIL] Login failed. Make sure server is running.")
        return
        
    token = login_res.json()["access_token"]
    cookies = login_res.cookies
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # 2. Test SSRF Protection (should block private/localhost targets)
    ssrf_targets = [
        "http://localhost:10000",
        "127.0.0.1",
        "http://169.254.169.254/latest/meta-data",
        "http://192.168.1.1",
        "http://10.0.0.1",
        "http://[::1]"
    ]
    
    print("\n2. Testing SSRF Protections...")
    for target in ssrf_targets:
        res = requests.post(f"{BASE_URL}/api/v1/integrations/detect", json={"url": target}, headers=headers, cookies=cookies)
        if res.status_code == 422:
            print(f"  [PASS] Blocked SSRF target: {target} | Response: {res.json().get('detail')}")
        else:
            print(f"  [FAIL] Did not block SSRF target: {target} | Status: {res.status_code} | Response: {res.text}")
            
    # 3. Test Valid Platform Detections
    print("\n3. Testing Platform Auto-Detection...")
    detections = [
        {"url": "mystore.myshopify.com", "expected_platform": "shopify", "expected_oauth": True},
        {"url": "pages.razorpay.com/pl_someid/view", "expected_platform": "razorpay_pages", "expected_oauth": False},
        {"url": "payu.in", "expected_platform": "payu", "expected_oauth": False},
        {"url": "instamojo.com", "expected_platform": "instamojo", "expected_oauth": False},
        {"url": "google.com", "expected_platform": "unknown", "expected_oauth": False}
    ]
    
    for item in detections:
        res = requests.post(f"{BASE_URL}/api/v1/integrations/detect", json={"url": item["url"]}, headers=headers, cookies=cookies)
        if res.status_code == 200:
            data = res.json()
            if data["platform"] == item["expected_platform"] and data["supports_oauth"] == item["expected_oauth"]:
                print(f"  [PASS] Correctly detected {item['url']} as {data['platform']} (Oauth: {data['supports_oauth']})")
            else:
                print(f"  [FAIL] Mismatch for {item['url']}: Expected {item['expected_platform']}, got {data['platform']}")
        else:
            print(f"  [FAIL] Failed request for {item['url']} | Status: {res.status_code}")
            
    # 4. Test Shopify OAuth Start Endpoint
    print("\n4. Testing Shopify OAuth start endpoint...")
    oauth_start_res = requests.get(f"{BASE_URL}/api/v1/integrations/shopify/oauth/start?shop=test-onboarding-store", headers=headers, cookies=cookies)
    if oauth_start_res.status_code == 200:
        auth_url = oauth_start_res.json().get("auth_url", "")
        if "test-onboarding-store.myshopify.com/admin/oauth/authorize" in auth_url:
            print("  [PASS] Successfully generated Shopify OAuth URL")
        else:
            print(f"  [FAIL] Invalid auth URL structure: {auth_url}")
    else:
        print(f"  [FAIL] Shopify OAuth start failed with status: {oauth_start_res.status_code}")
        
    # 5. Test analyze-light Endpoint
    print("\n5. Testing /transactions/analyze-light...")
    light_payload = {
        "org_id": "test_org_id_123",
        "amount": 1500.0,
        "currency": "INR",
        "fingerprint": "mock_fp_xyz"
    }
    light_res = requests.post(f"{BASE_URL}/api/v1/transactions/analyze-light", json=light_payload)
    if light_res.status_code == 200:
        data = light_res.json()
        if data.get("monitoring_only") is True:
            print(f"  [PASS] analyze-light response verified (risk: {data.get('risk')})")
        else:
            print(f"  [FAIL] Response not flagged as monitoring_only: {data}")
    else:
        print(f"  [FAIL] analyze-light request failed with status: {light_res.status_code}")
        
    print("\n=== NO-CODE TESTS COMPLETED ===")

if __name__ == "__main__":
    run_no_code_tests()
