import os
import sys

# Ensure app/ml and its dependencies are importable (required for joblib unpickling)
ML_DIR = os.path.dirname(os.path.abspath(__file__))
if ML_DIR not in sys.path:
    sys.path.insert(0, ML_DIR)
backend_dir = os.path.dirname(os.path.dirname(ML_DIR))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import numpy as np
import pandas as pd
import joblib
import logging

logger = logging.getLogger(__name__)

MODELS_DIR = os.path.join(ML_DIR, 'models')

class FlowshieldEnsemble:
    """
    3-layer weighted ensemble:
      Layer 1 — MVIForest  (unsupervised anomaly detection)
      Layer 2 — XGBoost    (supervised fraud classifier)
      Layer 3 — Hard Rules (always-on override rules)

    Weights: [MVI:0.30, XGB:0.50, Rules:0.20]
    """

    WEIGHTS = {"mvi": 0.20, "xgb": 0.30, "rules": 0.50}
    FALLBACK = {"mvi": 0.40, "rules": 0.60}

    # High-risk countries (sanctions / known fraud hotspots)
    HIGH_RISK_COUNTRIES = {'KP','IR','SY','CU','VE','MM','BY'}

    def __init__(self):
        self.mviforest     = None
        self.xgboost       = None
        self.multiclass_xgb = None
        self.label_encoder = None
        self.shap_explainer = None
        self.feature_eng   = None
        self.scaler        = None
        self._xgb_available = False
        self._multi_xgb_available = False
        self._mvi_available = False
        self._load_all()

    def _load_all(self):
        # Load scaler
        scaler_path = os.path.join(MODELS_DIR, 'feature_scaler.joblib')
        if os.path.exists(scaler_path):
            self.scaler = joblib.load(scaler_path)
            logger.info("Scaler loaded")

        # Load MVIForest
        for fname in ['mviforest_tuned_v1.joblib', 'mviforest_v1.joblib']:
            path = os.path.join(MODELS_DIR, fname)
            if os.path.exists(path):
                self.mviforest = joblib.load(path)
                self._mvi_available = True
                logger.info(f"MVIForest loaded: {fname}")
                break

        # Load XGBoost + SHAP + FeatureEngineer
        xgb_path = os.path.join(MODELS_DIR, 'xgboost_fraud_v1.joblib')
        shap_path = os.path.join(MODELS_DIR, 'shap_explainer_v1.joblib')
        eng_path  = os.path.join(MODELS_DIR, 'feature_engineer_v1.joblib')

        if os.path.exists(xgb_path) and os.path.exists(eng_path):
            self.xgboost     = joblib.load(xgb_path)
            self.feature_eng = joblib.load(eng_path)
            self._xgb_available = True
            logger.info("XGBoost loaded")

            if os.path.exists(shap_path):
                self.shap_explainer = joblib.load(shap_path)
                logger.info("SHAP explainer loaded")
        else:
            logger.warning("XGBoost not found — using MVIForest+Rules only")

        # Load Multiclass XGBoost Model B + LabelEncoder
        multi_xgb_path = os.path.join(MODELS_DIR, 'xgboost_multiclass_v1.joblib')
        le_path = os.path.join(MODELS_DIR, 'label_encoder_v1.joblib')

        if os.path.exists(multi_xgb_path) and os.path.exists(le_path):
            self.multiclass_xgb = joblib.load(multi_xgb_path)
            self.label_encoder = joblib.load(le_path)
            self._multi_xgb_available = True
            logger.info("XGBoost Multiclass Model B + LabelEncoder loaded")

        logger.info(f"Ensemble ready: MVI={self._mvi_available}, XGB={self._xgb_available}, MultiXGB={self._multi_xgb_available}")

    def _apply_hard_rules(self, features: dict) -> tuple:
        """Hard rules that override ML — instant and deterministic"""
        score = 0.0
        reasons = []

        country = features.get('customer_country', 'IN')
        amount  = float(features.get('amount_inr', 0))
        vel_1h  = int(features.get('tx_count_last_1h', 0))
        ip_match = int(features.get('ip_country_match', 1))
        mcc_tier = int(features.get('mcc_risk_tier', 0))
        new_dev  = int(features.get('is_new_device', 0))
        is_night = int(features.get('is_night', 0))

        if country in self.HIGH_RISK_COUNTRIES:
            score = max(score, 0.96)
            reasons.append("Transaction from sanctioned jurisdiction")

        if vel_1h > 50:
            score = 1.0
            reasons.append("Impossible velocity — potential card cloning")
        elif vel_1h > 20:
            score = max(score, 0.90)
            reasons.append(f"Extreme velocity: {vel_1h} transactions/hour")

        if amount > 5000 and ip_match == 0:
            score = max(score, 0.88)
            reasons.append(f"Cross-border mismatch on mid-value transaction (₹{amount:,.0f})")
        elif amount > 1000 and ip_match == 0:
            score = max(score, 0.55)
            reasons.append("Cross-border mismatch detected")

        if mcc_tier == 2 and new_dev == 1 and is_night == 1:
            score = max(score, 0.82)
            reasons.append("High-risk merchant on new device at night")

        if features.get('is_first_transaction', 0) == 1 and amount > 50000:
            score = max(score, 0.78)
            reasons.append("Very high first transaction amount")

        # ── UPI / India-specific rules ────────────────────────────────────────
        channel = str(features.get('channel', '')).lower()
        is_upi  = channel in {"upi", "bhim", "phonepe", "gpay", "paytm", "upi_collect"}

        # UPI Collect fraud: recipient-initiated payment requests are high risk
        if channel == 'upi_collect' and amount > 5000:
            score = max(score, 0.75)
            reasons.append("UPI Collect request above safe threshold — verify payee")

        # SIM swap + UPI: new device + night + UPI channel
        if features.get('is_new_device', 0) == 1 and features.get('is_night', 0) == 1 and is_upi:
            score = max(score, 0.80)
            reasons.append("UPI transaction from new device at night — potential SIM swap")

        # High-velocity UPI (card testing via micro-UPI)
        if is_upi and int(features.get('tx_count_last_1h', 0)) > 10 and amount < 100:
            score = max(score, 0.85)
            reasons.append("Micro-amount UPI velocity — potential card testing pattern")

        return score, reasons

    def _get_mvi_score(self, features: dict) -> float:
        """Get MVIForest anomaly score [0-1]"""
        if not self._mvi_available or self.scaler is None:
            return 0.5

        try:
            from app.ml.features.feature_engineer import UnifiedFeatureEngineer
            feat_array = np.array([[
                float(features.get(f, 0)) for f in UnifiedFeatureEngineer.BASE_FEATURES[:59]
            ]])
            feat_scaled = self.scaler.transform(feat_array)
            score = float(self.mviforest.anomaly_score(feat_scaled)[0])
            return np.clip(score, 0.0, 1.0)
        except Exception as e:
            logger.error(f"MVIForest error: {e}")
            return 0.5

    def _get_xgb_score(self, features: dict) -> tuple:
        """Get XGBoost supervised score [0-1] + SHAP reasons"""
        if not self._xgb_available or self.feature_eng is None:
            return 0.5, []

        try:
            feat_df = pd.DataFrame([features])
            for col in self.feature_eng.BASE_FEATURES:
                if col not in feat_df.columns:
                    feat_df[col] = 0

            feat_eng = self.feature_eng.build_training_matrix(feat_df.to_dict(orient='records'))
            xgb_score = float(self.xgboost.predict_proba(feat_eng.values)[0, 1])

            reasons = []
            if self.shap_explainer:
                from app.ml.features.feature_engineer import UnifiedFeatureEngineer
                shap_vals = self.shap_explainer.shap_values(feat_eng.values)[0]
                reasons = UnifiedFeatureEngineer.generate_human_readable_reason(
                    shap_vals, self.feature_eng.BASE_FEATURES, features, top_n=3
                )

            return np.clip(xgb_score, 0.0, 1.0), reasons

        except Exception as e:
            logger.error(f"XGBoost error: {e}")
            return 0.5, []

    def _get_multiclass_prediction(self, features: dict) -> dict:
        if not self._multi_xgb_available or self.multiclass_xgb is None or self.feature_eng is None:
            return {"fraud_type": "legitimate", "fraud_type_confidence": 1.0}
        try:
            feat_df = pd.DataFrame([features])
            for col in self.feature_eng.BASE_FEATURES:
                if col not in feat_df.columns:
                    feat_df[col] = 0
            feat_eng = self.feature_eng.build_training_matrix(feat_df.to_dict(orient='records'))
            probs = self.multiclass_xgb.predict_proba(feat_eng.values)[0]
            max_idx = np.argmax(probs)
            pred_class = self.label_encoder.inverse_transform([max_idx])[0]
            return {
                "fraud_type": str(pred_class),
                "fraud_type_confidence": round(float(probs[max_idx]), 4)
            }
        except Exception as e:
            logger.error(f"Multiclass prediction error: {e}")
            return {"fraud_type": "unknown_pattern", "fraud_type_confidence": 0.0}

    def predict(self, features: dict) -> dict:
        """Full ensemble prediction."""
        # Layer 3: Hard rules (always run first)
        rule_score, rule_reasons = self._apply_hard_rules(features)

        # Layer 1: MVIForest
        mvi_score = self._get_mvi_score(features)

        # Layer 2: XGBoost
        xgb_score, xgb_reasons = self._get_xgb_score(features)

        # Combined ML score
        if self._xgb_available:
            # XGBoost is highly accurate and generalizable (85% weight)
            # MVIForest acts as a secondary anomaly indicator (15% weight)
            ml_score = 0.15 * mvi_score + 0.85 * xgb_score
        else:
            ml_score = mvi_score

        # Final score is the maximum of the ML prediction and the deterministic hard rules
        final = max(ml_score, rule_score)
        final = float(np.clip(final, 0.0, 1.0))

        # Build reasons list
        all_reasons = []
        all_reasons.extend(rule_reasons)
        all_reasons.extend(xgb_reasons)

        if not all_reasons:
            if final > 0.70: all_reasons = ["ML ensemble detected anomalous pattern"]
            elif final > 0.30: all_reasons = ["Mildly unusual transaction — monitoring"]
            else: all_reasons = ["Transaction within normal parameters"]

        # Risk label and decision
        if final >= 0.39: label, decision = "fraud", "block"
        elif final >= 0.15: label, decision = "suspicious", "review"
        else: label, decision = "safe", "allow"

        confidence = float(np.clip(1.0 - abs(final - 0.5) * 2, 0.5, 1.0))
        model_ver = "ensemble_v1.0" + ("_mvi+xgb+rules" if self._xgb_available else "_mvi+rules")

        # Multiclass prediction (Model B) if final score is high or suspicious
        fraud_type_res = {"fraud_type": "legitimate", "fraud_type_confidence": 1.0}
        if final >= 0.15:
            fraud_type_res = self._get_multiclass_prediction(features)

        return {
            "risk_score":   round(final, 4),
            "risk_label":   label,
            "decision":     decision,
            "confidence":   round(confidence, 4),
            "reasons":      all_reasons[:3],
            "model_scores": {
                "mviforest": round(float(mvi_score), 4),
                "xgboost":   round(float(xgb_score), 4),
                "rules":     round(float(rule_score), 4),
                "final":     round(final, 4),
            },
            "model_version": model_ver,
            "fraud_type": fraud_type_res["fraud_type"],
            "fraud_type_confidence": fraud_type_res["fraud_type_confidence"]
        }

# Module-level singleton
_ensemble_instance = None

def get_ensemble() -> FlowshieldEnsemble:
    global _ensemble_instance
    if _ensemble_instance is None:
        _ensemble_instance = FlowshieldEnsemble()
    return _ensemble_instance
