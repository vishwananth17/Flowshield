import numpy as np
import pandas as pd
import json
import os
from datetime import datetime

class FraudDatasetGenerator:
    def __init__(self, n_normal=50000, n_fraud=500, seed=42):
        self.n_normal = n_normal
        self.n_fraud = n_fraud
        self.seed = seed
        np.random.seed(seed)
        
    def generate(self):
        # Generate Normal Transactions
        normal_data = self._generate_normal(self.n_normal)
        
        # Generate Fraud Patterns (100 each)
        p1 = self._generate_p1_high_amount(100)
        p2 = self._generate_p2_velocity(100)
        p3 = self._generate_p3_geo(100)
        p4 = self._generate_p4_new_device(100)
        p5 = self._generate_p5_high_risk_merchant(100)
        
        fraud_data = pd.concat([p1, p2, p3, p4, p5])
        
        # Combine
        df = pd.concat([normal_data, fraud_data]).sample(frac=1).reset_index(drop=True)
        
        # Derived features
        df['is_weekend'] = df['day_of_week'].apply(lambda x: 1 if x >= 5 else 0)
        df['is_night'] = df['hour_of_day'].apply(lambda x: 1 if (x < 6 or x > 23) else 0)
        
        return df

    def _generate_normal(self, n):
        data = {
            'amount_inr': np.clip(np.random.lognormal(mean=np.log(2000), sigma=1.2, size=n), 50, 50000),
            'hour_of_day': np.clip(np.random.normal(13, 4, size=n).astype(int), 0, 23),
            'day_of_week': np.random.randint(0, 7, size=n),
            'tx_count_last_1h': np.clip(np.random.poisson(2, size=n), 0, 15),
            'tx_count_last_24h': np.clip(np.random.poisson(8, size=n), 0, 50),
            'amount_sum_last_1h': np.random.lognormal(mean=np.log(3000), sigma=1.0, size=n),
            'amount_vs_avg_ratio': np.clip(np.random.normal(1.0, 0.3, size=n), 0.1, 5.0),
            'ip_country_match': np.random.binomial(1, 0.95, size=n),
            'card_country_match': np.random.binomial(1, 0.97, size=n),
            'is_new_device': np.random.binomial(1, 0.05, size=n),
            'merchant_risk_score': np.random.beta(2, 8, size=n),
            'mcc_risk_tier': np.random.choice([0, 1, 2], size=n, p=[0.7, 0.2, 0.1]),
            'device_age_days': np.clip(np.random.exponential(180, size=n), 0, 1825),
            'unique_merchants_24h': np.clip(np.random.poisson(3, size=n), 0, 20),
            'is_first_transaction': np.random.binomial(1, 0.03, size=n),
            'is_fraud': 0
        }
        return pd.DataFrame(data)

    def _generate_p1_high_amount(self, n):
        data = self._generate_normal(n)
        data['amount_inr'] = np.clip(np.random.lognormal(mean=np.log(80000), sigma=0.5, size=n), 50000, 500000)
        data['amount_vs_avg_ratio'] = np.random.uniform(8, 25, size=n)
        data['hour_of_day'] = np.random.randint(1, 6, size=n)
        data['ip_country_match'] = np.random.binomial(1, 0.2, size=n)
        data['merchant_risk_score'] = np.random.beta(8, 2, size=n)
        data['is_fraud'] = 1
        return data

    def _generate_p2_velocity(self, n):
        data = self._generate_normal(n)
        data['amount_inr'] = np.random.uniform(1, 100, size=n)
        data['tx_count_last_1h'] = np.random.randint(15, 51, size=n)
        data['tx_count_last_24h'] = np.random.randint(50, 201, size=n)
        data['unique_merchants_24h'] = np.random.randint(10, 31, size=n)
        data['amount_sum_last_1h'] = np.random.uniform(5000, 50000, size=n)
        data['is_new_device'] = 1
        data['is_fraud'] = 1
        return data

    def _generate_p3_geo(self, n):
        data = self._generate_normal(n)
        data['ip_country_match'] = 0
        data['card_country_match'] = 0
        data['amount_inr'] = np.random.lognormal(mean=np.log(15000), sigma=0.8, size=n)
        data['merchant_risk_score'] = np.random.beta(6, 4, size=n)
        data['mcc_risk_tier'] = np.random.choice([0, 1, 2], size=n, p=[0.1, 0.3, 0.6])
        data['is_new_device'] = np.random.binomial(1, 0.8, size=n)
        data['is_fraud'] = 1
        return data

    def _generate_p4_new_device(self, n):
        data = self._generate_normal(n)
        data['is_new_device'] = 1
        data['is_first_transaction'] = 1
        data['amount_inr'] = np.random.lognormal(mean=np.log(25000), sigma=0.7, size=n)
        data['amount_vs_avg_ratio'] = np.random.uniform(5, 20, size=n)
        data['device_age_days'] = 0
        data['is_fraud'] = 1
        return data

    def _generate_p5_high_risk_merchant(self, n):
        data = self._generate_normal(n)
        data['mcc_risk_tier'] = 2
        data['merchant_risk_score'] = np.random.uniform(0.8, 1.0, size=n)
        data['amount_inr'] = np.random.lognormal(mean=np.log(10000), sigma=1.0, size=n)
        data['tx_count_last_1h'] = np.random.poisson(5, size=n)
        data['ip_country_match'] = np.random.binomial(1, 0.4, size=n)
        data['is_fraud'] = 1
        return data

if __name__ == "__main__":
    gen = FraudDatasetGenerator()
    df = gen.generate()
    
    # Save CSV
    os.makedirs('data', exist_ok=True)
    df.to_csv('data/fraud_dataset.csv', index=False)
    
    # Metadata
    metadata = {
        "n_normal": int(df[df['is_fraud'] == 0].shape[0]),
        "n_fraud": int(df[df['is_fraud'] == 1].shape[0]),
        "fraud_rate": float(df['is_fraud'].mean()),
        "feature_names": list(df.columns),
        "generation_date": datetime.now().isoformat(),
        "fraud_patterns": {
            "p1_high_amount": 100,
            "p2_velocity": 100,
            "p3_geographic": 100,
            "p4_new_device": 100,
            "p5_high_risk_merchant": 100
        }
    }
    
    with open('data/fraud_dataset_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=4)
        
    print(f"Total samples: {len(df)}")
    print(f"Normal: {metadata['n_normal']} ({100-metadata['fraud_rate']*100:.1f}%)")
    print(f"Fraud: {metadata['n_fraud']} ({metadata['fraud_rate']*100:.1f}%)")
    print(f"Features: {len(df.columns)-1}")
    for k, v in metadata['fraud_patterns'].items():
        print(f"  {k}: {v}")
