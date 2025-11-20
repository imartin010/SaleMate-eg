# 🚀 Manual Consolidation Instructions

## Current Situation

Your consolidation migration files are created, but there's a migration history mismatch between local and remote. Here's how to proceed safely.

---

## ✅ Recommended Approach: Direct SQL Execution

Since Supabase CLI has migration history issues, the safest way is to run the SQL files directly in your Supabase dashboard.

### Step 1: Backup First (CRITICAL!)

Go to your Supabase dashboard and create a manual backup:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Database → Backups
4. Create a manual backup

OR use pg_dump if you have direct database access:
```bash
pg_dump "your_database_url" > backup_$(date +%Y%m%d).sql
```

### Step 2: Check Current State

Run this in your Supabase SQL Editor to see current tables:

```sql
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Expected current count:** 15 tables

---

## 📋 Execute Migrations in Order

Go to Supabase Dashboard → SQL Editor and run each file in this exact order:

### Phase 1: Events Consolidation

**File 1:** `supabase/migrations/20241118100001_phase1_create_events_table.sql`
- Creates the events table
- Run and verify: `SELECT COUNT(*) FROM events;`

**File 2:** `supabase/migrations/20241118100002_phase1_migrate_to_events.sql`
- Migrates data from activities, notifications, system_logs
- Run and verify data migrated

**File 3:** `supabase/migrations/20241118100003_phase1_create_views_and_cleanup.sql`
- Creates compatibility views
- Drops old tables (activities, notifications, system_logs)
- **After this: Should have 12 tables**

**Verify Phase 1:**
```sql
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Should return 12

SELECT event_type, COUNT(*) 
FROM events 
GROUP BY event_type;
-- Should show activity, notification, audit, etc.
```

---

### Phase 2: Transactions Consolidation

**File 4:** `supabase/migrations/20241118100004_phase2_create_transactions_table.sql`
- Creates the transactions table
- Run and verify: `SELECT COUNT(*) FROM transactions;`

**File 5:** `supabase/migrations/20241118100005_phase2_migrate_to_transactions.sql`
- Migrates data from commerce, payments, wallet_ledger_entries
- Run and verify data migrated

**File 6:** `supabase/migrations/20241118100006_phase2_create_views_and_cleanup.sql`
- Creates compatibility views
- Drops old tables (commerce, payments, wallet_ledger_entries)
- **After this: Should have 9 tables**

**Verify Phase 2 (CRITICAL - Financial Data!):**
```sql
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Should return 9

-- VERIFY WALLET BALANCES (IMPORTANT!)
SELECT 
  p.id,
  p.name,
  public.get_wallet_balance(p.id) as balance
FROM profiles p
WHERE p.role = 'user'
ORDER BY p.name;
-- Verify all balances are correct!

SELECT 
  transaction_type,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM transactions
GROUP BY transaction_type;
-- Should show commerce, payment, wallet, etc.
```

---

### Phase 3: Content Enhancement

**File 7:** `supabase/migrations/20241118100007_phase3_content_consolidation.sql`
- Enhances content table with metrics columns
- Migrates content_metrics data
- **After this: Should have 8 tables**

**Verify Phase 3:**
```sql
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Should return 8

SELECT 
  id,
  title,
  total_impressions,
  total_clicks,
  total_views
FROM content
LIMIT 5;
```

---

### Phase 4: System Data Consolidation

**File 8:** `supabase/migrations/20241118100008_phase4_system_data_consolidation.sql`
- Creates system_data table
- Migrates entities and auth_sessions
- **After this: Should have 9 tables** (8 core + salemate-inventory or keeping team_members separate)

**Verify Phase 4:**
```sql
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Should return 9 or 10 depending on team structure

SELECT 
  data_type,
  COUNT(*) as count
FROM system_data
GROUP BY data_type;
-- Should show entity, auth_session, etc.
```

---

## 🎯 Final Verification

After all phases complete, run:

```sql
-- 1. Check table count
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Should be around 9-10

-- 2. List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Expected tables:
-- 1. content
-- 2. events
-- 3. leads
-- 4. profiles
-- 5. projects
-- 6. salemate-inventory
-- 7. system_data
-- 8. team_members
-- 9. teams
-- 10. transactions

-- 3. Verify views exist (for backward compatibility)
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'VIEW'
ORDER BY table_name;

-- Should see:
-- activities, auth_sessions, commerce, content_metrics,
-- entities, notifications, payments, system_logs, wallet_ledger_entries

-- 4. Test a few key functions
SELECT public.get_wallet_balance('user-id-here');
SELECT public.get_unread_notification_count('user-id-here');
```

---

## 🔄 After Running Migrations

### 1. Regenerate TypeScript Types

```bash
cd "/Users/martin2/Desktop/Sale Mate Final"
bash regenerate_types.sh
```

### 2. Test Your Application

- [ ] Login/authentication works
- [ ] Notifications display
- [ ] Wallet balance shows correctly
- [ ] Payments process
- [ ] Lead management works
- [ ] All CRUD operations functional

### 3. Monitor for Issues

Check for:
- Application errors in console
- Database errors in Supabase logs
- User reports of issues

---

## 🆘 If Something Goes Wrong

### Rollback

1. Go to Supabase Dashboard → Database → Backups
2. Restore from the backup you created before starting
3. Wait for restoration to complete
4. Test application

### Get Support

If you encounter issues:
1. Check the error message
2. Run verification queries
3. Check Supabase logs
4. Review the migration file that failed

---

## 📊 Expected Results

### Before
- 15 core tables
- Scattered data across multiple tables
- Complex queries

### After
- 9-10 tables total
- Consolidated data model
- Simpler architecture
- Backward compatible views

### Benefits
- 40% fewer tables
- Easier maintenance
- Better performance
- Single source of truth for each domain

---

## ✅ Success Checklist

After completion:
- [ ] Backup created
- [ ] All 8 migration files executed successfully
- [ ] Table count verified (9-10 tables)
- [ ] Wallet balances verified (CRITICAL!)
- [ ] Views exist for backward compatibility
- [ ] TypeScript types regenerated
- [ ] Application tested end-to-end
- [ ] No errors in logs
- [ ] Users can access all features

---

## 🎉 You're Done!

Once all phases complete successfully and tests pass, you'll have:
- ✅ Cleaner database schema
- ✅ 40% fewer tables
- ✅ Better organized data
- ✅ Backward compatible
- ✅ Ready for scaling

---

*Run each phase carefully and verify before moving to the next!*

