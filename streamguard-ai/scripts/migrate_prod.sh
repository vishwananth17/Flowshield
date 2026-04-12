#!/bin/bash
# ==============================================================================
# Flowshield AI: Production Migration Runner
# ------------------------------------------------------------------------------
# Usage: ./scripts/migrate_prod.sh "postgresql://user:pass@host/dbname"
# ==============================================================================

if [ -z "$1" ]; then
    echo "❌ Error: Please provide a Neon PostgreSQL connection string."
    echo "Usage: ./scripts/migrate_prod.sh \"postgresql://user:pass@host/dbname\""
    exit 1
fi

echo "🚀 Running production migrations against Neon DB..."

# Move to the backend directory
cd backend

# Execute Alembic using the provided connection string via environment override
# Note: uses the current environment's Python/Alembic installation
export DATABASE_URL="$1"
alembic upgrade head

# Exit status check
if [ $? -eq 0 ]; then
    echo "✅ Migrations complete. Database is now in sync with production schema."
else
    echo "❌ Migration failed. Check your connection string or schema conflicts."
    exit 1
fi
