# Deploy Support Ticket System - Quick Start

## 🚀 Quick Deployment Steps

### Step 1: Apply Database Migration (REQUIRED)

Open Supabase SQL Editor and run:

```sql
-- Navigate to your Supabase project
-- Go to SQL Editor
-- Copy and paste ALL contents from:
supabase/migrations/setup_support_cases_rls.sql

-- Then click "RUN"
```

**What this does:**
- Enables Row Level Security on support_cases table
- Creates policies so users see only their own tickets
- Creates policies so support staff see all tickets
- Adds indexes for better performance
- Creates safe assignment function

### Step 2: Verify Database Setup

Run this query to check if RLS is enabled:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'support_cases';
```

Should return `rowsecurity = true`

### Step 3: Deploy Frontend (Already Done! ✅)

The code is already built and ready. Just deploy as normal:

```bash
# If using Vercel, Netlify, or similar:
git add .
git commit -m "Add support ticket system"
git push origin main

# Your deployment platform will auto-deploy
```

### Step 4: Test It!

1. **Test as User**:
   - Login as a regular user
   - Go to `/app/support`
   - Create a test ticket
   - Verify you see only your own tickets

2. **Test as Support**:
   - Login as a support staff member
   - Go to `/app/support`
   - Verify you see ALL tickets from all users
   - Try updating a ticket status
   - Try assigning a ticket to yourself

## ✅ What's Already Done

- ✅ Frontend code implemented
- ✅ Components created (UserSupportView, SupportAgentView)
- ✅ Store connected to Supabase
- ✅ Routes updated to allow all roles
- ✅ Navigation updated (Support link visible to all)
- ✅ Types updated with priority and closed status
- ✅ Build verified (no errors)

## ⚠️ What You MUST Do

- ⚠️ **IMPORTANT**: Run the RLS migration in Supabase (Step 1 above)
  - Without this, the security won't work properly
  - Users might see other users' tickets
  - Support staff might not see all tickets

## 🎯 Expected Behavior After Deployment

### For Users and Managers:
- Can access `/app/support`
- See "Support" link in sidebar and bottom navigation
- Can create new tickets
- Can see ONLY their own tickets
- Can search and filter their tickets
- See metrics for their own tickets

### For Support Staff and Admins:
- Can access `/app/support`
- See "Support" link in sidebar and bottom navigation
- See ALL tickets from ALL users
- Can update any ticket's status
- Can update any ticket's priority
- Can assign tickets to themselves
- Can filter by status, priority, assignment
- See platform-wide metrics

## 📊 Visual Differences Between Views

### User View (Regular Users & Managers):
```
┌─────────────────────────────────────────┐
│  My Support Tickets                     │
│  Track and manage your support cases    │
│                                          │
│  [New Ticket]                            │
│                                          │
│  📊 Metrics (Personal)                   │
│  [3 Open] [1 In Progress] [5 Resolved]  │
│                                          │
│  🔍 Search: ___________                  │
│  [All] [Open] [In Progress] [Resolved]  │
│                                          │
│  📋 Your Tickets:                        │
│  ┌────────────────────────────────────┐ │
│  │ ⚠️ High: Can't access dashboard    │ │
│  │ Status: In Progress                │ │
│  │ Assigned to: John (Support)        │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Support View (Support Staff & Admins):
```
┌──────────────────────────────────────────────────┐
│  Support Management Panel                        │
│  View and manage all support tickets             │
│                                                   │
│  📊 Platform Metrics                              │
│  [12 Open] [8 In Prog] [45 Resolved] [3 My] [2 Urgent] │
│                                                   │
│  🔍 Search: ___________                           │
│  Status: [All] [Open] [In Prog] [Resolved]       │
│  Assign: [All] [My Tickets] [Unassigned]         │
│  Priority: [All] [Urgent] [High] [Med] [Low]     │
│                                                   │
│  📋 All Tickets (showing 15):                     │
│  ┌─────────────────────────────────────────────┐ │
│  │ 🔴 Urgent: Server down                      │ │
│  │ By: Alice (user) · 5 min ago                │ │
│  │ Status: [Open ▼] Priority: [Urgent ▼]      │ │
│  │ [Assign to Me] [Reply]                      │ │
│  ├─────────────────────────────────────────────┤ │
│  │ 🟠 High: Can't access dashboard             │ │
│  │ By: Bob (manager) · 2 hours ago             │ │
│  │ Assigned to: John                           │ │
│  │ Status: [In Progress ▼] Priority: [High ▼] │ │
│  │ [Reply]                                     │ │
│  └─────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

## 🔐 Security Verification

After deployment, verify security is working:

### Test 1: User Isolation
```sql
-- Login as User A
-- Run this query in Supabase SQL Editor
SELECT COUNT(*) FROM support_cases;
-- Should only return User A's ticket count

-- Login as User B
-- Run the same query
-- Should only return User B's ticket count
-- (User B should NOT see User A's tickets)
```

### Test 2: Support Access
```sql
-- Login as Support Staff
-- Run this query
SELECT COUNT(*) FROM support_cases;
-- Should return ALL tickets across all users
```

### Test 3: Creation
```sql
-- Any authenticated user should be able to create
INSERT INTO support_cases (created_by, subject, description)
VALUES (auth.uid(), 'Test Ticket', 'This is a test');
-- Should succeed
```

## 📞 Need Help?

If something doesn't work:

1. **Check Supabase Logs**:
   - Go to Supabase Dashboard → Database → Logs
   - Look for any RLS policy errors

2. **Verify RLS Policies**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'support_cases';
   ```
   Should return 5-6 policies

3. **Check User Role**:
   ```sql
   SELECT id, email, role FROM profiles WHERE id = auth.uid();
   ```
   Make sure the role is set correctly

4. **Browser Console**:
   - Open browser DevTools (F12)
   - Check Console for any errors
   - Check Network tab for failed API calls

## 🎉 That's It!

Once you run the RLS migration, the support system is fully operational!

Users can start creating tickets immediately, and support staff can start managing them.

For detailed documentation, see:
- `SUPPORT_TICKET_SYSTEM_GUIDE.md` - Full feature documentation
- `SUPPORT_SYSTEM_IMPLEMENTATION_SUMMARY.md` - What was built

**Happy supporting!** 🎧

