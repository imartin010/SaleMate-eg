# How to Execute the 4 Migration Steps

## Prerequisites

1. **Database Backup**: Create a full backup before starting
2. **Database URL**: You'll need your Supabase database connection string
3. **Access**: Ensure you have admin/owner access to the database

## Option 1: Using Supabase CLI (Recommended)

If you have Supabase CLI set up locally:

```bash
# Link to your project (if not already linked)
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

The migrations will run automatically in order based on their timestamps.

## Option 2: Using psql (PostgreSQL Client)

```bash
# Set your database URL
export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run each migration in order
psql "$DATABASE_URL" -f supabase/migrations/20250120000001_create_consolidated_schema.sql
psql "$DATABASE_URL" -f supabase/migrations/20250120000002_create_consolidated_rls_policies.sql
psql "$DATABASE_URL" -f supabase/migrations/20250120000003_migrate_data_to_consolidated_tables.sql
psql "$DATABASE_URL" -f supabase/migrations/20250120000004_create_wallet_balance_function.sql
```

## Option 3: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste each migration file content
4. Run them in order:
   - `20250120000001_create_consolidated_schema.sql`
   - `20250120000002_create_consolidated_rls_policies.sql`
   - `20250120000003_migrate_data_to_consolidated_tables.sql`
   - `20250120000004_create_wallet_balance_function.sql`

## Option 4: Using the Execution Script

```bash
# Make script executable
chmod +x scripts/execute-migrations.sh

# Set your database URL
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Run the script
./scripts/execute-migrations.sh
```

## Verification

After running migrations, execute the verification queries:

```bash
psql "$DATABASE_URL" -f scripts/verify-migrations.sql
```

Or copy the queries from `scripts/verify-migrations.sql` into the Supabase SQL Editor.

## Troubleshooting

### Error: "relation already exists"
- The migration uses `CREATE TABLE IF NOT EXISTS`, so this shouldn't happen
- If it does, check if tables were partially created in a previous run

### Error: "permission denied"
- Ensure you're using the service role key or have proper permissions
- Check RLS policies aren't blocking the migration

### Error: "column does not exist"
- Verify you're running migrations in the correct order
- Check that Step 1 completed successfully before running Step 2

### Data Count Mismatch
- Check migration logs for errors
- Verify foreign key constraints
- Ensure all source tables exist and have data

## Rollback

If something goes wrong, the old tables remain intact. You can:
1. Stop using the new tables
2. Revert application code to use old tables
3. Drop new tables if needed (see MIGRATION_EXECUTION_GUIDE.md)

## Support

If you encounter issues:
1. Check the migration logs
2. Review error messages
3. Verify data integrity with verification queries
4. Check CONSOLIDATION_PROGRESS.md for known issues

