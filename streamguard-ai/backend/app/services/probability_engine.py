"""
Flowshield AI — Multi-Signal Probability Engine
Calculates calibrated risk probabilities from diverse signal inputs, combining
transparent rule-based feature contributions with ML ensemble predictions.
"""

import math
import logging
from typing import Any, Dict, List, Optional, Callable

logger = logging.getLogger(__name__)


class SignalWeight:
    """Configures individual signal contribution weights, directions, and scaling."""

    WEIGHTS: Dict[str, Dict[str, Any]] = {
        # -------------------------------------------------------------
        # Trust Signals (Negative weight = reduces risk score)
        # -------------------------------------------------------------
        "card_history_with_merchant": {
            "direction": "trust",
            "base_weight": 0.20,
            "scaling": "logarithmic",
            "note": "Single strongest legitimacy indicator. >5 prior payments reduces risk by 0.20."
        },
        "3ds_authenticated": {
            "direction": "trust",
            "base_weight": 0.15,
            "note": "Customer bank verified purchase directly through banking app."
        },
        "known_device": {
            "direction": "trust",
            "base_weight": 0.08,
            "note": "Hardware and browser fingerprint previously seen with this merchant."
        },

        # -------------------------------------------------------------
        # Risk Signals (Positive weight = increases risk score)
        # -------------------------------------------------------------
        "card_multi_account_use": {
            "direction": "risk",
            "base_weight": 0.35,
            "threshold": 2,
            "note": "High signal — one card tested across accounts in 10 minutes."
        },
        "velocity_card_1min": {
            "direction": "risk",
            "base_weight": 0.30,
            "threshold": 5,
            "note": "Card testing velocity spike within 60 seconds."
        },
        "amount_vs_average_ratio": {
            "direction": "risk",
            "base_weight": 0.15,
            "scaling": "ratio_stepped",
            "note": "Transaction amount significantly diverges from normal card spend."
        },
        "is_tor": {
            "direction": "risk",
            "base_weight": 0.12,
            "note": "Tor exit node anonymization proxy."
        },
        "failed_attempts_before_success": {
            "direction": "risk",
            "base_weight": 0.10,
            "threshold": 3,
            "note": "Repeated authorization or CVC/expiry failures."
        },
        "is_headless_browser": {
            "direction": "risk",
            "base_weight": 0.25,
            "note": "Automation framework or scraper execution without real browser rendering."
        },
        "device_cluster_size": {
            "direction": "risk",
            "base_weight": 0.20,
            "threshold": 3,
            "note": "Multiple merchant accounts sharing identical hardware fingerprint."
        },
        "account_prior_disputes": {
            "direction": "risk",
            "base_weight": 0.18,
            "threshold": 2,
            "note": "Repeated chargebacks or friendly fraud history."
        },
        "new_account_high_amount": {
            "direction": "risk",
            "base_weight": 0.15,
            "note": "High-value basket on an account under 7 days old."
        },
        "3ds_failed": {
            "direction": "risk",
            "base_weight": 0.20,
            "note": "Customer failed 3D-Secure bank verification challenge."
        },
        "is_network_flagged": {
            "direction": "risk",
            "base_weight": 0.15,
            "note": "Cross-merchant radar flagged device or card hash."
        },
        "password_reset_before_purchase": {
            "direction": "risk",
            "base_weight": 0.12,
            "note": "Password change immediately followed by large checkout (ATO signal)."
        },
        "days_since_last_transaction": {
            "direction": "risk",
            "base_weight": 0.10,
            "threshold": 90,
            "note": "Prolonged account dormancy (>90 days) followed by transaction."
        },
        "is_disposable_email": {
            "direction": "risk",
            "base_weight": 0.08,
            "note": "Temporary or disposable inbox provider."
        },
        "email_format_suspicious": {
            "direction": "risk",
            "base_weight": 0.06,
            "note": "Randomized automated username format."
        },

        # -------------------------------------------------------------
        # Low-weight Modifier Signals (Tie-breakers, not primary)
        # -------------------------------------------------------------
        "name_mismatch": {
            "direction": "risk",
            "base_weight": 0.05,
            "note": "Name on card differs from account name. Never primary signal alone."
        },
        "ip_country_mismatch": {
            "direction": "risk",
            "base_weight": 0.06,
            "note": "VPN, travel, and mobile roaming often cause this."
        },
        "is_vpn": {
            "direction": "risk",
            "base_weight": 0.05,
            "note": "Commercial VPN in use without other malicious flags."
        },
    }


