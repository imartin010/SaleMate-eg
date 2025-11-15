# 🔄 Recreate Admin User - Step by Step Guide

## Quick Steps (5 minutes)

### Step 1: Create Auth User via Supabase Dashboard

1. **Go to Supabase Dashboard:**
   - Navigate to: https://supabase.com/dashboard/project/wkxbhvckmgrmdkdkhnqo/auth/users

2. **Click "Add User" button** (top right)

3. **Fill in the form:**
   - **Email:** `themartining@gmail.com`
   - **Password:** (choose a secure password)
   - **Auto Confirm User:** ✅ Check this box (important!)
   - **Email Confirmed:** ✅ Check this box

4. **Click "Create User"**

5. **Copy the User ID** that's created (you'll need it)

---

### Step 2: Create Profile with Admin Role

1. **Go to Supabase SQL Editor:**
   - Navigate to: https://supabase.com/dashboard/project/wkxbhvckmgrmdkdkhnqo/sql/new

2. **Paste and run this SQL:**

```sql
-- Create admin profile for themartining@gmail.com
DO $$
DECLARE
    auth_user_id uuid;
    admin_email text := 'themartining@gmail.com';
    admin_name text := 'Martin';
BEGIN
    -- Get the auth user ID
    SELECT id INTO auth_user_id
    FROM auth.users
    WHERE email = admin_email
    LIMIT 1;

    IF auth_user_id IS NULL THEN
        RAISE EXCEPTION 'Auth user not found. Please create user first in Authentication → Users → Add User';
    END IF;

    RAISE NOTICE 'Found auth user ID: %', auth_user_id;

    -- Create profile with matching ID and admin role
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
        admin_name,
        'admin', -- Admin role
        0,
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = admin_email,
        role = 'admin',
        name = admin_name,
        updated_at = now();

    RAISE NOTICE '✅ SUCCESS: Profile created with admin role!';
    RAISE NOTICE 'User ID: %', auth_user_id;
END $$;

-- Verify it worked
SELECT 
    au.id as auth_user_id,
    au.email,
    p.id as profile_id,
    p.role,
    CASE 
        WHEN au.id = p.id THEN '✅ IDs MATCH - Perfect!'
        ELSE '❌ IDs DO NOT MATCH'
    END as status
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE au.email = 'themartining@gmail.com';
```

3. **Click "Run"**

4. **Verify the result:**
   - Should show: `✅ IDs MATCH - Perfect!`
   - Should show: `role: admin`

---

### Step 3: Test Admin Access

1. **Logout** from your app (if logged in)

2. **Login** with:
   - Email: `themartining@gmail.com`
   - Password: (the one you set in Step 1)

3. **Navigate to:** `http://localhost:5175/app/admin`

4. **You should see:** Admin dashboard with KPIs and charts ✅

---

## Alternative: Create User via App Signup

If you prefer to use the app:

1. **Go to signup page:** `http://localhost:5175/auth/signup`

2. **Sign up with:**
   - Email: `themartining@gmail.com`
   - Password: (choose one)
   - Name: `Martin`

3. **Complete signup**

4. **Then run Step 2 SQL** (to set role to admin)

---

## Troubleshooting

### Issue: "Auth user not found"
**Solution:** Make sure you created the user in Step 1 first

### Issue: "Duplicate key" error
**Solution:** Profile might already exist. The `ON CONFLICT` clause should handle this, but if it doesn't, delete the profile first:
```sql
DELETE FROM public.profiles WHERE email = 'themartining@gmail.com';
```
Then run the profile creation script again.

### Issue: Still can't access admin panel
**Solution:** 
1. Clear browser localStorage: `localStorage.clear()`
2. Logout and login again
3. Check browser console (F12) for "RoleGuard Check" logs
4. Verify profile role is 'admin' in database

---

## Quick Verification SQL

Run this anytime to check status:

```sql
SELECT 
    au.id as auth_user_id,
    au.email as auth_email,
    au.email_confirmed_at,
    p.id as profile_id,
    p.email as profile_email,
    p.role,
    p.name,
    CASE 
        WHEN au.id = p.id THEN '✅ Perfect'
        ELSE '❌ Mismatch'
    END as status
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE au.email = 'themartining@gmail.com';
```

**Expected:**
- `auth_user_id = profile_id` (must match!)
- `role = 'admin'`
- `status = '✅ Perfect'`

---

## That's It! 🎉

After completing these steps, you'll have:
- ✅ Auth user created
- ✅ Profile with admin role
- ✅ Matching IDs (so RLS works)
- ✅ Admin panel access

Let me know if you need help with any step!

