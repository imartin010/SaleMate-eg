# SaleMate Platform - Complete Documentation

## Executive Summary

**SaleMate** is Egypt's premier real estate lead management and marketplace platform that connects real estate brokers with verified property leads. The platform facilitates lead purchasing, CRM management, team collaboration, and performance tracking for real estate professionals.

---

## Platform Overview

### What SaleMate Does

SaleMate is a B2B SaaS platform that:

1. **Aggregates Real Estate Leads** from various sources (Facebook Ads, Google Ads, property developers)
2. **Sells Leads to Brokers** through a marketplace system with wallet-based payments
3. **Provides CRM Tools** for lead management and tracking
4. **Enables Team Management** with manager-agent hierarchy
5. **Tracks Performance** through analytics and reporting
6. **Facilitates Deals** between brokers and developers
7. **Manages Partnerships** with property developers and advertisers

### Target Users

**Primary Users:**
- Real estate brokers in Egypt
- Real estate agencies
- Property sales agents
- Team managers
- Marketing agencies

**Secondary Users:**
- Property developers (partners)
- Support staff
- Platform administrators

---

## Core Business Model

### Revenue Streams

1. **Lead Sales** (Primary Revenue)
   - Brokers purchase leads from the marketplace
   - Pricing: Cost Per Lead (CPL) set per project
   - Payment: Wallet-based system (prepaid credits)
   - Commission: Platform fee on each lead sold

2. **Premium Features** (Future)
   - Advanced analytics
   - Priority lead access
   - Team management tools
   - API access

3. **Developer Partnerships**
   - Developers pay for lead generation campaigns
   - Revenue share on closed deals
   - Featured project placements

### Transaction Flow

```
Developer → Runs Ads → Generates Leads → SaleMate Platform
                                              ↓
                                    Stores & Verifies Leads
                                              ↓
                                    Lists in Marketplace
                                              ↓
Broker → Browses Projects → Purchases Leads → Pays from Wallet
                                              ↓
                                    Broker Works Leads in CRM
                                              ↓
                                    Tracks to Closing
                                              ↓
                    Developer + Broker Close Deal → Commission
```

---

## User Roles & Permissions

### 1. Admin Role

**Who:** Platform administrators
**Access:** Full system access

**Capabilities:**
- ✅ View all users, leads, projects, deals
- ✅ Manage all data (create, read, update, delete)
- ✅ Upload leads to projects
- ✅ Set project pricing (CPL)
- ✅ Approve/reject wallet top-up requests
- ✅ Approve/reject lead purchase requests
- ✅ Manage user roles and permissions
- ✅ Access admin panel
- ✅ View all analytics and reports
- ✅ Manage partnerships
- ✅ Purchase leads for any user
- ✅ Assign leads to any user
- ✅ Ban/unban users
- ✅ Manage support tickets
- ✅ Default manager for all orphaned users

**Admin Panel Sections:**
- Dashboard (system overview, statistics)
- User Management (all users, roles, teams)
- Lead Management (upload, assign, manage)
- Project Management (create, edit, set pricing)
- Purchase Requests (approve/reject lead purchases)
- Wallet Requests (approve/reject top-ups)
- Analytics & Reports
- Partner Management
- Support Ticket Management
- System Settings

### 2. Support Role

**Who:** Customer support staff
**Access:** Support panel + limited admin access

**Capabilities:**
- ✅ View all users and their data
- ✅ View all leads and projects
- ✅ Help users troubleshoot issues
- ✅ Manage support tickets
- ✅ View (not edit) wallet transactions
- ✅ View (not approve) purchase requests
- ❌ Cannot purchase leads
- ❌ Cannot approve financial transactions
- ❌ Cannot change user roles
- ❌ Cannot delete data

**Support Panel Sections:**
- Support Tickets
- User Lookup
- Lead Lookup
- Activity Logs
- Help Documentation

### 3. Manager Role

**Who:** Agency owners, team leaders
**Access:** Manager dashboard + team management

**Capabilities:**
- ✅ Manage their team members (invite, remove)
- ✅ View team's leads and activity
- ✅ Purchase leads for themselves and team members
- ✅ Assign purchased leads to team members
- ✅ View team performance analytics
- ✅ Track team's deals
- ✅ Manage team's wallet (if enabled)
- ❌ Cannot see other managers' teams
- ❌ Cannot access admin panel
- ❌ Cannot manage users outside their team