def compute_contribution(signal_name: str, value: Any, config: Dict[str, Any], all_signals: Dict[str, Any]) -> float:
    """Computes the numerical contribution (-1.0 to +1.0) of a single signal."""
    direction = config.get("direction", "risk")
    base_weight = config.get("base_weight", 0.05)
    scaling = config.get("scaling", "threshold")
    threshold = config.get("threshold")

    # 1. Trust signals
    if direction == "trust":
        if signal_name == "card_history_with_merchant":
            count = int(value or 0)
            if count <= 0:
                return 0.0
            # 1 tx: -0.05, 5 tx: -0.15, 10+ tx: -0.20
            if count >= 10:
                return -0.20
            elif count >= 5:
                return -0.15
            elif count >= 2:
                return -0.08
            else:
                return -0.05

        elif signal_name == "3ds_authenticated":
            return -base_weight if bool(value) else 0.0

        elif signal_name == "known_device":
            return -base_weight if bool(value) else 0.0

    # 2. Risk signals
    if direction == "risk":
        if signal_name == "amount_vs_average_ratio":
            ratio = float(value or 1.0)
            if ratio < 2.0:
                # Normal spend pattern: slight trust reward
                return -0.04
            elif ratio >= 10.0:
                return 0.15
            elif ratio >= 5.0:
                return 0.10
            elif ratio >= 2.5:
                return 0.05
            return 0.02

        if signal_name == "card_multi_account_use":
            count = int(value or 1)
            if count > 4:
                return 0.35  # Extreme card testing
            elif count > 2:
                return 0.25
            elif count == 2:
                return 0.12
            return 0.0

        if signal_name == "velocity_card_1min":
            count = int(value or 1)
            if count > 15:
                return 0.30
            elif count > 5:
                return 0.20
            elif count > 2:
                return 0.08
            return 0.0

        if signal_name == "device_cluster_size":
            count = int(value or 1)
            if count > 10:
                return 0.20
            elif count > 3:
                return 0.12
            return 0.0

        if signal_name == "account_prior_disputes":
            count = int(value or 0)
            if count > 2:
                return 0.18
            elif count > 0:
                return 0.09
            return 0.0

        if signal_name == "failed_attempts_before_success":
            count = int(value or 0)
            if count > 5:
                return 0.10
            elif count >= 3:
                return 0.06
            return 0.0

        if signal_name == "days_since_last_transaction":
            days = int(value or 0)
            ratio = float(all_signals.get("amount_vs_average_ratio", 1.0))
            if days > 90 and ratio > 3.0:
                return 0.10
            return 0.0

        if signal_name == "name_mismatch":
            mismatch = float(value or 0.0)
            # If virtual or corporate, suppress name mismatch
            if all_signals.get("is_virtual_card") or all_signals.get("is_corporate_card"):
                return 0.0
            if mismatch > 0.4:
                return base_weight * mismatch
            return 0.0

        if signal_name == "is_vpn":
            # VPN alone is not fraud (many legitimate privacy users)
            # Only add weight if coupled with new account or high amount
            if bool(value):
                if all_signals.get("new_account_high_amount") or float(all_signals.get("amount_vs_average_ratio", 1.0)) > 3.0:
                    return base_weight
                return 0.02
            return 0.0

        # Boolean flags
        if isinstance(value, bool):
            return base_weight if value else 0.0

        # Threshold check
        if threshold is not None:
            num_val = float(value or 0)
            return base_weight if num_val >= threshold else 0.0

    return 0.0


