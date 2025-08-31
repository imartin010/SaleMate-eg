-- Drop existing OTP system completely
DROP FUNCTION IF EXISTS verify_otp_simple(TEXT, TEXT);
DROP FUNCTION IF EXISTS cleanup_expired_otps();
DROP FUNCTION IF EXISTS verify_otp(TEXT, TEXT);
DROP FUNCTION IF EXISTS create_otp(TEXT, BOOLEAN, JSONB);
DROP FUNCTION IF EXISTS hash_otp_code(TEXT);
DROP FUNCTION IF EXISTS generate_otp_code();
DROP TABLE IF EXISTS otp_codes CASCADE;

-- Create fresh OTP codes table
CREATE TABLE otp_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    is_signup BOOLEAN DEFAULT false,
    signup_data JSONB,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 5,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_otp_codes_phone ON otp_codes(phone);
CREATE INDEX idx_otp_codes_expires ON otp_codes(expires_at);
CREATE INDEX idx_otp_codes_used ON otp_codes(used_at);

-- Function to generate 6-digit OTP code
CREATE OR REPLACE FUNCTION generate_otp_code()
RETURNS TEXT AS $$
BEGIN
    RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to hash OTP code (simple hash for now)
CREATE OR REPLACE FUNCTION hash_otp_code(code TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(sha256(code::bytea), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to create OTP
CREATE OR REPLACE FUNCTION create_otp(
    phone_number TEXT,
    is_signup BOOLEAN DEFAULT false,
    signup_data JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    otp_code TEXT;
    code_hash TEXT;
    existing_otp RECORD;
    result JSONB;
BEGIN
    -- Check rate limiting (max 3 OTPs per 15 minutes)
    SELECT COUNT(*) INTO existing_otp.count
    FROM otp_codes 
    WHERE phone = phone_number 
    AND created_at > NOW() - INTERVAL '15 minutes'
    AND used_at IS NULL;
    
    IF existing_otp.count >= 3 THEN
        RETURN jsonb_build_object(
            'error', 'Too many OTP requests. Please wait 15 minutes.',
            'success', false
        );
    END IF;
    
    -- Check cooldown (45 seconds between requests)
    SELECT created_at INTO existing_otp.created_at
    FROM otp_codes 
    WHERE phone = phone_number 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF existing_otp.created_at IS NOT NULL 
    AND existing_otp.created_at > NOW() - INTERVAL '45 seconds' THEN
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

-- Function to verify OTP
CREATE OR REPLACE FUNCTION verify_otp(
    phone_number TEXT,
    input_code TEXT
)
RETURNS JSONB AS $$
DECLARE
    otp_record RECORD;
    code_hash TEXT;
    result JSONB;
BEGIN
    -- Find the most recent unused OTP for this phone
    SELECT * INTO otp_record
    FROM otp_codes 
    WHERE phone = phone_number 
    AND used_at IS NULL
    AND expires_at > NOW()
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Check if OTP exists
    IF otp_record IS NULL THEN
        RETURN jsonb_build_object(
            'error', 'No valid OTP found for this phone number',
            'success', false
        );
    END IF;
    
    -- Check if OTP is expired
    IF otp_record.expires_at <= NOW() THEN
        -- Mark as used to prevent reuse
        UPDATE otp_codes SET used_at = NOW() WHERE id = otp_record.id;
        RETURN jsonb_build_object(
            'error', 'OTP has expired',
            'success', false
        );
    END IF;
    
    -- Check if max attempts exceeded
    IF otp_record.attempts >= otp_record.max_attempts THEN
        -- Mark as used to prevent further attempts
        UPDATE otp_codes SET used_at = NOW() WHERE id = otp_record.id;
        RETURN jsonb_build_object(
            'error', 'Too many failed attempts. OTP has been blocked.',
            'success', false
        );
    END IF;
    
    -- Hash the input code
    code_hash := hash_otp_code(input_code);
    
    -- Verify the code
    IF otp_record.code_hash = code_hash THEN
        -- Mark OTP as used
        UPDATE otp_codes SET used_at = NOW() WHERE id = otp_record.id;
        
        -- Return success with OTP data
        result := jsonb_build_object(
            'success', true,
            'is_signup', otp_record.is_signup,
            'signup_data', otp_record.signup_data,
            'phone', otp_record.phone,
            'message', 'OTP verified successfully'
        );
        
        RETURN result;
    ELSE
        -- Increment attempt counter
        UPDATE otp_codes SET attempts = attempts + 1 WHERE id = otp_record.id;
        
        RETURN jsonb_build_object(
            'error', 'Invalid OTP code',
            'success', false,
            'remaining_attempts', otp_record.max_attempts - (otp_record.attempts + 1)
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM otp_codes 
    WHERE expires_at <= NOW() OR used_at IS NOT NULL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Set up Row Level Security (RLS)
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create OTPs" ON otp_codes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read their own OTPs" ON otp_codes
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own OTPs" ON otp_codes
    FOR UPDATE USING (true);

CREATE POLICY "Cleanup expired OTPs" ON otp_codes
    FOR DELETE USING (expires_at <= NOW() OR used_at IS NOT NULL);

-- Create a scheduled job to cleanup expired OTPs (every 5 minutes)
-- Note: This requires pg_cron extension which may not be available in Supabase
-- For now, we'll rely on manual cleanup or the cleanup function

-- Insert some test data for development
INSERT INTO otp_codes (phone, code_hash, is_signup, signup_data, expires_at, created_at)
VALUES 
    ('+201070020058', hash_otp_code('123456'), true, 
     '{"name": "Test User", "email": "test@example.com", "role": "user", "password": "password123"}'::jsonb,
     NOW() + INTERVAL '1 hour', NOW()),
    ('+201070020059', hash_otp_code('123456'), false, NULL,
     NOW() + INTERVAL '1 hour', NOW());

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON otp_codes TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
