# Team Invitation System - Quick Setup Guide

## ✅ Implementation Complete

A comprehensive team invitation system has been successfully implemented for managers to invite team members via email.

## 🚀 Quick Start

### 1. Apply Database Migration

Run the database migration to create the necessary tables and functions:

```bash
# Navigate to your project directory
cd "/Users/martin2/Desktop/Sale Mate Final"

# If using Supabase CLI (recommended)
supabase db push

# Or run the migration manually
psql YOUR_DATABASE_URL -f supabase/migrations/20241015000000_create_team_invitations.sql
```

### 2. Deploy Edge Function

Deploy the team invitation edge function:

```bash
# Deploy the send-team-invitation function
supabase functions deploy send-team-invitation

# Verify deployment
supabase functions list
```

### 3. Test the System

1. **Login as a Manager:**
   - Go to `http://localhost:3000/app/team` (or your production URL)
   - You should see the updated team page with "Invite Member" button

2. **Send an Invitation:**
   - Click "Invite Member"
   - Enter an email address
   - Click "Send Invitation"
   - Check the console/logs for the invitation URL (until email is configured)

3. **Accept Invitation (Existing User):**
   - Copy the invitation URL from logs
   - Open in a new browser/incognito window
   - Login with the invited user's account
   - Accept the invitation

4. **Sign Up with Invitation (New User):**
   - Copy the signup URL from logs
   - Open in a new browser/incognito window
   - Complete the signup form
   - User will automatically be added to the manager's team

## 📋 What Was Implemented

### Database
- ✅ `team_invitations` table with RLS policies
- ✅ `accept_team_invitation()` function
- ✅ `reject_team_invitation()` function
- ✅ Auto-assignment trigger on signup
- ✅ Invitation cleanup function

### Backend
- ✅ Edge function: `send-team-invitation`
- ✅ Email template (inline HTML)
- ✅ Security validations
- ✅ Token generation

### Frontend
- ✅ Updated TeamPage with email invitations
- ✅ Pending invitations section
- ✅ AcceptInvitation page
- ✅ Updated Signup flow
- ✅ Team store with invitation methods
- ✅ Route configuration

## 🎯 Key Features

### For Managers:
1. **Invite by Email** - Simply enter an email address
2. **Track Invitations** - See all pending, accepted, and rejected invitations
3. **Cancel Invitations** - Remove pending invitations anytime
4. **View Statistics** - See team size and pending invites at a glance

### For Invitees:

**If they have an account:**
- Receive email with invitation link
- View invitation details
- Accept or reject
- Instantly join the team

**If they don't have an account:**
- Receive email with signup link
- Email pre-filled in signup form
- Automatically join team after signup
- No extra steps needed

## 📧 Email Configuration (Optional)

Currently, the system logs invitation details to the console for development. To send actual emails:

### Using SendGrid (Recommended)

1. **Get SendGrid API Key:**
   - Sign up at https://sendgrid.com
   - Create an API key with "Mail Send" permissions

2. **Set Environment Variable:**
   ```bash
   # In Supabase dashboard: Settings → Edge Functions → Secrets
   SENDGRID_API_KEY=your_api_key_here
   ```

3. **Uncomment Email Code:**
   - Open `/supabase/functions/send-team-invitation/index.ts`
   - Find the commented SendGrid section (around line 171)
   - Uncomment the code block

4. **Redeploy Function:**
   ```bash
   supabase functions deploy send-team-invitation
   ```

## 🔍 Verification Checklist

- [ ] Database migration applied successfully
- [ ] Edge function deployed
- [ ] Can access `/app/team` as manager
- [ ] "Invite Member" button visible
- [ ] Can enter email and send invitation
- [ ] Invitation appears in "Pending Invites"
- [ ] Can click "Pending Invites" to view details
- [ ] Can cancel invitations
- [ ] Invitation URL works (check console for now)
- [ ] Accept invitation page loads
- [ ] Signup with invitation works
- [ ] User auto-assigned to team

## 📊 Database Queries for Verification

```sql
-- Check if table was created
SELECT * FROM team_invitations LIMIT 1;

-- View all functions
SELECT proname FROM pg_proc WHERE proname LIKE '%invitation%';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'team_invitations';

-- View pending invitations
SELECT * FROM team_invitations WHERE status = 'pending';

-- Test invitation acceptance (as a user)
SELECT accept_team_invitation('YOUR_TOKEN_HERE');
```

## 🐛 Troubleshooting

### Migration Fails
```bash
# Check current schema
supabase db diff

# Reset if needed (CAUTION: loses data)
supabase db reset
```

### Edge Function Not Working
```bash
# View function logs
supabase functions logs send-team-invitation

# Test function directly
supabase functions invoke send-team-invitation --body '{"invitee_email":"test@example.com"}'
```

### Invitations Not Showing
- Check browser console for errors
- Verify user is logged in as manager
- Check network tab for API calls
- Verify RLS policies are enabled

### Auto-Assignment Not Working
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'auto_assign_manager_on_signup';

-- Re-create trigger if needed
DROP TRIGGER IF EXISTS auto_assign_manager_on_signup ON profiles;
-- Then re-run the migration
```

## 📱 Testing Checklist

### As Manager:
- [ ] Send invitation to existing user
- [ ] Send invitation to new user
- [ ] View pending invitations
- [ ] Cancel an invitation
- [ ] Try to invite same person twice (should fail)
- [ ] Try to invite yourself (should fail)

### As Existing User:
- [ ] Receive invitation (check console URL for now)
- [ ] Open invitation page
- [ ] Accept invitation
- [ ] Verify added to team
- [ ] Reject an invitation

### As New User:
- [ ] Open signup link from invitation
- [ ] See invitation banner
- [ ] Email is pre-filled and locked
- [ ] Complete signup
- [ ] Verify automatically added to team

## 🎉 You're All Set!

The team invitation system is fully implemented and ready to use. Managers can now easily build their teams by inviting people via email, with seamless workflows for both existing and new users.

For detailed documentation, see `TEAM_INVITATION_SYSTEM.md`.

## 📞 Need Help?

If you encounter any issues:
1. Check the troubleshooting section above
2. Review the full documentation in `TEAM_INVITATION_SYSTEM.md`
3. Check Supabase logs for errors
4. Verify all environment variables are set

---

**Status:** ✅ Ready for Testing
**Next Steps:** 
1. Apply database migration
2. Deploy edge function  
3. Test the workflow
4. Configure email service (optional)

