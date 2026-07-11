import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import pandas as pd
import numpy as np
import xgboost as xgb
import shap
import joblib
import json
import time
import optuna
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import confusion_matrix, precision_score, recall_score, f1_score, average_precision_score, roc_auc_score
from sklearn.preprocessing import StandardScaler
from imblearn.over_sampling import SMOTE
from imblearn.combine import SMOTEENN
from features.feature_engineer import UnifiedFeatureEngineer

print("""
========================================================================
PART 0 — THE METRICS THAT ACTUALLY MATTER FOR FLOWSHIELD AI
========================================================================
- Accuracy is meaningless for fraud detection at a 1.38% base rate. A 
  dummy model predicting 'safe' 100% of the time achieves 98.62% accuracy
  but catches 0% of fraud.
- Precision represents: 'Of all alerts we block, how many are actually fraud?'
- Recall represents: 'Of all real fraud cases, how many did we catch?'
- Per-Tier Targets:
  * Block decisions require HIGH PRECISION (>95%) to prevent blocking
    genuine customers, which is extremely costly in business trust.
  * Review decisions can tolerate lower precision because they lead to
    a secondary inspection, reducing false blockages.
========================================================================
""")

def compute_fraud_metrics(y_true, y_prob, threshold):
    y_pred = (y_prob >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
    
    precision = precision_score(y_true, y_pred, zero_division=0)
    recall = recall_score(y_true, y_pred)
    f1 = f1_score(y_true, y_pred, zero_division=0)
    pr_auc = average_precision_score(y_true, y_prob)
    roc_auc = roc_auc_score(y_true, y_prob)
    
    # False Block Rate: FP / Total Genuine (TN + FP)
    genuine_count = tn + fp
    false_block_rate = (fp / genuine_count) if genuine_count > 0 else 0.0
    
    return {
        "precision": float(precision),
        "recall": float(recall),
        "f1": float(f1),
        "pr_auc": float(pr_auc),
        "roc_auc": float(roc_auc),
        "false_block_rate": float(false_block_rate),
        "true_block_count": int(tp),
        "false_block_count": int(fp),
        "true_allow_count": int(tn),
        "false_allow_count": int(fn)
    }

def load_dataset():
    if not os.path.exists('data/fraud_dataset.csv'):
        print("Dataset missing! Run generate_fraud_dataset.py first.")
        sys.exit(1)
        
    df = pd.read_csv('data/fraud_dataset.csv')
    if 'currency' not in df.columns:
        df['currency'] = 'INR'
    else:
        df['currency'] = df['currency'].fillna('INR')
    
    print(f"Loaded raw synthetic dataset: {len(df)} samples")
    return df

def main():
    df = load_dataset()
    
    # Create compound stratification key: is_fraud + pattern_category
    df['strat_key'] = df['is_fraud'].astype(str) + "_" + df['pattern_category'].astype(str)
    
    # 3.1 Stratified Split: 70% Train, 15% Val, 15% Test
    # Test set must never be touched during parameter/threshold tuning!
    X_temp, X_test_raw, y_temp, y_test_labels = train_test_split(
        df, df['is_fraud'], test_size=0.15, random_state=42, stratify=df['strat_key']
    )
    
    # Recompute strat keys for validation split
    X_train_raw, X_val_raw, y_train_labels, y_val_labels = train_test_split(
        X_temp, y_temp, test_size=0.1765, random_state=42, stratify=X_temp['strat_key']
    )
    
    print(f"Splits generated successfully:")
    print(f"  Train: {len(X_train_raw)} samples (Fraud: {y_train_labels.sum()})")
    print(f"  Val:   {len(X_val_raw)} samples (Fraud: {y_val_labels.sum()})")
    print(f"  Test:  {len(X_test_raw)} samples (Fraud: {y_test_labels.sum()})")
    
    # Extract features using UnifiedFeatureEngineer
    print("\nExtracting features using UnifiedFeatureEngineer...")
    engineer = UnifiedFeatureEngineer(None)
    X_train = engineer.build_training_matrix(X_train_raw.to_dict(orient='records'))
    X_val = engineer.build_training_matrix(X_val_raw.to_dict(orient='records'))
    X_test = engineer.build_training_matrix(X_test_raw.to_dict(orient='records'))
    
    # 3.2 Class Imbalance: SMOTE vs SMOTE-ENN comparison
    print("\nComparing SMOTE vs SMOTE-ENN balancing strategies...")
    smote = SMOTE(sampling_strategy=0.15, random_state=42, k_neighbors=5)
    X_train_smote, y_train_smote = smote.fit_resample(X_train, y_train_labels)
    
    smote_enn = SMOTEENN(sampling_strategy=0.15, random_state=42)
    X_train_senn, y_train_senn = smote_enn.fit_resample(X_train, y_train_labels)
    
    # Baseline comparison evaluation using default XGBoost
    base_xgb = xgb.XGBClassifier(tree_method='hist', random_state=42, verbosity=0)
    
    base_xgb.fit(X_train_smote, y_train_smote)
    prob_smote = base_xgb.predict_proba(X_val)[:, 1]
    metrics_smote = compute_fraud_metrics(y_val_labels, prob_smote, 0.5)
    
    base_xgb.fit(X_train_senn, y_train_senn)
    prob_senn = base_xgb.predict_proba(X_val)[:, 1]
    metrics_senn = compute_fraud_metrics(y_val_labels, prob_senn, 0.5)
    
    print("Balancing Metrics comparison (Validation set at 0.5 threshold):")
    print(f"  SMOTE:     PR-AUC={metrics_smote['pr_auc']:.4f}, False Block Rate={metrics_smote['false_block_rate']*100:.3f}%, Recall={metrics_smote['recall']*100:.1f}%")
    print(f"  SMOTE-ENN: PR-AUC={metrics_senn['pr_auc']:.4f}, False Block Rate={metrics_senn['false_block_rate']*100:.3f}%, Recall={metrics_senn['recall']*100:.1f}%")
    
    # Select best balancing strategy based on minimizing False Block Rate
    if metrics_senn['false_block_rate'] < metrics_smote['false_block_rate']:
        print("  -> Selecting SMOTE-ENN (lower False Block Rate)")
        X_train_bal, y_train_bal = X_train_senn, y_train_senn
        balancing_used = "SMOTE-ENN"
    else:
        print("  -> Selecting SMOTE (better/comparable False Block Rate)")
        X_train_bal, y_train_bal = X_train_smote, y_train_smote
        balancing_used = "SMOTE"

    # 3.3 Optuna Hyperparameter Search
    print("\nRunning Optuna Hyperparameter Search (50 trials)...")
    def objective(trial):
        params = {
            'n_estimators': trial.suggest_int('n_estimators', 100, 400),
            'max_depth': trial.suggest_int('max_depth', 4, 8),
            'learning_rate': trial.suggest_float('learning_rate', 0.02, 0.15, log=True),
            'min_child_weight': trial.suggest_int('min_child_weight', 2, 8),
            'subsample': trial.suggest_float('subsample', 0.7, 0.95),
            'colsample_bytree': trial.suggest_float('colsample_bytree', 0.7, 0.95),
            'scale_pos_weight': trial.suggest_float('scale_pos_weight', 1.0, 5.0),
            'tree_method': 'hist',
            'eval_metric': 'aucpr',
            'random_state': 42,
            'verbosity': 0
        }
        
        clf = xgb.XGBClassifier(**params)
        clf.fit(X_train_bal, y_train_bal)
        probs = clf.predict_proba(X_val)[:, 1]
        return average_precision_score(y_val_labels, probs)

    optuna.logging.set_verbosity(optuna.logging.WARNING)
    study = optuna.create_study(direction='maximize')
    study.optimize(objective, n_trials=50)
    best_params = study.best_params
    print(f"Best trial parameters: {best_params}")

    # 3.6 Cross Validation on balanced training set
    print("\nRunning 5-fold Stratified Cross-Validation on training set...")
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_clf = xgb.XGBClassifier(**best_params, tree_method='hist', random_state=42, verbosity=0)
    cv_scores = cross_val_score(cv_clf, X_train_bal, y_train_bal, cv=cv, scoring='average_precision')
    print(f"  PR-AUC across folds: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    # Train final model on entire training set
    print("\nTraining final XGBoost model...")
    final_model = xgb.XGBClassifier(**best_params, tree_method='hist', random_state=42, verbosity=0)
    final_model.fit(X_train_bal, y_train_bal)

    # 3.4 Threshold Sweeping (0.05 to 0.95) on validation set
    print("\nSweeping prediction thresholds on validation set...")
    val_probs = final_model.predict_proba(X_val)[:, 1]
    
    thresholds = np.arange(0.05, 0.96, 0.01)
    sweep_data = []
    
    block_threshold = 0.50
    review_threshold = 0.20
    
    # Target values search
    found_block = False
    for t in thresholds:
        metrics = compute_fraud_metrics(y_val_labels, val_probs, t)
        sweep_data.append({
            "threshold": round(float(t), 2),
            "false_block_rate": metrics["false_block_rate"],
            "recall": metrics["recall"],
            "precision": metrics["precision"]
        })
        
        # Block target: False Block Rate < 0.005 (0.5%) and block precision > 0.95
        if not found_block and metrics["false_block_rate"] < 0.005 and metrics["precision"] >= 0.95:
            block_threshold = round(float(t), 2)
            found_block = True
            
    # Review target: maximize recall (aim for block+review recall > 85%) while keeping false block low
    for t in thresholds:
        metrics = compute_fraud_metrics(y_val_labels, val_probs, t)
        if metrics["recall"] >= 0.85:
            review_threshold = round(float(t), 2)
            
    print(f"Recommended Decision thresholds:")
    print(f"  Block Threshold:  {block_threshold:.2f} (False Block Rate < 0.5%)")
    print(f"  Review Threshold: {review_threshold:.2f} (Fraud Recall > 85%)")

    # Evaluate final model on UNTOUCHED TEST SET
    print("\nPerforming Final Evaluation on Test Set...")
    test_probs = final_model.predict_proba(X_test)[:, 1]
    
    # Evaluate at the recommended Block Threshold
    final_metrics = compute_fraud_metrics(y_test_labels, test_probs, block_threshold)
    
    # Sweeps on test set to output the final results breakdown
    print("\n" + "="*55)
    print("  XGBoost Champion Final Test Set Metrics")
    print("="*55)
    print(f"  PR-AUC:             {final_metrics['pr_auc']:.4f}")
    print(f"  ROC-AUC:            {final_metrics['roc_auc']:.4f}")
    print(f"  Precision (Block):  {final_metrics['precision']*100:.2f}%  (target > 95%)")
    print(f"  Recall (Block):     {final_metrics['recall']*100:.2f}%")
    print(f"  False Block Rate:   {final_metrics['false_block_rate']*100:.3f}%  (target < 0.5%)")
    print(f"  True Block Count:   {final_metrics['true_block_count']}")
    print(f"  False Block Count:  {final_metrics['false_block_count']}")
    print(f"  True Allow Count:   {final_metrics['true_allow_count']}")
    print(f"  False Allow Count:  {final_metrics['false_allow_count']}")
    print("="*55)

    # 3.5 Per-Pattern-Category Evaluation
    print("\nEvaluating breakdown by Fraud Pattern Category on Test Set...")
    test_df_eval = X_test_raw.copy()
    test_df_eval['prob'] = test_probs
    test_df_eval['pred_block'] = (test_probs >= block_threshold).astype(int)
    test_df_eval['pred_review'] = (test_probs >= review_threshold).astype(int)
    
    patterns = test_df_eval['pattern_category'].unique()
    per_pattern_perf = {}
    
    for pattern in patterns:
        sub = test_df_eval[test_df_eval['pattern_category'] == pattern]
        total_pattern = len(sub)
        
        if sub['is_fraud'].iloc[0] == 1:
            # Fraud patterns: check recall
            blocked = sub['pred_block'].sum()
            reviewed = sub['pred_review'].sum()
            
            recall_block = blocked / total_pattern
            recall_combined = reviewed / total_pattern
            
            per_pattern_perf[pattern] = {
                "type": "fraud",
                "total_count": int(total_pattern),
                "recall_block": round(float(recall_block), 4),
                "recall_review_combined": round(float(recall_combined), 4)
            }
        else:
            # Safe pattern: check false block rate / allowed rate
            blocked = sub['pred_block'].sum()
            allowed = total_pattern - blocked
            allowed_rate = allowed / total_pattern
            blocked_rate = blocked / total_pattern
            
            per_pattern_perf[pattern] = {
                "type": "safe",
                "total_count": int(total_pattern),
                "allowed_rate": round(float(allowed_rate), 4),
                "blocked_rate": round(float(blocked_rate), 4)
            }
            
    print("\nDetailed Pattern breakdown:")
    for pat, metrics in per_pattern_perf.items():
        if metrics["type"] == "fraud":
            print(f"  Fraud Pattern '{pat}': Catch Rate (Block) = {metrics['recall_block']*100:.1f}%, Combined (Block/Review) = {metrics['recall_review_combined']*100:.1f}%")
        else:
            print(f"  Safe Edge Case '{pat}': Correctly Allowed Rate = {metrics['allowed_rate']*100:.1f}%, False Block Rate = {metrics['blocked_rate']*100:.1f}%")

    # Generate SHAP
    print("\nGenerating SHAP explanations...")
    explainer = shap.TreeExplainer(final_model)
    shap_vals = explainer.shap_values(X_test.values[:200])

    importance = dict(zip(X_train.columns.tolist(), np.abs(shap_vals).mean(axis=0).tolist()))
    sorted_imp = dict(sorted(importance.items(), key=lambda x: x[1], reverse=True))

    # Save outputs
    print("\nSaving final XGBoost artifacts...")
    os.makedirs('models', exist_ok=True)
    joblib.dump(final_model, 'models/xgboost_fraud_v1.joblib')
    joblib.dump(explainer,   'models/shap_explainer_v1.joblib')
    joblib.dump(engineer,    'models/feature_engineer_v1.joblib')
    
    # Formulate validation report JSON
    status = "READY_FOR_PRODUCTION"
    reasons = []
    
    if final_metrics["false_block_rate"] >= 0.005:
        status = "NEEDS_MORE_DATA"
        reasons.append("Overall False Block Rate is above 0.5% target.")
        
    for pat, metrics in per_pattern_perf.items():
        if metrics["type"] == "safe" and metrics["allowed_rate"] < 0.95:
            status = "NEEDS_MORE_DATA"
            reasons.append(f"Safe Edge Case '{pat}' correctly allowed rate ({metrics['allowed_rate']*100:.1f}%) is below 95% target.")
            
    report = {
        "dataset_size": int(len(df)),
        "fraud_rate": float(df['is_fraud'].mean()),
        "overall_metrics": final_metrics,
        "per_pattern_performance": per_pattern_perf,
        "recommended_thresholds": {
            "block_threshold": float(block_threshold),
            "review_threshold": float(review_threshold)
        },
        "balancing_used": balancing_used,
        "status": status,
        "specific_gaps": reasons
    }
    
    with open('models/xgboost_results.json', 'w') as f:
        json.dump(report, f, indent=2)
        
    print("\nReport summary saved to models/xgboost_results.json")
    print(f"Final Model Status: {status}")
    if reasons:
        print("Gaps identified:")
        for r in reasons:
            print(f"  - {r}")

if __name__ == "__main__":
    main()
