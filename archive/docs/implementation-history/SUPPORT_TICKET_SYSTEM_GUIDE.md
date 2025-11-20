# Support Ticket System - Implementation Guide

## Overview

The support ticket system allows users, managers, and support staff to create, track, and resolve support cases. The system features role-based views:

- **Users & Managers**: Can create tickets and view only their own tickets
- **Support Staff & Admins**: Can view all tickets across the platform and manage them

## Features

### For All Users (User, Manager, Support, Admin)

1. **Access to /app/support** - All authenticated users can access the support page
2. **Create Support Tickets** - Submit new support requests with:
   - Subject
   - Description
   - Priority (Low, Medium, High, Urgent)
3. **Track Tickets** - View status updates and progress on submitted tickets
4. **Search & Filter** - Search tickets and filter by status

### For Support Staff & Admins Only

1. **View All Tickets** - See tickets from all users across the platform
2. **Update Ticket Status** - Change status (Open, In Progress, Resolved, Closed)
3. **Update Priority** - Adjust ticket priority
4. **Assign Tickets** - Assign tickets to themselves or other support staff
5. **Advanced Filtering** - Filter by status, priority, and assignment
6. **Metrics Dashboard** - View support metrics (open cases, in progress, resolved, etc.)

## Architecture

### Database Schema

Table: `support_cases`

```sql
- id: UUID (Primary Key)
- created_by: UUID (Foreign Key to profiles)
- assigned_to: UUID (Foreign Key to profiles, nullable)
- subject: TEXT
- description: TEXT
- status: ENUM ('open', 'in_progress', 'resolved', 'closed')
- priority: ENUM ('low', 'medium', 'high', 'urgent')
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Row Level Security (RLS)

The system uses RLS policies to ensure data security:

1. **Users/Managers**: Can only SELECT their own tickets (`created_by = auth.uid()`)
2. **Support/Admin**: Can SELECT, UPDATE all tickets
3. **All authenticated users**: Can INSERT (create) tickets
4. **Only admins**: Can DELETE tickets

### Components

1. **UserSupportView** (`src/components/support/UserSupportView.tsx`)
   - View for regular users and managers
   - Shows only user's own tickets
   - Can create new tickets
   - Simplified interface focused on tracking personal cases

2. **SupportAgentView** (`src/components/support/SupportAgentView.tsx`)
   - View for support staff and admins
   - Shows all tickets across the platform
   - Can update status, priority, and assignments
   - Advanced filtering and metrics

3. **SupportPanel** (`src/pages/Support/SupportPanel.tsx`)
   - Main container component
   - Routes to appropriate view based on user role
   - Handles data fetching and state management

### Store

`src/store/support.ts` - Zustand store for support ticket state management

Key methods:
- `fetchUserCases(userId)` - Fetch tickets for a specific user
- `fetchAllCases()` - Fetch all tickets (for support staff)
- `createCase(userId, subject, description, priority)` - Create new ticket
- `updateCase(id, updates)` - Update ticket status, priority, or assignment

### API Functions

`src/lib/supabaseClient.ts` - Supabase client functions

- `getUserSupportCasesWithDetails(userId)` - Get user's tickets with creator/assignee details
- `getAllSupportCases()` - Get all tickets with details (for support staff)
- `createSupportCase(userId, subject, description, priority)` - Create new ticket
- `updateSupportCase(caseId, updates)` - Update ticket
- `assign_support_case_to_agent(case_id, agent_id)` - Safely assign ticket to agent

## Setup Instructions

### 1. Apply Database Migration

Run the RLS policies migration:

```bash
# In Supabase SQL Editor, run:
supabase/migrations/setup_support_cases_rls.sql
```

Or if using Supabase CLI:

```bash
supabase db push
```

### 2. Verify Table Exists

The `support_cases` table should already exist. Verify with:

```sql
SELECT * FROM public.support_cases LIMIT 1;
```

### 3. Test RLS Policies

Test that RLS is working correctly:

```sql
-- As a regular user, should only see own cases
SELECT * FROM public.support_cases;

-- As support/admin, should see all cases
SELECT * FROM public.support_cases;
```

## Usage

### Creating a Support Ticket (User View)

1. Navigate to `/app/support`
2. Click "New Ticket" button
3. Fill in:
   - Subject: Brief description
   - Priority: Select urgency
   - Description: Detailed information
4. Click "Create Ticket"

### Managing Tickets (Support View)

1. Navigate to `/app/support`
2. View all tickets in the dashboard
3. Use filters to find specific tickets:
   - Status filter (All, Open, In Progress, Resolved, Closed)
   - Assignment filter (All, My Tickets, Unassigned)
   - Priority filter (All, Urgent, High, Medium, Low)
4. Update tickets:
   - Change status dropdown
   - Change priority dropdown
   - Click "Assign to Me" for unassigned tickets
5. Click "Reply" to communicate with user (future feature)

## User Roles and Access

| Role    | Access Level                                      |
|---------|---------------------------------------------------|
| User    | Create tickets, view own tickets                  |
| Manager | Create tickets, view own tickets                  |
| Support | Create tickets, view ALL tickets, manage tickets  |
| Admin   | Full access (same as Support)                     |

## Status Flow

```
Open → In Progress → Resolved → Closed
  ↓         ↓           ↓
  → Can reopen at any stage (by support)