# -------------------------------------------------------------
# Plain-English Human-Readable Explanations
# -------------------------------------------------------------
HUMAN_REASONS = {
    "card_multi_account_use": lambda v, s: (
        f"This card was used across {v} different accounts in the last 10 minutes — "
        f"a strong card testing signal."
    ),
    "card_history_with_merchant": lambda v, s: (
        f"This card has successfully paid your store {v} times before — "
        f"a strong legitimacy signal."
    ),
    "velocity_card_1min": lambda v, s: (
        f"{v} payment attempts with this card in the last 60 seconds suggests automated card testing."
    ),
    "amount_vs_average_ratio": lambda v, s: (
        f"This transaction (₹{s.get('amount', 0):,.0f}) is {float(v):.1f}x higher than this "
        f"card's typical spend." if float(v) >= 2.0 else
        f"Purchase amount is consistent with customer's typical spend patterns."
    ),
    "3ds_authenticated": lambda v, s: (
        "The customer's bank verified this purchase directly through their banking app — "
        "strong legitimacy signal."
    ),
    "3ds_failed": lambda v, s: (
        "The customer failed bank verification — their bank could not confirm this is the real cardholder."
    ),
    "known_device": lambda v, s: (
        "This device fingerprint has been verified on prior successful transactions for this customer."
    ),
    "is_tor": lambda v, s: (
        "The transaction is routed through the Tor anonymization network — frequently used to hide identity in fraud."
    ),
    "is_headless_browser": lambda v, s: (
        "No real browser was detected — this appears to be an automated script, not a human customer."
    ),
    "device_cluster_size": lambda v, s: (
        f"This exact device fingerprint has been used across {v} different merchant accounts — "
        f"indicates device farming or synthetic identity ring."
    ),
    "account_prior_disputes": lambda v, s: (
        f"This customer has raised {v} disputes in the last 6 months — elevated chargeback risk profile."
    ),
    "new_account_high_amount": lambda v, s: (
        f"Account is {s.get('account_age_days', 0)} days old and this purchase is ₹{s.get('amount', 0):,.0f} — "
        f"unusually large for a newly created account."
    ),
    "failed_attempts_before_success": lambda v, s: (
        f"{v} failed payment attempts preceded this transaction — typical of brute-force credential stuffing."
    ),
    "is_network_flagged": lambda v, s: (
        "This device or card fingerprint was previously confirmed fraudulent by another merchant in the Flowshield network."
    ),
    "password_reset_before_purchase": lambda v, s: (
        "Password was reset immediately prior to this high-value checkout — characteristic account takeover pattern."
    ),
    "days_since_last_transaction": lambda v, s: (
        f"Account was dormant for {v} days before suddenly making this large purchase."
    ),
    "name_mismatch": lambda v, s: (
        f"Name on card differs from account name (match score: {1.0 - float(v):.0%}) — "
        f"note: virtual and company cards commonly cause this."
    ),
    "ip_country_mismatch": lambda v, s: (
        f"Customer billing address is in {s.get('billing_country', 'IN')} but IP is located in "
        f"{s.get('ip_country', 'Unknown')} — could be travel or VPN."
    ),
    "is_vpn": lambda v, s: (
        "Customer is connecting through a commercial VPN provider."
    ),
    "is_disposable_email": lambda v, s: (
        "The customer email uses a disposable, temporary inbox domain."
    ),
    "email_format_suspicious": lambda v, s: (
        "The email address format resembles an auto-generated randomized bot mailbox."
    ),
}


