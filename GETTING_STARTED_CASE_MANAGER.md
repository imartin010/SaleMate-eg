# 🎯 Getting Started with Case Manager

## Step-by-Step Setup Guide

Follow these steps to get the Case Manager running in your environment.

---

## Prerequisites

Make sure you have:
- ✅ Supabase account with project created
- ✅ Supabase CLI installed: `npm install -g supabase`
- ✅ OpenAI API key (provided)
- ✅ Node.js 18+ installed
- ✅ Terminal/command line access

---

## Step 1: Link to Supabase Project

```bash
cd "/Users/martin2/Desktop/Sale Mate Final"

# Login to Supabase (if not already logged in)
supabase login

# Link to your project
supabase link --project-ref YOUR-PROJECT-REF
```

Replace `YOUR-PROJECT-REF` with your Supabase project reference (find it in your dashboard URL).

---

## Step 2: Run Database Migrations

```bash
supabase db push
```

This will create:
- 5 new tables (case_feedback, case_actions, case_faces, inventory_matches, notifications)
- RLS policies for security
- Helper function for access control
- Indexes for performance

**Verify migration**:
```bash
supabase db diff
```

Should show "No changes" if successful.

---

## Step 3: Set Supabase Secrets

The OpenAI API key must be stored in Supabase (server-side) for security:

```bash
supabase secrets set OPENAI_API_KEY="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"
```

**Verify**:
```bash
supabase secrets list
```

Should show `OPENAI_API_KEY` in the list.

---

## Step 4: Deploy Edge Functions

Deploy all 7 Edge Functions:

```bash
supabase functions deploy notify-user
supabase functions deploy case-coach
supabase functions deploy case-stage-change
supabase functions deploy case-actions
supabase functions deploy case-face-change
supabase functions deploy inventory-matcher
supabase functions deploy reminder-scheduler
```

**Verify deployment**:
```bash
supabase functions list
```

Should show all 7 functions.

---

## Step 5: Configure Reminder Cron Job

This is **critical** for automatic reminders to work.

### Option A: Via Supabase Dashboard

1. Go to your Supabase Dashboard
2. Click **SQL Editor** in sidebar
3. Click **New Query**
4. Paste this SQL:

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

5. **Replace**:
   - `YOUR-PROJECT-REF` with your project reference
   - `YOUR-SERVICE-ROLE-KEY` with your service role key (from Settings → API)

6. Click **Run**

### Option B: Via Migration (Advanced)

The migration file `20251106000002_setup_reminder_cron.sql` is included but needs manual URL/key configuration.

**Verify cron job**:
```sql
SELECT * FROM cron.job WHERE jobname = 'case-manager-reminders';
```

Should return 1 row.

---

## Step 6: Install Frontend Dependencies

```bash
npm install
```

---

## Step 7: Install Playwright (For Testing)

```bash
npm run playwright:install
```

This downloads Chromium for automated browser testing.

---

## Step 8: Start Development Server

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Step 9: Test the System

1. **Login** to your account
2. **Navigate** to `/app/crm`
3. **Click "Manage"** on any lead
4. **Test stage change**:
   - Click "New Lead" in timeline
   - See CALL_NOW action appear
   - Check notification bell for reminder
5. **Test AI coaching**:
   - Add detailed feedback
   - Submit
   - View AI recommendations
6. **Test meeting scheduler**:
   - Pick a future date/time
   - Submit
   - See reminder actions created

---

## Step 10: Run Tests (Optional)

### Unit Tests
```bash
npm run test:unit
```

### E2E Tests
```bash
npm run test:e2e
```

###Browser Automation
```bash
npx tsx scripts/browser-configure-supabase.ts
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Can access `/app/crm` page
- [ ] "Manage" button appears on lead cards
- [ ] Clicking "Manage" opens Case Manager page
- [ ] Can see stage timeline on left
- [ ] Notification bell shows in header
- [ ] Changing stage to "New Lead" creates CALL_NOW action
- [ ] Adding feedback triggers AI coaching (wait 5-10 sec)
- [ ] Meeting scheduler creates two reminder actions
- [ ] Notifications appear in bell dropdown
- [ ] Can click notification to navigate to case
- [ ] Face change modal loads agent list
- [ ] Activity log shows feedback and actions

---

## 🐛 Common Setup Issues

### Issue: "supabase: command not found"

```bash
npm install -g supabase
```

### Issue: "Error: Not linked to any project"

```bash
supabase link --project-ref YOUR-PROJECT-REF
```

### Issue: "Migration failed: table already exists"

The migration is idempotent. If tables exist, that's OK!

### Issue: "Edge Function deployment fails"

Make sure you're logged in:
```bash
supabase login
```

### Issue: "AI coaching returns error"

1. Check OpenAI API key is set: `supabase secrets list`
2. Check Edge Function logs: `supabase functions logs case-coach`
3. Verify API key has credits

### Issue: "Notifications not appearing"

1. Check notifications table exists in database
2. Check RLS policies are enabled
3. Check browser console for errors
4. Verify user is authenticated

### Issue: "Build fails"

```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

---

## 📚 Next Steps

After setup is complete:

1. **Read the docs**:
   - `docs/CASE_MANAGER_QUICK_START.md` - Usage guide
   - `docs/CASE_MANAGER_WORKFLOWS.md` - Common workflows
   - `docs/case-manager.md` - Complete documentation

2. **Test with real leads**:
   - Start with a few test leads
   - Try different stage transitions
   - Evaluate AI coaching quality
   - Adjust workflows as needed

3. **Train your team**:
   - Show Case Manager interface
   - Demonstrate stage changes
   - Practice with AI coaching
   - Review notification system

4. **Monitor and optimize**:
   - Check Edge Function logs
   - Review notification delivery
   - Analyze AI coaching usage
   - Gather user feedback

---

## 🎉 You're All Set!

The Case Manager is now fully operational. Every lead is a managed case with AI coaching, smart reminders, and automated workflows.

**Start managing cases at `/app/crm`!**

---

## 💬 Support

If you encounter issues:

1. Check documentation in `docs/` folder
2. Review Edge Function logs
3. Check browser console
4. Run verification script: `./scripts/verify-case-manager.sh`
5. Review this guide again

---

**Version**: 1.0.0  
**Last Updated**: November 6, 2024  
**Status**: ✅ Ready to Use

