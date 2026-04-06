import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
import joblib

def create_and_train_model():
    # Generate some synthetic data for 'normal' transactions
    # Features: amount_log, user_frequency, location_risk
    print("Generating synthetic data for training...")
    n_samples = 10000
    
    # Normal transactions
    amounts_normal = np.random.lognormal(mean=np.log(50), sigma=1.0, size=n_samples)
    freqs_normal = np.random.randint(1, 10, size=n_samples)
    location_normal = np.random.uniform(0.0, 0.3, size=n_samples)
    
    # Fraud transactions (anomalies)
    n_fraud_samples = 200
    amounts_fraud = np.random.lognormal(mean=np.log(1000), sigma=1.5, size=n_fraud_samples)
    freqs_fraud = np.random.randint(10, 50, size=n_fraud_samples)
    location_fraud = np.random.uniform(0.7, 1.0, size=n_fraud_samples)
    
    # Combine
    amounts = np.concatenate([amounts_normal, amounts_fraud])
    freqs = np.concatenate([freqs_normal, freqs_fraud])
    locations = np.concatenate([location_normal, location_fraud])
    
    df = pd.DataFrame({
        'amount_log': np.log1p(amounts),
        'user_frequency': freqs,
        'location_risk': locations
    })
    
    print("Training Isolation Forest model...")
    model = IsolationForest(
        n_estimators=100,
        contamination=0.02,
        random_state=42
    )
    
    model.fit(df)
    
    # Save model
    joblib.dump(model, 'model.joblib')
    print("Model saved to model.joblib")

if __name__ == "__main__":
    create_and_train_model()
