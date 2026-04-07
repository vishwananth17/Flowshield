import numpy as np
from sklearn.ensemble import IsolationForest
import joblib
import os
import hashlib

class StreamGuardModel:
    def __init__(self, model_path: str = "model.joblib"):
        self.model_path = model_path
        self._model = None
        
        # In a real setup, we would load the trained model.
        # If it doesn't exist, we fallback to a simple dummy untrained IsolationForest.
        if os.path.exists(self.model_path):
            try:
                self._model = joblib.load(self.model_path)
            except Exception:
                self._create_dummy()
        else:
            self._create_dummy()

    def _create_dummy(self):
        # Create a basic IsolationForest and fit on some synthetic dummy "normal" data
        self._model = IsolationForest(n_estimators=50, contamination=0.05, random_state=42)
        X_dummy = np.random.randn(100, 3) 
        self._model.fit(X_dummy)
    
    def predict_risk(self, amount: float, time_hour: int, is_cross_border: bool) -> float:
        """
        Features: 
        1. normalized amount log
        2. simulated time feature vs peak
        3. cross border flag
        """
        amt_log = np.log1p(amount)
        time_feat = abs(time_hour - 12) / 12.0
        cb_feat = 1.0 if is_cross_border else 0.0
        
        X = np.array([[amt_log, time_feat, cb_feat]])
        
        # Get decision function (negative = outlier, positive = inlier)
        # We manually normalize it into a [0, 1] risk score
        score = self._model.decision_function(X)[0]
        
        normalized_risk = 0.5 - (score / 2.0)
        return min(max(normalized_risk, 0.0), 1.0)

ml_model = StreamGuardModel()
