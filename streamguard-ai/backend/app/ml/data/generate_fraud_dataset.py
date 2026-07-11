import numpy as np
import pandas as pd
import json
import os
import uuid
from datetime import datetime

class FraudDatasetGenerator:
    def __init__(self, n_normal=170000, n_edge=10000, n_fraud_per_pattern=180, seed=42):
        self.n_normal = n_normal
        self.n_edge = n_edge
        self.n_fraud_per_pattern = n_fraud_per_pattern
        self.seed = seed
        np.random.seed(seed)

    def generate(self):
        # 1. Normal/Legitimate baseline
        df_normal = self._generate_base(self.n_normal, is_fraud=0, is_hard_edge_case=0, pattern="normal")
        
        # 2. Safe Edge Cases (critical to reduce False Blocks)
        n_each_edge = self.n_edge // 5
        edge_1 = self._edge_large_first_time(n_each_edge)
        edge_2 = self._edge_genuine_traveler(n_each_edge)
        edge_3 = self._edge_gift_purchase(n_each_edge)
        edge_4 = self._edge_b2b_wholesale(n_each_edge)
        edge_5 = self._edge_thin_credit(n_each_edge)
        
        # 3. Fraud Patterns (E-commerce + SaaS)
        f_patterns = [
            ("triangulation_fraud", self._fraud_triangulation),
            ("refund_return_abuse", self._fraud_refund_return_abuse),
            ("promo_coupon_abuse", self._fraud_promo_coupon_abuse),
            ("account_takeover_post_purchase", self._fraud_account_takeover),
            ("card_testing", self._fraud_card_testing),
            ("friendly_fraud", self._fraud_friendly_fraud),
            ("marketplace_seller_fraud", self._fraud_marketplace_seller),
            ("subscription_fraud", self._fraud_subscription_fraud),
            ("gift_card_cashout_fraud", self._fraud_gift_card_cashout),
            ("cross_border_digital_fraud", self._fraud_cross_border),
            ("trial_abuse_rings", self._fraud_trial_abuse_rings),
            ("stolen_card_subscription_stacking", self._fraud_subscription_stacking),
            ("chargeback_prone_bin_ranges", self._fraud_bin_range_chargeback),
            ("api_abuse_credential_stuffing", self._fraud_api_abuse)
        ]
        
        frauds = []
        for name, func in f_patterns:
            frauds.append(func(self.n_fraud_per_pattern))
            
        # Concatenate all
        df = pd.concat([df_normal, edge_1, edge_2, edge_3, edge_4, edge_5] + frauds, ignore_index=True)
        
        # Shuffle
        df = df.sample(frac=1, random_state=self.seed).reset_index(drop=True)
        
        # Derive day_of_week and hour_of_day features
        df['is_weekend'] = df['day_of_week'].apply(lambda x: 1 if x >= 5 else 0)
        df['is_night'] = df['hour_of_day'].apply(lambda x: 1 if (x < 6 or x >= 22) else 0)
        
        return df

    def _generate_base(self, n, is_fraud=0, is_hard_edge_case=0, pattern="normal"):
        # Setup basic vectors
        amounts_inr = np.clip(np.random.lognormal(mean=np.log(2000), sigma=1.2, size=n), 50, 50000)
        hours = np.clip(np.random.normal(13, 4, size=n).astype(int), 0, 23)
        days = np.random.randint(0, 7, size=n)
        
        currency = np.random.choice(['INR', 'USD', 'EUR'], size=n, p=[0.8, 0.15, 0.05])
        conversion = {'INR': 1.0, 'USD': 83.5, 'EUR': 90.2}
        amounts = [amounts_inr[i] / conversion[currency[i]] for i in range(n)]
        
        mcc_risk_tier = np.random.choice([0, 1, 2], size=n, p=[0.7, 0.2, 0.1])
        mccs = []
        for tier in mcc_risk_tier:
            if tier == 2:
                mccs.append(np.random.choice(['6051', '6211', '7995', '4829', '6530']))
            elif tier == 1:
                mccs.append(np.random.choice(['5999', '7011', '4814', '5411', '5047']))
            else:
                mccs.append(np.random.choice(['5812', '5814', '5311', '5912', '4111']))
                
        ip_country_match = np.random.binomial(1, 0.96, size=n)
        countries = np.random.choice(['IN', 'US', 'GB'], size=n, p=[0.8, 0.15, 0.05])
        issuing_countries = [countries[i] if ip_country_match[i] == 1 else np.random.choice(['IN', 'US', 'GB']) for i in range(n)]
        
        emails = []
        domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com']
        for _ in range(n):
            handle = f"user_{np.random.randint(1000, 999999)}"
            emails.append(f"{handle}@{np.random.choice(domains)}")
            
        data = {
            'amount': amounts,
            'currency': currency,
            'merchant_category': mccs,
            'merchant_id': [f"m_{np.random.randint(1000, 9999)}" for _ in range(n)],
            'channel': np.random.choice(['web', 'upi', 'imps', 'upi_collect'], size=n, p=[0.5, 0.3, 0.1, 0.1]),
            'card_type': np.random.choice(['debit', 'credit', 'prepaid'], size=n, p=[0.6, 0.3, 0.1]),
            'customer_email': emails,
            'customer_country': countries,
            'card_issuing_country': issuing_countries,
            'customer_ip': [f"192.168.1.{np.random.randint(1, 255)}" for _ in range(n)],
            'device_fingerprint': [f"fp_{uuid.uuid4().hex[:12]}" for _ in range(n)],
            'user_agent': ["Mozilla/5.0 Chrome/120.0.0.0" for _ in range(n)],
            'is_vpn': np.random.binomial(1, 0.02, size=n),
            'asn_risk_tier': np.random.choice([0, 1, 2], size=n, p=[0.9, 0.08, 0.02]),
            'hour_of_day': hours,
            'day_of_week': days,
            
            # Feature engineering raw components
            'shipping_billing_address_mismatch': np.random.binomial(1, 0.05, size=n),
            'account_age_days': np.random.randint(10, 500, size=n),
            'prior_order_count_with_recipient': np.random.randint(1, 20, size=n),
            'historical_return_rate': np.random.uniform(0.0, 0.1, size=n),
            'historical_dispute_rate': np.random.uniform(0.0, 0.02, size=n),
            'is_first_time_high_value': np.zeros(n, dtype=int),
            'unique_merchants_5min': np.ones(n, dtype=int),
            'email_domain_is_disposable': np.zeros(n, dtype=int),
            'device_fingerprint_cluster_size': np.ones(n, dtype=int),
            'is_known_vpn_range': np.zeros(n, dtype=int),
            'bin_risk_category': np.random.choice([0, 1, 2], size=n, p=[0.8, 0.15, 0.05]),
            'transaction_to_signup_time_minutes': np.random.randint(100, 10000, size=n),
            
            # Fallback legacy features
            'tx_count_last_1h': np.clip(np.random.poisson(1, size=n), 0, 5),
            'tx_count_last_24h': np.clip(np.random.poisson(4, size=n), 0, 15),
            'amount_sum_last_1h': np.zeros(n),
            'amount_vs_avg_ratio': np.clip(np.random.normal(1.0, 0.1, size=n), 0.5, 1.5),
            'ip_country_match': ip_country_match,
            'card_country_match': ip_country_match,
            'is_new_device': np.zeros(n, dtype=int),
            'merchant_risk_score': np.random.beta(2, 10, size=n),
            'mcc_risk_tier': mcc_risk_tier,
            'device_age_days': np.random.randint(30, 730, size=n),
            'unique_merchants_24h': np.ones(n, dtype=int),
            'is_first_transaction': np.random.binomial(1, 0.02, size=n),
            'is_phone_valid_india': np.ones(n, dtype=int),
            'is_webview': np.zeros(n, dtype=int),
            'is_bot_user_agent': np.zeros(n, dtype=int),
            'is_fingerprint_missing': np.zeros(n, dtype=int),
            'failed_attempts_10m': np.zeros(n, dtype=int),
            'merchant_fraud_rate_30d': np.zeros(n),
            'merchant_age_days': np.random.randint(30, 1000, size=n),
            'customer_ltv': np.random.uniform(100, 50000, size=n),
            'customer_age_days': np.random.randint(10, 500, size=n),
            'avg_tx_size_30d': np.random.uniform(500, 3000, size=n),
            'approved_tx_count_lt': np.random.randint(5, 100, size=n),
            'fraud_alerts_lifetime': np.zeros(n, dtype=int),
            'declined_tx_ratio_30d': np.zeros(n),
            
            # Ground truth targets
            'is_fraud': is_fraud,
            'is_hard_edge_case': is_hard_edge_case,
            'pattern_category': pattern
        }
        return pd.DataFrame(data)

    # ── SAFE EDGE CASES ────────────────────────────────────────────────────────
    def _edge_large_first_time(self, n):
        df = self._generate_base(n, is_fraud=0, is_hard_edge_case=1, pattern="legitimate_large_first_time")
        df['amount'] = np.random.uniform(40000, 95000, size=n)
        df['is_first_transaction'] = 1
        df['is_first_time_high_value'] = 1
        df['account_age_days'] = 0
        df['approved_tx_count_lt'] = 0
        return df

    def _edge_genuine_traveler(self, n):
        df = self._generate_base(n, is_fraud=0, is_hard_edge_case=1, pattern="genuine_traveler")
        df['customer_country'] = 'US'
        df['card_issuing_country'] = 'IN' # Card from India, IP from USA
        df['ip_country_match'] = 0
        df['card_country_match'] = 0
        df['is_vpn'] = 0
        return df

    def _edge_gift_purchase(self, n):
        df = self._generate_base(n, is_fraud=0, is_hard_edge_case=1, pattern="legitimate_gift_purchase")
        df['shipping_billing_address_mismatch'] = 1
        df['account_age_days'] = np.random.randint(150, 600, size=n)
        df['prior_order_count_with_recipient'] = np.random.randint(3, 8, size=n)
        df['amount'] = np.random.uniform(5000, 15000, size=n)
        return df

    def _edge_b2b_wholesale(self, n):
        df = self._generate_base(n, is_fraud=0, is_hard_edge_case=1, pattern="genuine_b2b_wholesale")
        df['amount'] = np.random.uniform(100000, 250000, size=n)
        df['tx_count_last_1h'] = np.random.randint(8, 20, size=n)
        df['tx_count_last_24h'] = np.random.randint(20, 60, size=n)
        df['amount_vs_avg_ratio'] = np.random.uniform(1.2, 2.5, size=n)
        return df

    def _edge_thin_credit(self, n):
        df = self._generate_base(n, is_fraud=0, is_hard_edge_case=1, pattern="legitimate_thin_credit")
        df['account_age_days'] = np.random.randint(1, 15, size=n)
        df['approved_tx_count_lt'] = np.random.randint(1, 3, size=n)
        df['customer_ltv'] = np.random.uniform(50, 1000, size=n)
        df['card_type'] = 'prepaid'
        return df

    # ── FRAUD PATTERNS ─────────────────────────────────────────────────────────
    def _fraud_triangulation(self, n):
        df = self._generate_base(n, is_fraud=1, is_hard_edge_case=0, pattern="triangulation_fraud")
        df['amount'] = np.random.uniform(45000, 95000, size=n) # High value goods
        df['merchant_category'] = '6530' # High resale electronics
        df['is_first_transaction'] = 1
        df['shipping_billing_address_mismatch'] = 1
        df['prior_order_count_with_recipient'] = 0
        df['is_first_time_high_value'] = 1
        return df

    def _fraud_refund_return_abuse(self, n):
        df = self._generate_base(n, is_fraud=1, is_hard_edge_case=0, pattern="refund_return_abuse")
        df['historical_return_rate'] = np.random.uniform(0.7, 0.95, size=n)
        df['amount'] = np.random.uniform(10000, 40000, size=n)
        return df

    def _fraud_promo_coupon_abuse(self, n):
        df = self._generate_base(n, is_fraud=1, is_hard_edge_case=0, pattern="promo_coupon_abuse")
        df['device_fingerprint_cluster_size'] = np.random.randint(6, 15, size=n)
        df['account_age_days'] = 0
        df['is_first_transaction'] = 1
        df['transaction_to_signup_time_minutes'] = np.random.randint(0, 3, size=n)
        return df

    def _fraud_account_takeover(self, n):
        df = self._generate_base(n, is_fraud=1, is_hard_edge_case=0, pattern="account_takeover_post_purchase")
        df['account_age_days'] = np.random.randint(100, 500, size=n)
        df['shipping_billing_address_mismatch'] = 1
        df['prior_order_count_with_recipient'] = 0
        df['amount'] = np.random.uniform(35000, 80000, size=n)
        df['device_age_days'] = 0
        df['is_new_device'] = 1
        return df

    def _fraud_card_testing(self, n):
        df = self._generate_base(n, is_fraud=1, is_hard_edge_case=0, pattern="card_testing")
        df['amount'] = np.random.uniform(1, 49, size=n) # Tiny test purchases
        df['unique_merchants_5min'] = np.random.randint(3, 8, size=n)
        df['tx_count_last_1h'] = np.random.randint(5, 15, size=n)
        return df

    def _fraud_friendly_fraud(self, n):
        df = self._generate_base(n, is_fraud=1, is_hard_edge_case=0, pattern="friendly_fraud")
        df['historical_dispute_rate'] = np.random.uniform(0.15, 0.45, size=n)
        df['amount'] = np.random.uniform(5000, 25000, size=n)
        return df

    def _fraud_marketplace_seller(self, n):
        df = self._generate_base(n, is_fraud=1, is_hard_edge_case=0, pattern="marketplace_seller_fraud")
        df['merchant_age_days'] = np.random.randint(0, 2, size=n)
        df['tx_count_last_24h'] = np.random.randint(100, 500, size=n)
        return df

    def _fraud_subscription_fraud(self, n):
        df = self._generate_base(n, is_fraud=1, is_hard_edge_case=0, pattern="subscription_fraud")
        df['channel'] = 'web'
        df['card_type'] = 'prepaid'
        df['amount'] = np.random.uniform(499, 1999, size=n)
        df['is_first_transaction'] = 1
        return df

    def _fraud_gift_card_cashout(self, n):
        df = self._generate_base(n, is_fraud=1, is_hard_edge_case=0, pattern="gift_card_cashout_fraud")
        df['merchant_category'] = '7995' # Crypto/Gaming/GC cashout
        df['amount'] = np.random.uniform(10000, 50000, size=n)
        df['is_first_transaction'] = 1
        return df

    def _fraud_cross_border(self, n):
        df = self._generate_base(n, is_fraud=1, is_hard_edge_case=0, pattern="cross_border_digital_fraud")
        df['is_vpn'] = 1
        df['is_known_vpn_range'] = 1
        df['ip_country_match'] = 0
        df['card_country_match'] = 0
        df['customer_country'] = 'US'
        df['card_issuing_country'] = 'IN'
        return df

    def _fraud_trial_abuse_rings(self, n):
        df = self._generate_base(n, is_fraud=1, is_hard_edge_case=0, pattern="trial_abuse_rings")
        df['email_domain_is_disposable'] = 1
        df['device_fingerprint_cluster_size'] = np.random.randint(8, 25, size=n)
        df['customer_email'] = [f"bot_{uuid.uuid4().hex[:8]}@tempmail.com" for _ in range(n)]
        return df

    def _fraud_subscription_stacking(self, n):
        df = self._generate_base(n, is_fraud=1, is_hard_edge_case=0, pattern="stolen_card_subscription_stacking")
        df['unique_merchants_5min'] = np.random.randint(4, 10, size=n)
        df['card_type'] = 'credit'
        return df

    def _fraud_bin_range_chargeback(self, n):
        df = self._generate_base(n, is_fraud=1, is_hard_edge_case=0, pattern="chargeback_prone_bin_ranges")
        df['bin_risk_category'] = 2 # high risk BIN
        df['historical_dispute_rate'] = np.random.uniform(0.1, 0.35, size=n)
        return df

    def _fraud_api_abuse(self, n):
        df = self._generate_base(n, is_fraud=1, is_hard_edge_case=0, pattern="api_abuse_credential_stuffing")
        df['failed_attempts_10m'] = np.random.randint(5, 18, size=n)
        df['channel'] = 'upi_collect'
        return df


