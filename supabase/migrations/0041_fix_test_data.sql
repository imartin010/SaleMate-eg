-- Fix test data to match user's phone number format
-- Migration: 0041_fix_test_data.sql

-- Clear existing test data
DELETE FROM otp_codes WHERE phone IN ('+1234567890', '+1987654321');

-- Insert test data with the user's actual phone number format
INSERT INTO otp_codes (phone, code_hash, expires_at, is_signup, signup_data)
VALUES 
  ('+201070020058', hash_otp_code('123456'), NOW() + INTERVAL '1 hour', true, 
   '{"name": "Test User", "email": "test@example.com", "role": "user"}'),
  ('+201070020059', hash_otp_code('123456'), NOW() + INTERVAL '1 hour', false, NULL)
ON CONFLICT DO NOTHING;
