# The Fraud Detection Universe: 2026 Competitor Map

This document breaks down the major players in the fraud detection space. Use this to identify exactly where Flowshield AI wins and where we differ.

---

## 1. Direct Adversaries (API-First & Behavioral)
These are your closest rivals. They focus on real-time decisions via REST APIs.

| Company | Key Strength | The Flowshield Advantage |
| :--- | :--- | :--- |
| **SEON** | Massive social media and digital footprint lookups. | Flowshield uses **unsupervised Isolation Forests** which catch unknown anomalies, while SEON relies heavily on known reputation rules. |
| **Sardine** | Behavioral biometrics (how you type, move mouse). | Sardine is expensive and targeted at high-tier neobanks. Flowshield is **developer-centric**, lower friction, and easier to integrate for startups. |
| **Sift** | Large historical network data (Consortium). | Sift is a "black box." Flowshield provides **Explainable AI (XAI)**—giving specific reasons for every'Block' decision. |

---

## 2. Infrastructure & Orchestration
These platforms don't always "do" the fraud detection; they connect you to 50 other data sources.

| Company | Key Strength | The Flowshield Advantage |
| :--- | :--- | :--- |
| **Alloy** | Integrates 200+ data sources into one workflow. | Alloy is a "Project" to set up (months of work). Flowshield is a **"Plug-and-Play" Shield** (minutes of work). |
| **Sumsub** | All-in-one KYC (ID check) + AML + Transaction Monitoring. | Sumsub focuses on identity. Flowshield focuses on **Transaction Velocity & Patterns**. |

---

## 3. The Enterprise Giants (The "Old Guard")
These are what the big banks use. They are slow, expensive, and require a sales team.

| Company | Key Strength | The Flowshield Advantage |
| :--- | :--- | :--- |
| **Feedzai** | Handles massive volume for top-tier banks. | Too complex for a startup. Flowshield uses **Docker-native** deployment, making it cloud-agnostic and 10x cheaper. |
| **Forter** | Near-perfect "Chargeback Guarantee" for retailers. | Forter is for e-commerce, not fintech. Flowshield is built specifically for **Fintech/SaaS streaming data**. |
| **LexisNexis** | Massive datasets on physical identities (SSN, Address). | They focus on "Who you are." Flowshield focuses on **"What you are doing right now."** |

---

## 4. Unsupervised ML Specialists
These companies use AI similarly to Flowshield.

| Company | Key Strength | The Flowshield Advantage |
| :--- | :--- | :--- |
| **DataVisor** | Uses advanced clustering to find fraud rings. | Heavy focus on post-transaction batch analysis. Flowshield is **Streaming-first (Kafka)**—we block in mid-air. |
| **Hawk AI** | Transparency for regulators (AML focus). | Hawk AI is for compliance officers. Flowshield is for **Engineers and Product Managers**. |

---

## 5. Embedded Gateway Fraud Tools
Every major payment processor has their own.

*   **Stripe Radar**: Only works if you use Stripe.
*   **Adyen RevenueProtect**: Built into Adyen's stack.
*   **Checkout.com Fraud Detection**: Built into Checkout.com.

**The Flowshield Win:** "We are the **Switzerland of Fraud Detection**. If you use 3 different gateways (e.g., Stripe for US, Razorpay for India, Adyen for Europe), Flowshield gives you a **single source of truth** across all of them."

---

## Strategic Summary for Investors
When they ask about "The Others," your script is:

> "Most competitors fall into two traps: they are either **too invasive** (requiring sensitive user PII) or **too slow** (batch processing). 
> 
> Flowshield AI wins on **Streaming Intelligence**. By using Kafka and an unsupervised Isolation Forest model, we detect anomalies in sub-100ms using only minimal data (Digital Footprint). We are the only platform built natively for the **Multi-Gateway Fintech architecture** of 2026."
