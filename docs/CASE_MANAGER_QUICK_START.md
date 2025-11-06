# Case Manager - Quick Start Guide

Get the Case Manager system up and running in minutes.

---

## 🎯 What You'll Get

After following this guide, you'll have:

✅ AI-powered case coaching for every lead  
✅ Stage-aware playbooks with automated actions  
✅ Smart reminders and notifications  
✅ Agent reassignment (face switching)  
✅ Budget-based inventory matching  
✅ Complete activity tracking  

---

## ⚡ Quick Install

### Option 1: Automated Script (Recommended)

```bash
cd "/Users/martin2/Desktop/Sale Mate Final"
./scripts/deploy-case-manager.sh
```

This handles everything automatically!

### Option 2: Manual Steps

If automated script fails, follow these steps:

#### 1. Install Dependencies

```bash
npm install
npm install -D @playwright/test vitest
npx playwright install chromium
```

#### 2. Set OpenAI API Key

Edit `.env` file (create from `env.example` if needed):

```env
VITE_OPENAI_API_KEY=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
```

#### 3. Run Database Migration

```bash
supabase db push
```

#### 4. Deploy Edge Functions

```bash
supabase functions deploy notify-user
supabase functions deploy case-coach
supabase functions deploy case-stage-change
supabase functions deploy case-actions
supabase functions deploy case-face-change
supabase functions deploy inventory-matcher
supabase functions deploy reminder-scheduler
```

#### 5. Set Supabase Secrets

```bash
supabase secrets set OPENAI_API_KEY="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"
```

#### 6. Configure Reminder Cron

In Supabase SQL Editor, run:

```sql
SELECT cron.schedule(
  'case-manager-reminders',
  '*/5 * * * *',
  $$SELECT net.http_post(
    url:='https://YOUR-PROJECT-REF.supabase.co/functions/v1/reminder-scheduler',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR-SERVICE-ROLE-KEY"}'::jsonb
  )$$
);
```

Replace `YOUR-PROJECT-REF` and `YOUR-SERVICE-ROLE-KEY` with your values.

---

## 🎮 Using Case Manager

### Access the Case Manager

1. **Start development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to CRM**:
   - Go to `http://localhost:5173/app/crm`
   - Or click "My Leads" in sidebar

3. **Open a Case**:
   - Click the purple **"Manage"** button on any lead
   - Or click the **Briefcase** icon in table view

### Understanding the Interface

**Left Panel - Stage Timeline**:
- Shows current stage
- Click any stage to change
- Quick stats display
- "Change Face" button

**Center Panel - Actions & Coaching**:
- AI Coach recommendations (after feedback)
- Feedback editor
- Activity timeline

**Right Panel - Tools**:
- Quick actions (Call, WhatsApp, Email)
- Pending actions list
- Meeting scheduler
- Inventory matches (for Low Budget cases)

---

## 🎯 Common Workflows

### Workflow 1: New Lead → First Call

1. Lead appears in CRM as "New Lead"
2. Open Case Manager
3. See **CALL_NOW** action created automatically
4. Get notification reminder in 15 minutes
5. Click **Call Client** button
6. After call, add feedback
7. Get AI coaching recommendations

### Workflow 2: Qualify Lead as Potential

1. Change stage to **"Potential"**
2. **Required**: Enter feedback about conversation
3. AI generates coaching recommendations
4. Click "Create Action" on recommendations
5. Use **Meeting Scheduler** to book appointment
6. Two reminders created automatically (24h and 2h before)

### Workflow 3: Handle Low Budget Client

1. Change stage to **"Low Budget"**
2. Enter budget information:
   - Total budget, OR
   - Down payment + Monthly installment
3. System searches inventory automatically
4. View matched properties in **Inventory Matches** card
5. See recommendation (good matches / adjust expectations / dead lead)
6. Contact client with options

### Workflow 4: Reassign to Different Agent (Change Face)

