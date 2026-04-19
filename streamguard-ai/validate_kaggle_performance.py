import os
import pandas as pd
import requests
import json
import time
from sklearn.metrics import roc_auc_score, recall_score, precision_score, f1_score

# Environment Setup
API_URL = "https://flowshield-backend-ani8.onrender.com/api/v1"
API_KEY = "sg_live_GgN9Y3I5vdUKgvuEhcYq6Wn6XQPYNAKa"

def validate_performance():
    print("STARTING REAL-WORLD PERFORMANCE AUDIT (KAGGLE DATASET)...")
    
    try:
        import kagglehub
        path = kagglehub.dataset_download("mlg-ulb/creditcardfraud")
        csv_path = os.path.join(path, "creditcard.csv")
        df = pd.read_csv(csv_path)
    except Exception as e:
        print(f"❌ Kaggle data not found locally: {e}")
        return

    # Select Balanced Test Set for Forensic Accuracy
    fraud_set = df[df['Class'] == 1].sample(100, random_state=42)
    legit_set = df[df['Class'] == 0].sample(100, random_state=42)
    test_set = pd.concat([fraud_set, legit_set]).sample(frac=1).reset_index(drop=True)
    
    print(f"Dataset Loaded. Running 200 adversarial inferences against {API_URL}...")
    
    y_true = []
    y_scores = []
    y_pred = []
    latencies = []

    headers = {"X-API-Key": API_KEY, "Content-Type": "application/json"}
    
    for i, row in test_set.iterrows():
        payload = {
            "transaction_id": f"PERF_TEST_{i}",
            "amount": float(row['Amount']),
            "currency": "EUR", # Testing cross-currency logic
            "merchant": {
                "id": "m_perf_test",
                "name": "Validation Terminal",
                "category": "6012",
                "country": "BE"
            },
            "card": {
                "last_four": "1234",
                "type": "credit",
                "issuing_country": "BE"
            },
            "customer": {
                "id": f"c_{i}",
                "email": f"test_{i}@flowshield.ai",
                "country": "BE",
                "ip": "1.2.3.4"
            },
            "channel": "web"
        }

        try:
            start = time.perf_counter()
            resp = requests.post(f"{API_URL}/transactions/analyze", json=payload, headers=headers)
            latencies.append((time.perf_counter() - start) * 1000)
            
            if resp.status_code == 200:
                data = resp.json()
                y_true.append(row['Class'])
                y_scores.append(data['risk_score'])
                y_pred.append(1 if data['decision'] != 'allow' else 0)
                
                status = "FRAUD" if row['Class'] == 1 else "LEGIT"
                match = "[PASS]" if y_pred[-1] == y_true[-1] else "[FAIL]"
                print(f"[{i+1}/200] Ground Truth: {status} | AI: {data['decision'].upper()} {match} | Score: {data['risk_score']:.3f}")
            else:
                print(f"Error: {resp.status_code}")
                
            time.sleep(0.1) # Protect endpoint from rate limits
            
        except Exception as e:
            print(f"Request failed: {e}")

    # Calculate Enterprise Metrics
    auc = roc_auc_score(y_true, y_scores)
    recall = recall_score(y_true, y_pred)
    precision = precision_score(y_true, y_pred)
    f1 = f1_score(y_true, y_pred)
    p95_lat = sorted(latencies)[int(len(latencies) * 0.95)]

    print("\n" + "="*50)
    print("FLOWSHIELD AI PERFORMANCE SCORECARD (V1.3)")
    print("="*50)
    print(f"ROC AUC:    {auc:.4f}")
    print(f"RECALL:     {recall*100:.1f}%")
    print(f"PRECISION:  {precision*100:.1f}%")
    print(f"F1 SCORE:   {f1:.4f}")
    print(f"P95 LATENCY: {p95_lat:.1f}ms")
    print("="*50)

if __name__ == "__main__":
    validate_performance()
