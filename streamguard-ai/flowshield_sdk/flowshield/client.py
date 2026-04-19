"""
Flowshield AI Python SDK
========================
Official client library for the Flowshield AI Fraud Detection API.
Reduces integration from days/weeks to under 5 minutes.

Install:
    pip install flowshield

Quickstart:
    from flowshield import FlowshieldClient
    fs = FlowshieldClient(api_key="fs_live_xxxx")
    result = fs.analyze(amount=18000, currency="INR", ...)
    print(result.decision)  # "block"
    print(result.reasons)   # ["High-risk merchant", ...]
"""

import time
import logging
from dataclasses import dataclass, field
from typing import Literal, Optional

try:
    import requests
except ImportError:
    raise ImportError("Install requests: pip install requests")

logger = logging.getLogger(__name__)

__version__ = "1.0.0"

# ── Data Models ───────────────────────────────────────────────────────────────

@dataclass
class Merchant:
    id: str
    name: str
    category: str   # MCC code e.g. "5411" = grocery
    country: str    # ISO-2 e.g. "IN"

@dataclass
class Card:
    last_four: str
    type: str       # "credit" | "debit" | "prepaid"
    issuing_country: str

@dataclass
class Customer:
    id: str
    country: str    # ISO-2 e.g. "IN"
    email: Optional[str] = None
    ip: Optional[str] = None
    city: Optional[str] = None
    device_fingerprint: Optional[str] = None

@dataclass
class FraudResult:
    """Response from the Flowshield API."""
    transaction_id: str
    risk_score: float           # 0.0 (safe) → 1.0 (fraud)
    risk_label: str             # "safe" | "suspicious" | "fraud"
    decision: str               # "allow" | "review" | "block"
    confidence: float           # Model confidence 0.0–1.0
    reasons: list[str]          # Human-readable fraud reasons
    detection_latency_ms: int   # Time taken in milliseconds
    model_version: str
    model_scores: dict          # Per-layer breakdown

    @property
    def is_fraud(self) -> bool:
        return self.decision == "block"

    @property
    def needs_review(self) -> bool:
        return self.decision == "review"

    @property
    def is_safe(self) -> bool:
        return self.decision == "allow"

    def __repr__(self):
        return (
            f"FraudResult(decision='{self.decision}', "
            f"risk_score={self.risk_score:.3f}, "
            f"reasons={self.reasons[:1]})"
        )

# ── Exceptions ────────────────────────────────────────────────────────────────

class FlowshieldError(Exception):
    """Base exception for Flowshield SDK errors."""
    pass

class AuthenticationError(FlowshieldError):
    """Raised when the API key is invalid or missing."""
    pass

class RateLimitError(FlowshieldError):
    """Raised when API rate limit is exceeded."""
    pass

class FlowshieldAPIError(FlowshieldError):
    """Raised for unexpected API errors."""
    def __init__(self, message, status_code=None, request_id=None):
        super().__init__(message)
        self.status_code = status_code
        self.request_id = request_id

# ── Main Client ───────────────────────────────────────────────────────────────

