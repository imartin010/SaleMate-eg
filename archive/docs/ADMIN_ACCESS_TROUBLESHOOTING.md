# Admin Access Troubleshooting

## Issue: Admin Cannot Access Admin Panel

### What I Fixed:
1. ✅ RoleGuard now waits for profile to load before checking
2. ✅ Added debug logging to console
3. ✅ Fixed fallback path from '/dashboard' to '/app/dashboard'
4. ✅ Restructured routes so AdminLayout doesn't conflict with AppLayout

---

## Quick Fix Steps:

### Step 1: Refresh the Page
```
- Hard reload: Cmd+Shift+R (Mac) or Ctrl+Shift+F5 (Windows)
- Clear localStorage: Open console → localStorage.clear() → Reload
```

### Step 2: Check Browser Console
```
1. Open http://localhost:5174/app/admin
2. Open browser DevTools (F12)
3. Go to Console tab
4. Look for "RoleGuard Check" log
```

**You should see:**
```javascript
RoleGuard Check: {
  userRole: "admin",
  allowedRoles: ["admin"],
  hasAccess: true
}
```

**If you see:**
```javascript
userRole: "user"  // WRONG!
```
→ Your profile role needs to be updated in database

**If you see:**
```javascript
Access denied: User role "user" not in allowed roles: ["admin"]
```
→ Confirmed: Need to update profile.role in database

### Step 3: Verify Profile Role in Database

**Go to Supabase:**
https://supabase.com/dashboard/project/wkxbhvckmgrmdkdkhnqo/editor

**Steps:**
1. Click "profiles" table in sidebar
2. Find your user row
3. Check the "role" column
4. If it says "user" → Click to edit → Change to "admin"
5. Save changes

**Your admin user should be:**
- ID: `11111111-1111-1111-1111-111111111111`
- Email: `themartining@gmail.com`
- Role: `admin` ← Must be exactly this

### Step 4: Logout and Login Again

After changing role in database:
```
1. Logout from the app
2. Login again
3. Try accessing /app/admin
4. Should work now!
```

---

## Quick SQL Fix (Run in Supabase SQL Editor)

If you want to update via SQL:

```sql
-- Check current role
SELECT id, email, role FROM profiles WHERE email = 'themartining@gmail.com';

-- Update to admin
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'themartining@gmail.com';

-- Verify the change
SELECT id, email, role FROM profiles WHERE email = 'themartining@gmail.com';
```

**Expected result:**
```
id: 11111111-1111-1111-1111-111111111111
email: themartining@gmail.com
role: admin  ✅
```

---

## Alternative: Check Auth Store

**In browser console:**
```javascript
// Check if profile loaded
useAuthStore.getState().profile

// Should show:
// {
//   id: "11111111-1111-1111-1111-111111111111",
//   name: "Martin",
//   email: "themartining@gmail.com",
//   role: "admin",  ← This is critical!
//   ...
// }
```

**If role is not "admin":**
1. Update in Supabase profiles table
2. Logout and login again
3. Check console.log again

---

## Common Issues & Solutions

### Issue 1: "Access Denied" in console
**Cause:** Role is not "admin" in database
**Fix:** Update profiles table, set role = 'admin'

### Issue 2: Infinite redirect loop
**Cause:** RoleGuard rejecting but redirect not working
**Fix:** Clear localStorage, logout, login again

### Issue 3: Blank page / No error
**Cause:** JavaScript error preventing render
**Fix:** Check browser console for errors, share with me

### Issue 4: "Loading..." forever
**Cause:** Profile not loading from database
**Fix:** Check Supabase connection, refresh profile

---

## Debug Checklist

Run through these in browser console:

```javascript
// 1. Check if logged in
const user = useAuthStore.getState().user;
console.log('User:', user?.email);

// 2. Check profile
const profile = useAuthStore.getState().profile;
console.log('Profile:', profile);
console.log('Role:', profile?.role);

// 3. Check if admin
console.log('Is Admin:', profile?.role === 'admin');

// 4. Manually refresh profile
await useAuthStore.getState().refreshProfile();
console.log('Profile after refresh:', useAuthStore.getState().profile);
```

---

## Expected Flow:

```
1. Login → Auth succeeds
2. Auth store loads profile from database
3. Profile.role = 'admin'
4. Navigate to /app/admin
5. RoleGuard checks: profile.role === 'admin' ✅
6. AdminLayout renders
7. Admin panel displays
```

**If fails at step 5:**
- Profile role is not 'admin'
- Update in database
- Logout and login again

---

## Quick Test After Fix:

```bash
# 1. Update role in database (if needed)
# 2. Clear browser storage
localStorage.clear()

# 3. Reload page
window.location.href = '/auth/login'

# 4. Login again

# 5. Try admin panel
window.location.href = '/app/admin'

# 6. Check console for "RoleGuard Check" log
```

---

## What to Tell Me:

**When you try to access /app/admin, what happens?**

1. Blank page?
2. Redirects to /app/dashboard?
3. Shows "Loading..." forever?
4. Shows an error message?
5. What does the browser console say?

**Also check:**
- What is your profile.role in the database?
- What does console.log show for "RoleGuard Check"?

Share this info and I'll fix it immediately! 🔧

