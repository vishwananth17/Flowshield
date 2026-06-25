import requests
import time
import json
import uuid
import sys

# Default to local backend for testing, but allow overriding via environment/argument
BASE_URL = "http://localhost:10000"
if len(sys.argv) > 1:
    BASE_URL = sys.argv[1]

LOGIN_URL = f"{BASE_URL}/api/v1/auth/login"
ME_URL = f"{BASE_URL}/api/v1/auth/me"
API_KEYS_URL = f"{BASE_URL}/api/v1/api-keys"
ANALYZE_URL = f"{BASE_URL}/analyze_transaction"
STATS_URL = f"{BASE_URL}/api/v1/analytics/stats"
EXPORT_URL = f"{BASE_URL}/api/v1/analytics/export"
TRANSACTIONS_URL = f"{BASE_URL}/api/v1/transactions"
HEALTH_URL = f"{BASE_URL}/api/v1/health"
METRICS_URL = f"{BASE_URL}/api/v1/metrics"
LOCKDOWN_URL = f"{BASE_URL}/api/v1/admin/emergency-lockdown"
DISABLE_LOCKDOWN_URL = f"{BASE_URL}/api/v1/admin/disable-lockdown"

ALERTS_URL = f"{BASE_URL}/api/v1/alerts"
WAITLIST_DEBUG_URL = f"{BASE_URL}/api/v1/auth/waitlist/debug-list"

EMAIL = "bsvishwananth@gmail.com"
PASSWORD = "#vishwananth17"

def assert_status(response, expected_status, task_name):
    if response.status_code == expected_status:
        print(f"  [PASS] {task_name}")
        return True
    else:
        print(f"  [FAIL] {task_name} | Expected {expected_status}, got {response.status_code}")
        print(f"  Response: {response.text[:200]}")
        return False

