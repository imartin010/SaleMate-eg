-- Add OTP system for phone authentication
-- Migration: 0033_add_otp_system.sql

-- Create OTP table for storing temporary OTP codes
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE,
  is_signup BOOLEAN DEFAULT false,
  signup_data JSONB -- Store signup data for new users
);

-- Create indexes for OTP table
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone ON otp_codes(phone);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires ON otp_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_codes_created ON otp_codes(created_at);

-- Make email optional in profiles table since phone is now mandatory
ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS generate_otp_code();
DROP FUNCTION IF EXISTS hash_otp_code(TEXT);
DROP FUNCTION IF EXISTS create_otp(TEXT, BOOLEAN, JSONB);
DROP FUNCTION IF EXISTS verify_otp(TEXT, TEXT);
DROP FUNCTION IF EXISTS cleanup_expired_otps();

-- Create function to generate OTP code
CREATE OR REPLACE FUNCTION generate_otp_code()
RETURNS TEXT AS $$
BEGIN
  -- Generate 6-digit code
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to hash OTP code (simple hash for demo, use bcrypt in production)
CREATE OR REPLACE FUNCTION hash_otp_code(code TEXT)
RETURNS TEXT AS $$
BEGIN
  -- In production, use proper hashing like bcrypt
  -- For now, using a simple hash for demonstration
  RETURN encode(sha256(code::bytea), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create OTP
CREATE OR REPLACE FUNCTION create_otp(
  phone_number TEXT,
  is_signup BOOLEAN DEFAULT false,
  signup_data JSONB DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  otp_code TEXT;
  code_hash TEXT;
  existing_otp RECORD;
BEGIN
  -- Normalize phone number
  phone_number := '+' || REGEXP_REPLACE(phone_number, '[^0-9]', '', 'g');
  
  -- Check if phone starts with 1 (US format) and add if missing
  IF LENGTH(phone_number) = 11 AND phone_number LIKE '+1%' THEN
    -- Already correct format
  ELSIF LENGTH(phone_number) = 10 THEN
    phone_number := '+1' + phone_number;
  END IF;
  
  -- Check for existing OTP within 15 minutes
  SELECT * INTO existing_otp 
  FROM otp_codes 
  WHERE phone = phone_number 
    AND created_at > NOW() - INTERVAL '15 minutes'
    AND used_at IS NULL
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- If OTP exists and was created less than 45 seconds ago, block
  IF existing_otp IS NOT NULL AND 
     existing_otp.created_at > NOW() - INTERVAL '45 seconds' THEN
    RAISE EXCEPTION 'Please wait 45 seconds before requesting another OTP';
  END IF;
  
  -- Check if more than 3 OTPs in last 15 minutes
  IF (SELECT COUNT(*) FROM otp_codes 
      WHERE phone = phone_number 
        AND created_at > NOW() - INTERVAL '15 minutes') >= 3 THEN
    RAISE EXCEPTION 'Too many OTP requests. Please wait 15 minutes.';
  END IF;
  
  -- Generate new OTP code
  otp_code := generate_otp_code();
  code_hash := hash_otp_code(otp_code);
  
  -- Insert OTP record
  INSERT INTO otp_codes (phone, code_hash, expires_at, is_signup, signup_data)
  VALUES (phone_number, code_hash, NOW() + INTERVAL '5 minutes', is_signup, signup_data);
  
  -- Return the plain text code (in production, this would be sent via SMS)
  RETURN otp_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to verify OTP
CREATE OR REPLACE FUNCTION verify_otp(
  phone_number TEXT,
  code TEXT
)
RETURNS JSONB AS $$
DECLARE
  otp_record RECORD;
  code_hash TEXT;
  result JSONB;
BEGIN
  -- Normalize phone number
  phone_number := '+' || REGEXP_REPLACE(phone_number, '[^0-9]', '', 'g');
  
  -- Check if phone starts with 1 (US format) and add if missing
  IF LENGTH(phone_number) = 11 AND phone_number LIKE '+1%' THEN
    -- Already correct format
  ELSIF LENGTH(phone_number) = 10 THEN
    phone_number := '+1' + phone_number;
  END IF;
  
  -- Hash the provided code
  code_hash := hash_otp_code(code);
  
  -- Find the OTP record
  SELECT * INTO otp_record 
  FROM otp_codes 
  WHERE phone = phone_number 
    AND code_hash = code_hash
    AND expires_at > NOW()
    AND used_at IS NULL
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- If no OTP found
  IF otp_record IS NULL THEN
    -- Increment attempts for any existing OTPs
    UPDATE otp_codes 
    SET attempts = attempts + 1 
    WHERE phone = phone_number 
      AND expires_at > NOW()
      AND used_at IS NULL;
    
    RAISE EXCEPTION 'Invalid or expired OTP code';
  END IF;
  
  -- Check if too many attempts
  IF otp_record.attempts >= 5 THEN
    RAISE EXCEPTION 'Too many failed attempts. Please request a new OTP.';
  END IF;
  
  -- Mark OTP as used
  UPDATE otp_codes 
  SET used_at = NOW() 
  WHERE id = otp_record.id;
  
  -- Return result
  result := jsonb_build_object(
    'success', true,
    'is_signup', otp_record.is_signup,
    'signup_data', otp_record.signup_data,
    'phone', phone_number
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clean up expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM otp_codes 
  WHERE expires_at < NOW() OR used_at IS NOT NULL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON otp_codes TO authenticated;
GRANT SELECT ON otp_codes TO anon;
GRANT EXECUTE ON FUNCTION create_otp(TEXT, BOOLEAN, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION verify_otp(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_otps() TO authenticated;

-- Create RLS policies for OTP table
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can create OTP" ON otp_codes;
DROP POLICY IF EXISTS "Users can view own OTP" ON otp_codes;
DROP POLICY IF EXISTS "Cleanup expired OTPs" ON otp_codes;

-- Allow anyone to create OTPs (for signup/signin)
CREATE POLICY "Anyone can create OTP" ON otp_codes
  FOR INSERT WITH CHECK (true);

-- Allow users to view their own OTPs
CREATE POLICY "Users can view own OTP" ON otp_codes
  FOR SELECT USING (phone = (SELECT phone FROM profiles WHERE id = auth.uid()));

-- Allow cleanup of expired OTPs
CREATE POLICY "Cleanup expired OTPs" ON otp_codes
  FOR DELETE USING (expires_at < NOW() OR used_at IS NULL);

-- Fix RLS policies for profiles table to allow signup
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (true); -- Allow profile creation during signup

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow users to view their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Grant necessary permissions for profiles
GRANT ALL ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;

-- Create a scheduled job to clean up expired OTPs (optional)
-- This would typically be handled by a cron job or Supabase Edge Functions

-- Clear existing test data and insert fresh test data for development
DELETE FROM otp_codes WHERE phone IN ('+1234567890', '+1987654321');

INSERT INTO otp_codes (phone, code_hash, expires_at, is_signup, signup_data)
VALUES 
  ('+1234567890', hash_otp_code('123456'), NOW() + INTERVAL '1 hour', true, 
   '{"name": "Test User", "email": "test@example.com", "role": "user"}'),
  ('+1987654321', hash_otp_code('123456'), NOW() + INTERVAL '1 hour', false, NULL)
ON CONFLICT DO NOTHING;
