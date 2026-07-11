import os
import sys
import time
import datetime
import logging
import joblib
import numpy as np
import pandas as pd
import xgboost as xgb
from decimal import Decimal
from sklearn.model_selection import train_test_split
from sklearn.metrics import average_precision_score, roc_auc_score
from imblearn.over_sampling import SMOTE
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

# Make sure app/ml is in python path so joblib can deserialize features.*
ml_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'ml')
sys.path.insert(0, os.path.abspath(ml_dir))

from app.models.transaction import Transaction
from app.models.model_registry import ModelRegistry
from app.ml.features.feature_engineer import UnifiedFeatureEngineer

logger = logging.getLogger(__name__)

class RetrainService:
    @classmethod
    async def retrain_model_pipeline(cls, db: AsyncSession) -> dict:
        """Pulls resolved feedback, engineers features, trains a challenger XGBoost model, and registers it."""
        start_time = time.time()
        ml_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'ml')
        models_dir = os.path.join(ml_dir, 'models')
        dataset_path = os.path.join(ml_dir, 'data', 'fraud_dataset.csv')
        
        # 1. Fetch resolved production transactions (is_confirmed_fraud is not None)
        stmt = select(Transaction).where(Transaction.is_confirmed_fraud.isnot(None))
        res = await db.execute(stmt)
        resolved_txs = res.scalars().all()
        
        logger.info(f"Retrieved {len(resolved_txs)} resolved production feedback records.")
        if len(resolved_txs) < 5:
            # We need a small pool of actual production feedback to make retraining meaningful
            logger.info("Fewer than 5 resolved production feedback records — retraining skipped.")
            return {"status": "skipped", "message": "Insufficient feedback records to retrain"}

        # 2. Extract features from resolved feedback using UnifiedFeatureEngineer
        eng_path = os.path.join(models_dir, 'feature_engineer_v1.joblib')
        if not os.path.exists(eng_path):
            logger.error("Feature engineer binary missing — cannot compile features.")
            return {"status": "error", "message": "Feature engineer binary missing"}
            
        engineer = joblib.load(eng_path)
        
        prod_rows = []
        for tx in resolved_txs:
            prod_rows.append({
                "amount": float(tx.amount),
                "currency": tx.currency,
                "merchant_category": tx.merchant_category,
                "channel": tx.channel,
                "card_type": tx.card_type,
                "customer_country": tx.customer_country,
                "is_vpn_or_hosting": 1 if "vpn" in str(tx.fraud_reasons).lower() else 0,
                # defaults
                "is_webview": 0,
                "is_bot_user_agent": 0,
                "is_fingerprint_missing": 1 if not tx.device_fingerprint else 0,
                "ip_country_match": 1 if tx.customer_country == tx.customer_country else 0
            })
            
        prod_features_df = engineer.build_training_matrix(prod_rows)
        prod_labels = np.array([1 if tx.is_confirmed_fraud else 0 for tx in resolved_txs])
        
        # 3. Load baseline synthetic dataset
        if not os.path.exists(dataset_path):
            logger.error("Baseline training dataset missing.")
            return {"status": "error", "message": "Baseline dataset missing"}
            
        baseline_raw = pd.read_csv(dataset_path)
        baseline_df = engineer.build_training_matrix(baseline_raw.to_dict(orient='records'))
        baseline_labels = baseline_raw['is_fraud'].values
        
        # Keep intersection of features
        features_cols = [c for c in engineer.BASE_FEATURES if c in prod_features_df.columns and c in baseline_df.columns]
        
        X_prod = prod_features_df[features_cols].values
        X_base = baseline_df[features_cols].values
        
        # Oversample production feedback by 5x weight
        X_prod_oversampled = np.repeat(X_prod, 5, axis=0)
        y_prod_oversampled = np.repeat(prod_labels, 5, axis=0)
        
        # Merge baseline and oversampled feedback
        X_combined = np.vstack([X_base, X_prod_oversampled])
        y_combined = np.concatenate([baseline_labels, y_prod_oversampled])
        
        # Split into train & validation sets
        X_train, X_val, y_train, y_val = train_test_split(X_combined, y_combined, test_size=0.15, random_state=42, stratify=y_combined)
        
        # Handle SMOTE
        smote = SMOTE(random_state=42)
        X_train_res, y_train_res = smote.fit_resample(X_train, y_train)
        
        # 4. Train challenger XGBoost model using tuned hyperparameters
        challenger_params = {
            'n_estimators': 284,
            'max_depth': 8,
            'learning_rate': 0.0344,
            'min_child_weight': 2,
            'subsample': 0.909,
            'colsample_bytree': 0.928,
            'scale_pos_weight': 2.108,
            'random_state': 42
        }
        
        challenger = xgb.XGBClassifier(**challenger_params)
        challenger.fit(X_train_res, y_train_res)
        
        # Evaluate challenger on validation set
        val_probs = challenger.predict_proba(X_val)[:, 1]
        challenger_pr_auc = float(average_precision_score(y_val, val_probs))
        challenger_roc_auc = float(roc_auc_score(y_val, val_probs))
        
        # 5. Fetch current champion details
        champion_stmt = select(ModelRegistry).where(ModelRegistry.status == "active")
        champ_res = await db.execute(champion_stmt)
        champion = champ_res.scalar_one_or_none()
        
        champ_pr_auc = 0.90  # Default baseline
        if champion and "pr_auc" in champion.metrics_json:
            champ_pr_auc = float(champion.metrics_json["pr_auc"])
            
        logger.info(f"Challenger PR-AUC: {challenger_pr_auc:.4f} | Champion PR-AUC: {champ_pr_auc:.4f}")
        
        # 6. Save and register if challenger is a viable candidate (within 5% of champion or better)
        status = "inactive"
        if challenger_pr_auc >= (champ_pr_auc * 0.95):
            status = "candidate"
            
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        model_filename = f"xgboost_challenger_{timestamp}.joblib"
        challenger_path = os.path.join(models_dir, model_filename)
        
        joblib.dump(challenger, challenger_path)
        
        # Save registry record
        candidate_version = f"xgb_challenger_{timestamp}"
        registry_record = ModelRegistry(
            model_name="xgboost_fraud",
            version=candidate_version,
            metrics_json={
                "pr_auc": round(challenger_pr_auc, 4),
                "roc_auc": round(challenger_roc_auc, 4),
                "prod_feedback_count": len(resolved_txs)
            },
            file_path=os.path.join("models", model_filename),
            status=status
        )
        db.add(registry_record)
        await db.commit()
        
        logger.info(f"Model retraining pipeline complete. New model registered as: {candidate_version} (Status: {status})")
        
        return {
            "status": "completed",
            "candidate_version": candidate_version,
            "pr_auc": challenger_pr_auc,
            "roc_auc": challenger_roc_auc,
            "registered_status": status,
            "training_latency_sec": int(time.time() - start_time)
        }
