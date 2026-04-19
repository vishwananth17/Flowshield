# Flowshield AI Python SDK

The official Python client for [Flowshield AI](https://flowshield.ai) — real-time fraud detection for Indian fintechs.

## Install

```bash
pip install flowshield
```

## 5-Minute Quickstart

```python
from flowshield import FlowshieldClient, Merchant, Card, Customer

# Initialize
fs = FlowshieldClient(api_key="fs_live_xxxxxxxxxxxx")

# Analyze a transaction
result = fs.analyze(
    transaction_id="tx_your_id_123",
    amount=18000,          # INR
    currency="INR",
    merchant=Merchant(id="m_1", name="CryptoEx", category="6051", country="IN"),
    card=Card(last_four="4242", type="credit", issuing_country="IN"),
    customer=Customer(id="cust_1", country="IN", ip="203.0.113.5"),
)

# Act on the result
if result.is_fraud:
    print(f"BLOCKED: {result.reasons}")    # ["High-risk merchant on new device"]
elif result.needs_review:
    print(f"REVIEW needed: score={result.risk_score:.2f}")
else:
    print(f"SAFE: allowed through")
```

## Try Sandbox First (No API Key Needed)

```python
from flowshield import FlowshieldClient

fs = FlowshieldClient(sandbox=True)

# Test a known fraud scenario
result = fs.sandbox_demo(scenario="fraud")   # or "safe" or "review"
print(result)
# FraudResult(decision='block', risk_score=0.865, reasons=['High-risk merchant...'])
```

## Response Object

```python
result.risk_score       # float 0.0–1.0
result.risk_label       # "safe" | "suspicious" | "fraud"
result.decision         # "allow" | "review" | "block"
result.reasons          # ["Reason 1", "Reason 2", "Reason 3"]
result.confidence       # float 0.0–1.0
result.detection_latency_ms   # int (typically < 50ms)
result.model_scores     # {"mviforest": 0.71, "xgboost": 0.98, "rules": 0.0}
result.is_fraud         # bool shortcut
result.needs_review     # bool shortcut
result.is_safe          # bool shortcut
```

## Error Handling

```python
from flowshield import FlowshieldClient, AuthenticationError, RateLimitError

try:
    result = fs.analyze(...)
except AuthenticationError:
    print("Invalid API key")
except RateLimitError:
    print("Rate limit hit — consider upgrading plan")
except Exception as e:
    print(f"API error: {e}")
    # Flowshield never crashes your transaction flow
    # Always have a fallback (e.g., allow + flag for review)
```

## Get an API Key

1. Create an account: [flowshield.ai](https://flowshield-git-main-vishwananth17s-projects.vercel.app/register)
2. Navigate to **API Keys** in the dashboard
3. Click **Generate Key**, select Environment = Live
4. Copy the key — shown once, never again

---

Built on the MVIForest algorithm (IEEE Access, 2022)  
ROC AUC: **0.9969** | Recall: **81%** | FAR: **0.20%**
