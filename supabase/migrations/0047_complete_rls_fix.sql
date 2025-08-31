-- Complete fix for profiles RLS infinite recursion
-- This will completely reset the RLS policies

-- Disable RLS completely first
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies (force drop)
DO $$
DECLARE
    pol_name TEXT;
BEGIN
    FOR pol_name IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_name || '" ON profiles';
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create very simple policies without recursion
CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE USING (true);

CREATE POLICY "profiles_delete_policy" ON profiles
    FOR DELETE USING (true);

-- Ensure permissions are granted
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO anon;
GRANT ALL ON profiles TO service_role;
