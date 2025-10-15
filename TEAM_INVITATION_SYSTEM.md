# Team Invitation System - Complete Implementation

## Overview
A comprehensive team invitation system has been implemented that allows managers to invite people to join their team via email, whether they have a SaleMate account or not.

## Features

### 1. Email-Based Invitations
- Managers can invite people by email address
- System automatically detects if the invitee already has an account
- Different workflows for existing users vs new users

### 2. For Existing Users
- Receive an email with a unique invitation link
- Click the link to view invitation details
- Can accept or reject the invitation
- Upon acceptance, they are added to the manager's team

### 3. For New Users
- Receive an email with a signup link pre-filled with their email
- Create their account with the invitation token
- Automatically added to the manager's team upon signup
- Database trigger handles the automatic assignment

### 4. Manager Dashboard
- View all team members
- See pending invitations
- Cancel invitations if needed
- Track invitation status (pending, accepted, rejected, expired)

## Implementation Details

### Database Schema

#### New Table: `team_invitations`
```sql
CREATE TABLE team_invitations (
  id UUID PRIMARY KEY,
  manager_id UUID REFERENCES profiles(id),
  invitee_email TEXT,
  invitee_user_id UUID REFERENCES profiles(id),
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  token TEXT UNIQUE,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### Database Functions
- `accept_team_invitation(invitation_token)` - Accept an invitation
- `reject_team_invitation(invitation_token)` - Reject an invitation
- `check_pending_invitations_on_signup()` - Trigger function for auto-assignment
- `cleanup_expired_invitations()` - Clean up expired invitations

### Edge Function: `send-team-invitation`

Location: `/supabase/functions/send-team-invitation/index.ts`

**Responsibilities:**
- Validate manager permissions (must be manager or admin)
- Check if user is already in the team
- Generate unique invitation token
- Create invitation record in database
- Send invitation email (template included)
- Return invitation URL

**Request:**
```json
{
  "invitee_email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invitation sent successfully",
  "invitation_url": "https://salemate-eg.com/app/team/accept-invitation?token=...",
  "has_account": true
}
```

### Frontend Components

#### 1. Updated TeamPage (`/src/pages/Team/TeamPage.tsx`)
**New Features:**
- Email input for invitations (replaced user ID input)
- Pending invitations section
- Invitation statistics card
- Cancel invitation functionality

**Key Methods:**
- `inviteUserByEmail(email)` - Send invitation via edge function
- `cancelInvitation(invitationId)` - Cancel pending invitation
- `fetchInvitations()` - Load all invitations

#### 2. AcceptInvitation Page (`/src/pages/Team/AcceptInvitation.tsx`)
**Route:** `/app/team/accept-invitation?token=xxx`

**Features:**
- Validates invitation token
- Checks invitation expiry
- Displays invitation details
- Accept/Reject actions
- Beautiful UI with manager information

**Flow:**
1. User clicks email link
2. System validates they're logged in (redirects to login if not)
3. Verifies invitation is for their email
4. Shows invitation details
5. User accepts or rejects
6. Updates database and redirects appropriately

#### 3. Updated Signup Page (`/src/pages/Auth/Signup.tsx`)
**New Features:**
- Detects invitation parameters in URL: `?invitation=token&email=user@example.com`
- Pre-fills email field and locks it
- Shows invitation notice banner
- Custom success message for invited users

**URL Parameters:**
- `invitation` - Invitation token
- `email` - Pre-filled email address

### Team Store Updates (`/src/store/team.ts`)

**New State:**
```typescript
interface TeamState {
  invitations: TeamInvitation[];
  fetchInvitations(): Promise<void>;
  inviteUserByEmail(email: string): Promise<boolean>;
  cancelInvitation(invitationId: string): Promise<boolean>;
}
```

**New Interface:**
```typescript
interface TeamInvitation {
  id: string;
  manager_id: string;
  invitee_email: string;
  invitee_user_id: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}
