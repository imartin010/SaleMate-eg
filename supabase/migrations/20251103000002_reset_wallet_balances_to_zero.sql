-- ============================================
-- RESET ALL USER WALLET BALANCES TO ZERO
-- ============================================
-- This migration sets wallet_balance to 0 for all users
-- as per the new wallet-first home page design
-- ============================================

-- STEP 1: Log current state before migration
-- ============================================
DO $$
DECLARE
    total_users integer;
    users_with_balance integer;
    total_balance numeric;
BEGIN
    SELECT COUNT(*) INTO total_users FROM public.profiles;
    SELECT COUNT(*) INTO users_with_balance FROM public.profiles WHERE COALESCE(wallet_balance, 0) > 0;
    SELECT COALESCE(SUM(wallet_balance), 0) INTO total_balance FROM public.profiles;
    
    RAISE NOTICE '📊 Pre-migration stats:';
    RAISE NOTICE '   Total users: %', total_users;
    RAISE NOTICE '   Users with balance > 0: %', users_with_balance;
    RAISE NOTICE '   Total balance across all users: % EGP', total_balance;
END $$;

-- STEP 2: Reset all wallet balances to 0
-- ============================================
UPDATE public.profiles
SET 
    wallet_balance = 0,
    updated_at = NOW()
WHERE COALESCE(wallet_balance, 0) != 0;

-- STEP 3: Ensure all profiles have wallet_balance = 0 (including NULL values)
-- ============================================
UPDATE public.profiles
SET 
    wallet_balance = 0,
    updated_at = NOW()
WHERE wallet_balance IS NULL;

-- STEP 4: Verify migration success
-- ============================================
DO $$
DECLARE
    users_with_zero_balance integer;
    users_with_balance integer;
    total_users integer;
BEGIN
    SELECT COUNT(*) INTO total_users FROM public.profiles;
    SELECT COUNT(*) INTO users_with_zero_balance 
    FROM public.profiles 
    WHERE COALESCE(wallet_balance, 0) = 0;
    SELECT COUNT(*) INTO users_with_balance 
    FROM public.profiles 
    WHERE COALESCE(wallet_balance, 0) > 0;
    
    RAISE NOTICE '✅ Post-migration stats:';
    RAISE NOTICE '   Total users: %', total_users;
    RAISE NOTICE '   Users with balance = 0: %', users_with_zero_balance;
    RAISE NOTICE '   Users with balance > 0: %', users_with_balance;
    
    IF users_with_balance = 0 AND users_with_zero_balance = total_users THEN
        RAISE NOTICE '✅ SUCCESS: All wallet balances reset to 0!';
    ELSE
        RAISE WARNING '⚠️  WARNING: Migration may not have completed successfully!';
    END IF;
END $$;

-- STEP 5: Return summary
-- ============================================
SELECT 
    '✅ Wallet balance reset complete!' as status,
    (SELECT COUNT(*) FROM public.profiles) as total_users,
    (SELECT COUNT(*) FROM public.profiles WHERE COALESCE(wallet_balance, 0) = 0) as users_with_zero_balance,
    (SELECT COUNT(*) FROM public.profiles WHERE COALESCE(wallet_balance, 0) > 0) as users_with_balance;

