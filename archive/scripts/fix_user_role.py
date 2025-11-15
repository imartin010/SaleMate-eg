#!/usr/bin/env python3
"""
Script to check and fix user role in Supabase
"""

import os
import sys
from pathlib import Path

def main():
    print("🔍 User Role Checker & Fixer")
    print("=" * 50)
    print()
    
    # Check if user has Supabase credentials
    supabase_url = os.getenv('SUPABASE_URL', 'https://wkxbhvckmgrmdkdkhnqo.supabase.co')
    
    print(f"📡 Supabase URL: {supabase_url}")
    print()
    
    print("🔧 SQL Queries to Run in Supabase Dashboard:")
    print("-" * 50)
    print()
    
    print("1️⃣ Check current user profiles:")
    print("""
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    p.id as profile_id,
    p.name,
    p.role,
    p.created_at as profile_created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'themartining@gmail.com'
ORDER BY u.created_at DESC;
""")
    
    print("2️⃣ Fix the admin user role:")
    print("""
-- Update the admin user role
UPDATE public.profiles 
SET 
    role = 'admin'::user_role,
    updated_at = NOW()
WHERE email = 'themartining@gmail.com'
   OR id = (SELECT id FROM auth.users WHERE email = 'themartining@gmail.com');

-- If no profile exists, create one
INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'name', SPLIT_PART(u.email, '@', 1), 'Admin') as name,
    'admin'::user_role,
    NOW(),
    NOW()
FROM auth.users u
WHERE u.email = 'themartining@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO UPDATE SET
    role = 'admin'::user_role,
    updated_at = NOW();
""")
    
    print("3️⃣ Verify the fix:")
    print("""
SELECT 
    'Profile Status' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ No profile found'
        WHEN COUNT(*) = 1 THEN '✅ Profile exists'
        ELSE '⚠️ Multiple profiles found'
    END as status
FROM public.profiles 
WHERE email = 'themartining@gmail.com'

UNION ALL

SELECT 
    'Admin Role Check' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 1 THEN '✅ Admin role set correctly'
        ELSE '❌ Admin role not set'
    END as status
FROM public.profiles 
WHERE email = 'themartining@gmail.com' AND role = 'admin';
""")
    
    print("4️⃣ Check all users and their roles:")
    print("""
SELECT 
    u.email,
    p.role,
    p.name,
    CASE 
        WHEN p.id IS NULL THEN '❌ No Profile'
        ELSE '✅ Profile Exists'
    END as profile_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;
""")
    
    print()
    print("🚀 Instructions:")
    print("1. Go to your Supabase Dashboard → SQL Editor")
    print("2. Run query #1 to see current status")
    print("3. Run query #2 to fix the admin role")
    print("4. Run query #3 to verify the fix")
    print("5. Run query #4 to see all users")
    print()
    print("🔄 After running the SQL:")
    print("1. Refresh your browser")
    print("2. Log out and log back in")
    print("3. Check if the role shows correctly in the sidebar")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())

