# Case Manager - System Architecture

## Overview Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERFACE                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Left Panel   │  │ Center Panel │  │ Right Panel  │     │
│  │              │  │              │  │              │     │
│  │ • Timeline   │  │ • AI Coach   │  │ • Actions    │     │
│  │ • Stats      │  │ • Feedback   │  │ • Meeting    │     │
│  │ • Change Face│  │ • Activity   │  │ • Inventory  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                     REACT HOOKS & STATE                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ useCase      │  │ useStageChange│  │ useNotifications│
│  │              │  │              │  │              │     │
│  │ • Data fetch │  │ • Validation │  │ • Bell badge │     │
│  │ • Realtime   │  │ • API calls  │  │ • Dropdown   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   API CLIENT LAYER                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ caseApi.ts - Wrapper for Supabase Function Calls     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                 SUPABASE EDGE FUNCTIONS                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐             │
│  │notify-user │ │ case-coach │ │case-stage- │             │
│  │            │ │  (GPT-4)   │ │   change   │             │
│  └────────────┘ └────────────┘ └────────────┘             │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐             │
│  │case-actions│ │face-change │ │ inventory- │             │
│  │            │ │            │ │  matcher   │             │
│  └────────────┘ └────────────┘ └────────────┘             │
│  ┌────────────┐                                             │
│  │ reminder-  │  (Cron: every 5 min)                       │
│  │ scheduler  │                                             │
│  └────────────┘                                             │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                  POSTGRESQL DATABASE                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ leads        │  │case_feedback │  │ case_actions │     │
│  │ (existing)   │  │ (new)        │  │ (new)        │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ case_faces   │  │ inventory_   │  │notifications │     │
│  │ (new)        │  │ matches(new) │  │ (new)        │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ salemate-    │  │ profiles     │                        │
│  │ inventory    │  │ (existing)   │                        │
│  │ (existing)   │  │              │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                          │
│  ┌────────────────────────────────────┐                    │
│  │ OpenAI GPT-4 API                   │                    │
│  │ • Case coaching                    │                    │
│  │ • Recommendations                  │                    │
│  │ • Follow-up scripts                │                    │
│  └────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Stage Change Flow

```
User clicks stage button
    ↓
StageChangeModal opens
    ↓
User fills required data
    ↓
useStageChange.changeLeadStage()
    ↓
Validates via stateMachine.validateStageChange()
    ↓
Calls caseApi.changeStage()
    ↓
HTTP POST to case-stage-change Edge Function
    ↓
Edge Function:
  • Updates lead.stage
  • Calls stateMachine.transitions[stage].onEnter()
  • Creates case_actions
  • Calls case-coach (if needed)
  • Calls inventory-matcher (if Low Budget)
  • Calls notify-user for reminders
    ↓
Database writes (with RLS checks)
    ↓
Realtime subscription triggers
    ↓
Frontend state updates automatically
    ↓
UI re-renders with new data
```

### AI Coaching Flow

```
User submits feedback
    ↓
FeedbackEditor.handleSubmit()
    ↓
INSERT into case_feedback table
    ↓
caseApi.getAICoaching()
    ↓
HTTP POST to case-coach Edge Function
    ↓
Edge Function:
  • Builds context from lead + feedback + history
  • Creates detailed prompt for GPT-4
  • Calls OpenAI API
  • Parses JSON response
  • Returns structured recommendations
    ↓
UPDATE case_feedback.ai_coach with response
    ↓
Realtime subscription triggers
    ↓
CaseCoachPanel re-renders
    ↓
User sees recommendations + script + risk flags
```

### Reminder Flow

```
pg_cron job triggers (every 5 min)
    ↓
HTTP POST to reminder-scheduler Edge Function
    ↓
Edge Function:
  • SELECT from case_actions WHERE status='PENDING' AND due_at <= now()
  • For each action:
    - Get lead details
    - Find target user (buyer/assigned/owner)
    - Call notify-user Edge Function
    - UPDATE notified_at = now()
    ↓
notify-user Edge Function:
  • INSERT into notifications table
  • Set status = 'sent'
    ↓
Realtime subscription to notifications triggers
    ↓
useNotifications hook updates state
    ↓
NotificationBell shows badge + dropdown
    ↓
User clicks notification
    ↓
Navigate to case
    ↓
UPDATE notification.read_at
```

### Face Change Flow

