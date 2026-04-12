param (
    [Parameter(Mandatory=$true)]
    [string]$DatabaseUrl
)

Write-Host "🚀 Running production migrations against Neon DB (Windows PowerShell)..." -ForegroundColor Cyan

# Enter the backend directory
cd backend

# Set environment variable for the session
$env:DATABASE_URL = "$DatabaseUrl"

# Execute Alembic using the most robust direct package call
python -c "import alembic.config; alembic.config.main()" upgrade head

# Finalize
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migrations complete (PowerShell)." -ForegroundColor Green
} else {
    Write-Host "❌ Migration failed." -ForegroundColor Red
    exit $LASTEXITCODE
}
