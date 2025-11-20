# Auto-Create Profiles for All Users

## 🎯 Purpose

This migration ensures that **every user in Supabase Authentication automatically gets a profile** in the `profiles` table. This happens in two ways:

1. **For New Users**: A database trigger automatically creates a profile when a user signs up
2. **For Existing Users**: Creates profiles for any users that don't have one yet

## 📋 What This Migration Does

### 1. Creates/Updates Trigger Function
- Function: `handle_new_user()`
- Runs automatically when a new user is inserted into `auth.users`
- Creates a profile with:
  - Same ID as the user
  - Name from metadata or email prefix
  - Email from user record
  - Phone from metadata (if available)
  - Role from metadata (defaults to 'user')

### 2. Creates/Updates Trigger
- Trigger: `on_auth_user_created`
- Fires: `AFTER INSERT` on `auth.users`
- Executes: `handle_new_user()` function

### 3. Creates Profiles for Existing Users
- Finds all users in `auth.users` without profiles
- Creates profiles for them using available metadata
- Handles missing data gracefully (uses defaults)

### 4. Verification
- Checks if trigger exists
- Counts total users and profiles
- Reports any missing profiles
- Displays success/warning messages

## 🚀 How to Apply

### Option 1: Via Supabase SQL Editor (Recommended)

1. **Open Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/wkxbhvckmgrmdkdkhnqo/sql
   - Or navigate: Project → SQL Editor

2. **Copy Migration SQL:**
   - Open file: `supabase/migrations/20241101000003_auto_create_profiles.sql`
   - Copy **ALL** contents (Ctrl+A, Ctrl+C)

3. **Paste and Run:**
   - Paste into SQL Editor
   - Click **"Run"** button (or Ctrl/Cmd + Enter)
   - Wait for completion

4. **Verify Success:**
   - Should see: `✅ Automatic profile creation configured!`
   - Check the notice messages for status
   - Verify trigger count and profile count

### Option 2: Via Supabase CLI

```bash
cd supabase
supabase db push
```

This will apply all pending migrations including this one.

## ✅ Expected Output

When you run the migration, you should see:

```
✅ Trigger exists: true
✅ Total auth users: X
✅ Total profiles: X
✅ Missing profiles: 0
✅ SUCCESS: All users have profiles and trigger is active!

status: ✅ Automatic profile creation configured!
message: Trigger will create profiles for all new users automatically.
total_profiles: X
total_users: X
```

## 🔍 How It Works

### For New Users (Automatic)

```sql
-- User signs up → Auth creates user in auth.users
-- ↓
-- Trigger fires automatically
-- ↓
-- handle_new_user() function runs
-- ↓
-- Profile created in public.profiles
```

**Example:**
1. User signs up with:
   - Email: `john@example.com`
   - Metadata: `{name: "John Doe", phone: "+1234567890"}`
2. Trigger automatically creates profile:
   ```sql
   INSERT INTO profiles (id, name, email, phone, role)
   VALUES (
     '<user-id>',
     'John Doe',
     'john@example.com',
     '+1234567890',
     'user'
   );
   ```

### For Existing Users (One-Time Fix)

If you have users without profiles, the migration creates them:

```sql
-- Migration finds all auth.users without profiles
-- ↓
-- Creates profiles for each missing user
-- ↓
-- Uses available metadata or sensible defaults
```

## 🛡️ Security Features

1. **SECURITY DEFINER**: Function runs with elevated privileges to bypass RLS
2. **Safe Conflicts**: Uses `ON CONFLICT DO NOTHING` to prevent errors
3. **RLS Compatible**: Works with Row Level Security policies
4. **Graceful Defaults**: Handles missing metadata gracefully

## 📊 What Gets Created

For each user, the profile includes:

| Field | Source | Default |
|-------|--------|---------|
| `id` | `auth.users.id` | Required |
| `name` | `raw_user_meta_data->>'name'` | Email prefix |
| `email` | `auth.users.email` | Required |
| `phone` | `raw_user_meta_data->>'phone'` or `phone` | Empty string |
| `role` | `raw_user_meta_data->>'role'` | 'user' |

## 🔄 After Migration

Once applied:
- ✅ All new signups automatically get profiles
- ✅ All existing users have profiles
- ✅ Trigger is active and working
- ✅ No manual intervention needed

## 🧪 Testing

### Test New Signup

1. Create a new account via your signup page
2. Check `profiles` table - should see new profile
3. Verify all fields are populated correctly

### Verify Existing Users

```sql
-- Check for any users still missing profiles
SELECT u.id, u.email
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
);
-- Should return 0 rows
```

### Verify Trigger

```sql
-- Check trigger exists
SELECT tgname, tgrelid::regclass
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
-- Should return 1 row
```

## 📁 Related Files

- **Migration**: `supabase/migrations/20241101000003_auto_create_profiles.sql`
- **RLS Fix**: `supabase/migrations/20241101000002_fix_profiles_rls_recursion.sql`
- **Restore Script**: `RESTORE_DATABASE_WORKING_STATE.sql` (also includes trigger)

## ⚠️ Important Notes

1. **RLS Policies**: Make sure `Allow profile creation during signup` policy exists (included in RLS fix migration)
2. **Metadata**: The trigger uses `raw_user_meta_data` from auth.users
3. **Idempotent**: Safe to run multiple times - won't create duplicates
4. **No Conflicts**: Uses `ON CONFLICT DO NOTHING` to prevent errors

## 🆘 Troubleshooting

### Trigger Not Firing?

1. **Check trigger exists:**
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

2. **Check function exists:**
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
   ```

3. **Check RLS policy:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Allow profile creation during signup';
   ```

### Users Still Missing Profiles?

Run the migration again - it will create profiles for any remaining users.

### Profile Creation Errors?

1. Check if `profiles` table exists
2. Verify table structure matches expected schema
3. Check RLS policies allow INSERT
4. Review function logs in Supabase dashboard

---

**Status:** Ready to apply! 🚀

This migration ensures all users (new and existing) have profiles automatically.

