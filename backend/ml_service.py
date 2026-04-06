import joblib
import os
import numpy as np

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.joblib")

model = None

def load_model():
    global model
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)

load_model()

def calculate_fraud_risk(amount: float, location: str, user_id: str) -> float:
    if model is None:
        # Fallback to simple rule-based if model is not trained/loaded
        return 90.0 if amount > 5000 else 10.0
    
    # Simple feature engineering for prediction
    # This is a very basic proxy representation for the real features we would extract
    amount_log = np.log1p(amount)
    user_frequency = 5  # mock placeholder
    
    # mock location risk
    location_risk = 0.1
    if amount > 1000:
        location_risk = 0.8
        
    features = np.array([[amount_log, user_frequency, location_risk]])
    
    predict_score = model.score_samples(features)[0] 
    
    # Normalize score_samples (-1 to 0 or unconstrained) to 0-100 scale conceptually
    # Higher negative value -> more anomalous
    # Let's map -1.0 to 100 and -0.4 to 0 as a rough mapping
    risk = max(0, min(100, ((-predict_score) - 0.4) / 0.6 * 100))
    
    # Add some randomness for the dashboard demo effect
    risk = risk + np.random.uniform(-5, 5)
    return float(max(0, min(100, risk)))

def evaluate_transaction(amount: float, location: str, user_id: str):
    score = calculate_fraud_risk(amount, location, user_id)
    
    status = "low_risk"
    recommendation = "approve"
    
    if score > 75:
        status = "high_risk"
        recommendation = "block_transaction"
    elif score > 50:
        status = "medium_risk"
        recommendation = "review_transaction"
        
    return score, status, recommendation
