# Admin Panel & CMS Documentation

## Overview

The SaleMate Admin Panel provides comprehensive administration tools for managing users, content, analytics, and platform settings. The CMS system allows administrators to manage email templates, SMS templates, marketing content, and banners without code changes.

## Access Control

### Roles
- **Admin**: Full access to all features
- **Support**: Access to support panel and user management
- **Manager**: Access to team management and lead assignments
- **User**: Standard user access

### Authentication
All admin routes require authentication and role verification. Access is controlled via `RoleGuard` components.

## Admin Panel Structure

### Dashboard (`/app/admin/dashboard`)
- Key Performance Indicators (KPIs)
- Revenue charts and analytics
- User growth metrics
- Recent activity feed
- Quick action buttons

### User Management (`/app/admin/users`)

#### Features
- View all users with search and filtering
- Change user roles (user → manager → admin)
- Suspend/ban users
- View user details (wallet balance, leads, activity)
- Bulk operations (ban, delete, role change)
- Create new users
- Export user data

#### Usage
1. Navigate to User Management
2. Use search to find specific users
3. Click on a user to view/edit details
4. Use bulk actions for multiple users
5. Click "Create User" to add new users

### Wallet Management (`/app/admin/wallets`)

#### Features
- View all wallet topup requests
- Approve/reject topup requests
- View receipt images
- Add admin notes
- Adjust wallet balances manually
- View transaction history

#### Workflow
1. User submits topup request with receipt
2. Admin reviews request in Wallet Management
3. Admin views receipt image
4. Admin approves or rejects with notes
5. Wallet balance is updated automatically on approval

### Purchase Requests (`/app/admin/purchases`)

#### Features
- View all purchase requests
- Filter by status (pending, approved, rejected)
- Approve/reject purchase requests
- View receipt images
- Bulk approve/reject
- Assign leads after approval
- Export purchase data

#### Workflow
1. User submits purchase request
2. Admin reviews in Purchase Requests
3. Admin views receipt and validates
4. Admin approves request
5. Leads are automatically assigned to user
6. User receives notification

### Lead Management (`/app/admin/leads`)

#### Features
- View all leads in the system
- Filter by project, status, assignee
- Bulk lead operations
- Assign leads to users
- Export lead data
- Lead upload via CSV

### Projects (`/app/admin/projects`)

#### Features
- Create/edit/delete projects
- Upload project images
- Set pricing (CPL - Cost Per Lead)
- Manage available leads
- Set project details (developer, region, description)

### Financial Reports (`/app/admin/financial`)

#### Features
- Revenue charts (daily, weekly, monthly)
- Top users by spending
- Top projects by revenue
- Transaction history
- Export financial data
- Date range filtering

### Analytics (`/app/admin/analytics`)

#### Features
- User growth charts
- Revenue trends
- Project performance metrics
- Role distribution
- Lead statistics
- Custom date ranges

### Audit Logs (`/app/admin/system/audit`)

#### Features
- View all system actions
- Filter by action type, entity, user
- Search audit logs
- Export audit data
- Real-time updates

## CMS Features

### Email Templates (`/app/admin/cms/emails`)

#### Creating Templates
1. Click "Create Template"
2. Enter template key (unique identifier)
3. Enter template name
4. Write subject line (supports variables like `{{name}}`)
5. Write HTML body using rich text editor
6. Define available variables
7. Save template

#### Variables
Templates support dynamic variables:
- `{{name}}` - User name
- `{{email}}` - User email
- `{{phone}}` - User phone
- `{{project}}` - Project name
- `{{amount}}` - Transaction amount
- `{{date}}` - Current date

#### Testing Templates
1. Click "Send Test Email" on any template
2. Enter recipient email
3. Provide test variables (optional)
4. Click "Send Test"
5. Check recipient inbox

### SMS Templates (`/app/admin/cms/sms`)

#### Creating Templates
1. Click "Create Template"
2. Enter template key
3. Enter template name
4. Write SMS message (160 character limit for single message)
5. Character counter shows current length
6. Define available variables
7. Save template

#### SMS Best Practices
- Keep messages under 160 characters for single SMS
- Use variables to personalize messages
- Test before deploying
- Check character count before sending

#### Testing Templates
1. Click "Send Test SMS" on any template
2. Enter recipient phone number
3. Provide test variables
4. Click "Send Test"
5. Check recipient phone

