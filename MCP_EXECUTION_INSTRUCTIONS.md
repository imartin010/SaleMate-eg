# MCP Migration Execution Instructions

## ✅ All Migration Files Ready

All 4 migration SQL files are prepared and ready for execution via MCP:

1. **Step 1**: `supabase/migrations/20250120000001_create_consolidated_schema.sql` (15.8 KB)
2. **Step 2**: `supabase/migrations/20250120000002_create_consolidated_rls_policies.sql` (11.6 KB)
3. **Step 3**: `supabase/migrations/20250120000003_migrate_data_to_consolidated_tables.sql` (21.5 KB)
4. **Step 4**: `supabase/migrations/20250120000004_create_wallet_balance_function.sql` (2.5 KB)

## Execution via MCP

Since MCP is available and connected, execute each migration file in order using your MCP database tool.

### Step 1: Create Consolidated Schema
Execute the SQL from: `supabase/migrations/20250120000001_create_consolidated_schema.sql`

This creates:
- `activities` table
- `commerce` table  
- `payments` table
- `content` table
- `content_metrics` table
- `notifications` table (enhanced)
- `system_logs` table
- Indexes and triggers

### Step 2: Create RLS Policies
Execute the SQL from: `supabase/migrations/20250120000002_create_consolidated_rls_policies.sql`

This creates Row Level Security policies for all new tables.

### Step 3: Migrate Data
Execute the SQL from: `supabase/migrations/20250120000003_migrate_data_to_consolidated_tables.sql`

This copies data from old tables to new consolidated tables.

### Step 4: Create Helper Functions
Execute the SQL from: `supabase/migrations/20250120000004_create_wallet_balance_function.sql`

This creates:
- `get_wallet_balance()` function
- Compatibility views

## Verification

After all 4 steps complete, run verification queries from `scripts/verify-migrations.sql`

## Safety

- All migrations use `IF NOT EXISTS` - safe to run multiple times
- Data migration uses `ON CONFLICT DO NOTHING` - prevents duplicates
- Old tables remain intact - no data loss
- Wrapped in transactions - atomic operations

