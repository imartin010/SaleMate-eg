-- Working OTP migration
-- Migration: 0040_working_otp.sql

-- Create a simple working verify function
CREATE OR REPLACE FUNCTION verify_otp_simple(
  phone_param TEXT,
  code_param TEXT
)
RETURNS JSONB AS $$
DECLARE
  otp_record RECORD;
  hashed_code TEXT;
BEGIN
  -- Hash the provided code
  hashed_code := hash_otp_code(code_param);
  
  -- Find the OTP record
  SELECT * INTO otp_record 
  FROM otp_codes 
  WHERE phone = phone_param 
    AND code_hash = hashed_code
    AND expires_at > NOW()
    AND used_at IS NULL
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- If no OTP found
  IF otp_record IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired OTP code';
  END IF;
  
  -- Mark OTP as used
  UPDATE otp_codes 
  SET used_at = NOW() 
  WHERE id = otp_record.id;
  
  -- Return result
  RETURN jsonb_build_object(
    'success', true,
    'is_signup', otp_record.is_signup,
    'signup_data', otp_record.signup_data,
    'phone', phone_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION verify_otp_simple(TEXT, TEXT) TO anon, authenticated;
