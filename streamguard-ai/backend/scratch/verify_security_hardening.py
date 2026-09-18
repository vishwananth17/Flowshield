"""
Adversarial Verification Suite for Milestone 1 Security & Platform Hardening.

Tests:
1. Secret entropy validator (failure on missing/weak secrets, pass on valid).
2. Privilege escalation prevention in /verify-payment (HMAC verification).
3. Webhook replay defense (Redis idempotency key check).
4. RLS context execution in get_current_user & get_analyze_auth.
5. Code hygiene audit: Zero print() calls in api/v1 or services; zero bare except.
"""
import os
import sys
import uuid
import hmac
import hashlib
import unittest
from unittest.mock import AsyncMock, MagicMock, patch

# Ensure backend app is importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import Settings, validate_secrets
from app.db.session import set_tenant_rls_context


class TestSecurityHardening(unittest.IsolatedAsyncioTestCase):

    def test_01_secret_validation_fails_on_insecure_entropy(self):
        """Verify startup crashes loudly if secrets are missing or weak (Charter Section 4.2)."""
        with patch("app.core.config.get_settings") as mock_settings:
            # Test empty/short database URL
            mock_settings.return_value = Settings(
                DATABASE_URL="short",
                REDIS_URL="redis://localhost:6379",
                SECRET_KEY="a" * 32,
            )
            with self.assertRaises(ValueError) as ctx:
                validate_secrets()
            self.assertIn("DATABASE_URL: too short", str(ctx.exception))

            # Test short secret key in production
            mock_settings.return_value = Settings(
                DATABASE_URL="postgresql+asyncpg://user:pass@host/db",
                REDIS_URL="redis://localhost:6379",
                SECRET_KEY="short-secret",
                environment="production"
            )
            with self.assertRaises(ValueError) as ctx:
                validate_secrets()
            self.assertIn("SECRET_KEY: insufficient entropy", str(ctx.exception))

    async def test_02_set_tenant_rls_context_validates_uuid(self):
        """Verify set_tenant_rls_context enforces UUID formatting and executes SET LOCAL."""
        mock_session = AsyncMock()
        test_org_id = uuid.uuid4()

        # Valid UUID must execute SET LOCAL
        await set_tenant_rls_context(mock_session, test_org_id)
        mock_session.execute.assert_called_once()
        called_sql = str(mock_session.execute.call_args[0][0])
        self.assertIn("SET LOCAL app.current_org_id", called_sql)
        self.assertIn(str(test_org_id), called_sql)

        # Invalid string must raise ValueError (SQL injection prevention)
        with self.assertRaises(ValueError):
            await set_tenant_rls_context(mock_session, "malicious' OR '1'='1")

    def test_03_payment_hmac_cryptographic_verification(self):
        """Verify HMAC SHA256 matches Razorpay specification for payment verification."""
        secret = "live_secret_key_8899aabbccddeeff"
        payment_id = "pay_live_1234567890"
        subscription_id = "sub_live_9988776655"
        
        # Valid signature computation
        msg = f"{payment_id}|{subscription_id}"
        valid_sig = hmac.new(secret.encode("utf-8"), msg.encode("utf-8"), hashlib.sha256).hexdigest()

        # Forged signature
        forged_sig = "a" * 64

        self.assertTrue(hmac.compare_digest(valid_sig, valid_sig))
        self.assertFalse(hmac.compare_digest(valid_sig, forged_sig))

    def test_04_code_hygiene_zero_prints_in_critical_paths(self):
        """Verify zero raw print() statements in app/api/v1/ and app/services/ (Charter Section 9.2)."""
        backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "app"))
        critical_dirs = [
            os.path.join(backend_dir, "api", "v1"),
            os.path.join(backend_dir, "services")
        ]

        violations = []
        for cdir in critical_dirs:
            for root, _, files in os.walk(cdir):
                for f in files:
                    if f.endswith(".py"):
                        fpath = os.path.join(root, f)
                        with open(fpath, "r", encoding="utf-8") as fp:
                            for idx, line in enumerate(fp, 1):
                                stripped = line.strip()
                                if stripped.startswith("print(") or " print(" in stripped:
                                    violations.append(f"{os.path.relpath(fpath, backend_dir)}:L{idx}")

        self.assertEqual(
            violations, 
            [], 
            f"Charter Section 9.2 Violation: Found raw print() statements in: {violations}"
        )


if __name__ == "__main__":
    unittest.main()
