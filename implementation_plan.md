# FlowShield AI: Test-Ready MVP Implementation & Validation Plan

## Goal
Transition FlowShield AI from a redesigned interface into a fully **Test-Ready MVP** that we can confidently hand to a real merchant or tester with the promise:
> *"Send us your transactions. FlowShield will analyze them in real time and show you what looks risky and why."*

---

## 1. Readiness Audit: Current State vs. Test-Ready Checklist

| Checklist Phase | Component / Capability | Current Status | Action Required |
| :--- | :--- | :--- | :--- |
| **Phase 0: Positioning** | Factual fintech positioning without hype claims | ✅ **Complete** | Purged all "100% prevention" and "guaranteed" claims from landing page and docs. |
| **Phase 1: Architecture** | FastAPI + Postgres + Redis + ML pipeline | 🟡 **Partially Ready** | Backend core exists; needs standalone execution mode without requiring external Kafka broker for local testing. |
| **Phase 2: Dataset** | 10,000+ realistic test transactions with labeled scenarios | 🔴 **Missing** | Need a realistic synthetic generation script with 15 fraud scenarios (card testing, ATO, velocity floods, geo-mismatch) + baseline normal distribution. |
| **Phase 3 & 4: Features & Rules** | 50+ features, deterministic override rules | ✅ **Complete** | `UnifiedFeatureEngineer` has 59 features; `_apply_hard_rules` covers velocity, sanctioned geos, and UPI collect patterns. |
| **Phase 5 & 6: ML & Scoring** | MVIForest + XGBoost + 0–100 calibrated score | ✅ **Complete** | 3-layer ensemble active in `app.ml.ensemble` with calibrated thresholds (0-30 Low, 31-70 Medium, 71-90 High, 91-100 Critical). |
| **Phase 7: Explainability** | Plain-English explanations without ML jargon | 🟡 **Needs Verification** | SHAP explainer generates features; verify output strings are 100% merchant-friendly (e.g., "14 checkouts in 2 minutes", not "XGB_WEIGHT_0.84"). |
| **Phase 8 & 9: Frontend & Inspection** | Dashboard, KPI cards, Transaction Detail Drawer | ✅ **Complete** | Built to Stripe Radar / Linear specifications with 56px `RiskScore`, `SignalCards`, and chronological forensic timeline. |
| **Phase 10 & 11: Realtime & Sandbox** | Live Feed + Attack Simulator | ✅ **Complete** | Reconstructed at `/simulator` with preset vectors and customizable parameter sandbox. |
| **Phase 12: Free Risk Audit** | CSV upload -> Validation -> Instant Risk Report | 🔴 **Missing** | Build the Free Risk Audit feature (frontend CSV dropzone + backend analysis + diagnostic audit report). |
| **Phase 13 & 14: Security & Privacy** | Anonymized data ingestion, no PII leakage | 🟡 **Needs Verification** | Ensure all endpoints accept anonymized identifiers (`customer_8124`, `device_2938`) without demanding personal PII. |
| **Phase 16 & 17: Performance & FPR** | Latency, throughput, False Positive Rate | 🔴 **Needs Benchmarking** | Run automated evaluation script measuring Latency (<50ms target) and False Positive Rate on normal transactions. |

---

## 2. Priority Implementation Roadmap

