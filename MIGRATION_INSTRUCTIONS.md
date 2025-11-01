# SQL Migration Instructions - Run Through Chromium

## 🚀 Quick Start

The browser should now be open to the Supabase SQL Editor. Follow these steps:

---

## Step 1: Run First Migration - Schema Fixes

1. **Copy** the entire content from: `supabase/migrations/20241101000000_fix_schema_conflicts.sql`
2. **Paste** it into the SQL Editor in Chromium
3. **Click** "Run" button (or press Ctrl/Cmd + Enter)
4. **Wait** for success message
5. **Verify** no errors appear

**This migration:**
- ✅ Adds missing columns to `leads` table (assigned_to_id, upload_user_id, is_sold, sold_at, cpl_price, platform)
- ✅ Adds missing foreign key constraints
- ✅ Enables RLS on all tables
- ✅ Creates performance indexes

---

## Step 2: Run Second Migration - RLS Policies

1. **Copy** the entire content from: `supabase/migrations/20241101000001_add_basic_rls_policies.sql`
2. **Paste** it into the SQL Editor (clear previous content)
3. **Click** "Run" button
4. **Wait** for success message
5. **Verify** no errors appear

**This migration:**
- ✅ Creates RLS policies for all tables
- ✅ Sets up user access controls
- ✅ Enables admin/support access
- ✅ Protects data with row-level security

---

## Step 3: Run Verification Script

1. **Copy** the entire content from: `supabase/scripts/verify_schema_consistency.sql`
2. **Paste** it into the SQL Editor (clear previous content)
3. **Click** "Run" button
4. **Review** the output in the Messages/Results panel
5. **Look for** ✅ checkmarks (success) or ❌/⚠️ warnings

**This script:**
- ✅ Checks if all columns exist
- ✅ Verifies foreign keys are in place
- ✅ Confirms RLS policies exist
- ✅ Validates table structure consistency

**Expected Output:**
```
✅ All required columns exist in leads table
✅ All required foreign key constraints exist
✅ All tables have RLS policies
✅ RLS is enabled on all required tables
✅ lead_purchase_requests table exists
✅ buyer_user_id column exists
✅ number_of_leads column exists
✅ total_price column exists
```

---

## 📋 File Locations

All SQL files are located in your project:

1. **Migration 1:** `supabase/migrations/20241101000000_fix_schema_conflicts.sql`
2. **Migration 2:** `supabase/migrations/20241101000001_add_basic_rls_policies.sql`
3. **Verification:** `supabase/scripts/verify_schema_consistency.sql`

---

## ⚠️ Important Notes

- **Run in order:** Always run migrations in the order shown above
- **One at a time:** Don't combine multiple migrations in one run
- **Check for errors:** If you see any errors, stop and review
- **Backup first:** These migrations are safe (they check before modifying), but always good practice to have backups

---

## ✅ After Completion

Once all migrations are complete:

1. ✅ Check verification script output - all should be ✅
2. ✅ Test your application
3. ✅ Verify admin panel loads correctly
4. ✅ Test purchase requests functionality
5. ✅ Check browser console for any errors

---

## 🆘 Troubleshooting

If you encounter errors:

1. **Column already exists:** This is fine - migrations check first and skip if exists
2. **Policy already exists:** This is fine - migrations drop and recreate policies
3. **Foreign key constraint errors:** Check if referenced tables exist
4. **Permission errors:** Make sure you're logged in as project owner/admin

---

**Status:** Ready to run! 🚀



