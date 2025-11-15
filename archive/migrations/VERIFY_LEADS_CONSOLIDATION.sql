-- ============================================
-- VERIFY LEADS TABLE CONSOLIDATION
-- ============================================
-- Run this script to verify that all leads are in the unified table
-- and all workflows are configured correctly
-- ============================================

-- STEP 1: Verify leads table structure
-- ============================================

SELECT 
    'Leads Table Structure' as check_type,
    COUNT(*) as column_count,
    CASE 
        WHEN COUNT(*) >= 25 THEN '✅ PASS'
        ELSE '❌ FAIL - Missing columns'
    END as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'leads';

-- STEP 2: Check for required columns
-- ============================================

SELECT 
    'Required Columns Check' as check_type,
    column_name,
    CASE 
        WHEN column_name IN (
            'id', 'client_name', 'client_phone', 'project_id', 
            'buyer_user_id', 'assigned_to_id', 'owner_id',
            'stage', 'is_sold', 'source', 'platform',
            'created_at', 'updated_at'
        ) THEN '✅'
        ELSE '⚠️'
    END as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'leads'
AND column_name IN (
    'id', 'client_name', 'client_phone', 'client_email',
    'project_id', 'buyer_user_id', 'assigned_to_id', 'owner_id',
    'stage', 'is_sold', 'source', 'platform',
    'priority', 'last_contacted_at', 'next_followup_at',
    'created_at', 'updated_at'
)
ORDER BY column_name;

-- STEP 3: Verify indexes exist
-- ============================================

SELECT 
    'Indexes Check' as check_type,
    indexname,
    CASE 
        WHEN indexname LIKE 'idx_leads_%' THEN '✅'
        ELSE '⚠️'
    END as status
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'leads'
ORDER BY indexname;

-- STEP 4: Check RLS policies
-- ============================================

SELECT 
    'RLS Policies Check' as check_type,
    policyname,
    CASE 
        WHEN policyname LIKE '%leads%' THEN '✅'
        ELSE '⚠️'
    END as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'leads'
ORDER BY policyname;

-- STEP 5: Verify lead counts
-- ============================================

SELECT 
    'Lead Counts' as check_type,
    COUNT(*) as total_leads,
    COUNT(*) FILTER (WHERE is_sold = false) as available_leads,
    COUNT(*) FILTER (WHERE is_sold = true) as sold_leads,
    COUNT(*) FILTER (WHERE buyer_user_id IS NOT NULL) as purchased_leads,
    COUNT(*) FILTER (WHERE assigned_to_id IS NOT NULL) as assigned_leads
FROM public.leads;

-- STEP 6: Check for orphaned leads (no project)
-- ============================================

SELECT 
    'Orphaned Leads Check' as check_type,
    COUNT(*) as orphaned_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ PASS - No orphaned leads'
        ELSE '❌ FAIL - Found orphaned leads'
    END as status
FROM public.leads
WHERE project_id IS NULL;

-- STEP 7: Verify foreign key relationships
-- ============================================

SELECT 
    'Foreign Keys Check' as check_type,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    '✅' as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'leads'
ORDER BY kcu.column_name;

-- STEP 8: Check supporting tables reference leads correctly
-- ============================================

SELECT 
    'Supporting Tables Check' as check_type,
    'lead_tags' as table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'lead_tags_lead_id_fkey'
            AND table_name = 'lead_tags'
        ) THEN '✅ References leads'
        ELSE '❌ Missing FK to leads'
    END as status
UNION ALL
SELECT 
    'Supporting Tables Check' as check_type,
    'lead_reminders' as table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'lead_reminders_lead_id_fkey'
            AND table_name = 'lead_reminders'
        ) THEN '✅ References leads'
        ELSE '❌ Missing FK to leads'
    END as status
UNION ALL
SELECT 
    'Supporting Tables Check' as check_type,
    'lead_activities' as table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'lead_activities_lead_id_fkey'
            AND table_name = 'lead_activities'
        ) THEN '✅ References leads'
        ELSE '❌ Missing FK to leads'
    END as status;

-- STEP 9: Summary
-- ============================================

SELECT 
    '🎉 CONSOLIDATION VERIFICATION COMPLETE' as summary,
    (SELECT COUNT(*) FROM public.leads) as total_leads,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads') as column_count,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'leads') as index_count,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'leads') as policy_count,
    CASE 
        WHEN (SELECT COUNT(*) FROM public.leads WHERE project_id IS NULL) = 0 THEN '✅ All leads have projects'
        ELSE '⚠️ Some leads missing projects'
    END as data_quality;