class FlowshieldClient:
    """
    Flowshield AI fraud detection client.

    Args:
        api_key (str): Your Flowshield API key (fs_live_xxx or fs_test_xxx)
        sandbox (bool): Use sandbox mode — no API key needed, returns mock data
        timeout (int): Request timeout in seconds (default: 10)
        base_url (str): API base URL (override for self-hosted)

    Example:
        # Production
        fs = FlowshieldClient(api_key="fs_live_xxxxxxxxxxxx")

        # Sandbox (no key needed — for testing)
        fs = FlowshieldClient(sandbox=True)

        result = fs.analyze(
            transaction_id="tx_001",
            amount=18000,
            currency="INR",
            merchant=Merchant(id="m_1", name="CryptoEx", category="6051", country="IN"),
            card=Card(last_four="4242", type="credit", issuing_country="IN"),
            customer=Customer(id="cust_1", country="IN", ip="203.0.113.5"),
        )

        if result.is_fraud:
            block_transaction()
        elif result.needs_review:
            flag_for_manual_review()
    """

    PRODUCTION_URL = "https://flowshield-backend-ani8.onrender.com/api/v1"
    SANDBOX_URL    = "https://flowshield-backend-ani8.onrender.com/api/v1/sandbox"

    def __init__(
        self,
        api_key: Optional[str] = None,
        sandbox: bool = False,
        timeout: int = 10,
        base_url: Optional[str] = None,
    ):
        self.sandbox = sandbox
        self.timeout = timeout

        if sandbox:
            self.base_url = self.SANDBOX_URL
            self.api_key  = "sandbox"
            logger.info("Flowshield SDK: SANDBOX mode — responses are simulated")
        else:
            if not api_key:
                raise AuthenticationError(
                    "api_key is required. "
                    "Get yours at https://flowshield-backend-ani8.onrender.com/dashboard/api-keys"
                )
            self.api_key  = api_key
            self.base_url = base_url or self.PRODUCTION_URL

        self._session = requests.Session()
        self._session.headers.update({
            "X-API-Key": self.api_key,
            "Content-Type": "application/json",
            "User-Agent": f"flowshield-python/{__version__}",
            "X-SDK-Version": __version__,
        })

    def analyze(
        self,
        transaction_id: str,
        amount: float,
        currency: str,
        merchant: Merchant,
        card: Card,
        customer: Customer,
        channel: str = "api",
        metadata: dict = None,
    ) -> FraudResult:
        """
        Analyze a transaction for fraud risk.

        Returns a FraudResult with decision, risk_score, and reasons.
        Raises FlowshieldError on failure.
        """
        payload = {
            "transaction_id": transaction_id,
            "amount": float(amount),
            "currency": currency.upper(),
            "merchant": {
                "id": merchant.id,
                "name": merchant.name,
                "category": merchant.category,
                "country": merchant.country.upper(),
            },
            "card": {
                "last_four": card.last_four,
                "type": card.type,
                "issuing_country": card.issuing_country.upper(),
            },
            "customer": {
                "id": customer.id,
                "country": customer.country.upper(),
                "email": customer.email,
                "ip": customer.ip,
                "city": customer.city,
                "device_fingerprint": customer.device_fingerprint,
            },
            "channel": channel,
            "metadata": metadata or {},
        }

        try:
            endpoint = f"{self.base_url}/transactions/analyze"
            resp = self._session.post(endpoint, json=payload, timeout=self.timeout)
        except requests.Timeout:
            raise FlowshieldAPIError(f"Request timed out after {self.timeout}s")
        except requests.ConnectionError as e:
            raise FlowshieldAPIError(f"Connection error: {e}")

        self._handle_error(resp)
        data = resp.json()

        return FraudResult(
            transaction_id=data.get("transaction_id", transaction_id),
            risk_score=float(data["risk_score"]),
            risk_label=data["risk_label"],
            decision=data["decision"],
            confidence=float(data.get("confidence", 0.5)),
            reasons=data.get("reasons", []),
            detection_latency_ms=int(data.get("detection_latency_ms", 0)),
            model_version=data.get("model_version", "unknown"),
            model_scores=data.get("model_scores", {}),
        )

    def sandbox_demo(self, scenario: str = "fraud") -> FraudResult:
        """
        Quick demo call — no API key needed.
        scenario: "fraud" | "safe" | "review"
        """
        scenarios = {
            "fraud": {
                "id": "demo_fraud", "amount": 180000, "mcc": "6051",
                "country_cust": "IN", "country_card": "US"
            },
            "safe": {
                "id": "demo_safe", "amount": 450, "mcc": "5411",
                "country_cust": "IN", "country_card": "IN"
            },
            "review": {
                "id": "demo_review", "amount": 8500, "mcc": "5999",
                "country_cust": "IN", "country_card": "IN"
            },
        }
        s = scenarios.get(scenario, scenarios["fraud"])
        return self.analyze(
            transaction_id=s["id"],
            amount=s["amount"],
            currency="INR",
            merchant=Merchant(id="demo_m", name="Demo Merchant", category=s["mcc"], country="IN"),
            card=Card(last_four="4242", type="credit", issuing_country=s["country_card"]),
            customer=Customer(id="demo_cust", country=s["country_cust"], ip="203.0.113.5"),
            channel="sdk_demo",
        )

    def _handle_error(self, resp: "requests.Response"):
        if resp.status_code == 200:
            return
        try:
            err = resp.json().get("error", {})
            code = err.get("code", "UNKNOWN")
            msg  = err.get("message", resp.text)
        except Exception:
            code, msg = "UNKNOWN", resp.text

        if resp.status_code == 401:
            raise AuthenticationError(f"Invalid API key: {msg}")
        elif resp.status_code == 429:
            raise RateLimitError(f"Rate limit exceeded: {msg}")
        else:
            raise FlowshieldAPIError(msg, status_code=resp.status_code)
