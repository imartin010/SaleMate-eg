-- ============================================
-- FIX WALLET BALANCE COLUMN
-- ============================================
-- Ensures wallet_balance column exists in profiles table
-- This is required for the payment gateway system
-- ============================================

-- Add wallet_balance column if it doesn't exist
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

-- Create or replace RPC function to get wallet balance
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

