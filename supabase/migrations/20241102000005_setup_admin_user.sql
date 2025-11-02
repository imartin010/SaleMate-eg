-- ============================================
-- SETUP ADMIN USER ACCESS
-- Ensure themartining@gmail.com can access admin panel
-- ============================================

-- IMPORTANT: This script ensures the admin user profile exists
-- with the correct role for admin panel access

DO $$
DECLARE
    admin_user_id uuid;
    existing_profile_id uuid;
    target_uuid uuid := '11111111-1111-1111-1111-111111111111';
    admin_email text := 'themartining@gmail.com';
BEGIN
    -- Find the user ID from auth.users
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = admin_email;

    -- Check if a profile with this email already exists
    SELECT id INTO existing_profile_id
    FROM public.profiles
    WHERE email = admin_email
    LIMIT 1;

    -- If profile with email exists, just update role to admin
    IF existing_profile_id IS NOT NULL THEN
        UPDATE public.profiles
        SET 
            role = 'admin',
            updated_at = now()
        WHERE id = existing_profile_id;
        
        RAISE NOTICE 'Updated existing profile (ID: %) to admin role', existing_profile_id;
    ELSE
        -- No profile exists with this email
        
        -- If user exists in auth.users
        IF admin_user_id IS NOT NULL THEN
            -- Check if profile with auth user ID exists (might have different email)
            IF EXISTS (SELECT 1 FROM public.profiles WHERE id = admin_user_id) THEN
                -- Profile exists with auth user ID, update email and role
                UPDATE public.profiles
                SET 
                    email = admin_email,
                    role = 'admin',
                    updated_at = now()
                WHERE id = admin_user_id;
                
                RAISE NOTICE 'Updated existing profile (auth user ID) to use email and admin role';
            ELSE
                -- Create new profile with auth user ID
                INSERT INTO public.profiles (
                    id,
                    email,
                    name,
                    role,
                    wallet_balance,
                    created_at,
                    updated_at
                ) VALUES (
                    admin_user_id,
                    admin_email,
                    'Martin',
                    'admin',
                    0,
                    now(),
                    now()
                );
                
                RAISE NOTICE 'Created new profile with auth user ID and admin role';
            END IF;
        ELSE
            -- User doesn't exist in auth.users
            
            -- Check if profile with target UUID exists
            IF EXISTS (SELECT 1 FROM public.profiles WHERE id = target_uuid) THEN
                -- Profile with target UUID exists, update email and role
                UPDATE public.profiles
                SET 
                    email = admin_email,
                    role = 'admin',
                    updated_at = now()
                WHERE id = target_uuid;
                
                RAISE NOTICE 'Updated profile with target UUID to use email and admin role';
            ELSE
                -- Create new profile with target UUID
                INSERT INTO public.profiles (
                    id,
                    email,
                    name,
                    role,
                    wallet_balance,
                    created_at,
                    updated_at
                ) VALUES (
                    target_uuid,
                    admin_email,
                    'Martin',
                    'admin',
                    0,
                    now(),
                    now()
                );
                
                RAISE NOTICE 'Created profile with target UUID and admin role';
            END IF;
        END IF;
    END IF;

END $$;

-- ============================================
-- VERIFICATION
-- ============================================

-- Show the admin user profile
SELECT 
    id,
    email,
    name,
    role,
    created_at
FROM public.profiles
WHERE email = 'themartining@gmail.com'
   OR id = '11111111-1111-1111-1111-111111111111';

-- ============================================
-- EXPECTED RESULT
-- ============================================
-- You should see one row with:
-- - email: themartining@gmail.com
-- - role: admin
-- ============================================


