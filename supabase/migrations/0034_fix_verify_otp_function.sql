-- Fix the verify_otp function to resolve ambiguous column references
-- Migration: 0034_fix_verify_otp_function.sql

DROP FUNCTION IF EXISTS verify_otp(TEXT, TEXT);

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
