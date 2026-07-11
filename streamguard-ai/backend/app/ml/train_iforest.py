import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import pandas as pd
import numpy as np
import joblib
import json
import time
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, confusion_matrix, recall_score, precision_score, average_precision_score
from sklearn.ensemble import IsolationForest as SklearnIF

from algorithms.mviforest import MVIForest
from features.feature_engineer import UnifiedFeatureEngineer

def load_and_preprocess():
    if not os.path.exists('data/fraud_dataset.csv'):
        print("Dataset missing! Run generate_fraud_dataset.py first.")
        sys.exit(1)
        
    df = pd.read_csv('data/fraud_dataset.csv')
    if 'currency' not in df.columns:
        df['currency'] = 'INR'
    else:
        df['currency'] = df['currency'].fillna('INR')
    
    # Create compound stratification key
    df['strat_key'] = df['is_fraud'].astype(str) + "_" + df['pattern_category'].astype(str)
    
    # 70/15/15 split
    X_temp, X_test_raw, y_temp, y_test = train_test_split(
        df, df['is_fraud'], test_size=0.15, random_state=42, stratify=df['strat_key']
    )
    X_train_raw, X_val_raw, y_train, y_val = train_test_split(
        X_temp, y_temp, test_size=0.1765, random_state=42, stratify=X_temp['strat_key']
    )
    
    # Build features
    engineer = UnifiedFeatureEngineer(None)
    X_train_df = engineer.build_training_matrix(X_train_raw.to_dict(orient='records'))
    X_val_df = engineer.build_training_matrix(X_val_raw.to_dict(orient='records'))
    X_test_df = engineer.build_training_matrix(X_test_raw.to_dict(orient='records'))
    
    # Scale features
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train_df.values)
    X_val = scaler.transform(X_val_df.values)
    X_test = scaler.transform(X_test_df.values)
    
    return X_train, X_val, X_test, y_train.values, y_val.values, y_test.values, X_test_raw, scaler

def evaluate_anomaly_detector(model, X_test, y_test, model_name):
    """Evaluate using fraud-specific metrics at top 1% threshold"""
    start = time.time()
    scores = -model.score_samples(X_test)
    latency = (time.time() - start) * 1000
    
    # Top 1% as anomalies
    threshold = np.percentile(scores, 98.6) # matches fraud rate ~1.4%
    y_pred = (scores >= threshold).astype(int)
    
    tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
    recall = recall_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, zero_division=0)
    roc_auc = roc_auc_score(y_test, scores)
    pr_auc = average_precision_score(y_test, scores)
    
    genuine_count = tn + fp
    false_block_rate = (fp / genuine_count) if genuine_count > 0 else 0.0
    
    print(f"\n{'='*50}")
    print(f"Model: {model_name}")
    print(f"{'='*50}")
    print(f"ROC AUC:           {roc_auc:.4f}")
    print(f"PR AUC:            {pr_auc:.4f}")
    print(f"Recall (Fraud):    {recall*100:.2f}%  ({tp}/{tp+fn} caught)")
    print(f"Precision (Block): {precision*100:.2f}%")
    print(f"False Block Rate:  {false_block_rate*100:.3f}%  (target < 0.5%)")
    print(f"Latency:           {latency:.1f}ms for {len(X_test)} samples")
    
    return {
        "model": model_name,
        "roc_auc": round(float(roc_auc), 4),
        "pr_auc": round(float(pr_auc), 4),
        "recall": round(float(recall), 4),
        "precision": round(float(precision), 4),
        "false_block_rate": round(float(false_block_rate), 4),
        "latency_ms": round(float(latency), 2),
    }

