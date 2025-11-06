# Case Manager System - Deployment Guide

## Prerequisites

Before deploying the Case Manager system, ensure you have:

- ✅ Supabase CLI installed (`npm install -g supabase`)
- ✅ Supabase project created and linked
- ✅ OpenAI API key
- ✅ Node.js 18+ installed
- ✅ Access to Supabase project dashboard

---

## Quick Start

For automated setup, run:

```bash
npm run setup:case-manager
```

This script will:
1. Verify environment variables
2. Run database migrations
3. Deploy Edge Functions
4. Configure secrets
5. Run build test

---

## Manual Deployment Steps

### Step 1: Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp env.example .env
   ```

2. Update `.env` with your values:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_OPENAI_API_KEY=sk-proj-your-openai-key
   ```

3. **Important**: Never commit `.env` file to Git!

### Step 2: Database Migration

Run the migration to create case manager tables:

```bash
cd "/Users/martin2/Desktop/Sale Mate Final"
supabase db push
```

This applies: `supabase/migrations/20251106000001_create_case_manager_tables.sql`

**Tables created**:
- `case_feedback` - Feedback with AI coaching
- `case_actions` - Actions and reminders
- `case_faces` - Agent reassignments
- `inventory_matches` - Budget-based matches
- `notifications` - Universal notifications

**Verify migration**:
```bash
supabase db diff
```

Should show no differences if migration successful.

### Step 3: Deploy Edge Functions

Deploy all Case Manager Edge Functions:

```bash
# Deploy individually
supabase functions deploy notify-user
supabase functions deploy case-coach
supabase functions deploy case-stage-change
supabase functions deploy case-actions
supabase functions deploy case-face-change
supabase functions deploy inventory-matcher
supabase functions deploy reminder-scheduler

# Or deploy all at once (if you have other functions, this deploys them too)
supabase functions deploy
```

**Verify deployment**:
```bash
supabase functions list
```

### Step 4: Configure Secrets

Set the OpenAI API key in Supabase secrets (server-side):

```bash
supabase secrets set OPENAI_API_KEY="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"
```

**Verify secrets**:
```bash
supabase secrets list
```

Should show `OPENAI_API_KEY` in the list.

### Step 5: Configure Cron Job for Reminders

The reminder scheduler needs to run every 5 minutes.

**Option A: Via Supabase Dashboard**

1. Go to Supabase Dashboard → SQL Editor
2. Run this SQL:

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

Replace:
- `YOUR-PROJECT-REF` with your project reference (e.g., `abcdefghijk`)
- `YOUR-SERVICE-ROLE-KEY` with your service role key from dashboard

**Option B: Via Migration**

Create a new migration file:

```bash
supabase migration new setup_reminder_cron
```

Add the SQL above to the migration file, then run `supabase db push`.

**Verify cron job**:
```sql
SELECT * FROM cron.job WHERE jobname = 'case-manager-reminders';
```

### Step 6: Test Locally

