# Database Consolidation - Migration Execution Guide

## ⚠️ IMPORTANT: Read Before Executing

This guide provides step-by-step instructions for executing the database consolidation migrations. **Execute these migrations in a staging environment first** before running in production.

---

## Prerequisites

1. **Backup Database:** Create a full backup of your database before starting
2. **Staging Environment:** Test all migrations in staging first
3. **Maintenance Window:** Plan for a maintenance window (estimated 1-2 hours)
4. **Rollback Plan:** Have a rollback strategy ready

---

## Migration Execution Order

Execute migrations in this exact order:

### Step 1: Create Consolidated Schema
```bash
# Run migration: 20250120000001_create_consolidated_schema.sql
# This creates all 12 new consolidated tables
```

**What it does:**
- Creates `activities`, `commerce`, `payments`, `content`, `content_metrics`, `notifications`, `system_logs` tables
- Adds indexes and constraints
- Does NOT drop old tables (they remain for data migration)

**Expected time:** 2-5 minutes

**Verification:**
```sql
-- Check that new tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('activities', 'commerce', 'payments', 'content', 'content_metrics', 'notifications', 'system_logs');
```

---

### Step 2: Create RLS Policies
```bash
# Run migration: 20250120000002_create_consolidated_rls_policies.sql
# This creates Row Level Security policies for new tables
```

**What it does:**
- Creates RLS policies for all new consolidated tables
- Ensures proper access control

**Expected time:** 1-2 minutes

**Verification:**
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('activities', 'commerce', 'payments', 'content', 'notifications', 'system_logs');
-- All should show rowsecurity = true
```

---

### Step 3: Migrate Data
```bash
# Run migration: 20250120000003_migrate_data_to_consolidated_tables.sql
# This copies data from old tables to new consolidated tables
```

**What it does:**
- Migrates data from old tables to new consolidated tables
- Preserves all relationships and foreign keys
- Old tables remain intact (for safety)

**Expected time:** 5-30 minutes (depends on data volume)

**Verification:**
```sql
-- Check data counts
SELECT 
  (SELECT COUNT(*) FROM activities) as activities_count,
  (SELECT COUNT(*) FROM commerce) as commerce_count,
  (SELECT COUNT(*) FROM payments) as payments_count,
  (SELECT COUNT(*) FROM content) as content_count,
  (SELECT COUNT(*) FROM notifications) as notifications_count,
  (SELECT COUNT(*) FROM system_logs) as system_logs_count;

-- Compare with old tables (if they still exist)
SELECT 
  (SELECT COUNT(*) FROM case_feedback) as old_feedback,
  (SELECT COUNT(*) FROM case_actions) as old_actions,
  (SELECT COUNT(*) FROM purchase_requests) as old_purchases;
```

**Data Integrity Checks:**
```sql
-- Verify activities migration
SELECT activity_type, COUNT(*) 
FROM activities 
GROUP BY activity_type;

-- Verify commerce migration
SELECT commerce_type, COUNT(*) 
FROM commerce 
GROUP BY commerce_type;

-- Verify payments migration
SELECT operation_type, COUNT(*) 
FROM payments 
GROUP BY operation_type;
```

---

### Step 4: Create Helper Functions
```bash
# Run migration: 20250120000004_create_wallet_balance_function.sql
# This creates helper functions and compatibility views
```

**What it does:**
- Creates `get_wallet_balance()` function
- Creates compatibility views for backward compatibility
- Enables wallet balance computation from payments table

**Expected time:** 1 minute

**Verification:**
```sql
-- Test wallet balance function
SELECT get_wallet_balance('YOUR_PROFILE_ID_HERE');

-- Check compatibility views exist
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN ('profile_wallets_consolidated', 'wallet_entries_consolidated');
```

---

## Post-Migration Steps

### 1. Update Application Code
- ✅ Frontend code updates (50% complete - see CONSOLIDATION_PROGRESS.md)
- ⏳ Backend edge functions updates (15% complete)
- ⏳ Test all workflows

### 2. Verify Functionality
Test these critical workflows:
- [ ] User signup/login
- [ ] Wallet balance display
- [ ] Lead purchase (wallet payment)
- [ ] Lead purchase (card/instapay - creates commerce record)
- [ ] Wallet top-up request
- [ ] Admin approval of purchase requests
- [ ] Admin approval of top-up requests
- [ ] CRM lead management
- [ ] Case manager workflows (stage changes, feedback, actions)
- [ ] Notifications
- [ ] Banner display

### 3. Performance Testing
- Check query performance on new tables
- Verify indexes are being used
- Monitor slow queries

### 4. Data Validation
```sql
-- Sample validation queries

