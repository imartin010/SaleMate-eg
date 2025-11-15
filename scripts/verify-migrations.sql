-- Database Consolidation - Verification Queries
-- Run these queries after migrations to verify everything is correct

-- ============================================
-- 1. Verify Tables Exist
-- ============================================
SELECT 
  'Tables Check' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 12 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'activities', 'commerce', 'payments', 'content', 
  'content_metrics', 'notifications', 'system_logs',
  'leads', 'projects', 'profiles', 'teams', 'team_members'
);

-- ============================================
-- 2. Check Data Counts
-- ============================================
SELECT 
  'Data Counts' as check_type,
  (SELECT COUNT(*) FROM activities) as activities_count,
  (SELECT COUNT(*) FROM commerce) as commerce_count,
  (SELECT COUNT(*) FROM payments) as payments_count,
  (SELECT COUNT(*) FROM content) as content_count,
  (SELECT COUNT(*) FROM notifications) as notifications_count,
  (SELECT COUNT(*) FROM system_logs) as system_logs_count;

-- ============================================
-- 3. Verify Activities Migration
-- ============================================
SELECT 
  'Activities Types' as check_type,
  activity_type,
  COUNT(*) as count
FROM activities
GROUP BY activity_type
ORDER BY count DESC;

-- ============================================
-- 4. Verify Commerce Migration
-- ============================================
SELECT 
  'Commerce Types' as check_type,
  commerce_type,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM commerce
GROUP BY commerce_type
ORDER BY count DESC;

-- ============================================
-- 5. Verify Payments Migration
-- ============================================
SELECT 
  'Payment Operations' as check_type,
  operation_type,
  COUNT(*) as count,
  SUM(CASE WHEN operation_type = 'deposit' THEN amount ELSE -amount END) as net_amount
FROM payments
WHERE status = 'completed'
GROUP BY operation_type
ORDER BY count DESC;

-- ============================================
-- 6. Verify Content Migration
-- ============================================
SELECT 
  'Content Types' as check_type,
  content_type,
  COUNT(*) as count
FROM content
GROUP BY content_type
ORDER BY count DESC;

-- ============================================
-- 7. Check RLS is Enabled
-- ============================================
SELECT 
  'RLS Status' as check_type,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('activities', 'commerce', 'payments', 'content', 'notifications', 'system_logs')
ORDER BY tablename;

-- ============================================
-- 8. Verify Helper Functions
-- ============================================
SELECT 
  'Functions Check' as check_type,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('get_wallet_balance')
ORDER BY routine_name;

-- ============================================
-- 9. Test Wallet Balance Function
-- ============================================
-- Replace 'YOUR_PROFILE_ID' with an actual profile ID
-- SELECT 
--   'Wallet Balance Test' as check_type,
--   get_wallet_balance('YOUR_PROFILE_ID'::uuid) as balance;

-- ============================================
-- 10. Check Indexes
-- ============================================
SELECT 
  'Indexes Check' as check_type,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('activities', 'commerce', 'payments', 'content', 'notifications')
ORDER BY tablename, indexname;

-- ============================================
-- 11. Verify Foreign Keys
-- ============================================
SELECT
  'Foreign Keys' as check_type,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND tc.table_name IN ('activities', 'commerce', 'payments', 'content', 'notifications', 'system_logs')
ORDER BY tc.table_name, kcu.column_name;

-- ============================================
-- 12. Sample Data Validation
-- ============================================
-- Compare old vs new (if old tables still exist)
SELECT 
  'Data Comparison' as check_type,
  (SELECT COUNT(*) FROM activities WHERE activity_type = 'feedback') as new_feedback_count,
  (SELECT COUNT(*) FROM case_feedback) as old_feedback_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM activities WHERE activity_type = 'feedback') >= 
         (SELECT COUNT(*) FROM case_feedback) THEN '✅ PASS'
    ELSE '⚠️  WARNING'
  END as status
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'case_feedback');

