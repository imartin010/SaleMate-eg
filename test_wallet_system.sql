-- Test script for wallet and lead request system
-- Run this after executing create_wallet_and_lead_request_system.sql

-- 1. Test wallet creation for existing users
-- This will create wallets for any existing users who don't have one
INSERT INTO user_wallets (user_id, balance, currency)
SELECT 
    au.id,
    0.00,
    'EGP'
FROM auth.users au
LEFT JOIN user_wallets uw ON au.id = uw.user_id
WHERE uw.user_id IS NULL;

-- 2. Test adding money to wallet (replace with actual user ID)
-- SELECT add_to_wallet('your-user-id-here', 100.00, 'Test deposit');

-- 3. Test creating a lead request (replace with actual IDs)
-- SELECT create_lead_request(
--     'your-user-id-here',
--     'your-project-id-here', 
--     5,
--     100.00,
--     'Test lead request'
-- );

-- 4. Check if all tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_wallets', 'wallet_transactions', 'lead_requests')
ORDER BY table_name;

-- 5. Check if all views exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_wallet_summary', 'lead_request_details')
ORDER BY table_name;

-- 6. Check if all functions exist
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'get_user_wallet_balance',
    'add_to_wallet', 
    'create_lead_request',
    'update_wallet_balance',
    'create_user_wallet'
)
ORDER BY routine_name;

-- 7. Test wallet balance function
SELECT get_user_wallet_balance(auth.uid()) as current_user_balance;
