# Team Members Disappearing After Role Change - Fix Guide

## 🐛 Issue Description

When an admin invites someone, they accept, then the admin changes their role to manager, the invited team member disappears from the team page.

## ✅ Fixes Applied

### 1. **Improved useEffect Dependencies**
Added better dependency tracking to ensure team data reloads when role changes:

```typescript
useEffect(() => {
  if (user && profile) {
    const currentIsManager = profile.role === 'manager' || profile.role === 'admin';
    
    if (currentIsManager) {
      fetchTeam();
      fetchInvitations();
    } else {
      fetchTeammates();
      fetchMyInvitations();
    }
  }
}, [user?.id, profile?.role, profile?.id]); // Better dependencies
```

### 2. **Added Manual Refresh Button**
A refresh button is now available in the Team Management section to manually reload team data.

**Location**: Top right of the page, next to "Invite Member" button
**Icon**: Activity/Refresh icon

### 3. **Added Debug Button**
A debug button (🐛) that logs comprehensive information to the browser console.

**What it shows:**
- Current User ID
- Current Profile (name, email, role)
- Is Manager status
- Number of members in store
- Direct database query results

### 4. **Enhanced Logging**
Added console logging throughout the team fetching process to help diagnose issues:

```typescript
console.log('👥 Fetching team for user:', user.user.id);
console.log('📋 Found team member IDs:', idList);
console.log('✅ Fetched team members:', data?.length || 0);
```

## 🔍 Troubleshooting Steps

### Step 1: Check Browser Console
1. Open browser Developer Tools (F12 or Cmd+Option+I)
2. Go to Console tab
3. Click the refresh button (⟳) on the team page
4. Look for log messages:
   - `👥 Fetching team for user:` - Shows your user ID
   - `📋 Found team member IDs:` - Shows IDs of team members
   - `✅ Fetched team members:` - Shows count of members loaded

### Step 2: Use Debug Button
1. Click the 🐛 (debug) button on the team page
2. Check the console for `🔍 === DEBUG INFO ===`
3. Look at the "Direct DB query results"
4. Compare with "Members in store"

**Expected Results:**
- Direct DB query should show your team members
- Members in store should match

**If mismatch:**
- State is not updating properly
- Click refresh button

### Step 3: Check Database Directly
Run the SQL queries in `check_team_data.sql`:

1. Go to Supabase Dashboard → SQL Editor
2. Open `check_team_data.sql`
3. Replace `'themartining@gmail.com'` with your email
4. Run each query section

**What to check:**
- Query 1: Your current role (should be 'manager')
- Query 2: Users with your ID as manager_id (should show team members)
- Query 3: Accepted invitations (should show your sent invitations)

## 🔧 Common Issues & Solutions

### Issue 1: Profile Not Updated
**Symptom:** Old role is cached

**Solution:**
1. Click the refresh icon next to your role in the sidebar
2. Or logout and login again
3. Clear browser cache

### Issue 2: Team Members Exist But Don't Show
**Symptom:** Direct DB query shows members, but UI shows empty

**Solution:**
1. Click the refresh button (⟳)
2. Check console for errors
3. If persists, hard refresh browser (Cmd+Shift+R or Ctrl+Shift+F5)

### Issue 3: RLS Policy Issue
**Symptom:** Database query works in SQL editor but not in app

**Solution:**
Check if there are any Row Level Security policies blocking access:

```sql
-- Run in Supabase SQL Editor
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

If you see role-based restrictions, they may need to be adjusted.

## 📊 Expected Behavior

### For Admin/Manager Viewing Team:
```
1. User logs in with manager or admin role
2. Navigates to /app/team
3. useEffect triggers with profile.role dependency
4. fetchTeam() is called
5. Query: SELECT * FROM profiles WHERE manager_id = {user_id}
6. Results displayed in table
```

### The Query Doesn't Care About YOUR Role:
The query `manager_id = user.user.id` doesn't filter by your role at all.
It just finds all profiles where the `manager_id` column matches your user ID.

**This means:**
- ✅ Works if you're admin
- ✅ Works if you're manager
- ✅ Works if you change roles
- The only thing that matters is: Does the team member have your ID in their `manager_id` column?

## 🧪 Test Scenarios

### Test 1: Role Change
1. Be admin with team members
2. Change role to manager
3. **Expected:** Team members still visible
4. **Action if not:** Click refresh button

### Test 2: New Member Added
1. Invite someone
2. They accept
3. **Expected:** Immediately appear in your team
4. **Action if not:** Click refresh button

### Test 3: After Login
1. Logout
2. Login again
3. Go to team page
4. **Expected:** All team members visible
5. **Action if not:** Check debug button output

## 🔍 Database Schema Check

Your team member should have this data:
```sql
{
  "id": "their-uuid",
  "email": "member@email.com",
  "name": "Member Name",
  "role": "user",
  "manager_id": "YOUR-USER-UUID",  // <- This is the key!
  "created_at": "2024-10-15..."
}
```

If `manager_id` is NULL or different, they won't appear in your team.

## 🛠️ Manual Fix (If Needed)

If a team member's `manager_id` got reset or is wrong:

```sql
-- Find the team member
SELECT id, email, name, manager_id 
FROM profiles 
WHERE email = 'member@email.com';

-- Fix their manager_id
UPDATE profiles 
SET manager_id = 'YOUR-USER-UUID'  -- Replace with your user ID
WHERE email = 'member@email.com';
```

## 🎯 Prevention

To prevent this issue in the future:

1. **Always use the refresh button** after changing roles
2. **Clear browser cache** regularly
3. **Check console logs** if something seems off
4. **Use debug button** to verify state vs database

## 📱 Quick Fix Checklist

When team members disappear:

- [ ] Click refresh button (⟳)
- [ ] Check browser console for errors
- [ ] Click debug button (🐛)
- [ ] Compare "Direct DB query" vs "Members in store"
- [ ] Hard refresh browser (Cmd+Shift+R)
- [ ] Check profile role is correct
- [ ] Run SQL diagnostic queries
- [ ] Check manager_id in database

## 🆘 Still Not Working?

If team members still don't appear:

1. **Collect Debug Info:**
   - Click 🐛 button
   - Copy console output
   - Run SQL queries from `check_team_data.sql`

2. **Check These:**
   - Is your user ID correct?
   - Do team members have your ID in manager_id?
   - Are there any console errors?
   - What does direct DB query return?

3. **Common Causes:**
   - Browser cache (clear it)
   - Stale auth session (logout/login)
   - Database connection issue (check Supabase status)
   - RLS policy blocking (check policies)

## ✅ Success Indicators

You'll know it's working when:

1. ✅ Console shows: `✅ Fetched team members: 1` (or more)
2. ✅ Debug button shows members in "Direct DB query results"
3. ✅ Team table displays members
4. ✅ Stats cards show correct counts

---

**Status:** ✅ Enhanced with debugging tools
**Tools Added:**
- Refresh button
- Debug button
- Enhanced console logging
- SQL diagnostic queries

**Last Updated:** October 15, 2024

