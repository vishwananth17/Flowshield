# Flowshield AI — Core UX Principles & Design System Laws

This document codifies the 8 primary UX laws that govern all interface design, data visualization, and analyst workflows across Flowshield AI. Every frontend page, component, drawer, and table must adhere to these rules.

---

## 1. Tesler's Law (Conservation of Complexity)
> *Complexity in a system cannot be eliminated; it can only be shifted. Shift it entirely away from the user into the machine.*

- **Backend / Engine**: Absorb 100% of the mathematical complexity (30+ imperfect forensic signals, ASN classifications, SHAP values, canvas hashes, 1-minute velocity spikes, cross-merchant SHA-256 radar).
- **Frontend / UI**:
  - Never force an analyst to mentally compute weighted scores or parse raw tensor values.
  - Collapse multi-signal complexity into:
    1. **One radial arc gauge** calibrated 0–100.
    2. **One unambiguous verdict badge**: `[APPROVE]`, `[CHALLENGE]`, `[BLOCK — FRAUD]`.
    3. **One plain-English auto-generated explanation paragraph** synthesizing primary drivers, mitigating factors, and routing recommendations.

---

## 2. Pareto Principle (The 80/20 Rule)
> *80% of consequences stem from 20% of causes. In fraud detection, 1 or 2 critical signals drive 80% of the risk score.*

- **Signal Sorting**:
  - Always sort signal breakdown tables by absolute impact (`Math.abs(contribution)`) in descending order.
  - Place the **Top 3 Risk Drivers** at the very top with high-contrast indicator arrows (`↑ +0.35`).
  - Never force an analyst to scroll through 30 neutral features to find why a transaction was challenged or blocked.

---

## 3. Parkinson's Law (Urgency & Deadlines)
> *Work expands to fill the time available for its completion. Deadlines must be visible, visual, and urgent.*

- **Dispute Defense & Chargeback Windows**:
  - Indian gateways (Razorpay, Cashfree) and card networks enforce rigid 7-to-14-day response windows.
  - Display explicit countdowns on disputes:
    - `< 2 days`: Red critical badge (`"1 day remaining — URGENT"`).
    - `< 5 days`: Amber warning badge (`"3 days remaining"`).
    - `> 5 days`: Slate normal badge.
  - Auto-schedule multi-channel alerts (Day 7, Day 3, Day 1, and Day 0) to prevent automatic forfeiture.

---

## 4. Zeigarnik Effect (Incomplete Tasks Drive Action)
> *People remember uncompleted or interrupted tasks better than completed ones. Visible progress meters drive completion.*

- **Evidence Package Gathering**:
  - Show an interactive **Evidence Strength Gauge**:
    - Example: `Evidence Strength: 65% (Moderate Case)`.
    - Provide a concrete next step: *"Upload proof of delivery or customer WhatsApp chat to reach 92% win probability."*
  - This transforms evidence gathering from an ambiguous chore into a clear, gamified checklist.

---

## 5. Hick's Law (Fewer Choices = Faster Decisions)
> *The time it takes to make a decision increases logarithmically with the number and complexity of choices.*

- **Analyst Action Bars**:
  - Prevent decision fatigue during high-volume fraud attacks (50+ transactions/min).
  - Limit analyst action choices in the Transaction Detail Drawer to **3 clear buttons**:
    1. `[Override: Approve]` (recovering legitimate buyer false declines).
    2. `[Mark False Positive]` (one-click continuous learning model update).
    3. `[Confirm Fraud]` (blacklist customer and broadcast device/card to defense radar).
  - Do not bury actions inside deeply nested sub-menus.

---

## 6. Doherty Threshold (< 400ms Interaction Pace)
> *Productivity surges when computer and user interact at a pace (< 400ms) where neither is forced to wait.*

- **Real-Time Latency Guarantees**:
  - Transaction scoring API must complete in `< 50ms`.
  - All analyst UI actions (e.g. clicking `Override: Approve` or `Mark False Positive`) must provide **optimistic UI updates and toast notifications in < 100ms**.
  - Always display animated skeleton shimmers during background telemetry loads instead of blank loading spinners or frozen screens.

---

## 7. Von Restorff Effect (Isolation of High Threats)
> *When multiple similar objects are present, the one that differs from the rest is most likely to be noticed and remembered.*

- **Threat Contrast Hierarchy**:
  - 95% of transactions are legitimate and blend naturally with the dark slate background (`#0A0F1D`).
  - Critical anomalies (fraud score > 72, Tor exit nodes, automated card testing rings) must immediately stand out using:
    - Bold ruby red badges (`[BLOCK — FRAUD]`).
    - Pulsing ping dots (`animate-ping`).
    - Red directional arrows (`↑ +0.35`).
  - An analyst scanning a 50-row table must be able to spot an active attack in `< 250ms`.

---

## 8. Postel's Law (The Robustness Principle)
> *Be liberal in what you accept, and conservative in what you send.*

- **Telemetry Search & Filtering**:
  - Accept messy, unstructured merchant inputs:
    - Phone numbers with or without country codes (`+91 98765 43210`, `9876543210`).
    - Raw payment IDs (`pay_K1j2k3...`), UUIDs, order numbers, customer emails with leading/trailing whitespace.
  - Automatically sanitize, trim, and match inputs without throwing strict validation errors.
  - Always output clean, standardized, monospace identifiers and ISO timestamps.

---

## Component Checklist

When building or updating Flowshield UI components, verify:
- [ ] Are choices limited to the minimum necessary? (Hick's Law)
- [ ] Is complex ML math explained in plain English? (Tesler's Law)
- [ ] Are the top 20% risk drivers highlighted first? (Pareto Principle)
- [ ] Are threat anomalies immediately identifiable at a glance? (Von Restorff Effect)
- [ ] Do interactions respond in < 100ms with optimistic feedback? (Doherty Threshold)
- [ ] Do dispute deadlines show clear time remaining? (Parkinson's Law)
- [ ] Does evidence gathering show an active strength progress bar? (Zeigarnik Effect)
- [ ] Are search inputs forgiving and resilient to formatting variations? (Postel's Law)
