# Cloud Deployment Guide (StreamGuard AI)

To get your application live and accept public requests and display the dashboard on your custom domain, you will deploy the architecture in three steps using modern serverless/managed infrastructure.

## Step 1: Database Setup (Supabase / Render)
You need a PostgreSQL database that is publicly accessible by your backend server.
1. Create a free account at [Supabase](https://supabase.com) or [Render PostgreSQL](https://render.com).
2. Create a new project/database.
3. Copy the **Connection String** (e.g., `postgresql://postgres:password@db.supabase.co:5432/postgres`).
4. Keep this string ready for Step 2.
*(Note: Because Alembic is built into your backend, the backend will automatically generate the required tables the first time it connects to your new cloud database).*

## Step 2: Backend API Deployment (Render / AWS Fargate)
We will deploy your FastAPI Python backend container. **Render** is the easiest platform for Dockerfiles.
1. Go to [Render.com](https://render.com) and click **"New Web Service"**.
2. Connect your GitHub repository where this project lies.
3. Select `backend` as your root directory. Render will automatically detect the `Dockerfile`.
4. In the Environment Variables section, add:
   - `DATABASE_URL` = (Your String from Step 1)
   - `STRIPE_SECRET_KEY` = (Your real stripe key)
   - `STRIPE_WEBHOOK_SECRET` = (Your real webhook signing secret)
5. Click **Deploy**. Your API will instantly be live (e.g., `https://streamguard-api.onrender.com`).

## Step 3: Frontend Deployment (Vercel)
Vercel is the fastest way to deploy a Vite React application globally.
1. Create an account at [Vercel](https://vercel.com).
2. Click **"Add New Project"** and import your GitHub repository.
3. When configuring the project:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
4. In the **Environment Variables**, add:
   - `VITE_API_URL` = (The URL of your backend from Step 2, e.g. `https://streamguard-api.onrender.com`)
5. Click **Deploy**. Vercel will process your React code and attach a public `https://...vercel.app` URL to it.

## Step 4: Stripe Configuration
1. Go to your [Stripe Developer Dashboard](https://dashboard.stripe.com/test/webhooks).
2. Add a new webhook endpoint.
3. Set the Endpoint URL to your backend API's webhook path: `https://streamguard-api.onrender.com/api/v1/billing/webhook`.
4. Choose the `checkout.session.completed` event.
5. Grab the new Webhook Signing Secret and update it in your Backend Environment Variables.

**Congratulations! Your SaaS is now fully deployed and instantly accepting worldwide payments and fraud-monitoring requests!**
