"""
Flowshield AI — Three-Tier Decision Engine
Implements calibrated probability gating: Approve (0.0-0.35), Challenge (0.35-0.72),
and Block (0.72-1.0), with deterministic hard rule overrides.
"""

import logging
from typing import Any, Dict, List, Optional
from app.services.probability_engine import build_decision_explanation

logger = logging.getLogger(__name__)

SANCTIONED_COUNTRIES = {"CU", "IR", "KP", "SY", "RU"}


class SignalObject:
    """Convenience attribute wrapper around raw signals dictionary."""
    def __init__(self, d: Dict[str, Any]):
        self._d = d

    def __getattr__(self, name: str) -> Any:
        return self._d.get(name)


class DecisionEngine:
    """Three-tier risk gating with hard rules and challenge routing."""

    DEFAULT_THRESHOLDS = {
        "approve": 0.35,
        "challenge": 0.72,
        "block": 1.0,
    }

    HARD_RULES = [
        {
            "name": "tor_high_value",
            "condition": lambda s: bool(s.is_tor) and float(s.amount or 0) > 5000,
            "action": "block",
            "reason": "Tor anonymization network used on high value transaction (₹>5,000)."
        },
        {
            "name": "card_testing_ring",
            "condition": lambda s: int(s.card_multi_account_use or 1) > 4,
            "action": "block",
            "reason": "Card used across 5+ accounts in 10 minutes (card testing ring pattern)."
        },
        {
            "name": "velocity_attack",
            "condition": lambda s: int(s.velocity_card_1min or 1) > 15,
            "action": "block",
            "reason": "Extreme velocity spike (>15 payment attempts/min) indicating bot attack."
        },
        {
            "name": "automated_system",
            "condition": lambda s: bool(s.is_headless_browser) and bool(s.is_datacenter_ip),
            "action": "block",
            "reason": "Automated headless browser executing from datacenter IP address."
        },
        {
            "name": "3ds_failed_high_value",
            "condition": lambda s: str(s.three_ds_result).lower() == "failed" and float(s.amount or 0) > 10000,
            "action": "block",
            "reason": "Failed 3D-Secure bank verification on high-value order (₹>10,000)."
        },
        {
            "name": "sanctioned_jurisdiction",
            "condition": lambda s: (
                str(s.ip_country).upper() in SANCTIONED_COUNTRIES or
                str(s.card_issuing_country).upper() in SANCTIONED_COUNTRIES
            ),
            "action": "block",
            "reason": "Transaction originates from or uses card issued in sanctioned jurisdiction."
        }
    ]

    def decide(
        self,
        risk_result: Dict[str, Any],
        signals: Dict[str, Any],
        org_thresholds: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Applies hard rules first, then evaluates the probability score against configured tiers.
        """
        score = risk_result.get("risk_score", 0.15)
        top_signals = risk_result.get("top_signals", [])
        sig_obj = SignalObject(signals)

        # 1. Evaluate Hard Rules (Always override ML/rules)
        for rule in self.HARD_RULES:
            try:
                if rule["condition"](sig_obj):
                    logger.info(f"Hard rule triggered: {rule['name']}")
                    explanation = f"Hard Rule Triggered: {rule['reason']}"
                    return {
                        "decision": "block",
                        "tier": "hard_rule",
                        "triggered_rule": rule["name"],
                        "reason": rule["reason"],
                        "score": 1.0,  # Hard override to maximum risk
                        "challenge_method": None,
                        "top_reasons": top_signals[:3],
                        "explanation": explanation,
                        "customer_message": "We couldn't complete this transaction. Please contact your bank."
                    }
            except Exception as e:
                logger.error(f"Error evaluating hard rule {rule['name']}: {e}")

        # 2. Determine Thresholds (Org-specific or Default)
        thresholds = org_thresholds or {}
        approve_threshold = float(thresholds.get("approve_below", self.DEFAULT_THRESHOLDS["approve"]))
        challenge_threshold = float(thresholds.get("challenge_above", self.DEFAULT_THRESHOLDS["challenge"]))

        # 3. Three-Tier Decision Logic
        if score <= approve_threshold:
            decision = "approve"
            tier_name = "low_risk"
            challenge_method = None
            customer_message = "Payment approved."
        elif score <= challenge_threshold:
            decision = "challenge"
            tier_name = "medium_risk"
            challenge_method = self._pick_challenge(signals)
            customer_message = "Additional step-up verification required to complete checkout."
        else:
            decision = "block"
            tier_name = "high_risk"
            challenge_method = None
            customer_message = "We couldn't complete this transaction. Please contact your bank."

        explanation = build_decision_explanation(top_signals, score, decision)

        return {
            "decision": decision,
            "tier": tier_name,
            "score": score,
            "challenge_method": challenge_method,
            "top_reasons": top_signals[:3],
            "explanation": explanation,
            "customer_message": customer_message,
            "triggered_rule": None
        }

    def _pick_challenge(self, signals: Dict[str, Any]) -> str:
        """Determines best challenge channel based on customer capabilities."""
        # 1. If 3DS is supported by issuer/gateway and not yet completed
        if signals.get("3ds_available") and signals.get("three_ds_result") != "authenticated":
            return "3ds_redirect"
        # 2. If phone is verified, challenge with SMS OTP
        elif signals.get("phone_verified", False):
            return "otp_sms"
        # 3. Hold for manual review
        else:
            return "manual_review"