**Manager Features:**
- Team Dashboard
- Team Member Management
- Lead Assignment
- Team Analytics
- Bulk Lead Purchase
- Performance Tracking

### 4. User Role  

**Who:** Individual brokers, sales agents
**Access:** Personal dashboard only

**Capabilities:**
- ✅ Purchase leads for themselves
- ✅ View leads assigned to them
- ✅ Manage their leads in CRM
- ✅ Update lead status and feedback
- ✅ View their deals
- ✅ Top up their wallet
- ✅ View their analytics
- ✅ Contact support
- ❌ Cannot see other users' data
- ❌ Cannot purchase for others
- ❌ Cannot invite team members

**User Features:**
- Personal Dashboard
- My Leads (CRM)
- Shop (Marketplace)
- My Deals
- My Wallet
- My Analytics
- Support Tickets

---

## Core Features & Functionality

### 1. Authentication System ✅ (Newly Built)

**Registration:**
- Mandatory fields: Full Name, Email, Phone Number, Password
- Phone verification via SMS OTP (Twilio)
- 6-digit OTP code
- 5-minute expiration
- SMS sender: "SaleMate"
- Auto profile creation
- Auto manager assignment (UUID: 11111111-1111-1111-1111-111111111111)

**Login:**
- Email & Password
- Remember Me (30-day session)
- Optional 2FA (Phone OTP)
- Forgot Password flow

**Security:**
- SHA-256 OTP hashing
- Rate limiting (3 attempts per 15 min)
- Session management
- RLS policies
- Role-based access control

### 2. Lead Marketplace (Shop)

**Purpose:** Brokers browse and purchase leads from available projects

**Features:**
- Project listings with:
  - Project name, developer, region
  - Available lead count
  - Price per lead (CPL)
  - Project images/logos
  - Lead quality indicators
- Filter by:
  - Region (Cairo, Alex, etc.)
  - Developer
  - Price range
  - Availability
- Search functionality
- Sort options (price, availability, popularity)

**Purchase Flow:**
```
1. Browse projects in marketplace
2. Select quantity of leads
3. Review order (quantity × CPL = total)
4. Confirm purchase
5. Deduct from wallet
6. Leads assigned to buyer
7. Accessible in CRM
```

**Purchase Options:**
- Buy for self (all roles)
- Buy for team member (manager/admin only)
- Bulk purchase (managers)

### 3. CRM (Lead Management)

**Purpose:** Manage purchased leads through sales pipeline

**Lead Information:**
- Client name
- Phone numbers (primary + 2 additional)
- Email address
- Job title
- Source platform (Facebook, Google, etc.)
- Project/development
- Stage in pipeline
- Notes/feedback
- Assignment (who owns the lead)
- Purchase date
- Last contact date

**Pipeline Stages:**
1. New (just purchased)
2. Contacted (first call made)
3. Qualified (interested buyer)
4. Viewing Scheduled
5. Viewing Done
6. Negotiating
7. Closed Won (deal made!)
8. Closed Lost (deal failed)
9. No Answer
10. Not Interested

**CRM Features:**
- Lead cards/table view
- Filter by stage, project, date
- Search leads
- Update lead stage
- Add feedback/notes
- Call tracking
- Lead assignment
- Export data
- Performance metrics

**Lead Actions:**
- Update stage
- Add notes
- Mark as won/lost
- Reassign to team member (managers)
- View history
- Contact client

### 4. Team Management

**Purpose:** Managers build and manage sales teams

**Features:**
- Invite team members via email
- Team member list
- Performance overview
- Lead assignment to team
- Team analytics
- Remove team members

**Team Hierarchy:**
```
Manager (UUID: X)
  ├── Agent 1 (manager_id = X)
  ├── Agent 2 (manager_id = X)
  └── Agent 3 (manager_id = X)

Admin (UUID: 11111111-1111-1111-1111-111111111111)
  ├── All orphaned users
  ├── All managers (can see everyone)
  └── All individual users without manager
```