-- Check wallet balances match
SELECT 
  p.id,
  p.name,
  get_wallet_balance(p.id) as new_balance,
  pw.balance as old_balance
FROM profiles p
LEFT JOIN profile_wallets pw ON pw.profile_id = p.id
LIMIT 10;

-- Check activities count matches old tables
SELECT 
  (SELECT COUNT(*) FROM activities WHERE activity_type = 'feedback') as new_feedback,
  (SELECT COUNT(*) FROM case_feedback) as old_feedback;

-- Check commerce count
SELECT 
  (SELECT COUNT(*) FROM commerce WHERE commerce_type = 'purchase') as new_purchases,
  (SELECT COUNT(*) FROM purchase_requests) as old_purchases;
```

---

## Rollback Plan

If something goes wrong, you can rollback:

### Option 1: Keep Both (Safest)
- Old tables remain intact
- Application can be reverted to use old tables
- No data loss

### Option 2: Drop New Tables
```sql
-- Only if you need to completely rollback
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS commerce CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS content CASCADE;
DROP TABLE IF EXISTS content_metrics CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS system_logs CASCADE;
DROP FUNCTION IF EXISTS get_wallet_balance(uuid);
DROP VIEW IF EXISTS profile_wallets_consolidated;
DROP VIEW IF EXISTS wallet_entries_consolidated;
```

---

## Cleanup (After Verification - Optional)

Once you've verified everything works for 1-2 weeks:

### Step 5: Drop Old Tables (Optional - Do Later)
```sql
-- Create backup first!
-- Then drop old tables (rename to _legacy_* instead of dropping)

ALTER TABLE case_feedback RENAME TO _legacy_case_feedback;
ALTER TABLE case_actions RENAME TO _legacy_case_actions;
ALTER TABLE case_faces RENAME TO _legacy_case_faces;
ALTER TABLE purchase_requests RENAME TO _legacy_purchase_requests;
ALTER TABLE wallet_topup_requests RENAME TO _legacy_wallet_topup_requests;
ALTER TABLE dashboard_banners RENAME TO _legacy_dashboard_banners;
-- ... etc for other old tables
```

**Or drop them completely (after thorough testing):**
```sql
-- Only after 2+ weeks of successful operation
DROP TABLE IF EXISTS _legacy_case_feedback CASCADE;
DROP TABLE IF EXISTS _legacy_case_actions CASCADE;
-- ... etc
```

---

## Troubleshooting

### Issue: Migration fails with "table already exists"
**Solution:** The migration uses `CREATE TABLE IF NOT EXISTS`, so this shouldn't happen. If it does, check for conflicting migrations.

### Issue: Data count mismatch
**Solution:** 
1. Check migration logs for errors
2. Verify foreign key constraints
3. Check for NULL values that might cause issues

### Issue: RLS policies blocking access
**Solution:**
1. Verify user roles in `profiles` table
2. Check RLS policies are correct
3. Test with service role key to bypass RLS temporarily

### Issue: Wallet balance incorrect
**Solution:**
1. Verify `get_wallet_balance()` function works
2. Check payments table has correct `entry_type` values
3. Verify `status = 'completed'` filter

---

## Support

If you encounter issues:
1. Check migration logs
2. Review error messages
3. Verify data integrity with validation queries
4. Check CONSOLIDATION_PROGRESS.md for known issues

---

## Success Criteria

Migration is successful when:
- ✅ All 12 consolidated tables exist
- ✅ All data migrated (counts match)
- ✅ RLS policies working
- ✅ Helper functions working
- ✅ Application code updated
- ✅ All workflows tested and working
- ✅ Performance acceptable

---

**Last Updated:** 2025-01-20
**Status:** Ready for Staging Execution

