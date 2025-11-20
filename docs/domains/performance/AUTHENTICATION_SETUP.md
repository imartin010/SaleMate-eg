# Performance Program - Authentication Setup

> **Last Updated**: November 19, 2024  
> **Status**: ✅ CONFIGURED

---

## Overview

The Performance Program (Coldwell Banker franchise tracking) now requires authentication to access.

---

## Access Credentials

### Coldwell Banker Performance Account

**Email**: `coldwellbanker@salemate.com`  
**Password**: `CWB1234`  
**Role**: `user`  
**User ID**: `c3ae3a73-ec43-402b-b8bd-bd0a41de5481`

---

## How to Access

### Local Development

1. **Set test subdomain** (in browser console):
   ```javascript
   localStorage.setItem('test-subdomain', 'performance');
   location.reload();
   ```

2. **OR** Access via subdomain:
   ```
   http://performance.localhost:5173
   ```

3. **Login with credentials**:
   - Email: `coldwellbanker@salemate.com`
   - Password: `CWB1234`

4. **You're in!** Access the performance dashboard

### Production

Visit: `https://performance.salemate-eg.com`

Login with the same credentials.

---

## What Changed

### 1. User Account Created ✅

Created in Supabase:
- Auth user in `auth.users` table
- Profile in `profiles` table
- Password encrypted with bcrypt

### 2. Authentication Added ✅

**Updated Files**:
- `src/main.tsx` - Added AuthProvider to performance subdomain
- `src/app/routes/performanceRoutes.tsx` - Wrapped routes with AuthGuard

**Before**:
```typescript
// No authentication
<ToastProvider>
  <RouterProvider router={activeRouter} />
</ToastProvider>
```

**After**:
```typescript
// Authentication required
<AuthProvider>
  <ToastProvider>
    <RouterProvider router={activeRouter} />
  </ToastProvider>
</AuthProvider>
```

### 3. Route Guards Applied ✅

All performance routes now require authentication:
- `/` - Performance home (requires auth)
- `/franchise/:franchiseSlug` - Franchise dashboard (requires auth)

---

## Testing

### Verify Authentication Works

1. **Clear session** (if needed):
   ```javascript
   localStorage.clear();
   location.reload();
   ```

2. **Try to access performance program**:
   - Should redirect to login page
   - Should show "Login to continue"

3. **Login with credentials**:
   - Email: `coldwellbanker@salemate.com`
   - Password: `CWB1234`

4. **Verify access**:
   - Should redirect to performance dashboard
   - Should show franchise data
   - Should be able to navigate freely

---

## Architecture

```
Performance Subdomain Flow:

1. User visits performance.localhost:5173
   ↓
2. App detects performance subdomain
   ↓
3. Loads performanceRouter (not main router)
   ↓
4. AuthProvider initializes
   ↓
5. AuthGuard checks for session
   ↓
6. If no session → Redirect to /auth/login
   ↓
7. User logs in with coldwellbanker@salemate.com
   ↓
8. AuthGuard allows access
   ↓
9. Performance dashboard loads
```

---

## Security

### Protected Routes

All performance program routes are now protected:
- ✅ Authentication required
- ✅ Session validation
- ✅ Auto-redirect to login if not authenticated

### Password Security

- ✅ Password encrypted with bcrypt
- ✅ Stored securely in Supabase auth.users
- ✅ Never exposed to frontend

---

## Managing Access

### Adding New Users

To add more users to the performance program:

```sql
-- 1. Create auth user
INSERT INTO auth.users (
  instance_id,
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'newuser@example.com',
  crypt('PASSWORD_HERE', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"User Name"}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
)
RETURNING id;

-- 2. Create profile (use the returned ID)
INSERT INTO profiles (
  id,
  email,
  name,
  role,
  phone,
  wallet_balance
) VALUES (
  'USER_ID_FROM_ABOVE',
  'newuser@example.com',
  'User Name',
  'user',
  '+20XXXXXXXXXX',
  0
);
```

### Changing Password

Use Supabase Dashboard or update directly:

```sql
UPDATE auth.users 
SET encrypted_password = crypt('NEW_PASSWORD', gen_salt('bf'))
WHERE email = 'coldwellbanker@salemate.com';
```

---

## Troubleshooting

### Can't Access Performance Program

1. **Clear browser cache and cookies**
2. **Check subdomain** - must be `performance.localhost:5173` or `performance.salemate-eg.com`
3. **Try test subdomain**:
   ```javascript
   localStorage.setItem('test-subdomain', 'performance');
   location.reload();
   ```

### Login Not Working

1. **Verify credentials** - Check for typos
2. **Check user exists**:
   ```sql
   SELECT id, email FROM profiles WHERE email = 'coldwellbanker@salemate.com';
   ```
3. **Reset password if needed** (see above)

### Still Shows Main App

1. **Check subdomain detection**:
   ```javascript
   localStorage.setItem('debug-subdomain', 'true');
   location.reload();
   // Check console logs
   ```

2. **Force performance router**:
   ```javascript
   localStorage.setItem('test-subdomain', 'performance');
   location.reload();
   ```

---

## Summary

✅ **Account Created**: `coldwellbanker@salemate.com` / `CWB1234`  
✅ **Authentication Added**: Performance router requires auth  
✅ **Route Guards**: All routes protected  
✅ **Ready to Use**: Login and access dashboard  

---

**Next Steps**:
1. Try logging in with the credentials
2. Access the performance dashboard
3. Track franchise performance

---

**Status**: ✅ COMPLETE  
**Security**: ✅ PROTECTED  
**Access**: ✅ CONFIGURED

