# Flowshield AI Production Deployment Script
# Required: railway login, vercel login, stripe login

Write-Host "🚀 Starting Flowshield AI Production Deployment..." -ForegroundColor Cyan

# Step 1 — Generate a secure JWT secret
try {
    $JWT_SECRET = $(openssl rand -hex 32)
} catch {
    # Fallback for systems without OpenSSL
    $JWT_SECRET = [System.Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Minimum 0 -Maximum 255) }))
}
Write-Host "✅ JWT_SECRET generated" -ForegroundColor Green

# Step 2 — Deploy backend to Railway
Write-Host "📦 Configuring Railway Backend..." -ForegroundColor Yellow
railway init --name flowshieldai-backend
railway plugin add redis
railway variables set `
  DATABASE_URL="postgresql+asyncpg://neondb_owner:npg_0nCK9awveMNl@ep-wild-shadow-amh6uy2c.c-5.us-east-1.aws.neon.tech/neondb?ssl=require" `
  JWT_SECRET="$JWT_SECRET" `
  ENVIRONMENT="production" `
  CORS_ORIGINS="https://app.flowshieldai.com" `
  LOG_LEVEL="info"
railway up --detach
Write-Host "🚀 Backend deploying to Railway..." -ForegroundColor Green

# Step 3 — Deploy frontend to Vercel
Write-Host "🎨 Configuring Vercel Frontend..." -ForegroundColor Yellow
Set-Location streamguard-ai/frontend
vercel --prod `
  --env VITE_API_URL=https://api.flowshieldai.com `
  --yes --force
Set-Location ../..
Write-Host "🚀 Frontend deploying to Vercel..." -ForegroundColor Green

# Step 4 — Create Stripe webhook
Write-Host "💳 Configuring Stripe Webhook..." -ForegroundColor Yellow
$stripePath = "C:\Users\vishw\AppData\Local\Microsoft\WinGet\Links\stripe.exe"
if (!(Test-Path $stripePath)) { $stripePath = "stripe" }
& $stripePath webhooks create `
  --url="https://api.flowshieldai.com/api/v1/billing/webhook" `
  --events="checkout.session.completed,customer.subscription.deleted,invoice.payment_failed"
Write-Host "✅ Stripe webhook created" -ForegroundColor Green

# Step 5 — Print final instructions
$instr = @"

======================================
DEPLOYMENT COMPLETE — DO THESE MANUALLY
======================================
1. Copy the Stripe webhook secret above
   Run: railway variables set STRIPE_WEBHOOK_SECRET=whsec_...
2. Add your Stripe live keys to Railway:
   railway variables set STRIPE_SECRET_KEY=sk_live_...
3. Add DNS CNAME records at your domain registrar:
   api.flowshieldai.com -> your Railway domain
   app.flowshieldai.com -> your Vercel domain
4. Verify: curl https://api.flowshieldai.com/health
======================================
"@
Write-Host $instr -ForegroundColor Cyan
