import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("model_trainer")

def train_baseline_model():
    """
    Trains an initial model for Flowshield AI.
    This model learns from production-relevant features:
    [amount, hour, is_cross_border, email_length, is_prepaid]
    """
    MODEL_DIR = os.path.join(os.path.dirname(__file__), "app", "ml_models")
    os.makedirs(MODEL_DIR, exist_ok=True)
    MODEL_PATH = os.path.join(MODEL_DIR, "fraud_ensemble_v1.joblib")

    logger.info("🛠️ Initializing Hybrid Ensemble Training...")
    
    n_samples = 20000
    
    # Feature 0: Amount (Normal dist but with some huge fraud spikes)
    amounts = np.random.lognormal(mean=5, sigma=2, size=n_samples)
    
    # Feature 1: Hour (0-23)
    hours = np.random.randint(0, 24, size=n_samples)
    
    # Feature 2: Is Cross Border (0 or 1)
    cb = np.random.binomial(1, 0.1, size=n_samples)
    
    # Feature 3: Email Length
    email_len = np.random.normal(15, 5, size=n_samples).clip(5, 50)
    
    # Feature 4: Is Prepaid
    prepaid = np.random.binomial(1, 0.05, size=n_samples)

    X = np.stack([amounts, hours, cb, email_len, prepaid], axis=1)
    
    # Define Target Logic (Fraud patterns for the model to learn)
    y = np.zeros(n_samples)
    
    # High amount + Night + CrossBorder = High Fraud Probability
    fraud_mask = (amounts > 5000) & (hours < 5) & (cb == 1)
    y[fraud_mask] = np.random.binomial(1, 0.8, size=sum(fraud_mask))
    
    # Small amount but prepaid cross border (Testing patterns)
    prepaid_fraud = (amounts < 50) & (prepaid == 1) & (cb == 1)
    y[prepaid_fraud] = np.random.binomial(1, 0.4, size=sum(prepaid_fraud))
    
    # Random noise
    random_noise = np.random.choice([0, 1], size=n_samples, p=[0.998, 0.002])
    y = np.maximum(y, random_noise)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    logger.info(f"📊 Training on {len(X_train)} samples with 5 production features...")
    model = RandomForestClassifier(n_estimators=100, max_depth=12, n_jobs=-1, random_state=42)
    model.fit(X_train, y_train)

    joblib.dump(model, MODEL_PATH)
    logger.info(f"✅ Production-Ready Model serialized at: {MODEL_PATH}")

if __name__ == "__main__":
    train_baseline_model()
