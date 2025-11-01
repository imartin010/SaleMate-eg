# ChatGPT Prompts for Admin Panel & CMS Development

## How to Use This

1. Open ChatGPT (GPT-4 or higher recommended)
2. Upload `SALEMATE_PLATFORM_DOCUMENTATION.md` to the chat
3. Copy and paste the prompts below

---

## Prompt 1: Enhanced Admin Dashboard

```
I need you to create an enhanced admin dashboard for SaleMate based on the documentation provided.

Requirements:
1. Modern dashboard with key metrics cards showing:
   - Total users (with growth %)
   - Total revenue (this month vs last month)
   - Active leads inventory
   - Pending purchase requests
   - Pending wallet top-ups
   - Active support tickets

2. Charts and graphs:
   - Revenue trend (last 30 days)
   - User signups trend
   - Lead purchases by project
   - Top performing users

3. Recent activity feed:
   - Latest user signups
   - Recent purchases
   - Recent support tickets
   - System events

4. Quick actions panel:
   - Approve pending requests
   - Upload leads
   - Create project
   - Add user

Design:
- Use the same gradient design as the auth pages
- Tailwind CSS
- TypeScript + React
- Recharts for graphs
- Responsive layout

File location: src/pages/Admin/AdminDashboard.tsx
```

---

## Prompt 2: User Management Interface

```
Create a comprehensive user management interface for the admin panel based on the SaleMate documentation.

Features needed:
1. User list table with:
   - Search by name, email, phone
   - Filter by role, status, signup date
   - Sort by any column
   - Pagination (100 users per page)
   - Bulk select and actions

2. Bulk operations:
   - Change role (multiple users)
   - Ban/unban users
   - Export selected users to CSV
   - Send notification to users

3. User detail panel (slide-over or modal):
   - Edit all user fields
   - Change role dropdown
   - Assign/change manager
   - View purchase history
   - View wallet balance and transactions
   - View team members (if manager)
   - Ban/unban button
   - Reset password button
   - Activity timeline

4. Team hierarchy view:
   - Visual tree diagram showing manager-user relationships
   - Click to expand/collapse
   - Quick reassignment

Technologies:
- React + TypeScript
- Tailwind CSS
- Headless UI for modals/dropdowns
- React Hook Form for edit forms
- Zustand for state management

File: src/pages/Admin/UserManagement.tsx
```

---

## Prompt 3: Project CMS

```
Build a complete CMS for managing real estate projects based on the SaleMate documentation.

Requirements:

1. Project list view:
   - Card grid or table view toggle
   - Search projects
   - Filter by region, developer, status
   - Sort by name, date, availability
   - Quick actions (edit, delete, duplicate)

2. Project editor (full-page form):
   - Basic Information:
     * Project name (required)
     * Developer name
     * Region/location
     * Project code (unique)
   
   - Rich Content:
     * Description (rich text editor - Tiptap or similar)
     * Features/amenities (checkbox list)
     * Unit types and pricing table
   
   - Media:
     * Project logo upload
     * Image gallery (multiple images)
     * Video URL
     * Floor plans upload
   
   - Marketplace Settings:
     * Price per lead (CPL)
     * Available leads count
     * Enable/disable in marketplace
     * Featured project toggle
     * Auto-hide when sold out
   
   - SEO (optional):
     * Meta title
     * Meta description
     * Keywords

3. Lead inventory management:
   - Upload leads to project (CSV)
   - View project's leads
   - Lead count tracking
   - Add/remove leads manually

4. Preview before publishing

Technologies:
- Rich text editor: @tiptap/react or similar
- Image upload: Supabase Storage
- Form: React Hook Form + Zod
- Drag-drop: @dnd-kit or react-beautiful-dnd
- File upload: react-dropzone

Files:
- src/pages/Admin/ProjectCMS.tsx
- src/components/admin/ProjectEditor.tsx
- src/components/admin/RichTextEditor.tsx
```

---

## Prompt 4: Purchase Request Management

