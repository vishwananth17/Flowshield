"""
Flowshield AI | Billing & Plan Orchestration
===========================================
Formalizes the logic for access control, request limits, and 
ensemble depth across different customer tiers.

Addresses the assumption: "How will Flowshield AI differentiate its pricing 
model to be significantly more accessible while remaining profitable?"
"""

from enum import Enum
from dataclasses import dataclass
from typing import List, Dict

class PlanTier(Enum):
    FREE = "free"
    BUILDER = "builder"      # For startups / early fintechs
    GROWTH = "growth"        # For high-volume marketplaces
    ENTERPRISE = "enterprise" # Custom infrastructure

@dataclass
class PlanLimits:
    name: str
    monthly_requests: int
    overage_inr_per_1k: float  # Profitable overage cost
    ensemble_layers: List[str]
    has_shap: bool
    has_webhooks: bool
    retention_days: int
    support_tier: str

# ── GLOBAL BILLING CONFIG ─────────────────────────────────────────────────────

PLAID_TIERS: Dict[PlanTier, PlanLimits] = {
    PlanTier.FREE: PlanLimits(
        name="Free Sandbox",
        monthly_requests=1_000,
        overage_inr_per_1k=500.0, # High cost to encourage upgrade
        ensemble_layers=["HardRules"], # Low compute cost
        has_shap=False,
        has_webhooks=False,
        retention_days=7,
        support_tier="community"
    ),
    PlanTier.BUILDER: PlanLimits(
        name="Developer Builder",
        monthly_requests=25_000,
        overage_inr_per_1k=49.0, # Competitive with global giants (approx. $0.60)
        ensemble_layers=["HardRules", "MVIForest"], # Anomaly protection
        has_shap=True, # Market differentiator
        has_webhooks=True,
        retention_days=30,
        support_tier="email"
    ),
    PlanTier.GROWTH: PlanLimits(
        name="Growth Scale",
        monthly_requests=100_000,
        overage_inr_per_1k=29.0, # Volume discount
        ensemble_layers=["HardRules", "MVIForest", "XGBoost"], # Full global oracle
        has_shap=True,
        has_webhooks=True,
        retention_days=90,
        support_tier="priority"
    ),
    PlanTier.ENTERPRISE: PlanLimits(
        name="Enterprise Fortress",
        monthly_requests=1_000_000_000, # Effectively unlimited
        overage_inr_per_1k=15.0,
        ensemble_layers=["HardRules", "MVIForest", "XGBoost", "DedicatedModel"],
        has_shap=True,
        has_webhooks=True,
        retention_days=365,
        support_tier="dedicated"
    )
}

def get_plan_limits(tier_id: str) -> PlanLimits:
    try:
        tier = PlanTier(tier_id.lower())
        return PLAID_TIERS[tier]
    except (ValueError, KeyError):
        return PLAID_TIERS[PlanTier.FREE]

def check_access_control(tier_id: str, current_count: int) -> bool:
    """Verifies if organization has quota remaining."""
    limits = get_plan_limits(tier_id)
    return current_count < limits.monthly_requests
