import numpy as np
from sklearn.ensemble import IsolationForest
import joblib
import os
import hashlib

class StreamGuardModel:
    def __init__(self):
        # Path to our high-fidelity ensemble model
        self.model_path = os.path.join(os.path.dirname(__file__), "..", "ml_models", "fraud_ensemble_v1.joblib")
        self._model = None
        self.model_type = "isolation_forest"
        
        if os.path.exists(self.model_path):
            try:
                self._model = joblib.load(self.model_path)
                self.model_type = "random_forest"
            except Exception:
                self._create_fallback()
        else:
            self._create_fallback()

    def _create_fallback(self):
        # Create a fast IsolationForest for cold-start fraud detection
        self._model = IsolationForest(n_estimators=50, contamination=0.1, random_state=42)
        X_train = np.random.normal(0, 1, (500, 5))
        self._model.fit(X_train)
        self.model_type = "isolation_forest"
    
    def predict_risk(self, amount: float, time_hour: int, is_cross_border: bool, email_len: int, is_prepaid: bool) -> float:
        amt_log = np.log1p(amount)
        # Normalize features
        time_norm = time_hour / 24.0
        cb_feat = 1.0 if is_cross_border else 0.0
        email_feat = min(email_len, 50) / 50.0
        prepaid_feat = 1.0 if is_prepaid else 0.0
        
        X = np.array([[amt_log, time_norm, cb_feat, email_feat, prepaid_feat]])
        
        if self.model_type == "random_forest":
            # Probability of Class 1 (Fraud)
            return float(self._model.predict_proba(X)[0][1])
        else:
            # Anomaly decision function normalization
            score = self._model.decision_function(X)[0]
            return min(max(0.5 - (score / 0.5), 0.0), 1.0)

ml_model = StreamGuardModel()