**Team Invitation Flow:**
1. Manager sends invitation (email + unique token)
2. Invitee receives email with signup link
3. Invitee signs up (with OTP)
4. Automatically assigned to manager's team
5. Manager can now assign leads and track performance

### 5. Wallet System

**Purpose:** Prepaid credit system for purchasing leads

**Wallet Features:**
- Balance tracking (EGP currency)
- Top-up requests
- Transaction history
- Purchase deductions
- Refunds (admin only)

**Top-Up Flow:**
```
1. User requests top-up
2. Selects payment method (Instapay, Vodafone Cash, Bank Transfer)
3. Uploads receipt
4. Admin reviews and validates
5. Admin approves → wallet credited
6. Admin rejects → user notified
```

**Transaction Types:**
- Credit: Wallet top-up approved
- Debit: Lead purchase
- Refund: Admin-initiated refund
- Adjustment: Admin correction

### 6. Deals Management

**Purpose:** Track opportunities and closings with developers

**Deal Information:**
- Deal name
- Client info
- Developer/project
- Unit details
- Price
- Commission
- Status (pending, closed, cancelled)
- Documents/files
- Timeline

**Deal Stages:**
- Lead Generated
- Client Interested
- Viewing Scheduled
- Offer Made
- Negotiating
- Contract Signed
- Deal Closed
- Commission Paid

### 7. Analytics & Reporting

**Purpose:** Performance tracking and insights

**Metrics Tracked:**
- Total leads purchased
- Leads by stage
- Conversion rates
- Revenue generated
- Active leads
- Closed deals
- Response rates
- Time to close
- ROI analysis

**Report Types:**
- Personal performance (users)
- Team performance (managers)
- System overview (admin)
- Project performance
- Lead quality analysis
- Financial reports

**Analytics Features:**
- Charts and graphs
- Date range filters
- Export to CSV/Excel
- Trend analysis
- Comparison views

### 8. Partner Management

**Purpose:** Manage relationships with property developers

**Partner Information:**
- Company name
- Contact details
- Projects managed
- Commission structure
- Active/inactive status
- Logo/branding
- Contract details

**Partnership Features:**
- Add/remove partners
- Manage partner projects
- Track commissions
- Performance metrics
- Communication history

### 9. Support System

**Purpose:** Help desk for user issues

**Support Tickets:**
- Topic categories (Account, Wallet, Leads, Technical)
- Issue types
- Priority levels
- Status tracking
- Internal notes
- Public replies
- Assignment to support staff

**Ticket Flow:**
```
User creates ticket → Support reviews → Assigned to agent
                                              ↓
                                    Agent responds
                                              ↓
                                    User replies
                                              ↓
                                    Resolved/Closed
```

### 10. Inventory Management (Admin)

**Purpose:** Track lead inventory across projects

**Features:**
- Lead stock levels
- Upload bulk leads
- Project availability
- Lead quality scoring
- Source tracking
- Batch management

---

## Database Schema

### Key Tables

**profiles**
- User accounts and profile information
- Columns: id, name, email, phone, role, manager_id, phone_verified_at, last_login_at, is_banned, created_at, updated_at

**projects**
- Real estate development projects
- Columns: id, name, region, price_per_lead, available_leads, project_code, created_at

**leads**
- Individual client leads
- Columns: id, client_name, client_phone, client_phone2, client_phone3, client_email, client_job_title, project_id, buyer_user_id, assigned_to_id, stage, feedback, platform, is_sold, sold_at, created_at

**team_invitations**
- Manager team invitations
- Columns: id, manager_id, invitee_email, invitee_user_id, token, status, expires_at, created_at

**user_wallets**
- User wallet balances
- Columns: id, user_id, balance, created_at, updated_at

**wallet_transactions**
- Wallet transaction history
- Columns: id, wallet_id, user_id, amount, type, description, reference_id, created_at

**wallet_topup_requests**
- Pending wallet top-up requests
- Columns: id, user_id, amount, receipt_file_url, payment_method, status, validated_by, admin_notes, created_at

**purchase_requests** (or lead_purchase_requests)
- Lead purchase requests
- Columns: id, user_id, project_id, quantity, total_amount, status, created_at

**otp_verifications** ✅ (NEW)
- Phone OTP verification codes
- Columns: id, phone, code_hash, attempts, verified, purpose, expires_at, created_at

