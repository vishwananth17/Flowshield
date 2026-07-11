import os
import sys
import logging
import numpy as np
import pandas as pd
import resend
from datetime import datetime, timedelta, UTC
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# Make sure app/ml is in python path so joblib can deserialize features.*
ml_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'ml')
sys.path.insert(0, os.path.abspath(ml_dir))

from app.core.config import get_settings
from app.models.transaction import Transaction
from app.models.model_drift import ModelDriftLog
from app.models.model_registry import ModelRegistry
from app.ml.features.feature_engineer import UnifiedFeatureEngineer

logger = logging.getLogger(__name__)

def calculate_psi(expected: np.ndarray, actual: np.ndarray, num_bins: int = 10) -> float:
    """Computes the Population Stability Index between baseline and target distributions."""
    if len(expected) == 0 or len(actual) == 0:
        return 0.0
        
    percentiles = np.linspace(0, 100, num_bins + 1)
    bins = np.percentile(expected, percentiles)
    bins = np.unique(bins)
    
    if len(bins) < 2:
        # Categorical / Discrete
        expected_cats, expected_counts = np.unique(expected, return_counts=True)
        actual_cats, actual_counts = np.unique(actual, return_counts=True)
        
        expected_pct = expected_counts / len(expected)
        actual_dict = dict(zip(actual_cats, actual_counts))
        actual_pct = np.array([actual_dict.get(c, 0) / len(actual) for c in expected_cats])
    else:
        # Continuous
        expected_binned = np.digitize(expected, bins) - 1
        actual_binned = np.digitize(actual, bins) - 1
        
        expected_counts = np.bincount(expected_binned, minlength=len(bins)-1)
        actual_counts = np.bincount(actual_binned, minlength=len(bins)-1)
        
        expected_pct = expected_counts / len(expected)
        actual_pct = actual_counts / len(actual)
        
    # Laplace smoothing
    expected_pct = (expected_pct + 1e-4) / (sum(expected_pct) + 1e-4 * len(expected_pct))
    actual_pct = (actual_pct + 1e-4) / (sum(actual_pct) + 1e-4 * len(actual_pct))
    
    psi = np.sum((actual_pct - expected_pct) * np.log(actual_pct / expected_pct))
    return float(psi)