```
User clicks "Change Face" button
    ↓
ChangeFaceModal opens
    ↓
Modal fetches available agents from profiles table
    ↓
User selects new agent + reason
    ↓
caseApi.changeFace()
    ↓
HTTP POST to case-face-change Edge Function
    ↓
Edge Function:
  • INSERT into case_faces (from_agent, to_agent, reason)
  • UPDATE leads.assigned_to_id = to_agent
  • Call notify-user for new agent
  • Call notify-user for previous agent (if exists)
    ↓
Realtime subscriptions trigger
    ↓
Lead and faces data refresh
    ↓
ActivityLog shows face change
```

### Inventory Matching Flow

```
User changes to Low Budget stage
    ↓
Modal requires budget info
    ↓
caseApi.matchInventory()
    ↓
HTTP POST to inventory-matcher Edge Function
    ↓
Edge Function:
  • Calculates max affordable price
  • Queries salemate-inventory table
  • Applies filters (price, area, bedrooms)
  • Orders by price ASC
  • Limits to 10 results
  • Generates recommendation
  • INSERT into inventory_matches
    ↓
Realtime subscription triggers
    ↓
InventoryMatchesCard displays results
```

---

## Security Architecture

### Row Level Security (RLS)

All case tables use centralized access control:

```sql
can_access_lead(lead_id) → boolean
  ↓
Checks if auth.uid() matches:
  • leads.buyer_user_id
  • leads.assigned_to_id
  • leads.owner_id
  • OR user is admin/support
```

Applied to:
- case_feedback (read + insert)
- case_actions (read + all operations)
- case_faces (read + all operations)
- inventory_matches (read + insert)
- notifications (read + update own only)

### API Security

**Edge Functions**:
- CORS headers configured
- Service role key for database access
- Anon key for client calls (with RLS)
- JWT validation built-in

**Secrets**:
- OPENAI_API_KEY stored server-side only
- Never exposed to client
- Used only in Edge Functions

---

## Performance Architecture

### Frontend Optimizations

1. **Lazy Loading**: Components loaded on demand
2. **Memoization**: Filtered data cached
3. **Optimistic Updates**: Instant UI feedback
4. **Realtime Subscriptions**: Only for active cases
5. **Pagination**: 30 leads per page in CRM

### Backend Optimizations

1. **Database Indexes**: All foreign keys + frequently queried columns
2. **Query Optimization**: Selective field selection with joins
3. **Caching**: AI responses stored in database
4. **Batch Processing**: Reminder scheduler processes in bulk
5. **Connection Pooling**: Supabase built-in

### Monitoring Points

**Track these**:
- Edge Function execution time
- AI response latency (target: <5s)
- Database query performance
- Notification delivery rate
- Reminder accuracy

---

## Scalability Considerations

### Current Capacity

- **Leads**: Unlimited (PostgreSQL scales)
- **Actions**: Thousands per day
- **Notifications**: Hundreds per minute
- **AI Calls**: Rate limited by OpenAI (adjust model/tier)
- **Reminders**: Processes all due actions every 5 min

### Scaling Strategies

**If >10K active cases**:
1. Add database read replicas
2. Implement caching layer (Redis)
3. Batch notification delivery
4. Upgrade OpenAI tier
5. Optimize cron frequency

**If >100 concurrent users**:
1. Enable Supabase connection pooler
2. Implement frontend caching
3. Add CDN for static assets
4. Consider microservices split

---

## Technology Stack Details

### Frontend
- **Framework**: React 19 + TypeScript 5.8
- **Router**: React Router DOM 7
- **State**: Zustand + React Query
- **UI**: Tailwind CSS + Framer Motion
- **Forms**: React Hook Form + Zod
- **Build**: Vite 7

### Backend
- **Database**: PostgreSQL (Supabase)
- **API**: Supabase Edge Functions (Deno)
- **Realtime**: Supabase Realtime (WebSockets)
- **Auth**: Supabase Auth + RLS
- **Cron**: pg_cron extension

### AI/ML
- **Provider**: OpenAI
- **Model**: GPT-4
- **Context**: Egyptian real estate market
- **Response**: Structured JSON

### Testing
- **E2E**: Playwright (Chromium)
- **Unit**: Vitest
- **Automation**: Playwright scripts

### Deployment
- **Frontend**: Vercel (or any static host)
- **Backend**: Supabase (managed)
- **CI/CD**: GitHub Actions (optional)

---

## Extension Points

### Adding New Stage Types

1. Update `CaseStage` type in `src/types/case.ts`
2. Add configuration in `src/lib/case/stateMachine.ts`
3. Define requirements and onEnter actions
4. Update UI stage list components

### Adding New Action Types