**support_cases**
- Support tickets
- Columns: id, created_by, assigned_to, subject, description, topic, issue, status, created_at

**support_case_replies**
- Ticket responses
- Columns: id, case_id, user_id, message, is_internal_note, created_at

**partners**
- Property developer partnerships
- Columns: id, name, logo_url, website, contact_email, contact_phone, status, created_at

---

## Current Technology Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite 7
- **Routing:** React Router v6
- **State Management:** Zustand
- **Forms:** React Hook Form + Zod validation
- **Styling:** Tailwind CSS
- **UI Components:** Headless UI, Radix UI
- **Icons:** Lucide React
- **Charts:** Recharts
- **HTTP Client:** Fetch API

### Backend
- **BaaS:** Supabase (PostgreSQL database)
- **Authentication:** Supabase Auth + Custom Phone OTP
- **Edge Functions:** Deno (Supabase Functions)
- **Real-time:** Supabase Realtime subscriptions
- **Storage:** Supabase Storage (for files/receipts)
- **Database:** PostgreSQL 17

### External Services
- **SMS:** Twilio (phone verification, OTP)
- **Email:** SendGrid (invitations, notifications)
- **Deployment:** Vercel (frontend hosting)
- **Version Control:** Git + GitHub

---

## Current Admin Panel (Needs Update/CMS)

### Existing Admin Features

**Pages:**
- Admin Dashboard
- User Management (view all users)
- Purchase Requests (approve/reject)
- Lead Upload (bulk upload from CSV)
- Project Management (basic CRUD)

**Current Limitations:**
- No CMS for content management
- Limited project management features
- No bulk operations
- No advanced analytics
- No system configuration UI
- No email template management
- No partner portal
- No commission management
- No automated workflows

---

## What We Need (Admin Panel + CMS)

### Admin Panel Requirements

#### 1. Enhanced Dashboard
- System health metrics
- Real-time activity feed
- Revenue analytics
- User growth charts
- Lead inventory status
- Pending approvals counter
- Quick actions panel
- Recent transactions

#### 2. User Management
- **List View:**
  - Search and filter users
  - Sort by role, signup date, activity
  - Bulk actions (ban, change role, export)
  - Pagination
  
- **User Details:**
  - Edit profile information
  - Change role
  - Set manager
  - View activity history
  - View purchase history
  - View wallet balance
  - Ban/unban user
  - Reset password
  - Impersonate user (for support)

- **Team Hierarchy View:**
  - Visual tree of manager-user relationships
  - Drag-and-drop reassignment
  - Bulk team operations

#### 3. Project Management (CMS)
- **Project CRUD:**
  - Create/edit projects
  - Rich text editor for descriptions
  - Image upload (project images, logos)
  - Location/map integration
  - Amenities/features checklist
  - Unit types and pricing
  
- **Project Settings:**
  - Set CPL (cost per lead)
  - Enable/disable project
  - Featured project toggle
  - Available leads counter
  - Auto-hide when sold out
  
- **Bulk Operations:**
  - Import projects from CSV
  - Bulk price updates
  - Bulk status changes
  - Export project data

#### 4. Lead Management
- **Lead Upload:**
  - CSV upload with validation
  - Bulk assignment to projects
  - Duplicate detection
  - Data cleaning/formatting
  - Import history
  
- **Lead Assignment:**
  - Assign to users
  - Reassign leads
  - Bulk assignment
  - Auto-assignment rules
  
- **Lead Quality:**
  - Mark as high/medium/low quality
  - Flag suspicious leads
  - Blacklist phone numbers
  - Verification status

#### 5. Purchase Request Management
- **Request Queue:**
  - List all pending requests
  - Filter by user, project, date
  - Sort by amount, date
  
- **Request Actions:**
  - Approve (deduct wallet, assign leads)
  - Reject (with reason)
  - Bulk approve/reject
  - Set auto-approval rules

#### 6. Wallet Management
- **Top-Up Requests:**
  - View pending requests
  - Review receipt images
  - Approve/reject
  - Add admin notes
  - Bulk processing
  
- **Wallet Operations:**
  - Manual credit/debit
  - Refunds
  - Adjustments
  - Transaction history
  - Audit logs

