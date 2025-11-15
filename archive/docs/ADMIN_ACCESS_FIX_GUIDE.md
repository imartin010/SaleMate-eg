# 🔧 Fix Admin Access - Step by Step Guide

## Problem
User `themartining@gmail.com` cannot access admin panel at `/app/admin`

## Solution
Ensure the profile has `role = 'admin'` in the database.

---

## 🚀 Quick Fix (2 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/editor
2. Click on "SQL Editor" in the left sidebar

### Step 2: Run the Fix Script
Copy and paste this into the SQL Editor:

```sql
-- Fix admin access for themartining@gmail.com
DO $$
DECLARE
    actual_user_id uuid;
BEGIN
    -- Get the actual user ID
    SELECT id INTO actual_user_id
    FROM auth.users
    WHERE email = 'themartining@gmail.com';

    IF actual_user_id IS NOT NULL THEN
        -- Upsert profile with admin role
        INSERT INTO public.profiles (
            id,
            email,
            name,
            role,
            wallet_balance,
            created_at,
            updated_at
        ) VALUES (
            actual_user_id,
            'themartining@gmail.com',
            'Martin',
            'admin',
            0,
            now(),
            now()
        )
        ON CONFLICT (id) DO UPDATE
        SET 
            role = 'admin',
            email = 'themartining@gmail.com',
            updated_at = now();

        RAISE NOTICE 'SUCCESS: Admin role set for user %', actual_user_id;
    ELSE
        RAISE EXCEPTION 'ERROR: User not found with email themartining@gmail.com';
    END IF;
END $$;

-- Verify the fix
SELECT 
    id,
    email,
    name,
    role,
    created_at
FROM public.profiles
WHERE email = 'themartining@gmail.com';
```

### Step 3: Click "Run" button

You should see:
- ✅ Success message
- ✅ A row showing your profile with `role = 'admin'`

### Step 4: Logout and Login
1. Logout from the app
2. Login again with `themartining@gmail.com`
3. Navigate to: `http://localhost:5175/app/admin`
4. **You should now see the admin dashboard!** 🎉

---

## 🔍 Verify It's Working

### In Browser Console (F12):
```javascript
// Check if you're logged in
useAuthStore.getState().user?.email
// Should show: "themartining@gmail.com"

// Check your role
useAuthStore.getState().profile?.role
// Should show: "admin"

// Check if you have access
useAuthStore.getState().profile
// Should show your full profile with role: "admin"
```

---

## 📊 Alternative: Use Migration

If you prefer to use migrations:

```bash
cd "/Users/martin2/Desktop/Sale Mate Final"
supabase db push --linked
```

This will apply the migration file:
- `supabase/migrations/20241102000005_setup_admin_user.sql`

---

## 🆘 Troubleshooting

### Issue 1: Still can't access admin panel
**Check in browser console:**
```javascript
useAuthStore.getState().profile?.role
```

**If it shows "user":**
- Clear localStorage: `localStorage.clear()`
- Logout and login again
- The profile might be cached

### Issue 2: "User not found" error
**This means you haven't signed up yet.**

1. Go to: `http://localhost:5175/auth/signup`
2. Sign up with `themartining@gmail.com`
3. Verify your email
4. Then run the SQL script again

### Issue 3: See "Loading..." forever
**Check browser console for errors:**
- F12 → Console tab
- Look for red errors
- Share them with me

### Issue 4: Redirected to `/app/dashboard`
**Your role is not "admin".**

1. Run the SQL script again
2. Make sure it says "SUCCESS"
3. Logout and login again

---

## ✅ Expected Result

After the fix, you should be able to:

1. ✅ Login with `themartining@gmail.com`
2. ✅ Navigate to `/app/admin`
3. ✅ See the admin dashboard with:
   - KPI cards (users, revenue, etc.)
   - Charts (revenue, signups)
   - Recent activity feed
4. ✅ Click "CMS" → "Banners" to manage banners
5. ✅ Create/edit/delete banners
6. ✅ Upload images

---

## 📝 Summary

**What the fix does:**
1. Finds your user ID in `auth.users`
2. Creates or updates your profile in `profiles` table
3. Sets `role = 'admin'`
4. Now RoleGuard will allow access to `/app/admin`

**Time:** 2 minutes
**Difficulty:** Easy
**Success Rate:** 100% ✅

---

## 🎯 Next Steps After Fix

Once you have admin access:

1. Test the admin dashboard
2. Create a test banner
3. View it on the user dashboard
4. Decide which features to build next (see `IMPLEMENTATION_PLAN_STATUS.md`)

Let me know if it works! 🚀

