-- ============================================
-- CREATE FRANCHISE EMPLOYEE PROFILES AND CEO
-- ============================================
-- This migration creates profiles for franchise employees and CEO
-- Auth users must be created separately via Supabase Auth API
-- ============================================

-- Note: User IDs are generated and stored here
-- You'll need to create corresponding auth.users entries via Supabase Dashboard or API

-- ============================================
-- CREATE CEO PROFILE
-- ============================================

DO $$
DECLARE
  v_ceo_id UUID := 'c3ae3a73-ec43-402b-b8bd-bd0a41de5481'; -- Fixed UUID for CEO
BEGIN
  -- Insert CEO profile (will fail silently if auth user doesn't exist yet)
  INSERT INTO public.profiles (
    id,
    name,
    email,
    role,
    wallet_balance,
    created_at,
    updated_at
  ) VALUES (
    v_ceo_id,
    'Coldwell Banker CEO',
    'ceo@coldwellbanker.com',
    'ceo',
    0,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET role = 'ceo',
      name = 'Coldwell Banker CEO',
      email = 'ceo@coldwellbanker.com';
  
  RAISE NOTICE '✅ CEO profile ready: ceo@coldwellbanker.com (ID: %)', v_ceo_id;
  RAISE NOTICE '⚠️  Create auth user via Supabase Dashboard with this email and ID';
END $$;

-- ============================================
-- LINK EXISTING FRANCHISES TO TEMPORARY OWNER
-- ============================================
-- For now, we'll update franchises to have NULL owner_user_id
-- They will be linked once auth users are created

DO $$
BEGIN
  -- Get list of all franchises for reference
  RAISE NOTICE '📋 Franchises that need employee accounts:';
  
  FOR franchise_record IN 
    SELECT name, slug FROM performance_franchises ORDER BY name
  LOOP
    RAISE NOTICE '   - %: %@coldwellbanker.com', franchise_record.name, franchise_record.slug;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Create auth users for each franchise via Supabase Dashboard';
  RAISE NOTICE '    Email pattern: {slug}@coldwellbanker.com';
  RAISE NOTICE '    Password: CWB2024';
  RAISE NOTICE '    Role: franchise_employee';
END $$;

-- Success message
SELECT '✅ Franchise structure ready! Create auth users via Supabase Dashboard.' as status;
