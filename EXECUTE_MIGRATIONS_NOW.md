# 🚀 Execute the 4 Migration Steps - Quick Start

## Prerequisites Check

Before executing, ensure you have:
- ✅ Database backup created
- ✅ Supabase project access
- ✅ Database connection string

## Quick Execution (Choose One Method)

### Method 1: Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Execute Each Migration in Order:**

   **Step 1: Create Schema**
   ```sql
   -- Copy entire contents of:
   -- supabase/migrations/20250120000001_create_consolidated_schema.sql
   ```
   - Paste and click "Run"

   **Step 2: Create RLS Policies**
   ```sql
   -- Copy entire contents of:
   -- supabase/migrations/20250120000002_create_consolidated_rls_policies.sql
   ```
   - Paste and click "Run"

   **Step 3: Migrate Data**
   ```sql
   -- Copy entire contents of:
   -- supabase/migrations/20250120000003_migrate_data_to_consolidated_tables.sql
   ```
   - Paste and click "Run"
   - ⚠️ This may take several minutes

   **Step 4: Create Helper Functions**
   ```sql
   -- Copy entire contents of:
   -- supabase/migrations/20250120000004_create_wallet_balance_function.sql
   ```
   - Paste and click "Run"

4. **Verify Success**
   - Run verification queries from `scripts/verify-migrations.sql`
   - Check for any errors in the SQL Editor output

---

### Method 2: Using psql (Command Line)

```bash
# 1. Get your database connection string from Supabase Dashboard
# Settings > Database > Connection string > URI
# Format: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# 2. Set environment variable
export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# 3. Execute migrations in order
psql "$DATABASE_URL" -f supabase/migrations/20250120000001_create_consolidated_schema.sql
psql "$DATABASE_URL" -f supabase/migrations/20250120000002_create_consolidated_rls_policies.sql
psql "$DATABASE_URL" -f supabase/migrations/20250120000003_migrate_data_to_consolidated_tables.sql
psql "$DATABASE_URL" -f supabase/migrations/20250120000004_create_wallet_balance_function.sql

# 4. Verify
psql "$DATABASE_URL" -f scripts/verify-migrations.sql
```

---

### Method 3: Using Supabase CLI

```bash
# 1. Link to your project (if not already)
supabase link --project-ref your-project-ref

# 2. Push all migrations
supabase db push

# 3. Or run specific migration
supabase migration up
```

---

## Verification After Each Step

### After Step 1 (Schema Creation)
```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('activities', 'commerce', 'payments', 'content', 'notifications', 'system_logs')
ORDER BY table_name;
-- Should return 6 rows
```

### After Step 2 (RLS Policies)
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('activities', 'commerce', 'payments', 'content', 'notifications', 'system_logs');
-- All should show rowsecurity = true
```

### After Step 3 (Data Migration)
```sql
-- Check data counts
SELECT 
  (SELECT COUNT(*) FROM activities) as activities,
  (SELECT COUNT(*) FROM commerce) as commerce,
  (SELECT COUNT(*) FROM payments) as payments,
  (SELECT COUNT(*) FROM content) as content,
  (SELECT COUNT(*) FROM notifications) as notifications;
-- Compare with old table counts if they still exist
```

### After Step 4 (Helper Functions)
```sql
-- Check function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'get_wallet_balance';
-- Should return 1 row

-- Test function (replace with actual profile_id)
SELECT get_wallet_balance('YOUR-PROFILE-ID-HERE'::uuid);
```

---

## Troubleshooting

### Error: "relation already exists"
- ✅ This is OK - migrations use `CREATE TABLE IF NOT EXISTS`
- The migration will skip existing tables

### Error: "permission denied"
- Check you're using the correct database user
- For Supabase Dashboard, ensure you're logged in as project owner
- For psql, use the connection string with service role key

### Error: "column does not exist"
- Ensure migrations are run in the correct order
- Check that previous step completed successfully

### Data Migration Takes Too Long
- This is normal for large datasets
- Monitor progress in the SQL Editor
- The migration includes progress logging

---

## Rollback Plan

If something goes wrong:
1. **Old tables remain intact** - no data loss
2. Stop using new tables
3. Revert application code (if needed)
4. Drop new tables if necessary:
   ```sql
   DROP TABLE IF EXISTS activities CASCADE;
   DROP TABLE IF EXISTS commerce CASCADE;
   DROP TABLE IF EXISTS payments CASCADE;
   DROP TABLE IF EXISTS content CASCADE;
   DROP TABLE IF EXISTS content_metrics CASCADE;
   DROP TABLE IF EXISTS notifications CASCADE;
   DROP TABLE IF EXISTS system_logs CASCADE;
   DROP FUNCTION IF EXISTS get_wallet_balance(uuid);
   ```

---

## Next Steps After Migration

1. ✅ Run verification queries
2. ✅ Test application workflows
3. ✅ Monitor for errors
4. ✅ Check performance
5. ✅ Validate data integrity

---

## Support

If you encounter issues:
- Check `MIGRATION_EXECUTION_GUIDE.md` for detailed troubleshooting
- Review migration logs
- Verify data with queries in `scripts/verify-migrations.sql`

