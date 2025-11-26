# 📝 Create Franchise Employee Accounts - Manual Instructions

## ✅ CEO Account Ready

The CEO account already exists and has been updated:
```
Email: coldwellbanker@salemate.com
Password: CWB1234 (existing password)
Role: ✅ Updated to 'ceo'
```

---

## 📋 Create 22 Franchise Employee Accounts

You need to create 22 user accounts via Supabase Dashboard.

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to: https://supabase.com/dashboard/project/wkxbhvckmgrmdkdkhnqo/auth/users
2. Click "Add user" button (22 times)
3. For each franchise, use this pattern:

**Meeting Point**:
- Email: `meeting-point@coldwellbanker.com`
- Password: `CWB2024`
- Auto Confirm Email: ✅ Yes

**Infinity**:
- Email: `infinity@coldwellbanker.com`
- Password: `CWB2024`
- Auto Confirm Email: ✅ Yes

... (repeat for all 22 franchises)

### Complete List of Emails to Create:

```
meeting-point@coldwellbanker.com
infinity@coldwellbanker.com
peak@coldwellbanker.com
elite@coldwellbanker.com
legacy@coldwellbanker.com
empire@coldwellbanker.com
advantage@coldwellbanker.com
core@coldwellbanker.com
gate@coldwellbanker.com
rangers@coldwellbanker.com
ninety@coldwellbanker.com
tm@coldwellbanker.com
winners@coldwellbanker.com
trust@coldwellbanker.com
stellar@coldwellbanker.com
skyward@coldwellbanker.com
hills@coldwellbanker.com
wealth@coldwellbanker.com
new-alex@coldwellbanker.com
platinum@coldwellbanker.com
hub@coldwellbanker.com
experts@coldwellbanker.com
```

All use password: `CWB2024`

---

### Option 2: Via SQL (After Creating Auth Users)

After creating each auth user in Supabase Dashboard, run this SQL to link them:

```sql
-- Run this for EACH franchise after creating their auth user
-- Replace {USER_ID} with the actual UUID from auth.users
-- Replace {FRANCHISE_ID} with the franchise UUID

-- 1. Update profile to franchise_employee role
UPDATE profiles
SET role = 'franchise_employee',
    name = '{Franchise Name} Manager'
WHERE email = '{slug}@coldwellbanker.com';

-- 2. Link user to franchise
UPDATE performance_franchises
SET owner_user_id = (
  SELECT id FROM auth.users WHERE email = '{slug}@coldwellbanker.com'
)
WHERE slug = '{slug}';
```

### Option 3: Automated SQL Script

After creating all 22 auth users in Supabase Dashboard, run this single SQL script:

```sql
-- Update all profiles to franchise_employee and link to franchises
DO $$
DECLARE
  franchise_record RECORD;
  v_user_id UUID;
BEGIN
  FOR franchise_record IN 
    SELECT id, name, slug FROM performance_franchises ORDER BY name
  LOOP
    -- Get user ID from auth.users
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = franchise_record.slug || '@coldwellbanker.com';
    
    IF v_user_id IS NOT NULL THEN
      -- Update profile role
      UPDATE profiles
      SET role = 'franchise_employee',
          name = franchise_record.name || ' Manager'
      WHERE id = v_user_id;
      
      -- Link to franchise
      UPDATE performance_franchises
      SET owner_user_id = v_user_id
      WHERE id = franchise_record.id;
      
      RAISE NOTICE '✅ Linked %: %', franchise_record.name, franchise_record.slug || '@coldwellbanker.com';
    ELSE
      RAISE NOTICE '⚠️  No auth user found for %', franchise_record.slug || '@coldwellbanker.com';
    END IF;
  END LOOP;
END $$;
```

---

## ✅ Verification After Creating Accounts

Run this SQL to verify:

```sql
-- Check CEO account
SELECT email, role FROM profiles WHERE role = 'ceo';
-- Should show: coldwellbanker@salemate.com

-- Check franchise employee accounts
SELECT COUNT(*) as employee_count FROM profiles WHERE role = 'franchise_employee';
-- Should show: 22

-- Check linked franchises
SELECT 
  pf.name,
  pf.slug,
  p.email,
  p.role
FROM performance_franchises pf
LEFT JOIN profiles p ON p.id = pf.owner_user_id
ORDER BY pf.name;
-- Should show all 22 franchises with employee emails
```

---

## 🎯 Quick Test After Setup

### Test CEO:
```
1. Login: coldwellbanker@salemate.com / CWB1234
2. Should redirect to CEO Dashboard
3. Should see all 22 franchises
```

### Test Franchise Employee:
```
1. Login: meeting-point@coldwellbanker.com / CWB2024  
2. Should redirect to Meeting Point franchise dashboard
3. Should NOT see other franchises
```

---

## 📞 Need Help?

If you prefer automated creation, you can:
1. Use Supabase CLI to create users
2. Use the Supabase Management API
3. Create users via Supabase Dashboard (easiest)

The system is ready - just needs the auth users created!