#### 7. Analytics & Reports
- **System Analytics:**
  - Revenue dashboard
  - User growth metrics
  - Lead inventory trends
  - Purchase patterns
  - Conversion funnels
  
- **Financial Reports:**
  - Revenue by period
  - Revenue by project
  - Commission tracking
  - Wallet activity
  - Refunds and adjustments
  
- **User Reports:**
  - Top buyers
  - Active users
  - Churn analysis
  - Engagement metrics

#### 8. Content Management System (CMS)

**What Needs CMS:**

**Projects:**
- Project descriptions (rich text)
- Project images/gallery
- Developer information
- Amenities list
- Location details
- Pricing tables
- FAQs per project

**Marketing Content:**
- Homepage content
- Landing pages
- Blog/news articles
- Email templates
- SMS templates
- Notification templates

**Configuration:**
- System settings
- Feature flags
- Payment methods
- Pricing tiers
- Email branding
- SMS branding

**Partner Portal:**
- Partner profiles
- Partner dashboards
- Commission reports
- Lead performance
- Campaign management

#### 9. Support Panel (Enhanced)
- Ticket management interface
- Canned responses
- Internal notes
- Ticket assignment
- SLA tracking
- User context panel
- Quick actions

#### 10. System Configuration
- **General Settings:**
  - Platform name
  - Contact information
  - Timezone settings
  - Currency settings
  - Language preferences
  
- **Feature Toggles:**
  - Enable/disable features
  - Beta features
  - Maintenance mode
  
- **Payment Configuration:**
  - Accepted payment methods
  - Payment gateway settings
  - Commission rates
  - Refund policies
  
- **Email/SMS Templates:**
  - Welcome email
  - OTP messages
  - Purchase confirmations
  - Team invitations
  - Support responses

---

## Admin Panel Requirements Summary

### Must-Have Features

1. ✅ **User Management**
   - CRUD operations
   - Role management
   - Team assignment
   - Bulk operations

2. ✅ **Project CMS**
   - Rich content editing
   - Image management
   - Pricing control
   - Availability management

3. ✅ **Lead Management**
   - Bulk upload
   - Assignment tools
   - Quality control
   - Inventory tracking

4. ✅ **Financial Management**
   - Purchase approvals
   - Wallet top-ups
   - Transaction history
   - Reporting

5. ✅ **Content Management**
   - Project descriptions
   - Email templates
   - SMS templates
   - Marketing content

6. ✅ **Analytics Dashboard**
   - Revenue metrics
   - User metrics
   - Lead metrics
   - Conversion tracking

7. ✅ **System Configuration**
   - Settings panel
   - Feature flags
   - Payment methods
   - Branding

### Nice-to-Have Features

- Activity logs viewer
- Automated reports
- API key management
- Webhook management
- Data export tools
- Backup/restore UI
- System health monitoring
- Performance optimization tools

---

## Current State of the Platform

### What's Working ✅

**Authentication:**
- ✅ Signup with phone OTP
- ✅ Login with Remember Me & 2FA
- ✅ Role-based access
- ✅ Manager hierarchy
- ✅ Team invitations

**Core Features:**
- ✅ Lead marketplace (shop)
- ✅ CRM for lead management
- ✅ Wallet system
- ✅ Team management
- ✅ Support tickets
- ✅ Partner listings
- ✅ Deals tracking
- ✅ Basic analytics

**Admin Panel (Basic):**
- ✅ User list view
- ✅ Purchase request approval
- ✅ Lead upload (CSV)
- ✅ Basic project management

### What Needs Building

**Admin Panel:**
- ❌ Enhanced dashboard with metrics
- ❌ Advanced user management UI
- ❌ CMS for projects
- ❌ Bulk operations
- ❌ Advanced analytics
- ❌ System configuration UI
- ❌ Email/SMS template editor
- ❌ Partner management portal

**CMS:**
- ❌ Rich text editor
- ❌ Media library
- ❌ Content versioning
- ❌ Publishing workflow
- ❌ Template management

---

## Technical Details for AI Assistant

### File Structure

