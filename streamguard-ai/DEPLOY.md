# 🚀 Flowshield AI – Production Deployment Guide

This guide outlines the zero-downtime deployment process for the Flowshield AI platform using Neon (PostgreSQL), Railway (Backend/Redis), Upstash (Kafka), and Vercel (Frontend).

---

## 🏗️ 1. Infrastructure Provisioning (5-10 Minutes)

### Step 1: Database (Neon.tech)
1. Sign up/Login to **[Neon](https://neon.tech)**.
2. Create discovery project: `flowshieldai-prod`.
3. Copy the **Connection String** (ensure it starts with `postgresql://`).
4. Run migrations manually from your local machine:
   ```bash
   chmod +x scripts/migrate_prod.sh
   ./scripts/migrate_prod.sh "your-neon-connection-string"
   ```

### Step 2: Event Stream (Upstash.com)
1. Login to **[Upstash](https://upstash.com)** and create a new Kafka Cluster.
2. Create a Topic named: `transactions.raw`.
3. Copy **Bootstrap Server**, **SASL Username**, and **SASL Password**.

### Step 3: API Gateway (Railway.app)
1. Login to **[Railway](https://railway.app)**.
2. Create a "New Project" -> "Deploy from GitHub repo".
3. Select your Flowshield repository.
4. **Variables**: Add all fields from `backend/.env.production`.
5. Connect a **Redis** plugin (available in the Railway dashboard).

### Step 4: Dashboard & Docs (Vercel.com)
1. Login to **[Vercel](https://vercel.com)**.
2. "Add New" -> "Project".
3. Point to the `frontend/` directory of your repository.
4. **Environment Variables**:
   - `VITE_API_URL`: Your Railway production backend URL.
   - `VITE_STRIPE_PUBLISHABLE_KEY`: Your live Stripe key.
5. Deploy.

---

## 🧪 2. Production Health Check

Once the build finishes, verify the system integrity:

```bash
# Verify the API is breathing
curl https://api.flowshieldai.com/api/v1/health/status
```

**Expected Response:**
```json
{
  "status": "ok",
  "environment": "production",
  "services": {
    "database": "ok",
    "redis": "ok",
    "kafka": "ok",
    "ml_model": "ok"
  }
}
```

---

## 💳 3. Stripe Production Switch

### Live Webhook Configuration
1. Go to **Stripe Dashboard** -> **Developers** -> **Webhooks**.
2. Add Endpoint: `https://api.flowshieldai.com/api/v1/billing/webhook`.
3. Select Events:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy the **Signing Secret** (`whsec_...`) and update it in your Railway Environment Variables.

---

## 🛡️ 4. Security & CORS Checklist

- [ ] `ENVIRONMENT` is set to `production` in Railway.
- [ ] `CORS_ORIGINS` in Railway is set only to `https://app.flowshieldai.com`.
- [ ] Ensure `JWT_SECRET` is a high-entropy string (`openssl rand -hex 32`).
- [ ] Confirm no `.env` files are tracked in Git.

---

## 🔄 Rollback & Recovery

- **Backend**: In Railway, select the previous deployment commit and click **Rollback**.
- **Frontend**: In Vercel, select the previous deployment and click **Promote to Production**.
- **Database**: Restore Neon branch from point-in-time snapshot.

---

**Flowshield AI is now globally resilient. 🌎**