class DriftService:
    @classmethod
    async def run_drift_check(cls, db: AsyncSession, alert_email: str = "operator@flowshield.ai") -> dict:
        """Calculates feature drift over the last 7 days and triggers alerts for high drift (> 0.25)."""
        settings = get_settings()
        
        # 1. Load baseline training dataset
        ml_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'ml')
        dataset_path = os.path.join(ml_dir, 'data', 'fraud_dataset.csv')
        if not os.path.exists(dataset_path):
            logger.error(f"Training dataset path not found at {dataset_path} — cannot run drift check.")
            return {"status": "error", "message": "Baseline dataset missing"}
            
        try:
            baseline_raw = pd.read_csv(dataset_path)
            # Reconstruct training features using feature engineer
            eng_path = os.path.join(ml_dir, 'models', 'feature_engineer_v1.joblib')
            if not os.path.exists(eng_path):
                logger.error("Feature engineer binary missing — cannot compile baseline features.")
                return {"status": "error", "message": "Feature engineer binary missing"}
                
            engineer = joblib.load(eng_path) if 'joblib' in globals() else pd.read_pickle(eng_path)
        except Exception as e:
            # Fallback import of joblib if not loaded
            import joblib
            engineer = joblib.load(os.path.join(ml_dir, 'models', 'feature_engineer_v1.joblib'))
            baseline_raw = pd.read_csv(dataset_path)
            
        baseline_df = engineer.build_training_matrix(baseline_raw.to_dict(orient='records'))
        
        # 2. Get last week of production transactions
        seven_days_ago = datetime.now(UTC) - timedelta(days=7)
        tx_stmt = select(Transaction).where(Transaction.created_at >= seven_days_ago)
        tx_res = await db.execute(tx_stmt)
        txs = tx_res.scalars().all()
        
        if not txs:
            logger.info("No production transactions found in the last 7 days — skipping drift check.")
            return {"status": "skipped", "message": "No transactions in target window"}
            
        # Reconstruct actual feature dataframe from transactions
        # Convert Transaction sqlalchemy rows to dicts corresponding to feature engineer expectations
        tx_rows = []
        for tx in txs:
            tx_rows.append({
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
            
        actual_df = engineer.build_training_matrix(tx_rows)
        
        # Ensure we are evaluating intersection of features
        features_to_check = [f for f in engineer.BASE_FEATURES if f in baseline_df.columns and f in actual_df.columns]
        
        # 3. Calculate PSI per feature
        drift_results = {}
        high_drift_features = []
        
        # Find champion model version
        registry_stmt = select(ModelRegistry).where(ModelRegistry.status == "active")
        reg_res = await db.execute(registry_stmt)
        active_model = reg_res.scalar_one_or_none()
        model_ver = active_model.version if active_model else "ensemble_v2.0"
        
        for feat in features_to_check:
            expected_vals = baseline_df[feat].dropna().values
            actual_vals = actual_df[feat].dropna().values
            
            psi = calculate_psi(expected_vals, actual_vals)
            drift_results[feat] = psi
            
            # Log to DB
            drift_log = ModelDriftLog(
                model_version=model_ver,
                feature_name=feat,
                psi_score=Decimal(str(round(psi, 4))),
                alert_sent=False
            )
            db.add(drift_log)
            
            if psi > 0.25:
                high_drift_features.append({"feature": feat, "psi": psi})
                drift_log.alert_sent = True
                
        await db.commit()
        
        # 4. Trigger Email Alerts if high drift detected
        if high_drift_features and settings.resend_api_key:
            resend.api_key = settings.resend_api_key
            
            # Render HTML report
            rows_html = "".join([
                f"<tr><td style='padding:8px; border:1px solid #ddd;'><b>{item['feature']}</b></td>"
                f"<td style='padding:8px; border:1px solid #ddd; color:#e11d48;'>{item['psi']:.4f}</td></tr>"
                for item in high_drift_features
            ])
            
            html_content = f"""
            <div style="font-family:sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #e2e8f0; border-radius:12px;">
                <div style="background-color:#e11d48; padding:20px; border-radius:8px; text-align:center; color:white;">
                    <h1 style="margin:0;">Flowshield AI Alerts</h1>
                    <p style="margin:5px 0 0 0;">Significant Feature Drift Detected</p>
                </div>
                <div style="padding:20px;">
                    <h3 style="color:#1e293b;">Model: {model_ver}</h3>
                    <p style="color:#475569; line-height:1.6;">
                        Our weekly automated scheduler has detected significant population stability drift (PSI &gt; 0.25) across features. 
                        This suggests a change in incoming user behavior or payment patterns, indicating the model champion should be retrained.
                    </p>
                    <table style="width:100%; border-collapse:collapse; margin:20px 0;">
                        <thead>
                            <tr style="background-color:#f1f5f9;">
                                <th style="padding:8px; border:1px solid #ddd; text-align:left;">Feature Name</th>
                                <th style="padding:8px; border:1px solid #ddd; text-align:left;">PSI Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows_html}
                        </tbody>
                    </table>
                    <div style="background-color:#f8fafc; padding:15px; border-radius:8px; border-left:4px solid #e11d48;">
                        <p style="margin:0; color:#1e293b; font-weight:600;">Recommended Action:</p>
                        <p style="margin:5px 0 0 0; color:#64748b; font-size:14px;">
                            Run the champion-challenger monthly retraining pipeline script to generate a challenger model trained on the updated behavior profiles.
                        </p>
                    </div>
                </div>
            </div>
            """
            try:
                resend.Emails.send({
                    "from": "alerts@resend.dev",
                    "to": [alert_email],
                    "subject": f"⚠️ MODEL DRIFT ALERT: Significant drift in {model_ver}",
                    "html": html_content
                })
                logger.info(f"Drift alert email successfully sent to {alert_email}")
            except Exception as e:
                logger.error(f"Failed to send drift alert email: {e}")
                
        return {
            "status": "completed",
            "model_version": model_ver,
            "total_features_checked": len(features_to_check),
            "high_drift_count": len(high_drift_features),
            "drift_scores": drift_results
        }
