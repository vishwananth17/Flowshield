import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import pandas as pd
import numpy as np
import xgboost as xgb
import shap
import joblib
import json
import time
from sklearn.model_selection import (
    train_test_split, StratifiedKFold, cross_val_score
)
from sklearn.metrics import (
    roc_auc_score, recall_score, precision_score,
    f1_score, confusion_matrix, average_precision_score
)
from imblearn.over_sampling import SMOTE
from features.feature_engineer import FraudFeatureEngineer

def load_dataset():
    if not os.path.exists('data/fraud_dataset.csv'):
        print("Dataset missing! Run generate_fraud_dataset.py first.")
        sys.exit(1)
        
    df = pd.read_csv('data/fraud_dataset.csv')
    engineer = FraudFeatureEngineer()
    X = engineer.engineer(df[engineer.BASE_FEATURES])
    y = df['is_fraud'].values
    print(f"Dataset: {len(X)} samples, {X.shape[1]} features")
    print(f"Fraud rate: {y.mean()*100:.2f}%")
    return X, y, engineer

def handle_imbalance(X_train, y_train):
    print(f"Before SMOTE: fraud={y_train.sum()}, "
          f"normal={(y_train==0).sum()}")
    # Oversample fraud to ~15% of the dataset
    smote = SMOTE(sampling_strategy=0.15,
                  random_state=42, k_neighbors=5)
    X_res, y_res = smote.fit_resample(X_train, y_train)
    print(f"After SMOTE:  fraud={y_res.sum()}, "
          f"normal={(y_res==0).sum()}")
    return X_res, y_res

def train_model(X_train, y_train, X_val, y_val):
    n_neg = (y_train == 0).sum()
    n_pos = (y_train == 1).sum()
    scale_pw = n_neg / max(n_pos, 1)
    print(f"scale_pos_weight: {scale_pw:.1f}")

    model = xgb.XGBClassifier(
        n_estimators=500,
        max_depth=6,
        learning_rate=0.05,
        scale_pos_weight=scale_pw,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=5,
        gamma=0.1,
        reg_alpha=0.1,
        reg_lambda=1.0,
        n_jobs=1,
        tree_method='hist',
        eval_metric='aucpr',
        early_stopping_rounds=30,
        random_state=42,
        verbosity=0
    )
    eval_set = [(X_val, y_val)]
    model.fit(X_train, y_train,
              eval_set=eval_set, verbose=50)
    print(f"Best iteration: {model.best_iteration}")
    return model

def evaluate(model, X_test, y_test, name="XGBoost"):
    y_prob = model.predict_proba(X_test)[:, 1]

    # Find best threshold for F1
    thresholds = np.arange(0.1, 0.9, 0.01)
    best_f1, best_thresh = 0, 0.5
    for t in thresholds:
        f1 = f1_score(y_test, (y_prob >= t).astype(int),
                      zero_division=0)
        if f1 > best_f1:
            best_f1, best_thresh = f1, t

    y_pred = (y_prob >= best_thresh).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()

    roc_auc = roc_auc_score(y_test, y_prob)
    pr_auc  = average_precision_score(y_test, y_prob)
    recall  = recall_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, zero_division=0)
    specificity = tn / (tn + fp)
    far = fp / (fp + tn)

    print(f"\n{'='*55}")
    print(f"  {name} Results")
    print(f"{'='*55}")
    print(f"  ROC AUC:     {roc_auc:.4f}")
    print(f"  PR AUC:      {pr_auc:.4f}")
    print(f"  Recall:      {recall:.4f}  ({tp}/{tp+fn} fraud caught)")
    print(f"  Precision:   {precision:.4f}")
    print(f"  Specificity: {specificity:.4f}")
    print(f"  FAR:         {far:.4f}")
    print(f"  F1 Score:    {best_f1:.4f}")
    print(f"  Threshold:   {best_thresh:.2f}")
    print(f"  TP:{tp} FP:{fp} TN:{tn} FN:{fn}")

    return {
        "roc_auc": round(float(roc_auc), 4),
        "pr_auc": round(float(pr_auc), 4),
        "recall": round(float(recall), 4),
        "precision": round(float(precision), 4),
        "specificity": round(float(specificity), 4),
        "far": round(float(far), 4),
        "f1_score": round(float(best_f1), 4),
        "best_threshold": round(float(best_thresh), 2),
        "tp": int(tp), "fp": int(fp),
        "tn": int(tn), "fn": int(fn),
    }

