#!/bin/bash

# Execute Migrations via Supabase CLI or Direct SQL
# This script can be used if MCP postgres server is not available

set -e

echo "🚀 Executing Database Consolidation Migrations"
echo "=============================================="

# Check for Supabase CLI
if command -v supabase &> /dev/null; then
    echo "✅ Using Supabase CLI"
    
    # Check if linked
    if [ -f ".supabase/config.toml" ]; then
        echo "📋 Pushing migrations via Supabase CLI..."
        supabase db push
    else
        echo "⚠️  Project not linked. Please run: supabase link --project-ref YOUR_PROJECT_REF"
        exit 1
    fi
else
    echo "⚠️  Supabase CLI not found"
    echo "📋 Please execute migrations manually:"
    echo ""
    echo "Option 1: Supabase Dashboard SQL Editor"
    echo "  1. Go to https://supabase.com/dashboard"
    echo "  2. Open SQL Editor"
    echo "  3. Copy and paste each migration file in order:"
    echo "     - supabase/migrations/20250120000001_create_consolidated_schema.sql"
    echo "     - supabase/migrations/20250120000002_create_consolidated_rls_policies.sql"
    echo "     - supabase/migrations/20250120000003_migrate_data_to_consolidated_tables.sql"
    echo "     - supabase/migrations/20250120000004_create_wallet_balance_function.sql"
    echo ""
    echo "Option 2: Using psql"
    echo "  export DATABASE_URL='postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres'"
    echo "  psql \"\$DATABASE_URL\" -f supabase/migrations/20250120000001_create_consolidated_schema.sql"
    echo "  psql \"\$DATABASE_URL\" -f supabase/migrations/20250120000002_create_consolidated_rls_policies.sql"
    echo "  psql \"\$DATABASE_URL\" -f supabase/migrations/20250120000003_migrate_data_to_consolidated_tables.sql"
    echo "  psql \"\$DATABASE_URL\" -f supabase/migrations/20250120000004_create_wallet_balance_function.sql"
    exit 1
fi

echo ""
echo "✅ Migrations executed successfully!"
echo "📊 Run verification queries from scripts/verify-migrations.sql"

