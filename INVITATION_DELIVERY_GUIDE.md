# Team Invitation Delivery System

## 📧 How Invitations Are Received

The invitation system now uses a smart delivery method based on whether the invitee has an account:

### For EXISTING Users (Have SaleMate Account)
✅ **IN-APP NOTIFICATION** - No email sent!

1. **Invitation Created** - Manager sends invitation via `/app/team`
2. **In-App Notification** - User sees a red badge in the sidebar
3. **Invitations Page** - User clicks "Invitations" menu item
4. **Review & Accept** - User can accept or reject the invitation
5. **Instant Team Join** - Upon acceptance, immediately added to manager's team

**Why In-App?**
- Users are already active on the platform
- Faster response time
- Reduces email spam
- Better user experience
- Real-time updates

### For NEW Users (No SaleMate Account)
📧 **EMAIL NOTIFICATION** - Signup invitation sent!

1. **Invitation Created** - Manager sends invitation via `/app/team`
2. **Email Sent** - Professional invitation email to their inbox
3. **Click Signup Link** - Email contains direct signup link with pre-filled email
4. **Create Account** - User completes signup form
5. **Auto-Join Team** - Database trigger automatically assigns them to manager's team

**Why Email?**
- User doesn't have access to the platform yet
- Need to guide them to create account
- Professional first impression
- Includes team information

## 🎯 User Experience Flow

### Existing User Flow

```
Manager sends invitation
        ↓
Invitation created in database
        ↓
✅ NO EMAIL SENT (In-app only)
        ↓
User logs in / is already logged in
        ↓
Sees notification badge (🔴 1) on "Invitations" menu
        ↓
Clicks "Invitations" in sidebar
        ↓
Views invitation details:
  - Manager name
  - What it means
  - Benefits
  - Expiry date
        ↓
Accepts or Rejects
        ↓
If accepted: Added to team immediately
```

### New User Flow

```
Manager sends invitation
        ↓
Invitation created in database
        ↓
📧 EMAIL SENT to invitee
        ↓
User receives professional email with:
  - Manager's name
  - Team invitation details
  - Signup link (email pre-filled)
  - Expiry information
        ↓
User clicks signup link
        ↓
Lands on signup page with:
  - Email pre-filled & locked
  - Team invitation banner
  - "You've been invited" message
        ↓
Completes signup form
        ↓
Account created
        ↓
Database trigger fires
        ↓
Automatically assigned to manager's team
        ↓
Success! User is part of the team
```

## 🔔 Notification Badge

### Where Users See It
- **Sidebar Menu**: Red badge on "Invitations" menu item
- **Count Display**: Shows number of pending invitations
- **Auto-Refresh**: Updates every 30 seconds
- **Animated**: Pulsing animation to draw attention

### Badge Behavior
- **Badge appears** when user has pending invitations
- **Shows count** (1, 2, 3, etc.)
- **Disappears** when all invitations are processed
- **Both views**: Shows in collapsed & expanded sidebar

## 📱 Invitations Page (`/app/invitations`)

### Features
- Lists all pending team invitations
- Shows manager information
- Displays expiry dates
- Accept/Reject buttons
- Beautiful card-based UI
- Real-time updates

### What Users See
1. **Manager Details**: Name and email of person who invited them
2. **Benefits List**: What they'll get by joining
3. **Expiry Information**: How long invitation is valid
4. **Accept/Reject Actions**: Clear call-to-action buttons
5. **Processing Feedback**: Loading states and success messages

## 🔧 Technical Implementation

### Database
- Invitations stored in `team_invitations` table
- Status: `pending`, `accepted`, `rejected`, `expired`
- 7-day expiration
- Unique tokens for security

### Edge Function
```typescript
// Logic in send-team-invitation function
if (!existingUser) {
  // NEW USER: Send email
  sendEmail(invitee_email, invitationDetails);
} else {
  // EXISTING USER: In-app only
  console.log('In-app invitation created for:', existingUser.name);
}
```