```

## User Flows

### Flow 1: Manager Invites Existing User
1. Manager goes to `/app/team`
2. Clicks "Invite Member"
3. Enters user's email
4. System sends invitation email
5. User receives email, clicks link
6. User sees invitation page at `/app/team/accept-invitation?token=xxx`
7. User clicks "Accept Invitation"
8. User is added to manager's team
9. User redirected to their team page

### Flow 2: Manager Invites New User
1. Manager goes to `/app/team`
2. Clicks "Invite Member"
3. Enters email (user doesn't have account)
4. System sends invitation email
5. User receives email, clicks link
6. User lands on `/auth/signup?invitation=xxx&email=user@example.com`
7. User fills out signup form (email pre-filled)
8. Upon successful signup, database trigger automatically assigns manager
9. User redirected to login, then to dashboard

### Flow 3: Manager Views/Manages Invitations
1. Manager goes to `/app/team`
2. Clicks on "Pending Invites" stat card
3. Sees list of all pending invitations
4. Can cancel any invitation
5. Sees invitation dates and expiry

## Email Templates

### Invitation Email
Professional HTML email template included in the edge function with:
- SaleMate branding
- Manager name display
- Accept/Create Account button
- Expiry information
- Different messaging for existing vs new users

## Security Features

### Row Level Security (RLS)
- Managers can only view/manage their own invitations
- Users can view invitations sent to their email
- Users can only update invitations sent to them

### Validation
- Email format validation
- Manager permission check (must be manager or admin)
- Can't invite yourself
- Can't invite someone already in your team
- Token must match invitee's email
- Invitation must be pending and not expired

### Token Generation
- Cryptographically secure tokens using `crypto.randomUUID()`
- Unique tokens for each invitation
- 7-day expiration

## Migration

To apply this update to your database:

```bash
# If using Supabase CLI
supabase db push

# Or apply the migration manually
psql -f supabase/migrations/20241015000000_create_team_invitations.sql
```

## Testing

### Test Scenarios
1. ✅ Manager invites existing user
2. ✅ Manager invites new user
3. ✅ User accepts invitation
4. ✅ User rejects invitation
5. ✅ Manager cancels invitation
6. ✅ Invitation expires
7. ✅ User tries to use expired token
8. ✅ User tries to use someone else's invitation
9. ✅ Manager tries to invite team member twice
10. ✅ Manager tries to invite themselves

### Test Data
```sql
-- View all invitations
SELECT * FROM team_invitations;

-- View pending invitations for a manager
SELECT * FROM team_invitations 
WHERE manager_id = 'YOUR_MANAGER_ID' 
AND status = 'pending';

-- Clean up expired invitations
SELECT cleanup_expired_invitations();
```

## Email Service Configuration (Optional)

The current implementation logs emails to console for development. To send actual emails:

### Option 1: SendGrid
Add to your Supabase edge function environment:
```env
SENDGRID_API_KEY=your_api_key
```

Uncomment the SendGrid code in `/supabase/functions/send-team-invitation/index.ts`

### Option 2: Other Email Services
- Mailgun
- AWS SES
- Postmark
- Resend

Update the email sending logic in the edge function accordingly.

## Monitoring & Maintenance

### Cleanup Script
Run periodically to mark expired invitations:
```sql
SELECT cleanup_expired_invitations();
```

### Analytics Queries
```sql
-- Invitation acceptance rate
SELECT 
  COUNT(CASE WHEN status = 'accepted' THEN 1 END)::float / 
  COUNT(*)::float * 100 as acceptance_rate
FROM team_invitations;

-- Invitations by manager
SELECT 
  p.name,
  COUNT(*) as total_invitations,
  COUNT(CASE WHEN ti.status = 'accepted' THEN 1 END) as accepted
FROM team_invitations ti
JOIN profiles p ON p.id = ti.manager_id
GROUP BY p.name
ORDER BY total_invitations DESC;
```

## Future Enhancements

### Potential Features
1. **Bulk Invitations** - Import CSV of emails
2. **Custom Messages** - Allow managers to add personal notes
3. **Role Assignment** - Specify role when inviting (user/manager)
4. **Invitation Templates** - Pre-saved invitation messages
5. **Reminder Emails** - Auto-remind after X days
6. **Team Capacity Limits** - Restrict team size based on plan
7. **Invitation Analytics** - Track who invites the most, acceptance rates
8. **Mobile App Support** - Deep links for mobile apps

## Troubleshooting

### Common Issues

**Problem:** Invitation email not received
- Check spam folder
- Verify email address is correct
- Check edge function logs for errors
- Ensure email service is configured

**Problem:** "Invalid invitation" error
- Check if invitation has expired
- Verify token matches URL exactly
- Check if invitation was already accepted/rejected
- Ensure user is logged in with correct account

**Problem:** User not added to team after signup
- Verify email matches invitation exactly (case-sensitive)
- Check if trigger is enabled: `SELECT * FROM pg_trigger WHERE tgname = 'auto_assign_manager_on_signup';`
- Check database logs for trigger errors

**Problem:** Manager can't send invitations
- Verify user has 'manager' or 'admin' role
- Check RLS policies are enabled
- Check edge function permissions

## Support

For issues or questions:
1. Check this documentation
2. Review database logs
3. Check edge function logs in Supabase
4. Contact support at support@salemate-eg.com

---

**Implementation Date:** October 15, 2024
**Version:** 1.0.0
**Status:** ✅ Production Ready

