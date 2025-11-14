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
    
    -- Core lead relationships
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND constraint_name = 'lead_events_lead_id_fkey'
        AND table_name = 'lead_events'
    ) THEN
        missing_fks := array_append(missing_fks, 'lead_events.lead_id → leads.id');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND constraint_name = 'lead_tasks_lead_id_fkey'
        AND table_name = 'lead_tasks'
    ) THEN
        missing_fks := array_append(missing_fks, 'lead_tasks.lead_id → leads.id');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND constraint_name = 'lead_labels_lead_id_fkey'
        AND table_name = 'lead_labels'
    ) THEN
        missing_fks := array_append(missing_fks, 'lead_labels.lead_id → leads.id');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND constraint_name = 'lead_transfers_lead_id_fkey'
        AND table_name = 'lead_transfers'
    ) THEN
        missing_fks := array_append(missing_fks, 'lead_transfers.lead_id → leads.id');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND constraint_name = 'lead_recommendations_lead_id_fkey'
        AND table_name = 'lead_recommendations'
    ) THEN
        missing_fks := array_append(missing_fks, 'lead_recommendations.lead_id → leads.id');
    END IF;

    -- Commerce & wallets
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND constraint_name = 'lead_commerce_profile_id_fkey'
        AND table_name = 'lead_commerce'
    ) THEN
        missing_fks := array_append(missing_fks, 'lead_commerce.profile_id → profiles.id');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND constraint_name = 'profile_wallets_profile_id_fkey'
        AND table_name = 'profile_wallets'
    ) THEN
        missing_fks := array_append(missing_fks, 'profile_wallets.profile_id → profiles.id');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND constraint_name = 'wallet_entries_wallet_id_fkey'
        AND table_name = 'wallet_entries'
    ) THEN
        missing_fks := array_append(missing_fks, 'wallet_entries.wallet_id → profile_wallets.id');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND constraint_name = 'payment_operations_profile_id_fkey'
        AND table_name = 'payment_operations'
    ) THEN
        missing_fks := array_append(missing_fks, 'payment_operations.profile_id → profiles.id');
    END IF;

    -- Support threads
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND constraint_name = 'support_messages_thread_id_fkey'
        AND table_name = 'support_messages'
    ) THEN
        missing_fks := array_append(missing_fks, 'support_messages.thread_id → support_threads.id');
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
            'leads', 'lead_events', 'lead_tasks', 'lead_labels',
            'lead_transfers', 'lead_recommendations', 'lead_commerce',
            'marketing_assets', 'marketing_metrics', 'notification_events',
            'profile_wallets', 'wallet_entries', 'payment_operations',
            'support_threads', 'support_messages'
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
            'leads', 'lead_events', 'lead_tasks', 'lead_labels',
            'lead_transfers', 'lead_recommendations', 'lead_commerce',
            'marketing_assets', 'marketing_metrics', 'notification_events',
            'profile_wallets', 'wallet_entries', 'payment_operations',
            'support_threads', 'support_messages'
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

-- STEP 5: Confirm legacy tables are fully migrated (no base tables remain)
-- ============================================

DO $$
DECLARE
    legacy_base_tables TEXT[];
    tbl TEXT;
BEGIN
    legacy_base_tables := ARRAY[]::TEXT[];

    FOR tbl IN
        SELECT unnest(ARRAY[
            'feedback_history','case_feedback','lead_activities','lead_reminders',
            'case_actions','case_faces','inventory_matches','lead_tags',
            'lead_requests','purchase_requests','dashboard_banners','banner_metrics',
            'notifications','user_wallets','wallet_transactions','payment_transactions',
            'wallet_topup_requests','support_cases','support_case_replies'
        ])
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = tbl
              AND table_type = 'BASE TABLE'
        ) THEN
            legacy_base_tables := array_append(legacy_base_tables, tbl);
        END IF;
    END LOOP;

    IF array_length(legacy_base_tables, 1) > 0 THEN
        RAISE NOTICE '⚠️  Legacy base tables still present: %', array_to_string(legacy_base_tables, ', ');
    ELSE
        RAISE NOTICE '✅ All legacy tables have been migrated to the consolidated schema.';
    END IF;
END $$;

-- ============================================
-- Summary
-- ============================================

SELECT 
    'Schema Consistency Check Complete' as status,
    'Review the notices above for any issues' as message;
