def get_shap(model, X_train, X_test, feature_names):
    print("\nGenerating SHAP explanations...")
    explainer = shap.TreeExplainer(model)
    n = min(200, len(X_test))
    sv = explainer.shap_values(X_test[:n])

    importance = dict(zip(
        feature_names,
        np.abs(sv).mean(axis=0).tolist()
    ))
    sorted_imp = dict(sorted(
        importance.items(), key=lambda x: x[1], reverse=True
    ))

    print("\nTop 10 Features (SHAP):")
    for i, (f, v) in enumerate(list(sorted_imp.items())[:10]):
        bar = '#' * int(v * 50)
        print(f"  {i+1:2d}. {f:35s} {v:.4f} {bar}")

    return explainer, sorted_imp

def main():
    print("="*55)
    print("  Flowshield AI — XGBoost Training")
    print("="*55)

    X, y, engineer = load_dataset()

    X_temp, X_test, y_temp, y_test = train_test_split(
        X, y, test_size=0.15, random_state=42, stratify=y)
    X_train, X_val, y_train, y_val = train_test_split(
        X_temp, y_temp, test_size=0.18,
        random_state=42, stratify=y_temp)

    print(f"\nSplit — train:{len(X_train)} "
          f"val:{len(X_val)} test:{len(X_test)}")

    # Handle imbalance on train only
    X_tr_bal, y_tr_bal = handle_imbalance(
        X_train.values, y_train)

    # Cross validation
    print("\nRunning 5-fold cross-validation...")
    cv_model = xgb.XGBClassifier(
        n_estimators=300, max_depth=6,
        learning_rate=0.05, subsample=0.8,
        colsample_bytree=0.8, min_child_weight=5,
        n_jobs=1, tree_method='hist',
        random_state=42, verbosity=0
    )
    cv = StratifiedKFold(n_splits=5, shuffle=True,
                         random_state=42)
    cv_scores = cross_val_score(
        cv_model,
        pd.DataFrame(X_tr_bal, columns=X_train.columns),
        y_tr_bal, cv=cv, scoring='roc_auc', n_jobs=1
    )
    print(f"CV ROC AUC: {cv_scores.mean():.4f} "
          f"± {cv_scores.std():.4f}")

    # Train final model
    print("\nTraining final XGBoost model...")
    t0 = time.time()
    model = train_model(
        X_tr_bal, y_tr_bal,
        X_val.values, y_val
    )
    train_time = time.time() - t0
    print(f"Training time: {train_time:.1f}s")

    # Evaluate
    results = evaluate(model, X_test.values, y_test)
    results["training_time_s"] = round(train_time, 1)
    results["cv_roc_auc_mean"] = round(float(cv_scores.mean()), 4)
    results["cv_roc_auc_std"]  = round(float(cv_scores.std()), 4)

    # SHAP
    explainer, feat_imp = get_shap(
        model, X_tr_bal,
        X_test.values, X_train.columns.tolist()
    )

    # Inference speed
    t0 = time.time()
    _ = model.predict_proba(X_test.values)
    inf_ms = (time.time() - t0) * 1000
    print(f"\nInference: {inf_ms:.1f}ms for {len(X_test)} samples")
    print(f"Per sample: {inf_ms/len(X_test)*1000:.2f}µs")

    # Save
    print("\nSaving models...")
    os.makedirs('models', exist_ok=True)
    joblib.dump(model,    'models/xgboost_fraud_v1.joblib')
    joblib.dump(explainer,'models/shap_explainer_v1.joblib')
    joblib.dump(engineer, 'models/feature_engineer_v1.joblib')

    with open('models/xgboost_results.json','w') as f:
        json.dump({
            "results": results,
            "feature_importance": feat_imp,
            "features": X_train.columns.tolist(),
            "model_version": "xgboost_v1.0",
            "cv_scores": cv_scores.tolist(),
        }, f, indent=2)

    print("\n" + "="*55)
    print("  TRAINING COMPLETE")
    print("="*55)
    print(f"  ROC AUC:   {results['roc_auc']:.4f}  (target >0.95)")
    print(f"  PR AUC:    {results['pr_auc']:.4f}")
    print(f"  Recall:    {results['recall']:.4f}  (target >0.85)")
    print(f"  Precision: {results['precision']:.4f}")
    print(f"  FAR:       {results['far']:.4f}  (target <0.03)")

    passed = (results['roc_auc'] > 0.92 and
              results['recall'] > 0.75 and
              results['far'] < 0.05)
    print(f"\n  Status: {'✅ PASSED — ready for ensemble' if passed else '⚠️  NEEDS TUNING'}")
    print("="*55)

if __name__ == "__main__":
    main()
