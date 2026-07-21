class FraudTypeClassifier:
    """
    Rule-based classifier that identifies the most likely
    fraud type given the feature vector and ML score.
    Runs in < 1ms — purely logical, no ML overhead.
    """

    THRESHOLDS = {
        "stolen_card": {
            "min_score": 0.5,
            "signals": [
                "is_new_device", "geo_mismatch",
                "amount_vs_avg_ratio"
            ],
            "signal_threshold": 2
        },
        "chargeback_fraud": {
            "min_score": 0.4,
            "signals": [
                "prior_dispute_count",
                "customer_dispute_rate",
                "dispute_prone_product"
            ],
            "signal_threshold": 2
        },
        "account_takeover": {
            "min_score": 0.5,
            "signals": [
                "ato_impossible_travel",
                "ato_password_reset",
                "ato_new_device",
                "ato_account_modified"
            ],
            "signal_threshold": 2
        },
        "refund_fraud": {
            "min_score": 0.4,
            "signals": [
                "customer_refund_rate",
                "device_refund_count",
                "high_refund_category"
            ],
            "signal_threshold": 2
        },
        "promo_abuse": {
            "min_score": 0.35,
            "signals": [
                "device_account_count",
                "ip_account_count",
                "is_new_account",
                "has_sequential_email"
            ],
            "signal_threshold": 2
        },
        "bot_attack": {
            "min_score": 0.0,  # Override ML for clear bots
            "signals": [
                "is_bot_attack",
                "requests_per_minute"
            ],
            "signal_threshold": 1  # Any bot signal = flag
        },
    }

    def classify(self, ml_score: float, features: dict) -> dict:
        candidates = []

        for fraud_type, config in self.THRESHOLDS.items():
            if ml_score < config["min_score"]:
                continue

            # Count how many signals are triggered
            triggered = 0
            for signal in config["signals"]:
                val = features.get(signal, 0)
                # Specific threshold triggers
                if signal == "amount_vs_avg_ratio" and val > 3.0:
                    triggered += 1
                elif signal == "customer_dispute_rate" and val > 0.15:
                    triggered += 1
                elif signal == "customer_refund_rate" and val > 0.30:
                    triggered += 1
                elif signal == "device_refund_count" and val >= 3:
                    triggered += 1
                elif signal == "device_account_count" and val >= 3:
                    triggered += 1
                elif signal == "ip_account_count" and val >= 5:
                    triggered += 1
                elif signal == "requests_per_minute" and val > 100:
                    triggered += 1
                elif val > 0:
                    triggered += 1

            if triggered >= config["signal_threshold"]:
                candidates.append({
                    "fraud_type": fraud_type,
                    "triggered_signals": triggered,
                    "confidence": min(triggered / len(config["signals"]), 1.0)
                })

        if not candidates:
            return {
                "fraud_type": "unknown_pattern",
                "fraud_type_confidence": 0.0
            }

        # Pick the fraud type with the most triggered signals
        best = max(candidates, key=lambda x: x["triggered_signals"])
        return {
            "fraud_type": best["fraud_type"],
            "fraud_type_confidence": round(best["confidence"], 4)
        }
