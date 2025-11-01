# Fix Infinite Recursion in Profiles RLS Policies

## 🐛 Problem

The login page at `/auth/login` was returning **500 errors** when trying to query the `profiles` table. This was caused by **infinite recursion** in Row Level Security (RLS) policies.

**Root Cause:**
The RLS policies for the `profiles` table were querying the `profiles` table itself to check user roles, creating an infinite loop:
- Policy tries to SELECT from profiles
- SELECT triggers RLS policy check
- Policy tries to SELECT from profiles again
- **Infinite recursion!** 🔄

**Error in Browser Console:**
```
Failed to load resource: the server responded with a status of 500
@ https://wkxbhvckmgrmdkdkhnqo.supabase.co/rest/v1/profiles?select=*&id=eq.530745fe-2836-4195-b8ca-00ea2dd0c578
```

## ✅ Solution

Created a **SECURITY DEFINER function** that bypasses RLS when checking user roles. This prevents the infinite recursion.

**Migration File:** `supabase/migrations/20241101000002_fix_profiles_rls_recursion.sql`

### What the Fix Does:

1. **Creates Helper Function** `is_user_role()`:
   - Uses `SECURITY DEFINER` to bypass RLS
   - Safely checks user role without triggering recursion
   - Can be used in any RLS policy

2. **Replaces Recursive Policies**:
   - Removes policies that query `profiles` within `profiles` RLS
   - Creates new policies using the helper function
   - Maintains same security model (users see own profile, admins see all)

3. **Preserves Functionality**:
   - Users can still view/update their own profiles
   - Admins/support can view/update all profiles
   - Signup still works (INSERT policy unchanged)

## 🚀 How to Apply the Fix

### Option 1: Via Supabase SQL Editor (Recommended)

1. **Open Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/wkxbhvckmgrmdkdkhnqo/sql
   - Or use the SQL Editor link in your Supabase dashboard

2. **Copy the Migration SQL:**
   - Open file: `supabase/migrations/20241101000002_fix_profiles_rls_recursion.sql`
   - Copy **ALL** the contents (Ctrl+A, Ctrl+C)

3. **Paste and Run:**
   - Paste into the SQL Editor
   - Click **"Run"** button (or press Ctrl/Cmd + Enter)
   - Wait for success message

4. **Verify:**
   - Should see: `✅ Profiles RLS policies fixed - no more infinite recursion!`
   - Should see 5 policies listed for `profiles` table

### Option 2: Via Supabase CLI

```bash
cd supabase
supabase db push
```

This will apply all pending migrations including the fix.

## 📋 What Changed

### Before (Problematic):
```sql
CREATE POLICY "Admins can view all profiles"
    ON public.profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles  -- ❌ Recursion!
            WHERE id = auth.uid() AND role IN ('admin', 'support', 'manager')
        )
    );
```

### After (Fixed):
```sql
CREATE FUNCTION public.is_user_role(user_id uuid, allowed_roles text[])
RETURNS boolean SECURITY DEFINER ...  -- ✅ Bypasses RLS

CREATE POLICY "Admins can view all profiles"
    ON public.profiles
    FOR SELECT
    USING (
        auth.uid() = id  -- Users can see own
        OR public.is_user_role(auth.uid(), ARRAY['admin', 'support', 'manager'])  -- ✅ No recursion!
    );
```

## ✅ Verification

After applying the fix:

1. **Refresh Login Page:**
   - Go to: http://localhost:5173/auth/login
   - Check browser console - should see no more 500 errors

2. **Test Login:**
   - Try logging in with valid credentials
   - Should work without errors

3. **Check Policies:**
   ```sql
   SELECT policyname, cmd, qual
   FROM pg_policies 
   WHERE tablename = 'profiles'
   ORDER BY policyname;
   ```
   Should return 5 policies without recursion.

## 📁 Files Modified

1. **Created:**
   - `supabase/migrations/20241101000002_fix_profiles_rls_recursion.sql` (new migration)

2. **Updated:**
   - `RESTORE_DATABASE_WORKING_STATE.sql` (uses same fix for future restores)

## 🔄 Next Steps

1. ✅ Apply the migration (see instructions above)
2. ✅ Refresh the login page
3. ✅ Test login functionality
4. ✅ Verify no more 500 errors in console

## 🎯 Expected Result

- ✅ No more infinite recursion errors
- ✅ Login page loads without 500 errors
- ✅ Users can successfully log in
- ✅ Profiles queries work correctly
- ✅ Admin access still works

---

**Status:** Ready to apply! 🚀

Apply the migration file in Supabase SQL Editor to fix the infinite recursion issue.

