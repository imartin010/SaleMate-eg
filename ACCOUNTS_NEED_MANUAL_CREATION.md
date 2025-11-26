# ⚠️ Franchise Accounts Need Manual Creation

## Issue Discovered

When creating auth.users via direct SQL INSERT, Supabase Auth encounters schema errors during login:
```
"Database error querying schema" 
"confirmation_token: converting NULL to string is unsupported"
```

This happens because Supabase Auth (GoTrue) expects certain internal state that can only be set up through the Auth API, not via direct SQL.

## ✅ CEO Account Works

The CEO account works perfectly:
```
Email: coldwellbanker@salemate.com
Password: CWB1234
```

This account was created through Supabase properly and has been updated to 'ceo' role.

## 📝 Solution: Create Franchise Accounts via Supabase Dashboard

### Quick Steps (10 minutes)

1. **Go to Supabase Dashboard**:
   https://supabase.com/dashboard/project/wkxbhvckmgrmdkdkhnqo/auth/users

2. **Click "Add user" 22 times** with these details:

| # | Franchise | Email | Password |
|---|-----------|-------|----------|
| 1 | Advantage | advantage@coldwellbanker.com | CWB2024 |
| 2 | Core | core@coldwellbanker.com | CWB2024 |
| 3 | Elite | elite@coldwellbanker.com | CWB2024 |
| 4 | Empire | empire@coldwellbanker.com | CWB2024 |
| 5 | Experts | experts@coldwellbanker.com | CWB2024 |
| 6 | Gate | gate@coldwellbanker.com | CWB2024 |
| 7 | Hills | hills@coldwellbanker.com | CWB2024 |
| 8 | Hub | hub@coldwellbanker.com | CWB2024 |
| 9 | Infinity | infinity@coldwellbanker.com | CWB2024 |
| 10 | Legacy | legacy@coldwellbanker.com | CWB2024 |
| 11 | Meeting Point | meeting-point@coldwellbanker.com | CWB2024 |
| 12 | New Alex | new-alex@coldwellbanker.com | CWB2024 |
| 13 | Ninety | ninety@coldwellbanker.com | CWB2024 |
| 14 | Peak | peak@coldwellbanker.com | CWB2024 |
| 15 | Platinum | platinum@coldwellbanker.com | CWB2024 |
| 16 | Rangers | rangers@coldwellbanker.com | CWB2024 |
| 17 | Skyward | skyward@coldwellbanker.com | CWB2024 |
| 18 | Stellar | stellar@coldwellbanker.com | CWB2024 |
| 19 | TM | tm@coldwellbanker.com | CWB2024 |
| 20 | Trust | trust@coldwellbanker.com | CWB2024 |
| 21 | Wealth | wealth@coldwellbanker.com | CWB2024 |
| 22 | Winners | winners@coldwellbanker.com | CWB2024 |

**Important**: Check "Auto Confirm User" for each account!

3. **After creating all 22 users, run this SQL** to link them:

```sql
-- Link franchise employees to their franchises
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
      
      RAISE NOTICE '✅ %', franchise_record.name;
    ELSE
      RAISE NOTICE '⚠️ Missing: %@coldwellbanker.com', franchise_record.slug;
    END IF;
  END LOOP;
END $$;
```

## Why This is Needed

Supabase Auth (GoTrue) maintains complex internal state:
- Password hashing with specific algorithms
- Token generation and management
- Session management
- Email confirmation workflows
- Security policies

Direct SQL INSERT bypasses this setup, causing authentication failures.

## ✅ Everything Else is Ready

- Database migrations applied
- RLS policies configured
- Frontend code complete
- CEO account working
- UI styled professionally

Just need to create the 22 franchise accounts through Supabase Dashboard!

## Estimated Time

- Creating 22 users via dashboard: ~10 minutes
- Running linking SQL: ~10 seconds
- Testing: ~5 minutes

**Total: 15 minutes to full deployment** 🚀
