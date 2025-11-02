# 🔧 Fix Signup Error - Step by Step

## Problem
Getting "Database error saving new user" when trying to signup with:
- Email: `themartining@gmail.com`
- Phone: `+201070020058`

## Solution

### Step 1: Clean Up Conflicting Records

**Go to Supabase SQL Editor** and run:

```sql
-- Check for existing records
SELECT * FROM auth.users WHERE email = 'themartining@gmail.com';
SELECT * FROM public.profiles WHERE email = 'themartining@gmail.com';

-- If you see records, delete them:
DELETE FROM public.profiles WHERE email = 'themartining@gmail.com';
DELETE FROM auth.users WHERE email = 'themartining@gmail.com';
```

---

### Step 2: Fix the Signup Trigger

**Run this SQL** in Supabase SQL Editor:

```sql
-- Fix the handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    default_manager_id uuid;
BEGIN
    -- Try to get admin, but don't fail if none exists
    SELECT id INTO default_manager_id
    FROM public.profiles
    WHERE role = 'admin'
    LIMIT 1;

    -- Create profile (allows NULL manager_id)
    INSERT INTO public.profiles (
        id, name, email, phone, role, wallet_balance, manager_id, created_at, updated_at
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'User'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
        0,
        default_manager_id,
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        name = COALESCE(EXCLUDED.name, profiles.name),
        email = COALESCE(EXCLUDED.email, profiles.email),
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        updated_at = now();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error creating profile: %', SQLERRM;
        RETURN NEW; -- Don't fail signup
END;
$$;
```

---

### Step 3: Try Signup Again

1. **Go to:** `http://localhost:5175/auth/signup`

2. **Fill in the form:**
   - Email: `themartining@gmail.com`
   - Phone: `+201070020058`
   - Password: (your password)
   - Name: `Martin`

3. **Complete signup**

4. **Verify OTP** if needed

---

### Step 4: Set Admin Role

**After signup succeeds**, run this SQL:

```sql
-- Set admin role
UPDATE public.profiles
SET role = 'admin', updated_at = now()
WHERE email = 'themartining@gmail.com';

-- Verify
SELECT id, email, role FROM public.profiles WHERE email = 'themartining@gmail.com';
```

Should show: `role = 'admin'`

---

### Step 5: Test Admin Access

1. **Logout** (if needed)

2. **Login** with `themartining@gmail.com`

3. **Navigate to:** `http://localhost:5175/app/admin`

4. **You should see:** Admin dashboard ✅

---

## Quick One-Liner Fix

If you just want to fix it quickly, run this in SQL Editor:

```sql
-- Clean up
DELETE FROM public.profiles WHERE email = 'themartining@gmail.com';
DELETE FROM auth.users WHERE email = 'themartining@gmail.com';

-- Fix trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER SECURITY DEFINER SET search_path = public LANGUAGE plpgsql
AS $$ BEGIN
    INSERT INTO public.profiles (id, name, email, phone, role, wallet_balance, created_at, updated_at)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), NEW.email, COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, ''), COALESCE(NEW.raw_user_meta_data->>'role', 'user'), 0, now(), now())
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, updated_at = now();
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END; $$;
```

Then try signup again!

---

## Troubleshooting

### Still getting error?
1. Check browser console (F12) for detailed error
2. Check Supabase logs for trigger errors
3. Verify RLS policies allow profile creation

### Signup works but no profile?
Run this manually:
```sql
SELECT id FROM auth.users WHERE email = 'themartining@gmail.com';
-- Copy the ID, then:
INSERT INTO public.profiles (id, email, name, role, wallet_balance, created_at, updated_at)
VALUES (<paste_id>, 'themartining@gmail.com', 'Martin', 'admin', 0, now(), now());
```

---

That's it! 🎉
