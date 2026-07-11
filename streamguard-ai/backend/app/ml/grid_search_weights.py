import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import numpy as np
import pandas as pd
import joblib
from sklearn.metrics import roc_auc_score, average_precision_score, confusion_matrix, recall_score
from features.feature_engineer import UnifiedFeatureEngineer

def main():
    if not os.path.exists('data/fraud_dataset.csv'):
        print("Dataset missing! Run generate_fraud_dataset.py first.")
        sys.exit(1)
        
    df = pd.read_csv('data/fraud_dataset.csv')
    df['currency'] = df.get('currency', 'INR').fillna('INR')
    
    # 70/15/15 split - get the validation set
    df['strat_key'] = df['is_fraud'].astype(str) + "_" + df['pattern_category'].astype(str)
    from sklearn.model_selection import train_test_split
    X_temp, X_test_raw, y_temp, y_test = train_test_split(
        df, df['is_fraud'], test_size=0.15, random_state=42, stratify=df['strat_key']
    )
    X_train_raw, X_val_raw, y_train, y_val = train_test_split(
        X_temp, y_temp, test_size=0.1765, random_state=42, stratify=X_temp['strat_key']
    )
    
    # Load models
    xgb_model = joblib.load('models/xgboost_fraud_v1.joblib')
    mvi_model = joblib.load('models/mviforest_tuned_v1.joblib')
    scaler = joblib.load('models/feature_scaler.joblib')
    engineer = joblib.load('models/feature_engineer_v1.joblib')
    
    # Extract features on validation set
    X_val_df = engineer.build_training_matrix(X_val_raw.to_dict(orient='records'))
    
    # Get scores
    xgb_scores = xgb_model.predict_proba(X_val_df.values)[:, 1]
    
    # MVIForest scores require scaling
    X_val_scaled = scaler.transform(X_val_df.values)
    mvi_scores = -mvi_model.score_samples(X_val_scaled)
    # Scale MVI scores to 0-1
    mvi_scores = (mvi_scores - mvi_scores.min()) / (mvi_scores.max() - mvi_scores.min() + 1e-9)
    
    y_val_labels = y_val.values
    
    print("Running Ensemble Weight Grid Search...")
    print(f"{'Weight XGB':12s} | {'Weight MVI':12s} | {'Best Thresh':12s} | {'False Block Rate':18s} | {'Recall':10s}")
    print("-" * 75)
    
    best_recall = 0
    best_weights = (0.75, 0.25)
    best_thresh = 0.50
    best_fbr = 0.0
    
    for w_xgb in np.arange(0.0, 1.01, 0.05):
        w_mvi = 1.0 - w_xgb
        combined_scores = w_xgb * xgb_scores + w_mvi * mvi_scores
        
        # Sweep thresholds to find the best recall under FBR < 0.5%
        best_t_recall = 0
        best_t_thresh = 0.5
        best_t_fbr = 1.0
        
        for t in np.arange(0.05, 0.96, 0.01):
            y_pred = (combined_scores >= t).astype(int)
            tn, fp, fn, tp = confusion_matrix(y_val_labels, y_pred).ravel()
            
            fbr = fp / (tn + fp) if (tn + fp) > 0 else 0.0
            rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
            
            if fbr < 0.005:  # Constraint: False Block Rate < 0.5%
                if rec > best_t_recall:
                    best_t_recall = rec
                    best_t_thresh = t
                    best_t_fbr = fbr
                    
        print(f"{w_xgb:12.2f} | {w_mvi:12.2f} | {best_t_thresh:12.2f} | {best_t_fbr*100:17.3f}% | {best_t_recall*100:9.1f}%")
        
        if best_t_recall > best_recall:
            best_recall = best_t_recall
            best_weights = (w_xgb, w_mvi)
            best_thresh = best_t_thresh
            best_fbr = best_t_fbr
            
    print("\n" + "="*50)
    print("Optimal Ensemble Weights:")
    print(f"  XGBoost:   {best_weights[0]:.2f}")
    print(f"  MVIForest: {best_weights[1]:.2f}")
    print(f"  Optimal Decision Threshold: {best_thresh:.2f}")
    print(f"  Recall at <0.5% False Block Rate: {best_recall*100:.1f}% (FBR: {best_fbr*100:.3f}%)")
    print("="*50)

if __name__ == "__main__":
    main()
