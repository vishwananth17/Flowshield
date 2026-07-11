# Flowshield AI: Realigned Founder's Playbook for Launch & Revenue

Here is your updated GTM playbook to take Flowshield AI from a working codebase to a global, revenue-generating developer security product.

Based on early market feedback, we have realigned our Ideal Customer Profile (ICP) away from low-risk Indian D2C brands (where UPI/3DS and COD minimize transaction dispute risk) towards high-value **Fintech Infrastructure**, **Cross-Border Sellers**, and **Global Non-Stripe Commerce stacks**.

---

## 1. Realigned Ideal Customer Profile (ICP)

### Who is NOT our Customer (Exclude):
*   ❌ **Small local Indian D2C brands on Shopify:** Covered entirely by Stripe/Shopify native risk tools.
*   ❌ **UPI-only / local COD e-commerce stores:** Zero card chargeback risk. RTO risk is shipping-based, not transaction fraud.
*   ❌ **Standard Razorpay merchants:** Already rely on Razorpay's built-in basic risk flags.

### Who IS our Customer (Target):
*   ✅ **Fintechs & BNPL / Card Lenders (e.g., Slice, KreditBee):** Card fraud is extremely real for these platforms, and they carry the direct lending risk.
*   ✅ **Payment Aggregators & Gateways:** Wanting a customizable, transparent fraud layer (Explainable AI via SHAP) instead of depending on third-party black-box risk algorithms.
*   ✅ **Neobanks Issuing Prepaid Cards:** They carry the risk for card fraud/compromised cards rather than the merchant.
*   ✅ **Indian Cross-Border Merchants:** Selling internationally to the US/EU, where card fraud is rampant and 3D-secure OTP verification is not mandated.
*   ✅ **International Merchants on Custom / Non-Stripe Stacks:** Looking for a high-speed, cost-effective alternative to enterprise tools like Sift or Riskified.

---

## 2. Realigned Pricing Strategy (USD Benchmark)

We are structuring our pricing around global B2B SaaS benchmarks, billed in USD:

*   **Developer Tier (Free):** $0/month. 1,000 transaction analyses/month. Basic rules engine.
*   **Builder Tier ($99/month, or $79/mo Billed Annually):** 25,000 transactions/month. Unlocks ML Ensemble Model (Isolation Forest + XGBoost) + Webhooks + 30-day history.
*   **Growth Tier ($299/month, or $239/mo Billed Annually):** 100,000 transactions/month. Full ML ensemble, cross-network signals, dedicated analytics dashboard, 10 API keys.
*   **Enterprise Tier ($999+/month):** Custom volume, dedicated ML model, 99.9% uptime SLA, and custom integration support.

---

## 3. Realigned GTM Tactics

### Strategy A: Target Alternative payment stacks globally
Outreach to developers building checkouts on custom architectures, Adyen, Cashfree, Braintree, or multi-gateway integrations. Highlight our **independent control plane** value proposition: *"Stripe Radar only covers Stripe checkout. Flowshield secures your custom multi-gateway checkout in sub-100ms."*

### Strategy B: Developer SEO & Identity Protection Content
Focus on technical content around account takeover, synthetic identity checks, and carding attacks:
1.  *"Preventing Synthetic Identity Fraud on Digital Card Issuance."*
2.  *"Why Multi-Gateway Checkouts Need an Independent Risk Plane."*
3.  *"How to spot fake account signups using device fingerprinting and Isolation Forest."*

### Strategy C: Customer Discovery Campaigns
Conduct direct outreach to CTOs and risk managers of mid-sized neobanks and BNPLs in emerging markets. Ask:
> *"What does account/card fraud cost your infrastructure today, and what custom models are you currently maintaining?"*
