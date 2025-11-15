-- ============================================
-- COMPLETE WALLET SYSTEM FIX
-- ============================================
-- Run this in Supabase SQL Editor to fix:
-- 1. Missing wallet_balance column
-- 2. receipt_file_url NOT NULL constraint for card payments
-- ============================================

-- FIX 1: Add wallet_balance column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'wallet_balance'
    ) THEN
        -- Add the column with default value 0
        ALTER TABLE public.profiles
        ADD COLUMN wallet_balance numeric(10, 2) DEFAULT 0 NOT NULL;
        
        RAISE NOTICE '✅ Added wallet_balance column to profiles table';
    ELSE
        -- Column exists, but ensure it's not null and has default
        BEGIN
            ALTER TABLE public.profiles
            ALTER COLUMN wallet_balance SET DEFAULT 0;
            
            -- Set any NULL values to 0
            UPDATE public.profiles
            SET wallet_balance = 0
            WHERE wallet_balance IS NULL;
            
            -- Make it NOT NULL if it isn't already
            ALTER TABLE public.profiles
            ALTER COLUMN wallet_balance SET NOT NULL;
            
            RAISE NOTICE '✅ Updated wallet_balance column constraints';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '⚠️  Column exists but could not update constraints: %', SQLERRM;
        END;
    END IF;
END $$;

-- FIX 2: Make receipt_file_url nullable for card payments
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'wallet_topup_requests' 
        AND column_name = 'receipt_file_url'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.wallet_topup_requests 
        ALTER COLUMN receipt_file_url DROP NOT NULL;
        
        RAISE NOTICE '✅ Made receipt_file_url nullable for card payments';
    ELSE
        RAISE NOTICE 'ℹ️  receipt_file_url column is already nullable or does not exist';
    END IF;
END $$;

-- FIX 3: Create or replace RPC function to get wallet balance
CREATE OR REPLACE FUNCTION get_user_wallet_balance(p_user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_balance numeric;
BEGIN
    SELECT COALESCE(wallet_balance, 0) INTO v_balance
    FROM public.profiles
    WHERE id = p_user_id;
    
    RETURN COALESCE(v_balance, 0);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_wallet_balance TO authenticated;

-- Verify fixes
DO $$
DECLARE
    wallet_col_exists boolean;
    receipt_nullable boolean;
BEGIN
    -- Check wallet_balance column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'wallet_balance'
    ) INTO wallet_col_exists;
    
    -- Check receipt_file_url nullable
    SELECT is_nullable = 'YES' INTO receipt_nullable
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'wallet_topup_requests' 
    AND column_name = 'receipt_file_url';
    
    IF wallet_col_exists THEN
        RAISE NOTICE '✅ wallet_balance column exists';
    ELSE
        RAISE WARNING '❌ wallet_balance column still missing!';
    END IF;
    
    IF receipt_nullable THEN
        RAISE NOTICE '✅ receipt_file_url is nullable';
    ELSE
        RAISE WARNING '⚠️  receipt_file_url is still NOT NULL';
    END IF;
END $$;

