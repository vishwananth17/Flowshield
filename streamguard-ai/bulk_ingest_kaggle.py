import os
import pandas as pd
import requests
import json
import time
import random

# Configuration
API_URL = "https://flowshield-backend-ani8.onrender.com/api/v1"
API_KEY = "sg_live_GgN9Y3I5vdUKgvuEhcYq6Wn6XQPYNAKa" 

def bulk_ingest():
    print("INITIALIZING BULK KAGGE INGESTION...")
    
    try:
        import kagglehub
        path = kagglehub.dataset_download("mlg-ulb/creditcardfraud")
        csv_path = os.path.join(path, "creditcard.csv")
        df = pd.read_csv(csv_path)
        print(f"Loaded {len(df)} transactions from Kaggle.")
        
        fraud_samples = df[df['Class'] == 1].head(25)
        legit_samples = df[df['Class'] == 0].head(25)
        test_set = pd.concat([fraud_samples, legit_samples]).sample(frac=1).reset_index(drop=True)
        
    except Exception as e:
        print(f"Kagglehub not available or error: {e}. Falling back to high-fidelity simulation...")
        # Emergency Simulation logic
        data = []
        for i in range(20):
            is_fraud = random.choice([0, 1])
            data.append({
                "Time": i * 100,
                "Amount": random.uniform(5, 500) if is_fraud == 0 else random.uniform(5000, 150000),
                "Class": is_fraud
            })
        test_set = pd.DataFrame(data)

    print(f"Sending {len(test_set)} data points to Production...")

    success_count = 0
    for i, row in test_set.iterrows():
        payload = {
            "transaction_id": f"BULK_{int(row['Time'])}_{i}",
            "amount": float(row['Amount']),
            "currency": "USD",
            "merchant": {
                "id": "m_global",
                "name": "Marketplace" if row['Class'] == 0 else "High-Risk Terminal",
                "category": "5411",
                "country": "US"
            },
            "card": {
                "last_four": str(random.randint(1000, 9999)),
                "type": "credit",
                "issuing_country": "US"
            },
            "customer": {
                "id": f"c_user_{i}",
                "email": f"tester_{i}@flowshield.ai",
                "country": "US" if row['Class'] == 0 else "RU",
                "ip": "1.1.1.1" if row['Class'] == 0 else "104.28.1.1"
            },
            "channel": "web"
        }

        try:
            headers = {"X-API-Key": API_KEY, "Content-Type": "application/json"}
            resp = requests.post(f"{API_URL}/transactions/analyze", json=payload, headers=headers)
            
            if resp.status_code == 200:
                data = resp.json()
                decision = data.get("decision", "unknown").upper()
                print(f"[{i+1}/{len(test_set)}] Amount: ${row['Amount']:.2f} | Result: {decision}")
                success_count += 1
            else:
                try:
                    error_detail = resp.json()
                    print(f"[{i+1}/{len(test_set)}] Failed: {resp.status_code} - {error_detail}")
                except:
                    print(f"[{i+1}/{len(test_set)}] Failed: {resp.status_code} - {resp.text}")
            
            time.sleep(0.3) 
            
        except Exception as e:
            print(f"Error on row {i}: {e}")

    print(f"\nINGESTION COMPLETE: {success_count} transactions processed.")

if __name__ == "__main__":
    bulk_ingest()