1. Start development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:5173/app/crm`

3. Click "Manage" on any lead

4. Test stage changes:
   - Change to "New Lead" → should create CALL_NOW action
   - Add feedback → should get AI recommendations
   - Change to "Low Budget" with budget → should show inventory matches

### Step 7: Run Tests

**Unit tests**:
```bash
npm run test:unit
```

**E2E tests** (requires dev server running):
```bash
npm run test:e2e
```

**Interactive test mode**:
```bash
npm run test:e2e:ui
```

### Step 8: Build for Production

```bash
npm run build
```

Should complete without errors. Output in `dist/` folder.

### Step 9: Deploy Frontend

**Option A: Vercel**
```bash
vercel --prod
```

**Option B: Netlify**
```bash
netlify deploy --prod
```

**Option C: Custom Server**
```bash
# Copy dist/ folder to your web server
scp -r dist/* user@server:/var/www/html/
```

---

## Verification Checklist

After deployment, verify:

- [ ] All Edge Functions deployed (check dashboard)
- [ ] Database tables exist with RLS policies
- [ ] OpenAI API key set in secrets
- [ ] Cron job scheduled for reminders
- [ ] Frontend builds without errors
- [ ] Can navigate to `/app/crm/case/:leadId`
- [ ] Notifications appear in bell icon
- [ ] AI coaching works after feedback submission
- [ ] Stage changes trigger appropriate actions
- [ ] Inventory matching works for Low Budget stage
- [ ] Meeting scheduler creates reminders

---

## Monitoring

### Check Edge Function Logs

```bash
# View logs for specific function
supabase functions logs case-coach --tail

# View reminder scheduler logs
supabase functions logs reminder-scheduler --tail

# View all function logs
supabase functions logs --tail
```

### Check Database

```sql
-- Check notifications
SELECT * FROM notifications 
WHERE status = 'pending' 
ORDER BY created_at DESC 
LIMIT 10;

-- Check pending actions
SELECT * FROM case_actions 
WHERE status = 'PENDING' 
AND due_at <= now() 
ORDER BY due_at 
LIMIT 10;

-- Check AI coaching usage
SELECT COUNT(*) as ai_feedback_count 
FROM case_feedback 
WHERE ai_coach IS NOT NULL;

-- Check face changes
SELECT COUNT(*) as face_changes 
FROM case_faces;
```

### Monitor Performance

Track these metrics:
- **AI Coach Response Time**: Target < 5 seconds
- **Notification Delivery**: Target < 1 minute
- **Stage Change Latency**: Target < 2 seconds
- **Inventory Match Time**: Target < 3 seconds

---

## Rollback Procedure

If you need to rollback:

1. **Revert database migration**:
   ```sql
   -- Drop case manager tables
   DROP TABLE IF EXISTS public.notifications CASCADE;
   DROP TABLE IF EXISTS public.inventory_matches CASCADE;
   DROP TABLE IF EXISTS public.case_faces CASCADE;
   DROP TABLE IF EXISTS public.case_actions CASCADE;
   DROP TABLE IF EXISTS public.case_feedback CASCADE;
   DROP FUNCTION IF EXISTS public.can_access_lead(uuid);
   ```

2. **Remove Edge Functions**:
   ```bash
   supabase functions delete notify-user
   supabase functions delete case-coach
   supabase functions delete case-stage-change
   supabase functions delete case-actions
   supabase functions delete case-face-change
   supabase functions delete inventory-matcher
   supabase functions delete reminder-scheduler
   ```

3. **Remove cron job**:
   ```sql
   SELECT cron.unschedule('case-manager-reminders');
   ```

4. **Redeploy previous frontend version**

---

## Troubleshooting Deployment

### Migration Fails

**Error**: `relation "leads" does not exist`
- **Solution**: Ensure base CRM tables exist first

**Error**: `permission denied`
- **Solution**: Check you're using service role key for migrations

### Edge Function Deployment Fails

**Error**: `401 Unauthorized`
- **Solution**: Run `supabase login` and link project

**Error**: `Function already exists`
- **Solution**: Delete and redeploy, or use `--overwrite` flag

### Secrets Not Working

**Error**: `OPENAI_API_KEY is undefined`
- **Solution**: Secrets are Edge Function-only, verify with `supabase secrets list`

### Cron Job Not Running

**Error**: Reminders not firing
- **Solution**: Check cron is enabled in Supabase project settings
- **Solution**: Verify service role key in cron config
- **Solution**: Check Edge Function logs for errors

---

## Production Checklist

Before going live:

- [ ] Change OpenAI model to `gpt-4-turbo` for cost optimization (optional)
- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Configure rate limiting for Edge Functions
- [ ] Set up database backups
- [ ] Test notification delivery under load
- [ ] Review and optimize AI prompts
- [ ] Set up analytics tracking
- [ ] Configure CORS for production domain
- [ ] Test on multiple devices/browsers
- [ ] Perform security audit
- [ ] Document API keys and rotate if needed
- [ ] Set up staging environment
- [ ] Create disaster recovery plan

---

## Support

For deployment issues:

1. Check Edge Function logs: `supabase functions logs [name]`
2. Check database logs in dashboard
3. Review migration files
4. Check Discord/GitHub issues
5. Contact Supabase support if infrastructure issues

---

**Version**: 1.0.0  
**Last Updated**: November 6, 2024

