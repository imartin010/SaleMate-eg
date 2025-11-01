# Schema Conflict Analysis & Resolution

**Date:** 2024-11-01  
**Purpose:** Identify and resolve conflicts between provided schema, database tables, policies, and frontend/backend code

## 🚨 Critical Conflicts Found

### 1. **Table Name Conflicts**

#### Issue: `purchase_requests` vs `lead_purchase_requests`
- **Schema shows:** `lead_purchase_requests` table
- **Code uses:**
  - `purchase_requests` in `src/components/admin/PurchaseRequests.tsx`
  - `lead_purchase_requests` in `src/pages/Admin/PurchaseRequestsManager.tsx`
  - `lead_purchase_requests` in `src/hooks/admin/useAdminData.ts`

**Resolution:**
- ✅ Use `lead_purchase_requests` as the canonical table name (matches schema)
- ⚠️ Update `src/components/admin/PurchaseRequests.tsx` to use `lead_purchase_requests`
- ⚠️ Remove or migrate `purchase_requests` table if it exists

**Files to Fix:**
- `src/components/admin/PurchaseRequests.tsx` (lines 56, 73, 169)

---

#### Issue: `deal-attachments` (storage) vs `deal_attachments` (table)
- **Storage bucket:** `deal-attachments` (with hyphen)
- **Database table:** `deal_attachments` (with underscore)
- **Edge Function:** Uses both correctly

**Resolution:**
- ✅ This is intentional - storage buckets can have hyphens, tables cannot
- ✅ Keep as is - no conflict

---

### 2. **Column Name Conflicts in `lead_purchase_requests`**

#### Issue: `buyer_user_id` vs `user_id`
- **Schema shows:** `buyer_user_id uuid NOT NULL`
- **Code uses:**
  - `user_id` in `src/hooks/admin/useAdminData.ts` line 64
  - `buyer_user_id` in `src/pages/Admin/PurchaseRequestsManager.tsx` line 49 (foreign key reference)

**Resolution:**
- ✅ Schema is correct: column is `buyer_user_id`
- ⚠️ Update code to use `buyer_user_id` consistently

**Files to Fix:**
- `src/hooks/admin/useAdminData.ts` - Change `user_id` to `buyer_user_id` in select queries
- Verify all foreign key references use correct column names

---

### 3. **Missing Columns in `leads` Table Schema**

#### Issue: Schema missing columns that code uses
- **Schema provided shows:**
  - ✅ `buyer_user_id`
  - ✅ `batch_id`
  - ✅ Basic client fields
  
- **Schema missing (but code uses):**
  - ❌ `assigned_to_id` - Used in `src/store/leads.ts`
  - ❌ `upload_user_id` - Used in multiple files
  - ❌ `is_sold` - Used in TypeScript types
  - ❌ `sold_at` - Used in TypeScript types
  - ❌ `cpl_price` - Used in TypeScript types
  - ❌ `platform` - May be missing from provided schema

**Resolution:**
- ⚠️ Update database schema to include missing columns OR
- ⚠️ Update code to remove references to missing columns
- **Recommended:** Add missing columns to schema

**Required Schema Update:**
```sql
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS assigned_to_id uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS upload_user_id uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS is_sold boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sold_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS cpl_price numeric,
ADD COLUMN IF NOT EXISTS platform text; -- or use enum
```

---

### 4. **Missing Columns in `lead_purchase_requests`**

#### Issue: Schema shows `buyer_user_id` but code queries may reference wrong columns
- **Schema shows:**
  - ✅ `buyer_user_id uuid NOT NULL`
  - ✅ `number_of_leads integer NOT NULL`
  - ✅ `cpl_price numeric NOT NULL`
  - ✅ `total_price numeric NOT NULL`
  - ✅ `payment_method USER-DEFINED NOT NULL`
  - ✅ `receipt_file_url text NOT NULL`
  - ✅ `status USER-DEFINED NOT NULL DEFAULT 'pending'`

- **Code queries may use:**
  - `user_id` instead of `buyer_user_id`
  - `lead_count` instead of `number_of_leads`
  - Wrong foreign key references

**Resolution:**
- ⚠️ Verify all code uses correct column names from schema
- ⚠️ Update TypeScript types to match schema

---

### 5. **RLS Policy Conflicts**

#### Issue: Missing or inconsistent RLS policies

**Tables with RLS policies found in migrations:**
- ✅ `team_invitations` - Has policies (in migration file)
- ✅ `profiles` - Has policies (in RESTORE_DATABASE_WORKING_STATE.sql)

**Tables that may need RLS policies (from schema):**
- ⚠️ `leads` - Need to verify policies exist
- ⚠️ `lead_purchase_requests` - Need to verify policies exist
- ⚠️ `lead_batches` - Need to verify policies exist
- ⚠️ `feedback_history` - Need to verify policies exist
- ⚠️ `support_cases` - Need to verify policies exist
- ⚠️ `support_case_replies` - Need to verify policies exist
- ⚠️ `user_wallets` - Need to verify policies exist
- ⚠️ `wallet_transactions` - Need to verify policies exist

**Required Action:**
1. Check Supabase dashboard for existing policies
2. Create missing policies based on access patterns in code
3. Ensure policies match frontend/backend access requirements

---

### 6. **Foreign Key Constraint Issues**