```
Create a purchase request management interface for admins based on the SaleMate documentation.

Features:

1. Request queue with tabs:
   - Pending (needs action)
   - Approved (completed)
   - Rejected (declined)
   - All requests

2. Request table columns:
   - User name and email
   - Project name
   - Quantity requested
   - Total amount
   - Wallet balance (show if sufficient)
   - Date requested
   - Status
   - Actions

3. Quick approve/reject:
   - One-click approve (if balance sufficient)
   - Reject with reason modal
   - Bulk approve selected
   - Auto-approve toggle (if balance > amount)

4. Request details modal:
   - Full user information
   - Full project details
   - Purchase history
   - Wallet transaction history
   - Approve/reject buttons
   - Admin notes field

5. Filters and search:
   - Search by user or project
   - Filter by amount range
   - Filter by date range
   - Show only actionable (pending + sufficient balance)

Technologies:
- React + TypeScript + Tailwind
- Data table with sorting
- Modal dialogs
- Toast notifications for actions

File: src/pages/Admin/PurchaseRequests.tsx
```

---

## Prompt 5: Wallet & Financial Management

```
Build a wallet and financial management system for the admin panel based on SaleMate documentation.

Features:

1. Top-up request management:
   - Pending requests table
   - Receipt image viewer
   - User details
   - Approve/reject with notes
   - Bulk processing
   - Payment method filter

2. Wallet operations:
   - Manual credit user wallet
   - Manual debit (with reason)
   - Refund transaction
   - Adjustment (correction)
   - Transaction history

3. Financial dashboard:
   - Total platform revenue
   - Revenue by period (day/week/month)
   - Revenue by project
   - Commission tracking
   - Pending payouts
   - Wallet balances total

4. Transaction logs:
   - All wallet transactions
   - Filter by type, user, date
   - Export to CSV
   - Audit trail

5. Reporting:
   - Revenue reports
   - User spending analysis
   - Top projects by revenue
   - Payment method breakdown

Technologies:
- Charts: Recharts
- Image viewer: react-image-lightbox
- Date picker: react-datepicker
- Export: csv-export library

Files:
- src/pages/Admin/WalletManagement.tsx
- src/pages/Admin/FinancialReports.tsx
```

---

## Prompt 6: Analytics & Reporting

```
Create comprehensive analytics and reporting dashboards for SaleMate admin panel.

Dashboard sections:

1. System Overview:
   - Total users, active users, new signups
   - Total leads, available leads, sold leads
   - Total revenue, monthly revenue, revenue growth
   - Active projects, featured projects

2. User Analytics:
   - Signup trend (line chart)
   - Users by role (pie chart)
   - Active vs inactive users
   - Top buyers (table)
   - Churn analysis

3. Lead Analytics:
   - Lead inventory by project
   - Leads sold trend
   - Conversion rates
   - Lead quality metrics
   - Platform source breakdown

4. Revenue Analytics:
   - Revenue by month (bar chart)
   - Revenue by project (table)
   - Average order value
   - Top revenue-generating users
   - Commission breakdown

5. Filters:
   - Date range picker
   - Compare periods
   - Filter by project/user/region
   - Export reports

Technologies:
- Recharts for all charts
- Date range: react-date-range
- Export: Export to CSV, PDF
- Real-time data with Supabase

File: src/pages/Admin/Analytics.tsx
```

---

## Prompt 7: Content Management System (CMS)

```
Build a complete CMS for SaleMate based on the documentation.

CMS sections:

1. Project Content Management:
   - List all projects
   - Rich text editor for descriptions
   - Image gallery management
   - Amenities/features editor
   - Location/map integration
   - Publish/draft status

2. Email Template Editor:
   - List all email templates:
     * Welcome email
     * OTP email
     * Purchase confirmation
     * Team invitation
     * Password reset
     * Support response
   - Visual email editor or HTML editor
   - Variable placeholders ({{name}}, {{code}}, etc.)
   - Preview functionality
   - Test send

3. SMS Template Editor:
   - OTP message template
   - Purchase confirmation SMS
   - Deal notification SMS
   - Variable support
   - Character counter (160 limit)
   - Preview

4. Marketing Content:
   - Homepage hero section
   - Features section
   - Testimonials
   - FAQs
   - Blog posts/news

5. Settings & Configuration:
   - Platform settings (name, contact, etc.)
   - Payment methods configuration
   - Feature flags on/off
   - Email branding (logo, colors)
   - SMS branding

Technologies:
- Rich text: Tiptap or Lexical
- Email builder: react-email-editor or unlayer
- Image upload: Supabase Storage
- Preview: iframe or dedicated preview mode

Files:
- src/pages/Admin/CMS/
  - ProjectContent.tsx
  - EmailTemplates.tsx
  - SMSTemplates.tsx
  - MarketingContent.tsx
  - PlatformSettings.tsx
```

