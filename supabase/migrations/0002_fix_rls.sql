-- Fix infinite recursion in RLS policies
-- This migration fixes the profiles table RLS policies that cause infinite recursion

-- Drop problematic policies
DROP POLICY IF EXISTS "Managers can view team member profiles" ON profiles;
DROP POLICY IF EXISTS "Support and Admin can view all profiles" ON profiles;

-- Create simpler, non-recursive policies
CREATE POLICY "Managers can view team member profiles" ON profiles
    FOR SELECT USING (
        manager_id = auth.uid()
    );

CREATE POLICY "Support and Admin can view all profiles" ON profiles
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('support', 'admin')
        OR 
        EXISTS (
            SELECT 1 FROM auth.users u 
            WHERE u.id = auth.uid() 
            AND u.raw_user_meta_data ->> 'role' IN ('support', 'admin')
        )
    );

-- Update the admin update policy to be simpler
DROP POLICY IF EXISTS "Only Admin can update role, manager_id, and is_banned" ON profiles;

CREATE POLICY "Only Admin can update role, manager_id, and is_banned" ON profiles
    FOR UPDATE USING (
        auth.jwt() ->> 'role' = 'admin'
        OR 
        EXISTS (
            SELECT 1 FROM auth.users u 
            WHERE u.id = auth.uid() 
            AND u.raw_user_meta_data ->> 'role' = 'admin'
        )
    );

-- Fix similar issues in leads policies
DROP POLICY IF EXISTS "Managers can view team member leads" ON leads;
DROP POLICY IF EXISTS "Support and Admin can view all leads" ON leads;

CREATE POLICY "Managers can view team member leads" ON leads
    FOR SELECT USING (
        buyer_user_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = leads.buyer_user_id 
            AND p.manager_id = auth.uid()
        )
    );

CREATE POLICY "Support and Admin can view all leads" ON leads
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('support', 'admin')
        OR 
        EXISTS (
            SELECT 1 FROM auth.users u 
            WHERE u.id = auth.uid() 
            AND u.raw_user_meta_data ->> 'role' IN ('support', 'admin')
        )
    );

-- Fix orders policies
DROP POLICY IF EXISTS "Managers can view team member orders" ON orders;
DROP POLICY IF EXISTS "Support and Admin can view all orders" ON orders;

CREATE POLICY "Managers can view team member orders" ON orders
    FOR SELECT USING (
        user_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = user_id 
            AND p.manager_id = auth.uid()
        )
    );

CREATE POLICY "Support and Admin can view all orders" ON orders
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('support', 'admin')
        OR 
        EXISTS (
            SELECT 1 FROM auth.users u 
            WHERE u.id = auth.uid() 
            AND u.raw_user_meta_data ->> 'role' IN ('support', 'admin')
        )
    );

-- Fix support cases policies
DROP POLICY IF EXISTS "Support and Admin can view all support cases" ON support_cases;
DROP POLICY IF EXISTS "Support and Admin can update all support cases" ON support_cases;

CREATE POLICY "Support and Admin can view all support cases" ON support_cases
    FOR SELECT USING (
        created_by = auth.uid()
        OR assigned_to = auth.uid()
        OR auth.jwt() ->> 'role' IN ('support', 'admin')
        OR 
        EXISTS (
            SELECT 1 FROM auth.users u 
            WHERE u.id = auth.uid() 
            AND u.raw_user_meta_data ->> 'role' IN ('support', 'admin')
        )
    );

CREATE POLICY "Support and Admin can update all support cases" ON support_cases
    FOR UPDATE USING (
        assigned_to = auth.uid()
        OR auth.jwt() ->> 'role' IN ('support', 'admin')
        OR 
        EXISTS (
            SELECT 1 FROM auth.users u 
            WHERE u.id = auth.uid() 
            AND u.raw_user_meta_data ->> 'role' IN ('support', 'admin')
        )
    );

-- Fix activity policies
DROP POLICY IF EXISTS "Managers can view team member activity" ON recent_activity;
DROP POLICY IF EXISTS "Support and Admin can view all activity" ON recent_activity;

CREATE POLICY "Managers can view team member activity" ON recent_activity
    FOR SELECT USING (
        user_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = user_id 
            AND p.manager_id = auth.uid()
        )
    );

CREATE POLICY "Support and Admin can view all activity" ON recent_activity
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('support', 'admin')
        OR 
        EXISTS (
            SELECT 1 FROM auth.users u 
            WHERE u.id = auth.uid() 
            AND u.raw_user_meta_data ->> 'role' IN ('support', 'admin')
        )
    );
