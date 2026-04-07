# StreamGuard AI - Final Launch To-Do List

To turn this prototype into a finished, cash-generating business, we need to complete the following tasks. They are ordered from highest priority (Launch Critical) to lowest priority (Nice-to-Haves).

## Priority 1: Monetization & Integration (Launch Critical)
- [ ] **Stripe Billing Integration**
  - Implement Stripe Checkout on the frontend (perhaps inside the `Settings` page).
  - Create a webhooks listener on the backend to upgrade users to a "Pro" tier when they pay.
  - Implement a basic API Rate Limiter in FastAPI (e.g., Free users get 1,000 requests/mo, Pro gets 100,000).

- [ ] **Public Developer Docs**
  - Create a technical document showing how client-developers can securely POST to `https://api.streamguard.ai/v1/transactions/analyze`.
  - Provide code snippets (Node.js, cURL, Python) so they can instantly copy-paste your system into their store.

- [ ] **Production Cloud Deployment**
  - Deploy the PostgreSQL Database to a managed server (AWS RDS, Supabase, Neon).
  - Push the Backend Docker container to Render, Railway, or AWS Fargate.
  - Host the React UI on Vercel or Cloudflare.

## Priority 2: System Hardening (Pre-Launch Polish)
- [ ] **Simulate Live Data Pipeline**
  - Write a "Traffic Generator" Python script to fire thousands of fake transactions at your server so you can record a demo video of the Dashboard WebSockets processing huge data spikes.

- [ ] **Build out `Analytics` Page**
  - Replace `ComingSoon.tsx`. Fetch aggregate Postgres data (using `GROUP BY`) to show Total Protected Volume, Average Risk Score over 30 days, etc.

- [ ] **Build out `Alerts` Page**
  - Replace `ComingSoon.tsx`. Build a table that securely lists transactions exclusively marked as "FRAUD" or "REVIEW", giving the user a place to manually override or block flagged orders.

## Priority 3: Advanced ML features (Post-Launch)
- [ ] **Model Retraining Pipeline**
  - The model currently uses an untrained / dummy state locally. Write a Python script to extract 10,000 historical transactions from PostgreSQL and actively retrain the `IsolationForest` model, saving the `.joblib` file so it gets smarter as users use it.
- [ ] **Kafka Active Queueing**
  - Implement a celery/Kafka background worker node to handle extremely high traffic spikes gracefully without blocking FastAPI.