1. Click **"Change Face"** button
2. Select new agent from dropdown
3. Add reason (optional but recommended)
4. Submit
5. Both agents get notified
6. Lead is reassigned

### Workflow 5: Close the Deal

1. Change stage to **"Closed Deal"**
2. System creates:
   - Immediate "Ask for Referrals" action
   - Follow-up referral request in 30 days
3. Get congratulations notification
4. Track referral responses

---

## 🔔 Notifications

Notifications appear in:
- Bell icon (top right on desktop)
- Bell icon (top right in mobile header)
- Red badge shows unread count

**Click notification** to:
- Navigate to the case
- Mark as read
- See full details

**Notification triggers**:
- Action due dates reached
- Stage changes
- Face changes
- Inventory matches found
- Congratulations on closed deals

---

## 🤖 AI Coaching Tips

To get better AI recommendations:

**Good Feedback**:
✅ "Client is interested in 3BR apartment in New Cairo. Budget 5M EGP. Works in finance, married with 2 kids. Wants modern finishing and ground floor preferred."

**Poor Feedback**:
❌ "Interested"

**The more context you provide**:
- Client preferences
- Budget details
- Objections raised
- Timeline urgency
- Family situation
- Work/lifestyle

**The better the AI recommendations**!

---

## 🧪 Testing

### Run Unit Tests
```bash
npm run test:unit
```

### Run E2E Tests
```bash
# Make sure dev server is running
npm run dev

# In another terminal
npm run test:e2e

# Or use UI mode
npm run test:e2e:ui
```

### Manual Testing Checklist

- [ ] Can navigate to Case Manager from CRM
- [ ] Stage changes work
- [ ] Feedback submission works
- [ ] AI coach provides recommendations
- [ ] Actions can be completed/skipped
- [ ] Meeting scheduler creates reminders
- [ ] Notifications appear in bell
- [ ] Face change reassigns lead
- [ ] Inventory matching works for Low Budget
- [ ] Activity log shows all events

---

## 🐛 Troubleshooting

### "AI Coach not loading"

**Check**:
1. OpenAI API key is set: `supabase secrets list`
2. Edge Function logs: `supabase functions logs case-coach`
3. API key has credits
4. Browser console for errors

**Fix**:
```bash
supabase secrets set OPENAI_API_KEY="your-key"
```

### "Notifications not appearing"

**Check**:
1. Notification bell is visible in header
2. Database table exists: `SELECT * FROM notifications LIMIT 1;`
3. RLS policies are active
4. User ID matches notification user_id

**Fix**:
```bash
# Re-run migration
supabase db push
```

### "Reminders not firing"

**Check**:
1. Cron job is scheduled: `SELECT * FROM cron.job;`
2. Edge Function is deployed: `supabase functions list`
3. Service role key is correct in cron config

**Fix**:
Run the cron SQL in Supabase SQL Editor (see deployment guide).

### "Inventory matching returns nothing"

**Check**:
1. `salemate-inventory` table has data
2. Budget is reasonable (> 1M EGP typically)
3. Filters aren't too restrictive

**Fix**:
Adjust budget or remove optional filters (area, bedrooms).

---

## 📚 Learn More

- **Full Documentation**: [case-manager.md](./case-manager.md)
- **Deployment Guide**: [CASE_MANAGER_DEPLOYMENT.md](./CASE_MANAGER_DEPLOYMENT.md)
- **CRM Documentation**: [CRM_SYSTEM_DOCUMENTATION.md](./CRM_SYSTEM_DOCUMENTATION.md)
- **API Reference**: See Edge Function code in `supabase/functions/`

---

## 🎉 You're Ready!

The Case Manager is now active. Every lead in your CRM is now a fully-managed case with:

- 🤖 AI coaching
- ⏰ Smart reminders
- 👥 Team collaboration
- 🏠 Inventory matching
- 📊 Complete tracking

**Happy selling!** 🚀

