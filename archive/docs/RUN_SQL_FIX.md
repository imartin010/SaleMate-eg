# Run SQL Fix Script

The Supabase CLI connection is having issues, but I've created the migration file. Here's how to apply it:

## Option 1: Run in Supabase Dashboard (Recommended - Fastest)

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy ALL contents from: `supabase/migrations/20251102194435_fix_total_amount_column_name.sql`
6. Paste into the SQL Editor
7. Click **Run** (green button)
8. Wait for success message
9. Refresh your checkout page and try again!

## Option 2: The migration will auto-apply

The migration file is created at:
- `supabase/migrations/20251102194435_fix_total_amount_column_name.sql`

When the Supabase CLI connection is working again, just run:
```bash
supabase db push
```

The migration will automatically apply.

## What the fix does:

✅ Renames `total_price` → `total_amount` (if exists)  
✅ Creates `total_amount` column if missing  
✅ Ensures NOT NULL constraint  
✅ Removes duplicate `total_price` column  
✅ Verifies the fix worked  

## After running:

1. ✅ Refresh checkout page
2. ✅ Try purchase flow again
3. ✅ Error should be gone!