def build_decision_explanation(top_signals: List[Dict[str, Any]], final_score: float, decision: str) -> str:
    """Generates an executive explanation paragraph synthesizing top signals for non-technical merchants."""
    if not top_signals:
        return "Transaction evaluated within normal statistical risk parameters."

    risk_signals = [s for s in top_signals if s.get("direction") == "risk"]
    trust_signals = [s for s in top_signals if s.get("direction") == "trust"]

    if decision == "block":
        main_reasons = "; ".join([s["human_reason"].rstrip(".") for s in risk_signals[:3]])
        return (
            f"This transaction was declined (Risk Score: {int(final_score * 100)}/100) because "
            f"{main_reasons}. High probability of fraud detected."
        )
    elif decision == "challenge":
        primary = risk_signals[0]["human_reason"] if risk_signals else "elevated anomaly parameters"
        return (
            f"This transaction requires step-up verification (Risk Score: {int(final_score * 100)}/100) due to: "
            f"{primary}. Verification is requested to protect against potential chargebacks without declining a genuine buyer."
        )
    else:  # approve
        if trust_signals:
            strongest_trust = trust_signals[0]["human_reason"]
            return (
                f"Transaction approved with low risk score ({int(final_score * 100)}/100). {strongest_trust}"
            )
        return f"Transaction cleared standard security verification with low baseline risk ({int(final_score * 100)}/100)."


class ProbabilityEngine:
    """Combines multi-signal contributions with ML predictions into a unified risk probability."""

    def __init__(self):
        self.weights = SignalWeight.WEIGHTS

    def compute_risk_score(
        self,
        signals: Dict[str, Any],
        ml_predict_fn: Optional[Callable[[Dict[str, Any]], float]] = None,
        labeled_samples: int = 0
    ) -> Dict[str, Any]:
        """
        Combines all signals into a single risk probability.
        Returns the score, sub-scores, and human-readable feature contributions.
        """
        # Baseline start: 15% (A completely unknown transaction has small initial baseline risk)
        rule_score = 0.15
        contributions = []

        # 1. Process trust signals and risk signals
        for signal_name, config in self.weights.items():
            if signal_name in signals:
                val = signals[signal_name]
                contrib = compute_contribution(signal_name, val, config, signals)
                rule_score += contrib

                if abs(contrib) >= 0.02:
                    human_fn = HUMAN_REASONS.get(signal_name)
                    reason_text = human_fn(val, signals) if human_fn else f"{signal_name} changed score by {contrib:+.2f}"
                    
                    contributions.append({
                        "signal": signal_name,
                        "value": val,
                        "contribution": round(contrib, 4),
                        "direction": "risk" if contrib > 0 else "trust",
                        "impact_magnitude": round(abs(contrib), 4),
                        "human_reason": reason_text
                    })

        # Clamp rule score between 0.0 and 1.0
        rule_score = max(0.0, min(1.0, rule_score))

        # 2. Query ML Ensemble (if available)
        ml_score = rule_score
        if ml_predict_fn is not None:
            try:
                ml_score = float(ml_predict_fn(signals))
                ml_score = max(0.0, min(1.0, ml_score))
            except Exception as e:
                logger.warning(f"ML Ensemble prediction failed: {e}. Falling back to rule score.")
                ml_score = rule_score

        # 3. Dynamic blending between Rules and ML
        # ML gets higher weight as labeled feedback dataset grows (up to 60%)
        ml_weight = min(0.60, 0.30 + (labeled_samples / 50000.0) * 0.30)
        rule_weight = 1.0 - ml_weight

        final_score = (rule_score * rule_weight) + (ml_score * ml_weight)
        final_score = max(0.0, min(1.0, final_score))

        # Sort contributions by absolute impact (highest first)
        contributions.sort(key=lambda x: abs(x["contribution"]), reverse=True)

        return {
            "risk_score": round(final_score, 4),
            "rule_score": round(rule_score, 4),
            "ml_score": round(ml_score, 4),
            "ml_weight_used": round(ml_weight, 2),
            "top_signals": contributions[:7],
            "signal_count": len(contributions),
            "all_contributions": contributions,
        }
