-- ============================================
-- SCHEMA CONSISTENCY VERIFICATION SCRIPT
-- Run this to check for schema conflicts and missing elements
-- ============================================

-- STEP 1: Check for missing columns in leads table
-- ============================================

DO $$
DECLARE
    missing_cols TEXT[];
BEGIN
    missing_cols := ARRAY[]::TEXT[];
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'assigned_to_id'
    ) THEN
        missing_cols := array_append(missing_cols, 'assigned_to_id');
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'upload_user_id'
    ) THEN
        missing_cols := array_append(missing_cols, 'upload_user_id');
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'is_sold'
    ) THEN
        missing_cols := array_append(missing_cols, 'is_sold');
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'sold_at'
    ) THEN
        missing_cols := array_append(missing_cols, 'sold_at');
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'cpl_price'
    ) THEN
        missing_cols := array_append(missing_cols, 'cpl_price');
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'platform'
    ) THEN
        missing_cols := array_append(missing_cols, 'platform');
    END IF;
    
    IF array_length(missing_cols, 1) > 0 THEN
        RAISE NOTICE '❌ Missing columns in leads table: %', array_to_string(missing_cols, ', ');
    ELSE
        RAISE NOTICE '✅ All required columns exist in leads table';
    END IF;
END $$;

-- STEP 2: Check for missing foreign key constraints
-- ============================================

DO $$
DECLARE
    missing_fks TEXT[];
BEGIN
    missing_fks := ARRAY[]::TEXT[];
    
    -- Check leads.buyer_user_id FK
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND constraint_name = 'leads_buyer_user_id_fkey'
        AND table_name = 'leads'
    ) THEN
        missing_fks := array_append(missing_fks, 'leads.buyer_user_id → profiles.id');
    END IF;
    
    -- Check feedback_history.user_id FK
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND constraint_name = 'feedback_history_user_id_fkey'
        AND table_name = 'feedback_history'
    ) THEN
        missing_fks := array_append(missing_fks, 'feedback_history.user_id → profiles.id');
    END IF;
    
    -- Check lead_purchase_requests.buyer_user_id FK
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND constraint_name = 'lead_purchase_requests_buyer_user_id_fkey'
        AND table_name = 'lead_purchase_requests'
    ) THEN
        missing_fks := array_append(missing_fks, 'lead_purchase_requests.buyer_user_id → auth.users.id');
    END IF;
    
    IF array_length(missing_fks, 1) > 0 THEN
        RAISE NOTICE '❌ Missing foreign key constraints:';
        RAISE NOTICE '   %', array_to_string(missing_fks, E'\n   ');
    ELSE
        RAISE NOTICE '✅ All required foreign key constraints exist';
    END IF;
END $$;

-- STEP 3: Check for RLS policies
-- ============================================

DO $$
DECLARE
    tables_without_policies TEXT[];
    table_name TEXT;
BEGIN
    tables_without_policies := ARRAY[]::TEXT[];
    
    FOR table_name IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'leads', 'lead_purchase_requests', 'lead_batches', 
            'feedback_history', 'support_cases', 'user_wallets',
            'wallet_transactions', 'projects', 'developers'
        )
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = table_name
        ) THEN
            tables_without_policies := array_append(tables_without_policies, table_name);
        END IF;
    END LOOP;
    
    IF array_length(tables_without_policies, 1) > 0 THEN
        RAISE NOTICE '⚠️  Tables without RLS policies:';
        RAISE NOTICE '   %', array_to_string(tables_without_policies, ', ');
    ELSE
        RAISE NOTICE '✅ All tables have RLS policies';
    END IF;
END $$;

-- STEP 4: Check if RLS is enabled on all tables
-- ============================================

DO $$
DECLARE
    tables_without_rls TEXT[];
    table_rec RECORD;
BEGIN
    tables_without_rls := ARRAY[]::TEXT[];
    
    FOR table_rec IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'leads', 'lead_purchase_requests', 'lead_batches', 
            'feedback_history', 'support_cases', 'user_wallets',
            'wallet_transactions', 'projects', 'developers', 'partners'
        )
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_tables t
            JOIN pg_class c ON c.relname = t.tablename
            WHERE t.tablename = table_rec.tablename
            AND c.relrowsecurity = true
        ) THEN
            tables_without_rls := array_append(tables_without_rls, table_rec.tablename);
        END IF;
    END LOOP;
    
    IF array_length(tables_without_rls, 1) > 0 THEN
        RAISE NOTICE '⚠️  Tables with RLS disabled:';
        RAISE NOTICE '   %', array_to_string(tables_without_rls, ', ');
    ELSE
        RAISE NOTICE '✅ RLS is enabled on all required tables';
    END IF;
END $$;

-- STEP 5: Check for table name consistency
-- ============================================

DO $$
DECLARE
    table_checks TEXT[];
BEGIN
    table_checks := ARRAY[]::TEXT[];
    
    -- Check if lead_purchase_requests exists (should use this, not purchase_requests)
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_requests'
    ) THEN
        table_checks := array_append(table_checks, '⚠️  Both purchase_requests and lead_purchase_requests exist - consider migrating');
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'lead_purchase_requests'
    ) THEN
        table_checks := array_append(table_checks, '❌ lead_purchase_requests table does not exist');
    ELSE
        table_checks := array_append(table_checks, '✅ lead_purchase_requests table exists');
    END IF;
    
    RAISE NOTICE 'Table consistency checks:';
    RAISE NOTICE '%', array_to_string(table_checks, E'\n');
END $$;

-- STEP 6: Check column names in lead_purchase_requests
-- ============================================

DO $$
DECLARE
    col_checks TEXT[];
BEGIN
    col_checks := ARRAY[]::TEXT[];
    
    -- Check for buyer_user_id (correct)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lead_purchase_requests' 
        AND column_name = 'buyer_user_id'
    ) THEN
        col_checks := array_append(col_checks, '✅ buyer_user_id column exists');
    ELSE
        col_checks := array_append(col_checks, '❌ buyer_user_id column missing');
    END IF;
    
    -- Check for number_of_leads (correct)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lead_purchase_requests' 
        AND column_name = 'number_of_leads'
    ) THEN
        col_checks := array_append(col_checks, '✅ number_of_leads column exists');
    ELSE
        col_checks := array_append(col_checks, '❌ number_of_leads column missing (might be lead_count)');
    END IF;
    
    -- Check for total_price (correct)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lead_purchase_requests' 
        AND column_name = 'total_price'
    ) THEN
        col_checks := array_append(col_checks, '✅ total_price column exists');
    ELSE
        col_checks := array_append(col_checks, '❌ total_price column missing (might be total_amount)');
    END IF;
    
    -- Warn if user_id exists (incorrect - should be buyer_user_id)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lead_purchase_requests' 
        AND column_name = 'user_id'
    ) THEN
        col_checks := array_append(col_checks, '⚠️  user_id column exists (should be buyer_user_id)');
    END IF;
    
    RAISE NOTICE 'Lead purchase requests column checks:';
    RAISE NOTICE '%', array_to_string(col_checks, E'\n');
END $$;

-- ============================================
-- Summary
-- ============================================

SELECT 
    'Schema Consistency Check Complete' as status,
    'Review the notices above for any issues' as message;






