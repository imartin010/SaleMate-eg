-- Fix the create_otp function
DROP FUNCTION IF EXISTS create_otp(TEXT, BOOLEAN, JSONB);

CREATE OR REPLACE FUNCTION create_otp(
    phone_number TEXT,
    is_signup BOOLEAN DEFAULT false,
    signup_data JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    otp_code TEXT;
    code_hash TEXT;
    existing_count INTEGER;
    last_created TIMESTAMP WITH TIME ZONE;
    result JSONB;
BEGIN
    -- Check rate limiting (max 3 OTPs per 15 minutes)
    SELECT COUNT(*) INTO existing_count
    FROM otp_codes 
    WHERE phone = phone_number 
    AND created_at > NOW() - INTERVAL '15 minutes'
    AND used_at IS NULL;
    
    IF existing_count >= 3 THEN
        RETURN jsonb_build_object(
            'error', 'Too many OTP requests. Please wait 15 minutes.',
            'success', false
        );
    END IF;
    
    -- Check cooldown (45 seconds between requests)
    SELECT created_at INTO last_created
    FROM otp_codes 
    WHERE phone = phone_number 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF last_created IS NOT NULL 
    AND last_created > NOW() - INTERVAL '45 seconds' THEN
        RETURN jsonb_build_object(
            'error', 'Please wait 45 seconds before requesting another OTP.',
            'success', false
        );
    END IF;
    
    -- Generate OTP code
    otp_code := generate_otp_code();
    code_hash := hash_otp_code(otp_code);
    
    -- Insert OTP record
    INSERT INTO otp_codes (phone, code_hash, is_signup, signup_data, expires_at)
    VALUES (phone_number, code_hash, is_signup, signup_data, NOW() + INTERVAL '5 minutes');
    
    -- Return success with OTP code (in production, this would be sent via SMS)
    result := jsonb_build_object(
        'success', true,
        'otp_code', otp_code,
        'expires_in', '5 minutes',
        'message', 'OTP created successfully'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