def main():
    print("Loading and preprocessing dataset...")
    X_train, X_val, X_test, y_train, y_val, y_test, X_test_raw, scaler = load_and_preprocess()
    
    print(f"Train: {len(X_train)}, Val: {len(X_val)}, Test: {len(X_test)}")
    
    # 4. Re-tune sample_size and threshold parameters
    print("\nSweeping hyperparameter candidates for MVIForest on validation split...")
    best_val_auc = 0
    best_params = {"sample_size": 256, "threshold": 0.60}
    
    for ss in [256, 512]:
        for th in [0.50, 0.55, 0.60]:
            mvi_temp = MVIForest(n_estimators=100, sample_size=ss, threshold=th, random_state=42)
            mvi_temp.fit(X_train)
            scores = -mvi_temp.score_samples(X_val)
            auc = roc_auc_score(y_val, scores)
            print(f"  sample_size={ss:3d}, threshold={th:.2f} -> Val ROC AUC: {auc:.4f}")
            if auc > best_val_auc:
                best_val_auc = auc
                best_params = {"sample_size": ss, "threshold": th}
                
    print(f"Best Tuning Configuration: {best_params} (Val ROC-AUC: {best_val_auc:.4f})")
    
    # Fit final models
    print("\nFitting final models...")
    sklearn_if = SklearnIF(n_estimators=100, max_samples=best_params["sample_size"], contamination=0.014, random_state=42)
    sklearn_if.fit(X_train)
    
    mvi = MVIForest(n_estimators=100, sample_size=256, threshold=0.60, random_state=42)
    mvi.fit(X_train)
    
    mvi_tuned = MVIForest(n_estimators=100, sample_size=best_params["sample_size"], threshold=best_params["threshold"], random_state=42)
    mvi_tuned.fit(X_train)
    
    # Evaluate
    results = []
    results.append(evaluate_anomaly_detector(sklearn_if, X_test, y_test, "IForest (sklearn)"))
    results.append(evaluate_anomaly_detector(mvi, X_test, y_test, "MVIForest (paper baseline)"))
    results.append(evaluate_anomaly_detector(mvi_tuned, X_test, y_test, "MVIForest (tuned)"))
    
    # Per-pattern evaluation on untouched test set for MVIForest (Tuned)
    print("\nEvaluating MVIForest anomaly detection rate per pattern...")
    test_scores = -mvi_tuned.score_samples(X_test)
    test_thresh = np.percentile(test_scores, 98.6)
    
    test_df_eval = X_test_raw.copy()
    test_df_eval['pred_anomaly'] = (test_scores >= test_thresh).astype(int)
    
    patterns = test_df_eval['pattern_category'].unique()
    per_pattern_perf = {}
    
    print("\nMVIForest Per-Pattern Detection Breakdown:")
    for pattern in patterns:
        sub = test_df_eval[test_df_eval['pattern_category'] == pattern]
        total_count = len(sub)
        flagged = sub['pred_anomaly'].sum()
        flagged_rate = flagged / total_count
        
        is_fraud_pat = sub['is_fraud'].iloc[0] == 1
        pat_type = "fraud" if is_fraud_pat else "safe"
        
        per_pattern_perf[pattern] = {
            "type": pat_type,
            "total_count": int(total_count),
            "flagged_rate": round(float(flagged_rate), 4)
        }
        
        if pat_type == "fraud":
            print(f"  Fraud Pattern '{pattern}': Unsupervised Anomaly Flag Rate = {flagged_rate*100:.1f}%")
        else:
            print(f"  Safe Edge Case '{pattern}': False Flagged Rate = {flagged_rate*100:.1f}% (target: lower is better)")
            
    # Save artifacts
    print("\nSaving MVIForest artifacts...")
    os.makedirs('models', exist_ok=True)
    joblib.dump(sklearn_if, 'models/iforest_baseline.joblib')
    joblib.dump(mvi,        'models/mviforest_v1.joblib')
    joblib.dump(mvi_tuned,  'models/mviforest_tuned_v1.joblib')
    joblib.dump(scaler,     'models/feature_scaler.joblib')
    
    with open('models/training_results_iforest.json', 'w') as f:
        json.dump({
            "results": results,
            "best_params": best_params,
            "per_pattern_performance": per_pattern_perf,
            "training_samples": len(X_train),
            "test_samples": len(X_test),
        }, f, indent=2)
        
    print("\nAll models saved to models/")

if __name__ == "__main__":
    main()