```

## Priority Levels

- **Urgent** 🔴 - Immediate attention required
- **High** 🟠 - Important, needs quick resolution
- **Medium** 🔵 - Standard priority (default)
- **Low** ⚪ - Can be addressed later

## Security Features

1. **RLS Policies** - Database-level access control
2. **Role-Based Views** - Different UI for different roles
3. **Assignment Validation** - Only support staff can be assigned
4. **Audit Trail** - created_at and updated_at timestamps
5. **Secure Functions** - SECURITY DEFINER for safe assignment

## Future Enhancements

1. **Comments/Replies System** - Add threaded comments to tickets
2. **Email Notifications** - Notify users of status changes
3. **File Attachments** - Allow users to upload screenshots/files
4. **SLA Tracking** - Track response and resolution times
5. **Ticket Templates** - Pre-defined ticket types
6. **Internal Notes** - Private notes for support staff
7. **Ticket Categories** - Categorize tickets (Technical, Billing, etc.)
8. **Escalation System** - Auto-escalate urgent tickets
9. **Knowledge Base Integration** - Suggest articles based on ticket content
10. **Analytics Dashboard** - Detailed support metrics and reports

## Troubleshooting

### Users can't see their tickets

1. Check RLS policies are enabled:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'support_cases';
   ```

2. Verify user is authenticated:
   ```sql
   SELECT auth.uid();
   ```

3. Check if tickets exist:
   ```sql
   SELECT COUNT(*) FROM public.support_cases WHERE created_by = auth.uid();
   ```

### Support staff can't see all tickets

1. Verify user role in profiles table:
   ```sql
   SELECT id, email, role FROM public.profiles WHERE id = auth.uid();
   ```

2. Ensure role is 'support' or 'admin'

3. Check RLS policy allows support to view all:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'support_cases';
   ```

### Can't create tickets

1. Check INSERT policy exists
2. Verify user is authenticated
3. Check required fields are provided (created_by, subject, description)

## Testing Checklist

- [ ] User can access /app/support
- [ ] User can create a new ticket
- [ ] User can see only their own tickets
- [ ] User cannot see other users' tickets
- [ ] Manager has same access as user
- [ ] Support staff can see all tickets
- [ ] Support staff can update ticket status
- [ ] Support staff can update ticket priority
- [ ] Support staff can assign tickets to themselves
- [ ] Support staff can filter by status
- [ ] Support staff can filter by priority
- [ ] Support staff can filter by assignment
- [ ] Search functionality works
- [ ] Metrics display correctly
- [ ] RLS policies prevent unauthorized access
- [ ] Created tickets show in real-time

## Performance Considerations

1. **Indexes** - Created on commonly queried columns:
   - `created_by` - For user queries
   - `assigned_to` - For agent queries
   - `status` - For filtering
   - `priority` - For filtering
   - `created_at` - For sorting

2. **Query Optimization**:
   - Use `.select()` with specific joins to fetch related data
   - Limit results with pagination (future enhancement)
   - Use indexes for filtering

3. **Caching**:
   - Consider implementing client-side caching for frequently accessed tickets
   - Use Supabase realtime subscriptions for live updates (future enhancement)

## Code Examples

### Creating a Ticket Programmatically

```typescript
import { useSupportStore } from '@/store/support';

const { createCase } = useSupportStore();

await createCase(
  userId,
  'Unable to access dashboard',
  'I am getting a 404 error when trying to access my dashboard...',
  'high'
);
```

### Updating Ticket Status

```typescript
import { useSupportStore } from '@/store/support';

const { updateCase } = useSupportStore();

await updateCase(ticketId, {
  status: 'in_progress',
  assignedTo: currentUserId
});
```

### Fetching Tickets

```typescript
import { useSupportStore } from '@/store/support';

const { fetchUserCases, fetchAllCases, cases } = useSupportStore();

// For regular users
await fetchUserCases(userId);

// For support staff
await fetchAllCases();

// Access tickets
console.log(cases);
```

## Summary

The support ticket system provides a complete, secure, and user-friendly way for users to get help and for support staff to manage customer issues. With role-based access control, proper security policies, and a clean UI, the system is ready for production use.

For questions or issues, please create a support ticket! 😊