---

## Prompt 8: Complete Admin Panel Layout

```
Create the main admin panel layout and navigation based on SaleMate documentation.

Requirements:

1. Admin panel layout structure:
   - Top navbar with:
     * SaleMate logo
     * Search (global)
     * Notifications bell
     * User menu
   
   - Left sidebar with sections:
     * Dashboard (home icon)
     * Users (users icon)
     * Projects (building icon)
     * Leads (database icon)
     * Purchases (shopping cart icon)
     * Wallets (wallet icon)
     * Analytics (chart icon)
     * Support (life buoy icon)
     * CMS (edit icon)
     * Settings (cog icon)
   
   - Main content area with breadcrumbs

2. Navigation:
   - Active state highlighting
   - Collapsible sidebar
   - Mobile responsive (hamburger menu)
   - Keyboard shortcuts

3. Global components:
   - Search modal (Cmd+K)
   - Notifications panel
   - Quick actions menu
   - User profile dropdown

4. Permissions:
   - Show/hide sections based on role
   - Admin sees all sections
   - Support sees limited sections

Design:
- Same gradient style as auth pages
- Dark sidebar option
- Smooth transitions
- Professional look

Files:
- src/layouts/AdminLayout.tsx
- src/components/admin/AdminSidebar.tsx
- src/components/admin/AdminTopbar.tsx
```

---

## Combined Mega Prompt (All-in-One)

```
Based on the attached SALEMATE_PLATFORM_DOCUMENTATION.md, create a complete admin panel and CMS for the SaleMate platform.

The admin panel should include:

1. Enhanced Dashboard
   - System metrics cards
   - Revenue/user/lead charts
   - Recent activity feed
   - Quick actions panel

2. User Management
   - Advanced table with search/filter/sort
   - Bulk operations
   - User detail editor
   - Team hierarchy visualization

3. Project CMS
   - Rich text editor for content
   - Image gallery management
   - Pricing and availability control
   - Publish/draft workflow

4. Lead Management
   - Bulk upload interface
   - Lead assignment tools
   - Inventory tracking
   - Quality management

5. Financial Management
   - Purchase request approvals
   - Wallet top-up handling
   - Transaction history
   - Revenue reporting

6. Analytics & Reports
   - System analytics dashboard
   - User metrics
   - Revenue reports
   - Export functionality

7. Content Management
   - Email template editor
   - SMS template editor
   - Marketing content management
   - Platform settings

8. Support Management
   - Ticket queue
   - Ticket assignment
   - Canned responses
   - User context panel

Technical Requirements:
- Use React + TypeScript
- Tailwind CSS for styling
- Match existing design system (gradients, modern UI)
- Use Supabase for backend
- Follow existing code architecture
- Use existing RPC functions
- Implement proper role-based access
- Mobile responsive

Provide complete code for all components, properly structured and production-ready.
```

---

## Quick Reference

### Files to Share with ChatGPT

1. **`SALEMATE_PLATFORM_DOCUMENTATION.md`** (this file) - Complete platform overview
2. **`src/types/database.ts`** - Database type definitions
3. **`src/lib/supabaseClient.ts`** - Supabase connection
4. **`src/lib/rbac.ts`** - Permission system
5. **`src/components/auth/`** - Example of our code style

### What to Ask For

**Admin Panel:**
- Dashboard with metrics
- User management CRUD
- Project CMS
- Financial management
- Analytics/reports

**CMS:**
- Content editor
- Template management
- Media library
- Publishing workflow

**Both:**
- Follow existing design patterns
- Use TypeScript
- Proper error handling
- Loading states
- Mobile responsive

---

**Use these prompts to get ChatGPT to build your admin panel and CMS!** 🚀

