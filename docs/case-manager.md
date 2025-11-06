# Case Manager System Documentation

## Overview

The Case Manager transforms the traditional CRM lead view into an intelligent, stage-aware case management system. Every lead is treated as a "case" with automated playbooks, AI coaching powered by OpenAI GPT-4, agent reassignment (face switching), inventory matching for budget-constrained clients, and automated reminders delivered through an integrated notification system.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Database Schema](#database-schema)
3. [Stage Playbooks](#stage-playbooks)
4. [AI Coaching](#ai-coaching)
5. [Features](#features)
6. [API Reference](#api-reference)
7. [Components](#components)
8. [Deployment](#deployment)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## Architecture

### Technology Stack

**Frontend**:
- React 19 with TypeScript
- React Router for navigation
- Framer Motion for animations
- Tailwind CSS for styling
- Custom hooks for state management

**Backend**:
- Supabase (PostgreSQL) for database
- Supabase Edge Functions (Deno) for serverless API
- Row Level Security for data protection
- Realtime subscriptions for live updates

**AI/ML**:
- OpenAI GPT-4 for case coaching
- Context-aware recommendations
- Egyptian market-specific prompts

**Scheduling**:
- pg_cron for scheduled jobs
- Supabase Edge Functions for reminder processing
- Database-backed notification queue

### Data Flow

```
User changes lead stage
    ↓
Frontend validates requirements
    ↓
Stage Change Modal collects needed data
    ↓
API call to case-stage-change Edge Function
    ↓
Stage machine triggers:
  - Update lead stage
  - Create case actions
  - Call AI coach (if applicable)
  - Match inventory (if Low Budget)
  - Send notifications
    ↓
Realtime subscriptions update UI
    ↓
Reminder scheduler (cron every 5min)
    ↓
Process due actions → Send notifications
```

---

## Database Schema

### Table: `case_feedback`

Stores feedback entries with AI coaching recommendations.

```sql
CREATE TABLE public.case_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  stage text NOT NULL,
  feedback text NOT NULL,
  ai_coach text,  -- JSON string of AICoachResponse
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### Table: `case_actions`

Tracks actions, reminders, and tasks for each case.

```sql
CREATE TABLE public.case_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  action_type text NOT NULL,  -- CALL_NOW, PUSH_MEETING, etc.
  payload jsonb,
  due_at timestamptz,
  status text NOT NULL DEFAULT 'PENDING',  -- PENDING, DONE, SKIPPED, EXPIRED
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  notified_at timestamptz
);
```

### Table: `case_faces`

Records agent reassignments (face changes).

```sql
CREATE TABLE public.case_faces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  from_agent uuid REFERENCES public.profiles(id),
  to_agent uuid NOT NULL REFERENCES public.profiles(id),
  reason text,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### Table: `inventory_matches`

Caches inventory search results for Low Budget cases.

```sql
CREATE TABLE public.inventory_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  filters jsonb NOT NULL,
  result_count int NOT NULL DEFAULT 0,
  top_units jsonb,  -- Array of matched properties
  recommendation text,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### Table: `notifications`

Universal notification system for in-app and future channels.

```sql
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  url text,
  channels text[] DEFAULT ARRAY['inapp']::text[],
  status text NOT NULL DEFAULT 'pending',  -- pending, sent, read
  read_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

---

## Stage Playbooks

Each stage has specific requirements and automated actions:

### New Lead
**Requirements**: None  
**Actions**:
- Create `CALL_NOW` action due in 15 minutes
- Send notification: "Call Now Required"

### Potential
**Requirements**: Feedback (required)  
**Actions**:
- Save feedback
- Call AI coach for recommendations
- Create `PUSH_MEETING` action
- If meeting date provided:
  - Create `REMIND_MEETING` 24 hours before
  - Create `REMIND_MEETING` 2 hours before

### Hot Case
**Requirements**: None  
**Actions**: None (manual handling)

### Meeting Done
**Requirements**: None  
**Actions**: None (await next steps)

### EOI (Expression of Interest)
**Requirements**: None  
**Actions**:
- Create `CHANGE_FACE` action (suggest second opinion for pre-launch)

### Closed Deal
**Requirements**: None  
**Actions**:
- Create immediate `ASK_FOR_REFERRALS` action
- Create follow-up `ASK_FOR_REFERRALS` in 30 days
- Send congratulations notification

### Non Potential
**Requirements**: Feedback (required)  
**Actions**:
- Save feedback
- Create `CHANGE_FACE` action (suggest verification)

### Low Budget
**Requirements**: Budget OR (DownPayment AND Monthly Installment)  
**Actions**:
- Run inventory matcher
- Cache results in `inventory_matches`
- Display matched properties or "no matches" recommendation

### No Answer
**Requirements**: None  
**Actions**:
- Create `CALL_NOW` retry action in 2 hours

### Call Back
**Requirements**: None  
**Actions**:
- Create `CALL_NOW` callback action in 1 hour

### Switched Off
**Requirements**: None  
**Actions**:
- Create `CALL_NOW` retry action in 4 hours

### Wrong Number / Whatsapp
**Requirements**: None  
**Actions**: None (manual handling)

---

## AI Coaching

### How It Works

When feedback is submitted for stages like "Potential", the system:

1. Calls the `case-coach` Edge Function
2. Sends lead context + feedback to OpenAI GPT-4
3. Receives structured recommendations
4. Stores in `case_feedback.ai_coach` column
5. Displays in Case Coach Panel

### AI Response Structure

```typescript
{
  recommendations: [
    {
      cta: "Schedule site visit within 48 hours",
      reason: "Client shows strong buying signals",
      suggestedActionType: "PUSH_MEETING",
      dueInMinutes: 2880  // 48 hours
    }
  ],
  followupScript: "Hello Ahmed, following up on our conversation...",
  riskFlags: ["Budget mismatch", "High competition"]
}
```

### Prompt Engineering

The AI coach receives:
- Lead name, phone, current stage
- Latest feedback text
- Inventory match context (if available)
- Historical feedback (if available)
- Egyptian market context

---

## Features

### 1. Stage Timeline

**Component**: `CaseStageTimeline.tsx`

- Visual progress indicator
- Click to change stage
- Quick stats display
- Stage descriptions

### 2. AI Coach Panel

**Component**: `CaseCoachPanel.tsx`

- Displays recommendations from GPT-4
- "Create Action" buttons for quick execution
- Follow-up script ready for copy/paste
- Risk flags highlighted

### 3. Feedback Editor

**Component**: `FeedbackEditor.tsx`

- Rich text area for notes
- Auto-triggers AI coaching on submit
- Contextual to current stage

### 4. Actions & Reminders

**Component**: `ActionsList.tsx`

- Pending actions with due dates
- Overdue indicators
- Complete/Skip buttons
- Recently completed history

### 5. Meeting Scheduler

**Component**: `MeetingScheduler.tsx`

- Date/time picker
- Auto-creates T-24h and T-2h reminders
- Integrates with notification system

### 6. Face Change (Agent Reassignment)

**Component**: `ChangeFaceModal.tsx`

- Select new agent from dropdown
- Optional reason field
- Notifies both agents
- Records in `case_faces` table

### 7. Inventory Matching

**Component**: `InventoryMatchesCard.tsx`

- Displays top 10 matched units
- Shows affordability recommendation
- Filters by budget/area/bedrooms
- Links to property details

### 8. Notifications

**Component**: `NotificationBell.tsx`

- Bell icon in header
- Unread count badge
- Dropdown with recent notifications
- Click to navigate
- Mark as read functionality

### 9. Activity Log

**Component**: `ActivityLog.tsx`

- Chronological timeline
- Feedback, actions, face changes
- Timestamped entries
- User attribution

---

## API Reference

### Edge Functions

#### 1. `notify-user`

**Endpoint**: `/functions/v1/notify-user`  
**Method**: POST

**Request**:
```json
{
  "userId": "uuid",
  "title": "string",
  "body": "string",
  "url": "/crm/case/123",
  "channels": ["inapp"]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "sent",
    ...
  }
}
```

#### 2. `case-coach`

**Endpoint**: `/functions/v1/case-coach`  
**Method**: POST

**Request**:
```json
{
  "stage": "Potential",
  "lead": {
    "id": "uuid",
    "name": "John Doe",
    "phone": "+201234567890"
  },
  "lastFeedback": "Client interested in 3BR apartment"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "recommendations": [...],
    "followupScript": "...",
    "riskFlags": [...]
  }
}
```

#### 3. `case-stage-change`

**Endpoint**: `/functions/v1/case-stage-change`  
**Method**: POST

**Request**:
```json
{
  "leadId": "uuid",
  "newStage": "Potential",
  "userId": "uuid",
  "feedback": "Optional feedback text",
  "budget": 5000000,
  "meetingDate": "2024-11-10T14:00:00Z"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Stage changed to Potential"
}
```

#### 4. `case-actions`

**Endpoint**: `/functions/v1/case-actions`  
**Method**: POST

**Request (CREATE)**:
```json
{
  "method": "CREATE",
  "leadId": "uuid",
  "actionType": "CALL_NOW",
  "payload": {"sla": "15m"},
  "dueInMinutes": 15,
  "userId": "uuid"
}
```

**Request (COMPLETE)**:
```json
{
  "method": "COMPLETE",
  "actionId": "uuid"
}
```

#### 5. `case-face-change`

**Endpoint**: `/functions/v1/case-face-change`  
**Method**: POST

**Request**:
```json
{
  "leadId": "uuid",
  "toAgentId": "uuid",
  "reason": "Client needs different expertise",
  "userId": "uuid"
}
```

#### 6. `inventory-matcher`

**Endpoint**: `/functions/v1/inventory-matcher`  
**Method**: POST

**Request**:
```json
{
  "leadId": "uuid",
  "userId": "uuid",
  "totalBudget": 3000000,
  "downPayment": 500000,
  "monthlyInstallment": 40000,
  "area": "New Cairo",
  "minBedrooms": 2
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "resultCount": 5,
    "topUnits": [...],
    "recommendation": "Good matches found!",
    "matchId": "uuid"
  }
}
```

#### 7. `reminder-scheduler` (Cron)

**Endpoint**: `/functions/v1/reminder-scheduler`  
**Method**: POST (Called by pg_cron every 5 minutes)

**Response**:
```json
{
  "success": true,
  "total": 10,
  "notified": 8,
  "failed": 2
}
```

---

## Components

### Pages

#### CaseManager.tsx
**Path**: `/app/crm/case/:leadId`

Main case view with three-column layout:
- **Left**: Stage timeline, stats, change face button
- **Center**: AI coach panel, feedback editor, activity log
- **Right**: Quick actions, actions list, meeting scheduler, inventory matches

### UI Components

1. **CaseStageTimeline** - Visual stage progress with click-to-change
2. **CaseCoachPanel** - AI recommendations display
3. **FeedbackEditor** - Text area with AI trigger
4. **ActionsList** - Pending/completed actions
5. **ActivityLog** - Chronological event timeline
6. **QuickActions** - Call/WhatsApp/Email buttons
7. **MeetingScheduler** - Date picker with reminder creation
8. **InventoryMatchesCard** - Display matched properties
9. **ChangeFaceModal** - Agent reassignment dialog
10. **StageChangeModal** - Dynamic stage change form
11. **NotificationBell** - Header notification dropdown

---

## Hooks

### useCase(leadId: string)

Fetches complete case data with realtime subscriptions.

**Returns**:
```typescript
{
  lead: Lead | null;
  feedback: CaseFeedback[];
  actions: CaseAction[];
  faces: CaseFace[];
  matches: InventoryMatch[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
```

### useStageChange()

Handles stage transitions with validation.

**Returns**:
```typescript
{
  changing: boolean;
  error: string | null;
  changeLeadStage: (params) => Promise<boolean>;
  validateChange: (current, new, data) => { valid: boolean; error?: string };
}
```

### useNotifications()

Manages user notifications with realtime updates.

**Returns**:
```typescript
{
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refetch: () => Promise<void>;
}
```

---

## Deployment

### 1. Database Migration

```bash
cd "/Users/martin2/Desktop/Sale Mate Final"
supabase db push
```

This applies the migration: `20251106000001_create_case_manager_tables.sql`

### 2. Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy notify-user
supabase functions deploy case-coach
supabase functions deploy case-stage-change
supabase functions deploy case-actions
supabase functions deploy case-face-change
supabase functions deploy inventory-matcher
supabase functions deploy reminder-scheduler
```

### 3. Set Supabase Secrets

```bash
# Set OpenAI API key (required for AI coaching)
supabase secrets set OPENAI_API_KEY=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
```

### 4. Configure pg_cron

Run this SQL in Supabase SQL Editor:

```sql
SELECT cron.schedule(
  'reminder-scheduler',
  '*/5 * * * *',  -- Every 5 minutes
  $$SELECT net.http_post(
    url:='https://[YOUR-PROJECT-REF].supabase.co/functions/v1/reminder-scheduler',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer [YOUR-SERVICE-ROLE-KEY]"}'::jsonb
  )$$
);
```

Replace:
- `[YOUR-PROJECT-REF]` with your Supabase project reference
- `[YOUR-SERVICE-ROLE-KEY]` with your service role key

### 5. Deploy Frontend

```bash
# Build frontend
npm run build

# Deploy to Vercel (if using Vercel)
vercel --prod
```

---

## Testing

### Unit Tests

Run Vitest tests for state machine logic:

```bash
npm run test
```

**Test file**: `src/lib/case/__tests__/stateMachine.test.ts`

**Coverage**:
- Stage transition configurations
- Validation logic
- Helper functions

### E2E Tests

Run Playwright tests for complete workflows:

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/case-manager.spec.ts

# Run in UI mode (interactive)
npx playwright test --ui

# Run specific test
npx playwright test -g "should auto-create CALL_NOW action"
```

**Test Files**:
- `tests/e2e/case-manager.spec.ts` - Main case workflows
- `tests/automation/supabase-config.spec.ts` - Infrastructure verification

### Automated Setup

Run the automated setup script:

```bash
npx ts-node scripts/automated-setup.ts
```

This will:
1. Verify environment variables
2. Check Supabase CLI
3. Run migrations
4. Deploy Edge Functions
5. Set secrets
6. Run build test

---

## Troubleshooting

### AI Coaching Not Working

**Symptoms**: No recommendations appear after feedback submission

**Solutions**:
1. Check OpenAI API key is set in Supabase secrets:
   ```bash
   supabase secrets list
   ```
2. Check Edge Function logs:
   ```bash
   supabase functions logs case-coach
   ```
3. Verify API key is valid and has credits
4. Check browser console for errors

### Notifications Not Appearing

**Symptoms**: No notifications in bell dropdown

**Solutions**:
1. Verify `notifications` table exists and has RLS policies
2. Check realtime is enabled on table
3. Check notification was created in database:
   ```sql
   SELECT * FROM notifications WHERE user_id = 'your-user-id' ORDER BY created_at DESC LIMIT 10;
   ```
4. Check browser console for subscription errors

### Reminders Not Firing

**Symptoms**: Due actions don't trigger notifications

**Solutions**:
1. Verify pg_cron job is scheduled:
   ```sql
   SELECT * FROM cron.job;
   ```
2. Check `reminder-scheduler` Edge Function logs
3. Verify service role key is correct in cron config
4. Check `case_actions` table for pending actions:
   ```sql
   SELECT * FROM case_actions WHERE status = 'PENDING' AND due_at <= now();
   ```

### Inventory Matching Returns No Results

**Symptoms**: "No matches found" for reasonable budgets

**Solutions**:
1. Verify `salemate-inventory` table has data
2. Check budget calculation logic
3. Review filters in `inventory_matches` table
4. Adjust min/max price thresholds
5. Check property price ranges in inventory

### Stage Change Fails

**Symptoms**: Stage change modal shows error

**Solutions**:
1. Check validation requirements are met
2. Verify RLS policies allow update
3. Check Edge Function logs for errors
4. Verify user has access to lead (buyer_user_id, assigned_to_id, or owner_id)

---

## Security

### Row Level Security

All case tables use the `can_access_lead()` helper function:

```sql
CREATE FUNCTION can_access_lead(l_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM leads
    WHERE id = l_id
    AND (buyer_user_id = auth.uid() OR assigned_to_id = auth.uid() OR owner_id = auth.uid())
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

This ensures users can only access cases for leads they own or are assigned to.

### API Keys

- **OpenAI API Key**: Stored in Supabase Edge Function secrets (server-side only)
- **Service Role Key**: Used only by Edge Functions and cron jobs
- **Anon Key**: Used by frontend for authenticated requests

---

## Future Enhancements

1. **Multi-channel Notifications**: Email, WhatsApp, Push notifications
2. **Custom Playbooks**: Admin-configurable stage workflows
3. **Advanced AI**: Fine-tuned model for Egyptian real estate
4. **Predictive Analytics**: ML predictions for deal closure
5. **Voice Transcription**: Record and transcribe calls
6. **Document Management**: Attach contracts, IDs, etc.
7. **Team Analytics**: Compare face performance
8. **Mobile App**: Native iOS/Android apps

---

## Performance

### Optimizations

1. **Realtime Subscriptions**: Only subscribe to relevant tables per case
2. **Lazy Loading**: Components loaded on demand
3. **Memoization**: AI coach responses cached in database
4. **Batch Processing**: Reminder scheduler processes in bulk
5. **Indexes**: All foreign keys and frequently queried columns indexed

### Monitoring

Monitor these metrics:
- **AI Coach Response Time**: Target < 5 seconds
- **Notification Delivery**: Target < 1 minute for due actions
- **Stage Change Latency**: Target < 2 seconds
- **Inventory Match Time**: Target < 3 seconds

---

## Support

For issues or questions:
1. Check this documentation
2. Review Edge Function logs: `supabase functions logs [function-name]`
3. Check database logs in Supabase Dashboard
4. Review browser console for frontend errors
5. Run automated tests: `npx playwright test`

---

**Version**: 1.0.0  
**Last Updated**: November 6, 2024  
**Author**: SaleMate Team