#### Issue: Missing or incorrect foreign key constraints

**From provided schema:**
- ✅ `leads.project_id` → `projects.id`
- ✅ `leads.batch_id` → `lead_batches.id`
- ⚠️ `leads.buyer_user_id` - No FK constraint shown (should reference `profiles.id` or `auth.users.id`)
- ⚠️ `feedback_history.lead_id` → `leads.id`
- ⚠️ `feedback_history.user_id` - No FK constraint (should reference `profiles.id`)
- ✅ `lead_purchase_requests.project_id` → `projects.id`
- ⚠️ `lead_purchase_requests.buyer_user_id` - No FK constraint shown

**Resolution:**
- ⚠️ Add missing foreign key constraints
- ⚠️ Verify all foreign keys match between schema and database

---

### 7. **Edge Function Table References**

#### Functions that reference tables (verify consistency):
- ✅ `send-team-invitation` - Uses `profiles`, `team_invitations` correctly
- ✅ `assign_leads` - Uses `profiles`, `leads` correctly
- ✅ `bulk-lead-upload` - Uses `profiles`, `projects`, `lead_batches`, `leads` correctly
- ⚠️ `auth-otp` - Uses `otp_codes` (not in provided schema - may be missing)
- ⚠️ `upload-deal-files` - Uses `deal_attachments` (not in provided schema)
- ⚠️ `deals` - Uses `deals` table (not in provided schema)
- ⚠️ `admin-marketplace` - Uses `lead_purchase_requests` correctly
- ⚠️ `marketplace` - Uses `leads`, `lead_purchase_requests` correctly
- ⚠️ `recalc_analytics` - Uses `lead_analytics_mv` (materialized view, not in schema)

**Tables referenced in functions but not in provided schema:**
- `otp_codes` - OTP authentication system
- `deals` - Deal management system
- `deal_attachments` - Deal file attachments
- `orders` - Order management (used in payment_webhook)
- `lead_analytics_mv` - Materialized view for analytics

**Resolution:**
- ⚠️ Verify these tables exist in database
- ⚠️ Add to schema documentation if they're part of the system

---

## 📋 Action Items

### Immediate Fixes Required:

1. **Fix table name inconsistency:**
   - [ ] Update `src/components/admin/PurchaseRequests.tsx` to use `lead_purchase_requests`

2. **Fix column name inconsistency:**
   - [ ] Update `src/hooks/admin/useAdminData.ts` to use `buyer_user_id` instead of `user_id`

3. **Update schema or code for leads table:**
   - [ ] Either add missing columns (`assigned_to_id`, `upload_user_id`, `is_sold`, `sold_at`, `cpl_price`, `platform`) to database
   - [ ] OR remove code references to these columns if not needed

4. **Verify and add RLS policies:**
   - [ ] Check all tables have RLS enabled
   - [ ] Create missing policies based on access patterns

5. **Add missing foreign key constraints:**
   - [ ] Add FK for `leads.buyer_user_id` → `profiles.id`
   - [ ] Add FK for `feedback_history.user_id` → `profiles.id`
   - [ ] Add FK for `lead_purchase_requests.buyer_user_id` → `profiles.id` or `auth.users.id`

6. **Document missing tables:**
   - [ ] Add `otp_codes`, `deals`, `deal_attachments`, `orders` to schema documentation
   - [ ] Or confirm they should be removed if not needed

---

## ✅ Tables Verified (No Conflicts)

These tables appear consistent between schema and code:
- ✅ `profiles` - Correctly used throughout
- ✅ `projects` - Correctly used throughout
- ✅ `developers` - Correctly used throughout
- ✅ `partners` - Correctly used throughout
- ✅ `project_partner_commissions` - Correctly used
- ✅ `team_invitations` - Correctly used with proper migrations
- ✅ `support_cases` - Correctly used
- ✅ `support_case_replies` - Correctly used
- ✅ `user_wallets` - Correctly used
- ✅ `wallet_transactions` - Correctly used
- ✅ `lead_batches` - Correctly used
- ✅ `feedback_history` - Correctly used (but needs FK verification)
- ✅ `salemate-inventory` - Correctly used (note: hyphen in name is correct)

---

## 🔍 Verification Steps

1. **In Supabase Dashboard:**
   - Go to Table Editor → Check all table names match
   - Go to Database → Tables → Verify columns match schema
   - Go to Authentication → Policies → Verify all tables have policies
   - Go to Database → Functions → Verify all functions exist

2. **In Codebase:**
   - Run: `grep -r "\.from\(" src/ | grep -E "(purchase_requests|lead_purchase_requests)"`
   - Run: `grep -r "user_id\|buyer_user_id" src/ | grep lead_purchase`
   - Run: `grep -r "assigned_to_id\|upload_user_id" src/ | grep leads`

3. **Test Database Queries:**
   - Verify all queries from frontend execute successfully
   - Check for foreign key constraint violations
   - Test RLS policies allow appropriate access

---

## 📝 Notes

- The provided schema appears to be a **reference schema** and may not include all tables/columns in the actual database
- Some tables referenced in code may be legacy or planned features
- Materialized views and database functions are not shown in the provided schema
- Always verify against the actual Supabase database schema

---

**Status:** ⚠️ **CONFLICTS DETECTED** - Requires resolution before deployment