1. Update `CaseActionType` type in `src/types/case.ts`
2. Add icon in `ActionsList.tsx`
3. Add title/body in `reminder-scheduler/index.ts`
4. Implement handler if needed

### Adding New Notification Channels

1. Update `notifications.channels` array constraint
2. Implement delivery in `notify-user` Edge Function
3. Add configuration UI
4. Test delivery

### Customizing AI Prompts

1. Edit `supabase/functions/case-coach/index.ts`
2. Modify the prompt template
3. Adjust temperature/max_tokens
4. Test responses
5. Redeploy function

---

## Integration Points

### With Existing CRM

**Integration**: Seamless
- CRM continues to work unchanged
- "Manage" button links to Case Manager
- Data models compatible
- Realtime subscriptions coexist

### With Inventory System

**Integration**: Read-only queries
- Uses existing `salemate-inventory` table
- No modifications to inventory data
- Caches results in `inventory_matches`
- Links to inventory details

### With Notification System

**Integration**: New unified system
- Created from scratch for Case Manager
- Can be extended to other features
- Supports multiple channels (future)
- Realtime delivery

---

## Future Architecture Enhancements

### Phase 2 (Next 3-6 months)

1. **Multi-channel Notifications**
   - Email via SendGrid/Resend
   - WhatsApp via Twilio
   - Push via Firebase

2. **Advanced Analytics Dashboard**
   - Conversion rates by stage
   - AI coaching effectiveness
   - Agent performance comparison
   - Predictive deal closure ML model

3. **Voice Integration**
   - Call recording
   - Speech-to-text transcription
   - Automated feedback from calls

4. **Document Management**
   - Contract uploads
   - ID verification
   - E-signatures integration

5. **Mobile App**
   - React Native app
   - Push notifications
   - Offline support
   - Quick actions

---

## Cost Analysis

### OpenAI API Costs

**GPT-4 Pricing** (as of Nov 2024):
- Input: $0.03 per 1K tokens
- Output: $0.06 per 1K tokens

**Estimated per Feedback**:
- Input: ~500 tokens = $0.015
- Output: ~300 tokens = $0.018
- **Total: ~$0.033 per coaching session**

**Monthly projection** (100 agents, 50 feedbacks/agent/month):
- 100 agents × 50 feedbacks = 5,000 coaching sessions
- 5,000 × $0.033 = **~$165/month**

### Supabase Costs

**Free Tier**: 50MB database, 500MB bandwidth/month
**Pro Tier** ($25/month): 8GB database, 250GB bandwidth

Estimated Case Manager usage:
- Database: ~10-50MB (depending on history)
- Bandwidth: ~5-10GB/month (assuming 1000 active cases)

**Recommendation**: Pro tier for production

### Total Estimated Cost

- OpenAI: $165/month
- Supabase: $25/month
- **Total: ~$190/month** for 100 agents

---

## Disaster Recovery

### Backup Strategy

1. **Database**:
   - Supabase auto-backups (daily)
   - Manual exports before major changes
   - Point-in-time recovery available (Pro tier)

2. **Edge Functions**:
   - Version controlled in Git
   - Can redeploy anytime
   - No state stored in functions

3. **Frontend**:
   - Version controlled in Git
   - Deployed via CI/CD
   - Rollback via Vercel/Netlify

### Recovery Procedures

**If AI coaching fails**:
- System continues to work
- Feedback still saved
- Manual coaching possible
- Fix and redeploy case-coach function

**If reminder scheduler fails**:
- Actions still visible in UI
- Manual completion works
- No data loss
- Redeploy reminder-scheduler

**If database corrupted**:
- Restore from Supabase backup
- Minimal data loss (<24h)
- RLS prevents unauthorized access
- Edge Functions remain operational

---

## Compliance & Privacy

### Data Handling

- **Client PII**: Stored in `leads` table (existing RLS)
- **Feedback**: Protected by RLS (agent-only access)
- **AI Coaching**: Stored as text, no external persistence
- **Notifications**: User-specific, auto-deletion after 90 days (optional)

### GDPR Compliance

- ✅ Right to access: Users can query own data
- ✅ Right to deletion: CASCADE deletes on lead removal
- ✅ Data minimization: Only necessary fields
- ✅ Purpose limitation: Clear use cases documented

### Security Best Practices

- ✅ RLS on all tables
- ✅ API keys server-side only
- ✅ CORS properly configured
- ✅ Input validation
- ✅ SQL injection prevention (via Supabase client)
- ✅ XSS protection (React escaping)

---

**Version**: 1.0.0  
**Last Updated**: November 6, 2024  
**Architect**: AI Assistant