### Frontend Components
1. **Sidebar.tsx** - Notification badge & menu item
2. **MyInvitations.tsx** - Full invitations page
3. **AcceptInvitation.tsx** - Standalone acceptance page (for email links)
4. **Signup.tsx** - Updated to handle invitation tokens

### Auto-Assignment Trigger
```sql
CREATE TRIGGER auto_assign_manager_on_signup
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_pending_invitations_on_signup();
```

This trigger automatically:
- Checks for pending invitations on signup
- Assigns manager_id if invitation exists
- Marks invitation as accepted
- All happens seamlessly during account creation

## 📊 Manager Dashboard

### Invitation Tracking
- **Pending Invites Card**: Shows count of pending invitations
- **Invitations List**: Click to expand and see all
- **Cancel Feature**: Remove invitations if needed
- **Status Tracking**: See accepted/rejected/expired status

### What Managers See
```
When inviting existing user:
  ✅ "In-app invitation created for John Doe"
  → User will see it when they log in

When inviting new user:
  📧 "Email sent to john@example.com"
  → Check email for invitation link
```

## 🎨 UI Components

### Notification Badge (Sidebar)
```tsx
// Red badge with count
{hasBadge && (
  <div className="bg-red-500 text-white rounded-full animate-pulse">
    {item.badge}
  </div>
)}
```

### Invitation Card
- Gradient header with manager info
- Benefit list with checkmarks
- Expiry countdown
- Accept/Reject buttons
- Loading states

## 🔐 Security

### RLS Policies
- Users can only see invitations sent to their email
- Managers can only see invitations they sent
- Tokens are unique and secure
- Expiry checks on all operations

### Validation
- Email format validation
- Duplicate prevention (can't invite same person twice)
- Self-invitation prevention
- Already-in-team check

## 📈 Future Enhancements

Potential improvements:
1. **Push Notifications**: Browser/mobile push when invited
2. **Email Digest**: Weekly summary of pending invitations
3. **Invitation History**: See all past invitations
4. **Custom Messages**: Managers can add personal notes
5. **Batch Invitations**: Invite multiple people at once
6. **Analytics**: Track acceptance rates

## 🧪 Testing

### Test Scenarios

#### Test 1: Invite Existing User
1. Login as manager
2. Go to `/app/team`
3. Click "Invite Member"
4. Enter email of existing user
5. ✅ Check: NO email sent
6. Login as that user
7. ✅ Check: See red badge on "Invitations"
8. Click "Invitations"
9. ✅ Check: See invitation card
10. Click "Accept"
11. ✅ Check: Added to team

#### Test 2: Invite New User
1. Login as manager
2. Go to `/app/team`
3. Click "Invite Member"
4. Enter email of non-existent user
5. ✅ Check: Email sent (or logged in development)
6. Open signup link
7. ✅ Check: Email pre-filled
8. Complete signup
9. ✅ Check: Automatically in manager's team

#### Test 3: Notification Badge
1. Have pending invitation
2. Login
3. ✅ Check: Red badge appears
4. Click "Invitations"
5. Accept invitation
6. ✅ Check: Badge disappears

## 🎯 Summary

| Aspect | Existing Users | New Users |
|--------|---------------|-----------|
| **Delivery** | In-app notification | Email |
| **Location** | `/app/invitations` page | Signup link in email |
| **Visibility** | Red badge in sidebar | Email inbox |
| **Speed** | Instant | Depends on email |
| **Action** | Accept/Reject | Sign up → Auto-join |
| **Follow-up** | None needed | Account creation required |

## ✅ Benefits of This Approach

1. **Reduced Email Spam** - Existing users don't get unnecessary emails
2. **Better UX** - In-app is faster and more engaging
3. **Onboarding** - New users get proper welcome email
4. **Flexibility** - Different flows for different user types
5. **Real-time** - Existing users see invitations immediately
6. **Professional** - New users get branded invitation email

---

**Status:** ✅ Fully Implemented and Deployed
**Last Updated:** October 15, 2024