Following your 10-point priority sequence:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLOWSHIELD TEST-READY MVP                            │
├───────────────────────────────┬─────────────────────────────────────────────┤
│ 1. Engine & Explainability    │ Verify 0-100 score + plain-English reasons  │
│ 2. Realistic 10K+ Dataset     │ Normal + 15 fraud attack patterns           │
│ 3. Free Risk Audit Tool (CSV) │ Merchant acquisition & self-serve diagnostic│
│ 4. Evaluation Benchmark       │ Measure Latency, FPR, Precision, Recall     │
│ 5. Pilot-Ready Packaging      │ Onboarding doc + sample anonymized CSV data │
└───────────────────────────────┴─────────────────────────────────────────────┘
```

---

## Proposed Workstreams

### Workstream 1: Realistic 10,000+ Transaction Dataset Generator
- **Objective**: Create a deterministic, realistic synthetic dataset covering:
  - **Normal Transactions (85%)**: Micro, small, medium, and high-value orders; returning customers; known device hashes; consistent ISP/geo; normal time-of-day.
  - **Attack Patterns (15%)**:
    1. Card testing (rapid micro-charges across sequential cards)
    2. Velocity spike floods (10+ attempts in 60s from single device GUID)
    3. Tor / Datacenter proxy geo-mismatch (IP in NL/VN with domestic billing)
    4. Account Takeover (dormant account revival + password reset + shipping address deviation)
    5. Promo / discount abuse (disposable emails on identical hardware fingerprint)
    6. High-ticket first purchase without session warm-up
- **Outputs**:
  - `datasets/synthetic_transactions_10k.csv` (anonymized data ready for testing)
  - `scripts/generate_realistic_dataset.py` (customizable transaction generator)

### Workstream 2: Risk Engine & Plain-English Explainability Audit
- Ensure that for every transaction, FlowShield outputs:
  - `risk_score`: 0–100 integer
  - `risk_level`: LOW / MEDIUM / HIGH / CRITICAL
  - `recommendation`: ALLOW / REVIEW / BLOCK
  - `signals`: Plain-English descriptions:
    - *"14 checkout attempts in under 2 minutes from single device"*
    - *"Order value is 5.8× the customer's 90-day average"*
    - *"Origin IP resolves to a commercial Tor exit node"*
  - Zero raw feature names or internal ML jargon.

### Workstream 3: Free Transaction Risk Audit (The Acquisition Weapon)
- **Frontend Page / Feature**: `/audit` (or accessible directly from the Dashboard & Landing page)
  - Drag-and-drop CSV upload for anonymized transactions (with a downloadable sample CSV template).
  - Instant client-side validation (column checks: `transaction_id`, `amount`, `currency`, `timestamp`, `customer_id`, `ip_address`, `device_id`).
  - Processing progress indicator with estimated time.
  - **Executive Risk Diagnostic Report**:
    - **Header**: Total Transactions Analyzed, Flagged High Risk (Count & %), Potential Exposure Prevented (₹ / $).
    - **Risk Spectrum Distribution**: Low vs Medium vs High vs Critical breakdown.
    - **Top Threat Signals Detected**: Ranked by frequency (e.g. Velocity surge, Proxy detection, ATO).
    - **High-Risk Transaction Table**: Deep dive on the top 10 most suspicious records with plain-English reasons.
    - **Call-to-Action**: *"Want to monitor and block these risks in real time? Start your pilot."*
- **Backend Endpoint**: `POST /api/v1/audit/analyze-csv` (streaming batch evaluation).

### Workstream 4: Performance & False Positive Rate Benchmark
- Run automated evaluation script against the 10,000 transactions:
  - Measure **False Positive Rate** on legitimate transactions (target < 2%).
  - Measure **Detection Rate / Recall** on fraud scenarios (target > 90%).
  - Measure **Median Engine Latency** (target < 50ms).
  - Output summary report into `docs/BENCHMARK_RESULTS.md`.

---

## User Review Required

> [!IMPORTANT]
> **Should we prioritize building the Free Risk Audit CSV tool (Workstream 3) and the 10K Dataset Generator (Workstream 1) first?**
> This allows you to immediately test with real or synthetic CSV data and demo the diagnostic value to your first 3–5 prospect merchants.

---

## Verification Plan

### Automated Tests
1. `python scripts/generate_realistic_dataset.py --count 10000`: Generates verified labeled dataset.
2. `python scripts/benchmark_risk_engine.py`: Runs 10K transactions through the risk engine, computes confusion matrix, latency percentiles (p50, p95, p99), and FPR.
3. `npm run build`: Verifies frontend builds with 0 errors.

### Manual Verification
1. Upload sample CSV to the Free Risk Audit tool at `/audit`.
2. Verify that the diagnostic risk report generates within seconds and highlights realistic threat patterns with plain-English explanations.