def run_tests():
    print(f"=== STARTING INTEGRATION TESTS AGAINST {BASE_URL} ===")
    
    # 1. Login
    print("\n1. Testing Login...")
    login_res = requests.post(LOGIN_URL, json={"email": EMAIL, "password": PASSWORD})
    if not assert_status(login_res, 200, "User Login"):
        return
    
    auth_data = login_res.json()
    token = auth_data["access_token"]
    cookies = login_res.cookies
    user_role = auth_data["user"]["role"]
    print(f"  Role: {user_role}")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # 2. Get User Profile
    print("\n2. Testing GET /auth/me...")
    me_res = requests.get(ME_URL, headers=headers, cookies=cookies)
    assert_status(me_res, 200, "Get Profile Details")

    # 3. Waitlist Debug Gate checking
    print("\n3. Testing Waitlist Debug Authentication Gate...")
    # 3a. Unauthenticated request
    no_auth_res = requests.get(WAITLIST_DEBUG_URL)
    assert_status(no_auth_res, 401, "Block Unauthenticated Waitlist Debug Scan")
    
    # 3b. Authenticated request
    auth_debug_res = requests.get(WAITLIST_DEBUG_URL, headers=headers, cookies=cookies)
    assert_status(auth_debug_res, 200, "Allow Owner Waitlist Debug Scan")
    if auth_debug_res.status_code == 200:
        print(f"  Entries count: {auth_debug_res.json().get('count', 0)}")

    # 4. API Keys Management Lifecycle
    print("\n4. Testing API Keys Management Lifecycle...")
    
    # 4a. Get current keys
    get_keys_res = requests.get(API_KEYS_URL, headers=headers, cookies=cookies)
    assert_status(get_keys_res, 200, "List API Keys")
    initial_key_count = len(get_keys_res.json())
    print(f"  Initial key count: {initial_key_count}")

    # 4b. Create key
    new_key_name = f"Test Key - {uuid.uuid4().hex[:6]}"
    create_key_res = requests.post(API_KEYS_URL, headers=headers, cookies=cookies, json={
        "environment": "test",
        "name": new_key_name
    })
    assert_status(create_key_res, 201, "Create New API Key")
    key_data = create_key_res.json()
    api_key = key_data.get("raw_key") or key_data.get("api_key")
    key_id = key_data["id"]
    print(f"  Created key name: '{new_key_name}', prefix: {key_data.get('prefix')}")

    # 4c. Verify key is in list
    get_keys_res2 = requests.get(API_KEYS_URL, headers=headers, cookies=cookies)
    if assert_status(get_keys_res2, 200, "List API Keys after creation"):
        keys = get_keys_res2.json()
        matching_key = next((k for k in keys if k["id"] == key_id), None)
        if matching_key:
            print(f"  [PASS] Found matching key with name '{matching_key.get('name')}' in list")
        else:
            print(f"  [FAIL] Created key not found in list")

    # 4d. Rotate Key
    rotated_name = f"Rotated Key - {uuid.uuid4().hex[:6]}"
    rotate_res = requests.post(f"{API_KEYS_URL}/{key_id}/rotate", headers=headers, cookies=cookies, json={
        "environment": "test",
        "name": rotated_name
    })
    assert_status(rotate_res, 200, "Rotate API Key")
    rotated_data = rotate_res.json()
    rotated_key = rotated_data.get("raw_key") or rotated_data.get("api_key")
    rotated_id = rotated_data["id"]
    print(f"  Rotated to new key ID {rotated_id}, name: '{rotated_name}'")

    # 5. Analyze Transaction using rotated API key
    print("\n5. Testing Transaction Analysis & Alert Auto-Generation...")
    
    # 5a. Normal transaction (low score, shouldn't trigger alert)
    tx_payload_safe = {
        "transaction_id": f"TEST-SAFE-{uuid.uuid4().hex[:8].upper()}",
        "amount": 45.00,
        "currency": "INR",
        "merchant": {"name": "Local Grocery Store"},
        "customer": {"id": "cust-101", "city": "Mumbai"},
        "device": {"id": "dev-101"}
    }
    tx_headers = {
        "X-API-Key": rotated_key,
        "Content-Type": "application/json"
    }
    safe_tx_res = requests.post(ANALYZE_URL, headers=tx_headers, json=tx_payload_safe)
    if assert_status(safe_tx_res, 200, "Analyze Safe Transaction"):
        resp = safe_tx_res.json()
        print(f"  Response risk_score: {resp.get('risk_score')}, decision: {resp.get('decision')}, reasons: {resp.get('reasons')}")
        if "risk_score" in resp and "decision" in resp:
            print("  [PASS] Rich developer payload attributes found")
        else:
            print("  [FAIL] Missing developer payload attributes in response")

    # 5b. Fraudulent transaction (high score, should trigger alert)
    tx_payload_fraud = {
        "transaction_id": f"TEST-FRAUD-{uuid.uuid4().hex[:8].upper()}",
        "amount": 9999.00,
        "currency": "INR",
        "merchant": {"name": "High Value Electronics"},
        "customer": {"id": "cust-202", "city": "Delhi"},
        "device": {"id": "dev-202"}
    }
    fraud_tx_res = requests.post(ANALYZE_URL, headers=tx_headers, json=tx_payload_fraud)
    assert_status(fraud_tx_res, 200, "Analyze Fraudulent Transaction")
    fraud_resp = fraud_tx_res.json()
    print(f"  Fraud response risk_score: {fraud_resp.get('risk_score')}, decision: {fraud_resp.get('decision')}")

    # Give a tiny time buffer for DB async updates (though inserts are synchronous)
    time.sleep(0.5)

    # 6. Alert Triage Endpoints Testing
    print("\n6. Testing Alert Triage System Endpoints...")
    
    # 6a. Get alerts list
    alerts_res = requests.get(ALERTS_URL, headers=headers, cookies=cookies, params={"status": "open"})
    if assert_status(alerts_res, 200, "List Open Alerts"):
        alerts_list = alerts_res.json().get("alerts", [])
        total_alerts = alerts_res.json().get("total", 0)
        print(f"  Total open alerts in system: {total_alerts}")
        
        # Check if our generated fraudulent transaction triggered an alert
        matching_alert = next((a for a in alerts_list if a["transaction_id"] == tx_payload_fraud["transaction_id"]), None)
        if matching_alert:
            print(f"  [PASS] Automatic alert correctly generated for transaction {tx_payload_fraud['transaction_id']}")
            alert_id = matching_alert["id"]
        else:
            print(f"  [FAIL] No automatic alert found for transaction {tx_payload_fraud['transaction_id']}")
            alert_id = None
    else:
        alert_id = None

    if alert_id:
        # 6b. Get alert stats
        stats_res = requests.get(f"{ALERTS_URL}/stats", headers=headers, cookies=cookies)
        if assert_status(stats_res, 200, "Get Alerts Stats"):
            print(f"  Stats: {stats_res.json()}")

        # 6c. Get specific alert details
        detail_res = requests.get(f"{ALERTS_URL}/{alert_id}", headers=headers, cookies=cookies)
        if assert_status(detail_res, 200, "Get Alert Details"):
            detail_data = detail_res.json()
            print(f"  Alert Title: '{detail_data.get('title')}'")
            print(f"  Transaction Amount: {detail_data.get('transaction', {}).get('amount')}")
            print(f"  Timeline Activities: {len(detail_data.get('activities', []))}")
            if len(detail_data.get('activities', [])) > 0:
                print("  [PASS] Initial system activity logged correctly")
            else:
                print("  [FAIL] Missing initial activity log")

        # 6d. Update alert status (Triage transition)
        patch_res = requests.patch(f"{ALERTS_URL}/{alert_id}", headers=headers, cookies=cookies, json={
            "status": "in_review",
            "note": "Investigating high value transaction behavior."
        })
        if assert_status(patch_res, 200, "Transition Alert to In Review"):
            # Verify status in detail and check activity note
            detail_res2 = requests.get(f"{ALERTS_URL}/{alert_id}", headers=headers, cookies=cookies)
            if detail_res2.status_code == 200:
                det = detail_res2.json()
                if det.get("status") == "in_review" and len(det.get("activities", [])) >= 2:
                    print("  [PASS] Status updated and activity note logged in timeline")
                else:
                    print(f"  [FAIL] Failed to assert correct status/timeline logs: {det}")

        # 6e. Bulk Action Resolve
        bulk_res = requests.post(f"{ALERTS_URL}/bulk", headers=headers, cookies=cookies, json={
            "alert_ids": [alert_id],
            "action": "resolved"
        })
        if assert_status(bulk_res, 200, "Resolve Alert via Bulk Action"):
            # Confirm is resolved
            detail_res3 = requests.get(f"{ALERTS_URL}/{alert_id}", headers=headers, cookies=cookies)
            if detail_res3.status_code == 200 and detail_res3.json().get("status") == "resolved":
                print("  [PASS] Alert verified resolved in database")
            else:
                print("  [FAIL] Alert not resolved")

    # 7. Revoke original API key
    print("\n7. Testing API Key Revocation...")
    revoke_res = requests.delete(f"{API_KEYS_URL}/{key_id}", headers=headers, cookies=cookies)
    if assert_status(revoke_res, 200, "Revoke Original API Key"):
        # Verify it can no longer be rotated
        try_rotate_res = requests.post(f"{API_KEYS_URL}/{key_id}/rotate", headers=headers, cookies=cookies)
        if try_rotate_res.status_code == 404:
            print("  [PASS] Revoked API key correctly rejected for rotation")
        else:
            print(f"  [FAIL] Revoked API key allowed rotation request: {try_rotate_res.status_code}")

    # 8. Cleanup - Revoke the rotated key too
    print("\n8. Cleaning up rotated API Key...")
    requests.delete(f"{API_KEYS_URL}/{rotated_id}", headers=headers, cookies=cookies)

    # 9. Original endpoint smoke testing
    print("\n9. Testing Original endpoints (Transactions, Stats, Export)...")
    
    txs_res = requests.get(TRANSACTIONS_URL, headers=headers, cookies=cookies)
    assert_status(txs_res, 200, "GET /transactions list")
    
    analytics_stats_res = requests.get(STATS_URL, headers=headers, cookies=cookies)
    assert_status(analytics_stats_res, 200, "GET /analytics/stats")
    
    export_res = requests.get(EXPORT_URL, headers=headers, cookies=cookies)
    assert_status(export_res, 200, "GET /analytics/export CSV")
    
    health_res = requests.get(HEALTH_URL)
    metrics_res = requests.get(METRICS_URL)
    if health_res.status_code == 200 and metrics_res.status_code == 200:
        print("  [PASS] Health & Prometheus Metrics endpoints responsive")
    else:
        print(f"  [FAIL] Health/Metrics failed: health={health_res.status_code}, metrics={metrics_res.status_code}")

    # 10. Emergency Lockdown test (Lifted at end)
    if user_role == "owner":
        print("\n10. Testing Emergency Lockdown Mechanism...")
        lock_res = requests.post(LOCKDOWN_URL, headers=headers, cookies=cookies)
        if assert_status(lock_res, 200, "Lockdown Triggered"):
            # Verify system blocks requests
            blocked_health_res = requests.get(HEALTH_URL)
            if blocked_health_res.status_code == 503:
                print("  [PASS] System returned 503 during lockdown")
            else:
                print(f"  [WARNING] Health endpoint returned {blocked_health_res.status_code} during lockdown")
            
            # Lift lockdown
            unlock_res = requests.post(DISABLE_LOCKDOWN_URL, headers=headers, cookies=cookies)
            if assert_status(unlock_res, 200, "Lockdown Deactivated"):
                post_health_res = requests.get(HEALTH_URL)
                assert_status(post_health_res, 200, "System restored to normal operation")

    print("\n=== INTEGRATION TESTS COMPLETED ===")

if __name__ == "__main__":
    run_tests()
