-- ============================================
-- CREATE FRANCHISE EMPLOYEE ACCOUNTS AND CEO
-- ============================================
-- This migration creates user accounts for:
-- 1. One employee per franchise (22 franchises)
-- 2. One CEO account to oversee all franchises
-- ============================================

-- Helper function to create user and profile
CREATE OR REPLACE FUNCTION create_performance_user(
  p_email TEXT,
  p_password TEXT,
  p_name TEXT,
  p_role TEXT
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_encrypted_password TEXT;
BEGIN
  -- Generate user ID
  v_user_id := gen_random_uuid();
  
  -- Encrypt password (Supabase uses bcrypt, we'll use a simple hash for now)
  -- In production, Supabase handles this through their Auth API
  v_encrypted_password := crypt(p_password, gen_salt('bf'));
  
  -- Insert into auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    aud,
    role
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    p_email,
    v_encrypted_password,
    NOW(),
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
  )
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO v_user_id;
  
  -- If user already exists, get their ID
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
  END IF;
  
  -- Insert into profiles
  INSERT INTO public.profiles (
    id,
    name,
    email,
    role,
    wallet_balance,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    p_name,
    p_email,
    p_role,
    0,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET role = EXCLUDED.role,
      name = EXCLUDED.name;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CREATE CEO ACCOUNT
-- ============================================

DO $$
DECLARE
  v_ceo_id UUID;
BEGIN
  v_ceo_id := create_performance_user(
    'ceo@coldwellbanker.com',
    'CWB_CEO_2024',
    'Coldwell Banker CEO',
    'ceo'
  );
  
  RAISE NOTICE '✅ Created CEO account: ceo@coldwellbanker.com (ID: %)', v_ceo_id;
END $$;

-- ============================================
-- CREATE FRANCHISE EMPLOYEE ACCOUNTS
-- ============================================

DO $$
DECLARE
  v_user_id UUID;
  v_franchise_id UUID;
  franchise_record RECORD;
BEGIN
  -- Loop through all franchises and create employee accounts
  FOR franchise_record IN 
    SELECT id, name, slug FROM performance_franchises ORDER BY name
  LOOP
    -- Create user account
    v_user_id := create_performance_user(
      franchise_record.slug || '@coldwellbanker.com',
      'CWB2024',
      franchise_record.name || ' Manager',
      'franchise_employee'
    );
    
    -- Link user to franchise
    UPDATE performance_franchises
    SET owner_user_id = v_user_id
    WHERE id = franchise_record.id;
    
    RAISE NOTICE '✅ Created account for %: % (ID: %)', 
      franchise_record.name,
      franchise_record.slug || '@coldwellbanker.com',
      v_user_id;
  END LOOP;
  
  RAISE NOTICE '✅ Created employee accounts for all franchises';
END $$;

-- Drop the helper function (no longer needed)
DROP FUNCTION IF EXISTS create_performance_user(TEXT, TEXT, TEXT, TEXT);

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify CEO account
DO $$
DECLARE
  v_ceo_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_ceo_count
  FROM profiles
  WHERE role = 'ceo';
  
  RAISE NOTICE '✅ CEO accounts created: %', v_ceo_count;
END $$;

-- Verify franchise employee accounts
DO $$
DECLARE
  v_employee_count INTEGER;
  v_linked_franchises INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_employee_count
  FROM profiles
  WHERE role = 'franchise_employee';
  
  SELECT COUNT(*) INTO v_linked_franchises
  FROM performance_franchises
  WHERE owner_user_id IS NOT NULL;
  
  RAISE NOTICE '✅ Franchise employee accounts created: %', v_employee_count;
  RAISE NOTICE '✅ Franchises linked to employees: %', v_linked_franchises;
END $$;

-- Success message
SELECT '✅ Created CEO and franchise employee accounts successfully!' as status;
