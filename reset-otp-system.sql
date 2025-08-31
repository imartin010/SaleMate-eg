-- Reset OTP System - Run this if you encounter policy conflicts
-- This script will clean up existing OTP system data

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can create OTP" ON otp_codes;
DROP POLICY IF EXISTS "Users can view own OTP" ON otp_codes;
DROP POLICY IF EXISTS "Cleanup expired OTPs" ON otp_codes;

-- Drop existing functions
DROP FUNCTION IF EXISTS generate_otp_code();
DROP FUNCTION IF EXISTS hash_otp_code(TEXT);
DROP FUNCTION IF EXISTS create_otp(TEXT, BOOLEAN, JSONB);
DROP FUNCTION IF EXISTS verify_otp(TEXT, TEXT);
DROP FUNCTION IF EXISTS cleanup_expired_otps();

-- Drop the OTP table completely
DROP TABLE IF EXISTS otp_codes;

-- Reset profiles table email constraint (if needed)
-- Note: This might fail if you have existing data with NULL emails
-- ALTER TABLE profiles ALTER COLUMN email SET NOT NULL;

-- Clean up any test data
DELETE FROM otp_codes;

-- Now you can run the migration 0033_add_otp_system.sql again
