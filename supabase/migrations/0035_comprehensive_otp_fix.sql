-- Comprehensive fix for OTP functions to resolve ambiguous column references
-- Migration: 0035_comprehensive_otp_fix.sql

-- Drop and recreate all OTP functions with proper table references
DROP FUNCTION IF EXISTS create_otp(TEXT, BOOLEAN, JSONB);
DROP FUNCTION IF EXISTS verify_otp(TEXT, TEXT);
DROP FUNCTION IF EXISTS cleanup_expired_otps();

-- Fix create_otp function
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
  WHERE otp_codes.phone = phone_number 
    AND otp_codes.created_at > NOW() - INTERVAL '15 minutes'
    AND otp_codes.used_at IS NULL
  ORDER BY otp_codes.created_at DESC 
  LIMIT 1;
  
  -- If OTP exists and was created less than 45 seconds ago, block
  IF existing_otp IS NOT NULL AND 
     existing_otp.created_at > NOW() - INTERVAL '45 seconds' THEN
    RAISE EXCEPTION 'Please wait 45 seconds before requesting another OTP';
  END IF;
  
  -- Check if more than 3 OTPs in last 15 minutes
  IF (SELECT COUNT(*) FROM otp_codes 
      WHERE otp_codes.phone = phone_number 
        AND otp_codes.created_at > NOW() - INTERVAL '15 minutes') >= 3 THEN
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

-- Fix verify_otp function
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
  
  -- Find the OTP record with explicit table reference
  SELECT * INTO otp_record 
  FROM otp_codes 
  WHERE otp_codes.phone = phone_number 
    AND otp_codes.code_hash = code_hash
    AND otp_codes.expires_at > NOW()
    AND otp_codes.used_at IS NULL
  ORDER BY otp_codes.created_at DESC 
  LIMIT 1;
  
  -- If no OTP found
  IF otp_record IS NULL THEN
    -- Increment attempts for any existing OTPs
    UPDATE otp_codes 
    SET attempts = attempts + 1 
    WHERE otp_codes.phone = phone_number 
      AND otp_codes.expires_at > NOW()
      AND otp_codes.used_at IS NULL;
    
    RAISE EXCEPTION 'Invalid or expired OTP code';
  END IF;
  
  -- Check if too many attempts
  IF otp_record.attempts >= 5 THEN
    RAISE EXCEPTION 'Too many failed attempts. Please request a new OTP.';
  END IF;
  
  -- Mark OTP as used
  UPDATE otp_codes 
  SET used_at = NOW() 
  WHERE otp_codes.id = otp_record.id;
  
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

-- Fix cleanup_expired_otps function
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM otp_codes 
  WHERE otp_codes.expires_at < NOW() OR otp_codes.used_at IS NOT NULL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_otp(TEXT, BOOLEAN, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION verify_otp(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_otps() TO authenticated;
