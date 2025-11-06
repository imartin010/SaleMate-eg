# Schema Conflicts - Fixes Applied

**Date:** 2024-11-01  
**Status:** ✅ **FIXES APPLIED**

## Summary

All critical schema conflicts between the provided schema, database tables, and frontend/backend code have been identified and fixed.

---

## 🔧 Code Fixes Applied

### 1. **Fixed Table Name Inconsistency** ✅

**Issue:** Code was using both `purchase_requests` and `lead_purchase_requests`

**Files Fixed:**
- ✅ `src/components/admin/PurchaseRequests.tsx`
  - Changed all references from `purchase_requests` → `lead_purchase_requests`
  - Updated interface to match schema columns

**Changes:**
```typescript
// Before
.from('purchase_requests')

// After
.from('lead_purchase_requests')
```

---

### 2. **Fixed Column Name Inconsistencies** ✅

**Issue:** Code was using wrong column names in `lead_purchase_requests` table

**Files Fixed:**
- ✅ `src/components/admin/PurchaseRequests.tsx`
  - Changed `user_id` → `buyer_user_id`
  - Changed `quantity` → `number_of_leads`
  - Changed `receipt_url` → `receipt_file_url`
  
- ✅ `src/hooks/admin/useAdminData.ts`
  - Changed `user_id` → `buyer_user_id`
  - Changed `lead_count` → `number_of_leads`
  - Updated foreign key references to use `profiles!buyer_user_id`

**Changes:**
```typescript
// Before
.select('id, user_id, project_id, lead_count...')
.eq('id', request.user_id)

// After
.select('id, buyer_user_id, project_id, number_of_leads...')
.eq('id', request.buyer_user_id)
```

---

## 📄 SQL Migrations Created

### 1. **Schema Conflict Fixes Migration** ✅

**File:** `supabase/migrations/20241101000000_fix_schema_conflicts.sql`

**Adds Missing Columns:**
- ✅ `leads.assigned_to_id` (uuid, FK to profiles)
- ✅ `leads.upload_user_id` (uuid, FK to profiles)
- ✅ `leads.is_sold` (boolean, default false)
- ✅ `leads.sold_at` (timestamp)
- ✅ `leads.cpl_price` (numeric)
- ✅ `leads.platform` (text or enum)

**Adds Missing Foreign Keys:**
- ✅ `leads.buyer_user_id` → `profiles.id`
- ✅ `feedback_history.user_id` → `profiles.id`
- ✅ `lead_purchase_requests.buyer_user_id` → `auth.users.id`

**Enables RLS:**
- ✅ All required tables have RLS enabled

**Creates Indexes:**
- ✅ Performance indexes for frequently queried columns

---

### 2. **Basic RLS Policies Migration** ✅

**File:** `supabase/migrations/20241101000001_add_basic_rls_policies.sql`

**Creates Policies For:**
- ✅ `leads` - Users can view/manage their own leads
- ✅ `lead_purchase_requests` - Users can create/view their requests
- ✅ `lead_batches` - Admins manage, users view
- ✅ `feedback_history` - Users can view/create feedback for their leads
- ✅ `support_cases` - Users create, support staff manage
- ✅ `user_wallets` - Users view their own wallets
- ✅ `wallet_transactions` - Users view their own transactions

---

### 3. **Schema Verification Script** ✅

**File:** `supabase/scripts/verify_schema_consistency.sql`

**Checks:**
- ✅ Missing columns in `leads` table
- ✅ Missing foreign key constraints
- ✅ Missing RLS policies
- ✅ RLS enabled status
- ✅ Table name consistency
- ✅ Column name consistency in `lead_purchase_requests`

---

## 📋 Next Steps

### 1. **Apply Database Migrations**

Run the migrations in order:

```bash
# Option 1: Using Supabase CLI (recommended)
cd supabase
supabase db push

# Option 2: Manual application
# Copy each migration file content and run in Supabase SQL Editor
```

**Migration Order:**
1. `20241101000000_fix_schema_conflicts.sql` - Fixes schema issues
2. `20241101000001_add_basic_rls_policies.sql` - Adds RLS policies

### 2. **Verify Schema Consistency**

Run the verification script:

```sql
-- In Supabase SQL Editor, run:
-- supabase/scripts/verify_schema_consistency.sql
```

Review the output and fix any remaining issues.

### 3. **Test Application**

After applying migrations:

1. ✅ Test admin panel loads correctly
2. ✅ Test purchase requests functionality
3. ✅ Test leads CRUD operations
4. ✅ Test RLS policies (try accessing data as different users)
5. ✅ Check browser console for any errors

### 4. **Review RLS Policies**

The basic RLS policies have been created, but you may need to customize them based on:
- Your specific business requirements
- Team hierarchy needs (manager access to team member data)
- Partner access rules
- Any custom access patterns

---

## ✅ Verification Checklist

- [x] Code uses correct table name (`lead_purchase_requests`)
- [x] Code uses correct column names (`buyer_user_id`, `number_of_leads`, `receipt_file_url`)
- [x] SQL migration to add missing columns created
- [x] SQL migration to add foreign keys created
- [x] SQL migration to add RLS policies created
- [x] Schema verification script created
- [ ] Migrations applied to database
- [ ] Verification script run and passed
- [ ] Application tested and working

---

## 📊 Conflict Resolution Summary

| Conflict Type | Status | Resolution |
|--------------|--------|------------|
| Table name mismatch | ✅ Fixed | Updated code to use `lead_purchase_requests` |
| Column name mismatch | ✅ Fixed | Updated to use `buyer_user_id`, `number_of_leads`, `receipt_file_url` |
| Missing columns in leads | ✅ Fixed | SQL migration adds all missing columns |
| Missing foreign keys | ✅ Fixed | SQL migration adds all missing FKs |
| Missing RLS policies | ✅ Fixed | SQL migration adds basic policies |
| Edge Functions | ✅ Verified | All Edge Functions use correct table names |

---

## 🔍 Files Modified

### Code Files:
1. `src/components/admin/PurchaseRequests.tsx` - Fixed table/column names
2. `src/hooks/admin/useAdminData.ts` - Fixed column names and foreign key references

### SQL Migrations:
1. `supabase/migrations/20241101000000_fix_schema_conflicts.sql` - Schema fixes
2. `supabase/migrations/20241101000001_add_basic_rls_policies.sql` - RLS policies
3. `supabase/scripts/verify_schema_consistency.sql` - Verification script

### Documentation:
1. `SCHEMA_CONFLICT_ANALYSIS.md` - Detailed conflict analysis
2. `SCHEMA_FIXES_APPLIED.md` - This file (summary of fixes)

---

## ⚠️ Important Notes

1. **Backup First:** Always backup your database before applying migrations
2. **Test Environment:** Test migrations in a development environment first
3. **Review Policies:** Customize RLS policies based on your specific requirements
4. **Team Hierarchy:** Consider adding policies for manager access to team member data
5. **Partner Access:** Add policies if partners need special access

---

## 📞 Support

If you encounter any issues:

1. Check the verification script output
2. Review the conflict analysis document
3. Check Supabase logs for SQL errors
4. Verify all migrations were applied successfully

---

**Status:** ✅ **READY FOR DEPLOYMENT** (after migrations are applied)







