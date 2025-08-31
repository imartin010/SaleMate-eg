-- Reset rate limits and clear OTP data for testing
-- Migration: 0042_reset_rate_limits.sql

-- Clear all existing OTP records to reset rate limiting
DELETE FROM otp_codes;

-- Insert fresh test data with longer expiration
INSERT INTO otp_codes (phone, code_hash, expires_at, is_signup, signup_data)
VALUES 
  ('+201070020058', hash_otp_code('123456'), NOW() + INTERVAL '1 hour', true, 
   '{"name": "Test User", "email": "test@example.com", "role": "user"}'),
  ('+201070020059', hash_otp_code('123456'), NOW() + INTERVAL '1 hour', false, NULL)
ON CONFLICT DO NOTHING;
