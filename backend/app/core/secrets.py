import os
import secrets
import logging
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

logger = logging.getLogger(__name__)

REQUIRED_ENV_VARS = {
    "DATABASE_URL":          {"min_length": 20},
    "REDIS_URL":             {"min_length": 10},
    "JWT_SECRET":            {"min_length": 64},
    "RAZORPAY_KEY_ID":       {"min_length": 14},
    "RAZORPAY_KEY_SECRET":   {"min_length": 20},
    "RAZORPAY_WEBHOOK_SECRET": {"min_length": 20},
    "DB_ENCRYPTION_KEY":     {"min_length": 32},
    "ENVIRONMENT":           {"allowed": ["production",
                                          "staging",
                                          "development"]},
}

def validate_all_secrets():
    errors = []
    env = os.getenv("ENVIRONMENT", "development")

    # For development/staging, we can auto-fill missing/short variables with secure/valid dummy fallbacks
    if env != "production":
        if not os.getenv("JWT_SECRET") or len(os.getenv("JWT_SECRET")) < 64:
            os.environ["JWT_SECRET"] = secrets.token_hex(32)  # Generates 64 chars hex string
            logger.warning("Generated fallback JWT_SECRET for non-production environment.")

        if not os.getenv("DB_ENCRYPTION_KEY") or len(os.getenv("DB_ENCRYPTION_KEY")) < 32:
            os.environ["DB_ENCRYPTION_KEY"] = secrets.token_hex(16)  # Generates 32 chars hex string
            logger.warning("Generated fallback DB_ENCRYPTION_KEY for non-production environment.")

        if not os.getenv("RAZORPAY_KEY_ID") or len(os.getenv("RAZORPAY_KEY_ID")) < 14:
            os.environ["RAZORPAY_KEY_ID"] = "rzp_test_" + secrets.token_hex(5)
            logger.warning("Generated fallback RAZORPAY_KEY_ID for non-production environment.")

        if not os.getenv("RAZORPAY_KEY_SECRET") or len(os.getenv("RAZORPAY_KEY_SECRET")) < 20:
            os.environ["RAZORPAY_KEY_SECRET"] = "rzp_test_secret_" + secrets.token_hex(4)
            logger.warning("Generated fallback RAZORPAY_KEY_SECRET for non-production environment.")

        if not os.getenv("RAZORPAY_WEBHOOK_SECRET") or len(os.getenv("RAZORPAY_WEBHOOK_SECRET")) < 20:
            os.environ["RAZORPAY_WEBHOOK_SECRET"] = "rzp_webhook_secret_" + secrets.token_hex(4)
            logger.warning("Generated fallback RAZORPAY_WEBHOOK_SECRET for non-production environment.")

        if not os.getenv("DATABASE_URL") or len(os.getenv("DATABASE_URL")) < 20:
            # Fallback to local SQLite URL
            os.environ["DATABASE_URL"] = "sqlite:///./sql_app.db"
            logger.warning("Fallback to local SQLite database in development.")

        if not os.getenv("REDIS_URL") or len(os.getenv("REDIS_URL")) < 10:
            os.environ["REDIS_URL"] = "redis://localhost:6379/0"
            logger.warning("Fallback to localhost Redis in development.")

    for var, rules in REQUIRED_ENV_VARS.items():
        value = os.getenv(var, "")

        if not value:
            errors.append(f"Missing: {var}")
            continue

        min_len = rules.get("min_length", 0)
        if len(value) < min_len:
            errors.append(
                f"{var} too short: {len(value)} < {min_len}"
            )

        allowed = rules.get("allowed")
        if allowed and value not in allowed:
            errors.append(
                f"{var} invalid value: {value}"
            )

    if errors:
        raise ValueError(
            "Secret validation failed:\n" +
            "\n".join(errors)
        )

    logger.info("All secrets validated successfully")
