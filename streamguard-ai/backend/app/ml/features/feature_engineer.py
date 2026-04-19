import numpy as np
import pandas as pd

class FraudFeatureEngineer:

    BASE_FEATURES = [
        'amount_inr', 'hour_of_day', 'day_of_week', 'is_weekend',
        'tx_count_last_1h', 'tx_count_last_24h', 'amount_sum_last_1h',
        'amount_vs_avg_ratio', 'ip_country_match', 'card_country_match',
        'is_new_device', 'merchant_risk_score', 'mcc_risk_tier',
        'is_night', 'device_age_days', 'unique_merchants_24h',
        'is_first_transaction'
    ]

    ENGINEERED_FEATURES = [
        'amount_x_risk', 'velocity_x_amount', 'geo_x_amount',
        'night_x_foreign', 'new_device_x_amount',
        'high_risk_mcc_x_amount', 'amount_to_1h_sum_ratio',
        'tx_velocity_ratio', 'total_risk_score',
        'geo_risk_combined', 'behavioral_anomaly'
    ]

    ALL_FEATURES = BASE_FEATURES + ENGINEERED_FEATURES

    def engineer(self, X: pd.DataFrame) -> pd.DataFrame:
        df = X.copy()

        # Fill missing values with safe defaults
        for col in self.BASE_FEATURES:
            if col not in df.columns:
                df[col] = 0

        # Log transform amounts
        df['amount_log'] = np.log1p(df['amount_inr'])
        df['amount_sum_log'] = np.log1p(df['amount_sum_last_1h'])

        # Interaction features
        df['amount_x_risk'] = (
            df['amount_log'] * df['merchant_risk_score']
        )
        df['velocity_x_amount'] = (
            df['tx_count_last_1h'] * df['amount_log']
        )
        df['geo_x_amount'] = (
            (1 - df['ip_country_match']) * df['amount_log']
        )
        df['night_x_foreign'] = (
            df['is_night'] * (1 - df['ip_country_match'])
        )
        df['new_device_x_amount'] = (
            df['is_new_device'] * df['amount_log']
        )
        df['high_risk_mcc_x_amount'] = (
            (df['mcc_risk_tier'] == 2).astype(int) * df['amount_log']
        )

        # Ratio features
        df['amount_to_1h_sum_ratio'] = (
            df['amount_inr'] / (df['amount_sum_last_1h'] + 1)
        )
        df['tx_velocity_ratio'] = (
            df['tx_count_last_1h'] / (df['tx_count_last_24h'] + 1)
        )

        # Risk aggregates
        df['geo_risk_combined'] = (
            (1 - df['ip_country_match']) +
            (1 - df['card_country_match'])
        )
        df['total_risk_score'] = (
            df['merchant_risk_score'] * 0.3 +
            df['mcc_risk_tier'] / 2 * 0.2 +
            df['geo_risk_combined'] / 2 * 0.3 +
            df['is_new_device'] * 0.1 +
            df['is_night'] * 0.1
        )
        df['behavioral_anomaly'] = (
            df['amount_vs_avg_ratio'].clip(0, 10) / 10 * 0.4 +
            df['tx_velocity_ratio'].clip(0, 1) * 0.3 +
            df['is_first_transaction'] * 0.3
        )

        return df[self.ALL_FEATURES]

    @staticmethod
    def generate_human_readable_reason(
        shap_vals, feature_names, feature_values, top_n=3
    ):
        shap_dict = dict(zip(feature_names, shap_vals))
        sorted_by_impact = sorted(
            shap_dict.items(),
            key=lambda x: abs(x[1]),
            reverse=True
        )

        reasons = []
        for feat, shap_val in sorted_by_impact[:top_n * 2]:
            val = float(feature_values.get(feat, 0))

            if feat == 'amount_vs_avg_ratio' and val > 3:
                reasons.append(
                    f"Amount is {val:.1f}x higher than "
                    f"customer average"
                )
            elif feat == 'ip_country_match' and val == 0:
                reasons.append(
                    "IP geolocation does not match card country"
                )
            elif feat == 'tx_count_last_1h' and val > 5:
                reasons.append(
                    f"High velocity: {int(val)} transactions "
                    f"in last hour"
                )
            elif feat == 'is_new_device' and val == 1:
                reasons.append(
                    "Transaction from an unrecognised device"
                )
            elif feat == 'is_night' and val == 1:
                reasons.append(
                    "Unusual transaction time — night hours"
                )
            elif feat == 'merchant_risk_score' and val > 0.7:
                reasons.append(
                    f"High-risk merchant (risk score: {val:.2f})"
                )
            elif feat == 'mcc_risk_tier' and val == 2:
                reasons.append(
                    "High-risk merchant category (crypto/quasi-cash)"
                )
            elif feat == 'geo_risk_combined' and val >= 2:
                reasons.append(
                    "Both IP and card country are foreign"
                )
            elif feat == 'card_country_match' and val == 0:
                reasons.append(
                    "Card issuing country does not match "
                    "customer country"
                )
            elif feat == 'is_first_transaction' and val == 1:
                reasons.append(
                    "First transaction on this account"
                )
            else:
                if len(reasons) < top_n:
                    direction = "elevated" if shap_val > 0 \
                                else "reduced"
                    reasons.append(
                        f"Anomalous {feat.replace('_',' ')} "
                        f"pattern ({direction} risk)"
                    )

            if len(reasons) >= top_n:
                break

        return reasons[:top_n]
