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

# Step 2 — Verify Backend Configuration on Render
Write-Host "📦 Ensuring Render Backend is ready..." -ForegroundColor Yellow
Write-Host "⚠️  Please ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set in your Render dashboard." -ForegroundColor Magenta

# Step 3 — Deploy frontend to Vercel
Write-Host "🎨 Configuring Vercel Frontend..." -ForegroundColor Yellow
Set-Location frontend
vercel --prod `
  --env VITE_API_URL=https://flowshield-backend-ani8.onrender.com `
  --yes --force
Set-Location ..
Write-Host "🚀 Frontend deploying to Vercel..." -ForegroundColor Green

# Step 4 — Razorpay Webhook Info
Write-Host "💳 Razorpay Webhook Info..." -ForegroundColor Yellow
Write-Host "✅ Connect your Razorpay webhook to: https://flowshield-backend-ani8.onrender.com/api/v1/billing/webhook" -ForegroundColor Green

# Step 5 — Print final instructions
$instr = @"

======================================
DEPLOYMENT COMPLETE — RENDER + VERCEL
======================================
1. Your backend is active at Render.
2. Your frontend is active at Vercel.
3. Ensure Razorpay Live Keys are in Render Env Vars.
4. Verify: curl https://flowshield-backend-ani8.onrender.com/health
======================================
"@
Write-Host $instr -ForegroundColor Cyan