### Marketing Content (`/app/admin/cms/marketing`)

#### Creating CMS Pages
1. Click "Create Page"
2. Enter URL slug (e.g., "about-us")
3. Enter page title
4. Write content using rich text editor
5. Add meta description and keywords
6. Set status (draft or published)
7. Save page

#### Publishing Workflow
1. Create page as draft
2. Preview content
3. Edit as needed
4. Change status to "published"
5. Page is now live

#### Page Structure
- **Slug**: URL path (e.g., `/about-us`)
- **Title**: Page title
- **Content**: Rich text content
- **Meta**: SEO metadata
- **Status**: Draft or Published

### Banners (`/app/admin/cms/banners`)

#### Creating Banners
1. Click "Create Banner"
2. Upload banner image
3. Set title and description
4. Add link URL (optional)
5. Set placement (top, middle, bottom)
6. Set target audience (roles)
7. Set start/end dates
8. Set priority (lower = higher priority)
9. Set status (draft or live)
10. Save banner

#### Banner Targeting
- **Placement**: Where banner appears (top, middle, bottom)
- **Audience**: Which user roles see the banner
- **Dates**: When banner is active
- **Priority**: Display order (lower numbers first)

#### Banner Display
Banners automatically appear on user dashboard based on:
- Status is "live"
- Current date is within start/end range
- User role matches audience
- Placement setting

## Platform Settings (`/app/admin/cms/settings`)

### Feature Flags

Enable or disable features across the platform:
- Toggle features on/off
- Features are checked in real-time
- Changes take effect immediately

### System Configuration

Manage platform-wide settings:
- Payment gateway settings
- Branding options
- Email/SMS service configuration
- Security settings
- API keys

#### Adding Settings
1. Go to "Settings" tab
2. Click "Add Setting"
3. Enter setting key (e.g., "payment_gateway_url")
4. Enter setting value
5. Add description (optional)
6. Save

#### Updating Settings
1. Find setting in list
2. Edit value using key-value editor
3. Changes are saved automatically

## Best Practices

### User Management
- Always verify user identity before role changes
- Use ban sparingly - prefer warnings first
- Document admin actions in notes
- Export data before bulk deletions

### Wallet Management
- Always verify receipt images
- Add notes for rejected requests
- Verify amounts match receipts
- Check for duplicate requests

### Purchase Requests
- Verify receipt authenticity
- Check project availability before approval
- Ensure sufficient leads in inventory
- Document approval/rejection reasons

### CMS Templates
- Use descriptive template keys
- Test templates before publishing
- Document available variables
- Keep templates up to date
- Archive unused templates

### Banners
- Use high-quality images
- Set appropriate expiration dates
- Test banners on different devices
- Monitor click-through rates
- Remove expired banners

### Security
- Never share admin credentials
- Use audit logs to track actions
- Review audit logs regularly
- Enable 2FA for admin accounts
- Rotate API keys periodically

## Troubleshooting

### Users Not Appearing
- Check role filters
- Verify search terms
- Check if user is banned
- Refresh page

### Templates Not Sending
- Verify email/SMS service is configured
- Check template variables
- Verify recipient addresses/phones
- Check service logs

### Banners Not Showing
- Verify banner status is "live"
- Check date range
- Verify user role matches audience
- Check placement setting

### Settings Not Saving
- Verify admin role
- Check browser console for errors
- Verify setting key format
- Check database connection

## API Integration

### Edge Functions

The admin panel uses several edge functions:
- `cms-preview` - Preview draft content
- `send-test-email` - Send test emails
- `send-test-sms` - Send test SMS
- `config-update` - Update system settings

### Database Tables

Key tables used:
- `profiles` - User information
- `wallet_topup_requests` - Topup requests
- `purchase_requests` - Purchase requests
- `email_templates` - Email templates
- `sms_templates` - SMS templates
- `cms_pages` - CMS pages
- `dashboard_banners` - Banners
- `system_settings` - Platform settings
- `feature_flags` - Feature toggles
- `audit_logs` - Audit trail

## Support

For issues or questions:
1. Check this documentation
2. Review audit logs
3. Contact technical support
4. Check system health dashboard

---

**Last Updated**: November 2024
**Version**: 1.0.0
