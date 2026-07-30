import time
import httpx

def main():
    print("Polling Render for version 1.0.2-live deployment...")
    for i in range(25):
        try:
            res = httpx.get("https://flowshield-backend-ani8.onrender.com/", timeout=10.0)
            data = res.json()
            ver = data.get("version")
            print(f"[{i+1}/25] Render version: {ver}")
            if ver == "1.0.2-live":
                print("==> Render is now running 1.0.2-live! Testing Shopify webhook...")
                payload = {
                    "id": "1001",
                    "name": "#MWE8LVEE0",
                    "total_price": "1.00",
                    "currency": "INR",
                    "customer": {"id": "99", "email": "bsvishwananth@gmail.com"},
                    "billing_address": {"country_code": "IN", "city": "Chennai"}
                }
                webhook_res = httpx.post(
                    "https://flowshield-backend-ani8.onrender.com/api/v1/webhooks/shopify?api_key=sg_live_1yJW7SSB9p2hYLYLKHMUBJEZVd3yuNfc",
                    json=payload,
                    timeout=30.0
                )
                print("WEBHOOK STATUS:", webhook_res.status_code)
                print("WEBHOOK RESPONSE:", webhook_res.json())
                return
        except Exception as e:
            print(f"[{i+1}/25] Waiting... ({e})")
        time.sleep(10)

if __name__ == "__main__":
    main()