```
src/
├── components/
│   ├── admin/           # Admin panel components
│   │   ├── PurchaseRequests.tsx
│   │   └── [need more components]
│   ├── auth/            # Authentication components ✅
│   ├── common/          # Shared components
│   └── ...
├── pages/
│   ├── Auth/            # Auth pages ✅
│   ├── Admin/           # Admin panel pages
│   ├── CRM/             # CRM pages
│   ├── Shop/            # Marketplace
│   ├── Team/            # Team management
│   └── ...
├── hooks/
│   ├── admin/           # Admin-specific hooks
│   │   └── useAdminData.ts
│   └── ...
├── store/
│   ├── auth.ts          # Auth state ✅
│   ├── team.ts          # Team state
│   └── ...
├── lib/
│   ├── supabaseClient.ts
│   ├── rbac.ts          # Role-based access ✅
│   └── ...
└── types/
    └── database.ts      # Type definitions
```

### Database Access

**RPC Functions Available:**
- `get_user_tree(user_id)` - Get manager's team recursively
- `get_team_user_ids(user_id)` - Get team member IDs array
- `can_user_view(viewer_id, target_id)` - Permission check
- `can_purchase_for(purchaser_id, target_id)` - Purchase permission
- `get_accessible_leads(user_id)` - Role-based lead filtering

**Views Available:**
- `user_wallet_summary` - Wallet balance summary
- `lead_availability` - Project lead counts
- `projects_with_lead_counts` - Projects with inventory

### Design System

**Colors:**
- Primary: Blue (#3b82f6 to #1d4ed8 gradient)
- Secondary: Indigo (#6366f1 to #4f46e5 gradient)
- Success: Green (#10b981)
- Error: Red (#ef4444)
- Warning: Yellow (#f59e0b)
- Background: Gray gradient

**UI Patterns:**
- Gradient cards
- Smooth animations
- Loading skeletons
- Toast notifications
- Modal dialogs
- Dropdown menus
- Data tables with sorting/filtering

---

## Use This Documentation To:

### Request Admin Panel Updates

**Example Prompt:**
```
Based on the SALEMATE_PLATFORM_DOCUMENTATION.md, create an enhanced admin panel with:
- Dashboard with system metrics
- Advanced user management with bulk operations
- Project CMS with rich text editor
- Analytics reports with charts
- System configuration UI

Follow the same design patterns (gradients, Tailwind, TypeScript) used in the authentication system.
```

### Request CMS Development

**Example Prompt:**
```
Based on the SALEMATE_PLATFORM_DOCUMENTATION.md, create a CMS for managing:
- Project content (descriptions, images, amenities)
- Email/SMS templates
- Marketing content
- Partner information

Use the existing database schema and Supabase client. Follow the design system in the documentation.
```

### Request Specific Features

**Example Prompt:**
```
Based on SALEMATE_PLATFORM_DOCUMENTATION.md, add these features to the admin panel:
1. Bulk user role changes
2. Lead assignment automation rules
3. Revenue analytics dashboard
4. Email template editor

Maintain consistency with existing code architecture.
```

---

## Key Business Rules

### Lead Assignment
- User can only see leads they purchased or were assigned
- Manager can see all team leads
- Admin can see all leads
- Support can see all leads (read-only for most)

### Purchase Permissions
- User: Buy for self only
- Manager: Buy for self + team members
- Admin: Buy for anyone
- Support: Cannot purchase

### Wallet Rules
- Minimum top-up: Configurable (e.g., 100 EGP)
- Purchase requires sufficient balance
- Refunds only by admin
- Negative balance not allowed

### Manager Hierarchy
- Users without manager → manager_id = 11111111-1111-1111-1111-111111111111
- Team invitation → manager_id = inviter's ID
- Managers can have multiple levels (recursive)
- Admin sees all users regardless of hierarchy

---

## Platform Goals

### Short-term
- Streamline lead purchasing
- Improve admin panel UX
- Add CMS for content management
- Enhance analytics

### Long-term
- Mobile app
- API for integrations
- Automated lead scoring
- AI-powered recommendations
- WhatsApp integration
- Multiple countries expansion

---

**Use this documentation as context for AI assistants to build/update the admin panel and CMS!**

**Last Updated:** November 1, 2024
**Platform Status:** Production-ready authentication, needs admin panel enhancement

