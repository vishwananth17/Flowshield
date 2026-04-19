import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import (roc_auc_score, recall_score, 
    f1_score, confusion_matrix, classification_report)
from sklearn.ensemble import IsolationForest as SklearnIF
import joblib, json, time, os

from algorithms.mviforest import MVIForest

FEATURE_COLUMNS = [
    'amount_inr', 'hour_of_day', 'day_of_week', 'is_weekend',
    'tx_count_last_1h', 'tx_count_last_24h', 'amount_sum_last_1h',
    'amount_vs_avg_ratio', 'ip_country_match', 'card_country_match',
    'is_new_device', 'merchant_risk_score', 'mcc_risk_tier', 
    'is_night', 'device_age_days', 'unique_merchants_24h',
    'is_first_transaction'
]

def load_and_preprocess():
    df = pd.read_csv('data/fraud_dataset.csv')
    
    X = df[FEATURE_COLUMNS].values
    y = df['is_fraud'].values
    
    # Log-transform amount features (reduces skew)
    amount_indices = [0, 6]  # amount_inr, amount_sum_last_1h
    for idx in amount_indices:
        X[:, idx] = np.log1p(X[:, idx])
        
    # Scale features to [0, 1] range
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    return X_scaled, y, scaler

def evaluate_model(model, X_test, y_test, model_name):
    """
    Evaluate using paper metrics: ROC AUC, Recall,
    Specificity, FAR, F1 Score
    """
    start = time.time()
    # sklearn IsolationForest.score_samples returns negative scores
    # our MVIForest also returns negative scores for compatibility
    scores = -model.score_samples(X_test)  # higher = more anomalous
    latency = (time.time() - start) * 1000
    
    # Convert scores to binary predictions using threshold
    threshold = np.percentile(scores, 99)  # top 1% = fraud
    y_pred = (scores > threshold).astype(int)
    
    # Paper metrics
    tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
    far = fp / (fp + tn) if (fp + tn) > 0 else 0
    roc_auc = roc_auc_score(y_test, scores)
    f1 = f1_score(y_test, y_pred)
    
    print(f"\n{'='*50}")
    print(f"Model: {model_name}")
    print(f"{'='*50}")
    print(f"ROC AUC:     {roc_auc:.4f}")
    print(f"Recall:      {recall:.4f}  (fraud detection rate)")
    print(f"Specificity: {specificity:.4f} (normal correct rate)")
    print(f"FAR:         {far:.4f}   (false alarm rate)")
    print(f"F1 Score:    {f1:.4f}")
    print(f"Latency:     {latency:.1f}ms for {len(X_test)} samples")
    print(f"Per-sample:  {latency/len(X_test)*1000:.2f}µs")
    
    return {
        "model": model_name,
        "roc_auc": round(float(roc_auc), 4),
        "recall": round(float(recall), 4),
        "specificity": round(float(specificity), 4),
        "far": round(float(far), 4),
        "f1_score": round(float(f1), 4),
        "latency_ms": round(float(latency), 2),
    }

def train():
    print("Loading dataset...")
    X, y, scaler = load_and_preprocess()
    
    # Paper approach: train on ALL data (including anomalies)
    # Split: 80% train, 20% test — labels only used for evaluation
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, 
        stratify=y  # maintain fraud ratio in both splits
    )
    print(f"Train: {len(X_train)}, Test: {len(X_test)}")
    print(f"Fraud in test: {y_test.sum()} ({y_test.mean()*100:.1f}%)")
    
    results = []
    os.makedirs('models', exist_ok=True)
    
    # Model 1: sklearn IsolationForest (baseline)
    print("\nTraining sklearn IsolationForest (baseline)...")
    start = time.time()
    sklearn_if = SklearnIF(
        n_estimators=100,
        max_samples=256,
        contamination=0.01,
        random_state=42
    )
    sklearn_if.fit(X_train)
    print(f"  Training time: {time.time()-start:.2f}s")
    results.append(evaluate_model(sklearn_if, X_test, y_test, "IForest (sklearn)"))
    
    # Model 2: MVIForest (paper implementation)
    print("\nTraining MVIForest (paper implementation)...")
    start = time.time()
    mvi = MVIForest(
        n_estimators=100,
        sample_size=256,
        threshold=0.6,
        random_state=42
    )
    mvi.fit(X_train)
    print(f"  Training time: {time.time()-start:.2f}s")
    results.append(evaluate_model(mvi, X_test, y_test, "MVIForest (paper)"))
    
    # Model 3: MVIForest tuned for fraud detection
    print("\nTraining MVIForest (tuned for fraud)...")
    start = time.time()
    mvi_tuned = MVIForest(
        n_estimators=100,
        sample_size=512,  # larger sample
        threshold=0.55,   # slightly lower threshold
        random_state=42
    )
    mvi_tuned.fit(X_train)
    print(f"  Training time: {time.time()-start:.2f}s")
    results.append(evaluate_model(mvi_tuned, X_test, y_test, "MVIForest (tuned)"))
    
    # Save the best performing model
    print("\nSaving models...")
    joblib.dump(sklearn_if, 'models/iforest_baseline.joblib')
    joblib.dump(mvi,        'models/mviforest_v1.joblib')
    joblib.dump(mvi_tuned,  'models/mviforest_tuned_v1.joblib')
    joblib.dump(scaler,     'models/feature_scaler.joblib')
    
    # Save training results
    with open('models/training_results_iforest.json', 'w') as f:
        json.dump({
            "results": results,
            "feature_columns": FEATURE_COLUMNS,
            "training_samples": len(X_train),
            "test_samples": len(X_test),
            "fraud_rate": float(y.mean()),
        }, f, indent=2)
        
    print("\nAll models saved to models/")
    print("\nComparison Summary:")
    for r in results:
        print(f"  {r['model']:30s} ROC AUC: {r['roc_auc']:.4f}  Recall: {r['recall']:.4f}  FAR: {r['far']:.4f}")

if __name__ == "__main__":
    train()
