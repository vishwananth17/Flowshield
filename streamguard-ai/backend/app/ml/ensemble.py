import os
import numpy as np
import pandas as pd
import joblib
import logging

logger = logging.getLogger(__name__)

ML_DIR = os.path.dirname(os.path.abspath(__file__))
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
        self.shap_explainer = None
        self.feature_eng   = None
        self.scaler        = None
        self._xgb_available = False
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

        logger.info(f"Ensemble ready: MVI={self._mvi_available}, XGB={self._xgb_available}")

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
            from features.feature_engineer import FraudFeatureEngineer
            feat_array = np.array([[
                float(features.get(f, 0)) for f in FraudFeatureEngineer.BASE_FEATURES
            ]])
            feat_scaled = self.scaler.transform(feat_array)
            score = float(self.mviforest.anomaly_score(feat_scaled)[0])
            return np.clip(score, 0.0, 1.0)
        except Exception as e:
            logger.error(f"MVIForest error: {e}")
            return 0.5

    def _get_xgb_score(self, features: dict) -> tuple:
        """Get XGBoost score + SHAP reasons"""
        if not self._xgb_available:
            return 0.5, []

        try:
            from features.feature_engineer import FraudFeatureEngineer
            feat_df = pd.DataFrame([features])

            # Ensure all base features present
            for col in self.feature_eng.BASE_FEATURES:
                if col not in feat_df.columns:
                    feat_df[col] = 0

            feat_eng = self.feature_eng.engineer(feat_df[self.feature_eng.BASE_FEATURES])
            xgb_score = float(self.xgboost.predict_proba(feat_eng.values)[0, 1])

            reasons = []
            if self.shap_explainer:
                shap_vals = self.shap_explainer.shap_values(feat_eng.values)[0]
                reasons = FraudFeatureEngineer.generate_human_readable_reason(
                    shap_vals, self.feature_eng.ALL_FEATURES, features, top_n=3
                )

            return np.clip(xgb_score, 0.0, 1.0), reasons

        except Exception as e:
            logger.error(f"XGBoost error: {e}")
            return 0.5, []

    def predict(self, features: dict) -> dict:
        """Full ensemble prediction."""
        # Layer 3: Hard rules (always run first)
        rule_score, rule_reasons = self._apply_hard_rules(features)

        # Layer 1: MVIForest
        mvi_score = self._get_mvi_score(features)

        # Layer 2: XGBoost
        xgb_score, xgb_reasons = self._get_xgb_score(features)

        # Weighted combination
        if self._xgb_available:
            w = self.WEIGHTS
            final = (w["mvi"] * mvi_score + w["xgb"] * xgb_score + w["rules"] * rule_score)
        else:
            w = self.FALLBACK
            final = (w["mvi"] * mvi_score + w["rules"] * rule_score)

        final = float(np.clip(final, 0.0, 1.0))

        # Hard rule override — never let high-confidence rules get diluted by ML
        if rule_score >= 0.50:
            final = max(final, rule_score)

        # Build reasons list
        all_reasons = []
        all_reasons.extend(rule_reasons)
        all_reasons.extend(xgb_reasons)


        if not all_reasons:
            if final > 0.70: all_reasons = ["ML ensemble detected anomalous pattern"]
            elif final > 0.30: all_reasons = ["Mildly unusual transaction — monitoring"]
            else: all_reasons = ["Transaction within normal parameters"]

        # Risk label and decision
        if final >= 0.80: label, decision = "fraud", "block"
        elif final >= 0.40: label, decision = "suspicious", "review"
        else: label, decision = "safe", "allow"

        confidence = float(np.clip(1.0 - abs(final - 0.5) * 2, 0.5, 1.0))
        model_ver = "ensemble_v1.0" + ("_mvi+xgb+rules" if self._xgb_available else "_mvi+rules")

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
        }

# Module-level singleton
_ensemble_instance = None

def get_ensemble() -> FlowshieldEnsemble:
    global _ensemble_instance
    if _ensemble_instance is None:
        _ensemble_instance = FlowshieldEnsemble()
    return _ensemble_instance
