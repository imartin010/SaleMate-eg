# 🔧 Root Cause Fix - Admin Access Issue

## Problem Identified

**Root Cause:** The profile ID (`11111111-1111-1111-1111-111111111111`) doesn't match the auth user ID (`4534ebc6-b16a-497d-ad76-ab7b24070668`).

**Why this breaks:**
1. RLS policy requires: `auth.uid() = id`
2. When querying by auth user ID, it returns null (no matching profile)
3. When querying by email, RLS still blocks it because `auth.uid() != profile.id`
4. Result: Profile can't be loaded, so role is null, so admin access fails

## Solution

**Create a profile with the correct auth user ID:**

```sql
-- Run this in Supabase SQL Editor
DO $$
DECLARE
    auth_user_id uuid;
    admin_email text := 'themartining@gmail.com';
BEGIN
    -- Get the actual auth user ID
    SELECT id INTO auth_user_id
    FROM auth.users
    WHERE email = admin_email
    LIMIT 1;

    IF auth_user_id IS NULL THEN
        RAISE EXCEPTION 'Auth user not found';
    END IF;

    -- Create/Update profile with auth user ID
    INSERT INTO public.profiles (
        id,
        email,
        name,
        role,
        wallet_balance,
        created_at,
        updated_at
    ) VALUES (
        auth_user_id,
        admin_email,
        'Martin',
        'admin',
        0,
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = admin_email,
        role = 'admin',
        updated_at = now();
END $$;
```

## Files Fixed

1. ✅ `src/store/auth.ts` - Updated `refreshProfile()` to query by email as fallback
2. ✅ `FIX_ADMIN_PROFILE_NOW.sql` - SQL script to create profile with correct ID
3. ✅ `supabase/migrations/20241102000006_link_admin_profile_to_auth_user.sql` - Migration

## Steps to Fix

1. **Run the SQL script** in Supabase SQL Editor (see above)
2. **Logout** from the app
3. **Login** again with `themartining@gmail.com`
4. **Navigate** to `/app/admin`
5. **Verify** you see the admin dashboard

## Verification

After running the SQL, verify with:

```sql
SELECT 
    au.id as auth_user_id,
    p.id as profile_id,
    p.email,
    p.role,
    CASE WHEN au.id = p.id THEN '✅ MATCH' ELSE '❌ MISMATCH' END
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE au.email = 'themartining@gmail.com';
```

**Expected:** `auth_user_id = profile_id` and `role = 'admin'`

