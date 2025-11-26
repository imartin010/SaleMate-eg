# 🔧 Migrations to Run

## ⚠️ IMPORTANT: Run These Migrations First

Before using the multi-tenant system, you MUST run these 3 migrations in order:

---

## Migration 1: Add CEO and Franchise Employee Roles
**File**: `supabase/migrations/20251126125738_add_ceo_franchise_employee_roles.sql`

**What it does**: Adds `ceo` and `franchise_employee` roles to the profiles table

**How to run**:
```bash
# Option 1: Via Supabase CLI
supabase db push

# Option 2: Via Supabase Dashboard
# 1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
# 2. Copy content of migration file
# 3. Click "Run"

# Option 3: Via MCP Tools
# Use the database MCP connection to execute this migration
```

**Verify**: 
```sql
-- Check if roles were added
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
AND conname = 'profiles_role_check';
-- Should show: role IN ('user', 'manager', 'support', 'admin', 'ceo', 'franchise_employee')
```

---

## Migration 2: Update RLS Policies for CEO
**File**: `supabase/migrations/20251126125800_update_performance_rls_for_ceo.sql`

**What it does**: Updates all performance table RLS policies to allow CEO role access

**Tables affected**:
- performance_franchises
- performance_transactions
- performance_expenses
- performance_commission_schemes
- performance_commission_cuts

**How to run**: Same as Migration 1

**Verify**:
```sql
-- Check policies were updated
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename LIKE 'performance_%'
AND policyname LIKE '%CEO%';
-- Should show multiple policies with "CEO" in the name
```

---

## Migration 3: Create User Accounts
**File**: `supabase/migrations/20251126125900_create_franchise_employees_and_ceo.sql`

**What it does**: 
- Creates CEO account: `ceo@coldwellbanker.com`
- Creates 22 franchise employee accounts
- Links employees to franchises via `owner_user_id`

**Accounts created**:
- 1 CEO account
- 22 franchise employee accounts (one per franchise)

**How to run**: Same as Migration 1

**Verify**:
```sql
-- Check CEO account
SELECT email, id FROM auth.users WHERE email = 'ceo@coldwellbanker.com';

-- Check franchise employee accounts
SELECT COUNT(*) FROM profiles WHERE role = 'franchise_employee';
-- Should return: 22

-- Check franchises linked to employees
SELECT COUNT(*) FROM performance_franchises WHERE owner_user_id IS NOT NULL;
-- Should return: 22
```

---

## 🚨 Troubleshooting

### Migration 3 Fails with "function crypt does not exist"
**Solution**: Install pgcrypto extension first:
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```
Then re-run migration 3.

### Policies Already Exist
**Solution**: Migrations use `DROP POLICY IF EXISTS`, so they can be re-run safely.

### Users Already Exist
**Solution**: Migration uses `ON CONFLICT DO NOTHING`, so it can be re-run safely.

---

## ✅ After Running All Migrations

You should have:
- ✅ 2 new roles added to profiles table
- ✅ All performance RLS policies updated for CEO
- ✅ 1 CEO account created
- ✅ 22 franchise employee accounts created
- ✅ All franchises linked to employees

**Test immediately**:
```bash
# Test CEO login
# Email: ceo@coldwellbanker.com
# Password: CWB_CEO_2024

# Test franchise login
# Email: meeting-point@coldwellbanker.com
# Password: CWB2024
```

---

## 🎉 Ready to Use!

Once migrations are run successfully, the system is fully operational.

See `START_HERE_PERFORMANCE_MULTI_TENANT.md` for usage guide.