if __name__ == "__main__":
    # Generate ~170k normal + 10k hard edge case + 14 * 180 (2520) fraud = ~182,520 total rows
    gen = FraudDatasetGenerator(n_normal=170000, n_edge=10000, n_fraud_per_pattern=180)
    df = gen.generate()
    
    # Save CSV
    df.to_csv('fraud_dataset.csv', index=False)
    
    # Metadata
    metadata = {
        "n_normal": int(df[df['pattern_category'] == 'normal'].shape[0]),
        "n_edge_cases": int(df[df['is_hard_edge_case'] == 1].shape[0]),
        "n_fraud": int(df[df['is_fraud'] == 1].shape[0]),
        "fraud_rate": float(df['is_fraud'].mean()),
        "feature_names": list(df.columns),
        "generation_date": datetime.now().isoformat(),
        "patterns_breakdown": df['pattern_category'].value_counts().to_dict()
    }
    
    with open('fraud_dataset_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=4)
        
    print(f"Total samples: {len(df)}")
    print(f"Normal: {metadata['n_normal']}")
    print(f"Hard Edge Cases: {metadata['n_edge_cases']}")
    print(f"Fraud: {metadata['n_fraud']} ({metadata['fraud_rate']*100:.3f}%)")
    print(f"Features: {len(df.columns)-3}")
    print("\nPattern breakdown:")
    for k, v in metadata['patterns_breakdown'].items():
        print(f"  {k}: {v}")
