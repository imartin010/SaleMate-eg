#!/bin/bash

# Database Consolidation - Migration Execution Script
# Execute this script to run all 4 migration steps in order

set -e  # Exit on error

echo "🚀 Starting Database Consolidation Migrations"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI is not installed${NC}"
    echo "Install it from: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo -e "${RED}❌ Error: supabase/config.toml not found${NC}"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo -e "${YELLOW}⚠️  IMPORTANT: This will modify your database schema${NC}"
echo -e "${YELLOW}⚠️  Make sure you have a backup before proceeding${NC}"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Migration cancelled"
    exit 0
fi

echo ""
echo "📋 Migration Steps:"
echo "1. Create Consolidated Schema"
echo "2. Create RLS Policies"
echo "3. Migrate Data"
echo "4. Create Helper Functions"
echo ""

# Step 1: Create Consolidated Schema
echo -e "${GREEN}Step 1/4: Creating consolidated schema...${NC}"
if supabase db push --db-url "$DATABASE_URL" < supabase/migrations/20250120000001_create_consolidated_schema.sql 2>/dev/null || \
   supabase migration up --db-url "$DATABASE_URL" 2>/dev/null || \
   psql "$DATABASE_URL" -f supabase/migrations/20250120000001_create_consolidated_schema.sql; then
    echo -e "${GREEN}✅ Step 1 complete${NC}"
else
    echo -e "${RED}❌ Step 1 failed${NC}"
    echo "You may need to run the SQL file manually using your database client"
    exit 1
fi

echo ""

# Step 2: Create RLS Policies
echo -e "${GREEN}Step 2/4: Creating RLS policies...${NC}"
if supabase db push --db-url "$DATABASE_URL" < supabase/migrations/20250120000002_create_consolidated_rls_policies.sql 2>/dev/null || \
   psql "$DATABASE_URL" -f supabase/migrations/20250120000002_create_consolidated_rls_policies.sql; then
    echo -e "${GREEN}✅ Step 2 complete${NC}"
else
    echo -e "${RED}❌ Step 2 failed${NC}"
    exit 1
fi

echo ""

# Step 3: Migrate Data
echo -e "${GREEN}Step 3/4: Migrating data...${NC}"
echo -e "${YELLOW}This may take several minutes depending on data volume...${NC}"
if psql "$DATABASE_URL" -f supabase/migrations/20250120000003_migrate_data_to_consolidated_tables.sql; then
    echo -e "${GREEN}✅ Step 3 complete${NC}"
else
    echo -e "${RED}❌ Step 3 failed${NC}"
    exit 1
fi

echo ""

# Step 4: Create Helper Functions
echo -e "${GREEN}Step 4/4: Creating helper functions...${NC}"
if psql "$DATABASE_URL" -f supabase/migrations/20250120000004_create_wallet_balance_function.sql; then
    echo -e "${GREEN}✅ Step 4 complete${NC}"
else
    echo -e "${RED}❌ Step 4 failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 All migrations complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Run verification queries (see MIGRATION_EXECUTION_GUIDE.md)"
echo "2. Test all application workflows"
echo "3. Monitor for any issues"

