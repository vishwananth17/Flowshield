PLAN_LIMITS = {
    "free": {
        "requests": 1000,
        "api_keys": 1,
        "webhooks": 0,
        "history_days": 7,
        "ml_enabled": True,
        "analytics": True,
        "alerts": True
    },
    "basic": {
        "requests": 25000,
        "api_keys": 3,
        "webhooks": 1,
        "history_days": 30,
        "ml_enabled": True,
        "analytics": True,
        "alerts": True
    },
    "standard": {
        "requests": 100000,
        "api_keys": 10,
        "webhooks": 5,
        "history_days": 90,
        "ml_enabled": True,
        "analytics": True,
        "alerts": True
    },
    "premium": {
        "requests": -1,  # Unlimited
        "api_keys": -1,  # Unlimited
        "webhooks": -1,  # Unlimited
        "history_days": 365,
        "ml_enabled": True,
        "analytics": True,
        "alerts": True
    },
}

def get_limit(plan: str, feature: str):
    return PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])[feature]

def check_feature_access(plan: str, feature: str) -> bool:
    limit = get_limit(plan, feature)
    if isinstance(limit, bool):
        return limit
    return limit != 0
