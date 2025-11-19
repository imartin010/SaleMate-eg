# SaleMate Platform - Architecture Overview

> **Last Updated**: November 19, 2024  
> **Version**: 1.0 (Post-Refactor)  
> **Status**: Production-Ready

---

## Table of Contents

1. [What is SaleMate?](#what-is-salemate)
2. [High-Level Architecture](#high-level-architecture)
3. [Technology Stack](#technology-stack)
4. [Domain Model](#domain-model)
5. [Data Flow Patterns](#data-flow-patterns)
6. [Database Schema](#database-schema)
7. [External Integrations](#external-integrations)
8. [Security & Authentication](#security--authentication)
9. [Key Design Decisions](#key-design-decisions)
10. [Development Workflow](#development-workflow)

---

## What is SaleMate?

**SaleMate** is a B2B SaaS platform designed specifically for the Egyptian real estate market. It connects real estate brokers and agents with verified property leads through a marketplace model, while providing comprehensive CRM tools, AI-powered case management, team collaboration features, and performance tracking.

### Core Value Propositions

1. **Lead Marketplace**: Brokers can purchase verified leads from real estate developers (minimum 30 leads per transaction)
2. **CRM System**: Manage leads through different stages (New Lead → Contacted → Potential → Meeting Scheduled → Closed Deal)
3. **AI Case Manager**: GPT-4 powered coaching that provides recommendations, follow-up scripts, and risk analysis
4. **Wallet System**: Prepaid wallet for seamless lead purchases with multiple payment methods (card, InstaPay, bank transfer)
5. **Team Management**: Hierarchical team structure with managers and agents, including lead reassignment ("face switching")
6. **Admin Panel**: Comprehensive CMS for managing users, projects, leads, content, and system configuration

### Target Users

- **Brokers/Agents**: Purchase and manage property leads
- **Team Managers**: Oversee agent performance and lead distribution
- **Developers/Admins**: Configure projects, upload leads, manage system
- **Support Staff**: Handle user inquiries and moderation

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React 19 + TypeScript (SPA)                             │  │
│  │  • Vite Build Tool                                        │  │
│  │  • React Router (Client-side routing)                     │  │
│  │  • Zustand (Domain state management)                      │  │
│  │  • TanStack Query (Server state & caching)                │  │
│  │  • Tailwind CSS (Styling)                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE BACKEND                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Edge Functions (Deno/TypeScript)                         │  │
│  │  • Authentication (OTP, Email/Password)                   │  │
│  │  • Lead Management (Purchase, Assignment, Upload)         │  │
│  │  • Case Manager (AI Coaching, Stage Changes)             │  │
│  │  • Payments (Kashier, Paymob, Test Gateway)              │  │
│  │  • Notifications & Reminders                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↕                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database                                      │  │
│  │  • 8 Core Tables (consolidated schema)                    │  │
│  │  • Row Level Security (RLS) policies                      │  │
│  │  • Realtime subscriptions                                 │  │
│  │  • pg_cron for scheduled jobs                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↕                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Supabase Storage                                         │  │
│  │  • Receipts (payment proofs)                              │  │
│  │  • Deal files (contracts, documents)                      │  │
│  │  • Profile images                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
│  • OpenAI GPT-4 (AI Coaching)                                   │
│  • Kashier/Paymob (Payment Gateways)                            │
│  • Twilio (SMS/OTP)                                              │
│  • Facebook Graph API (Lead Ads Webhook)                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.1.1 | UI framework |
| **TypeScript** | 5.8.3 | Type safety |
| **Vite** | 7.1.2 | Build tool & dev server |
| **React Router** | 7.8.2 | Client-side routing |
| **Zustand** | 5.0.8 | Domain state management |
| **TanStack Query** | 5.85.5 | Server state & caching |
| **Tailwind CSS** | 4.1.12 | Styling framework |
| **Framer Motion** | 12.23.12 | Animations |
| **React Hook Form** | 7.62.0 | Form management |
| **Zod** | 4.1.8 | Schema validation |
| **Lucide React** | 0.542.0 | Icon library |
| **Recharts** | 3.3.0 | Data visualization |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Supabase** | 2.57.4 | Backend-as-a-Service |
| **PostgreSQL** | (via Supabase) | Primary database |
| **Deno** | (Edge Functions) | Serverless runtime |
| **pg_cron** | (Extension) | Scheduled jobs |

### External Services

- **OpenAI GPT-4**: AI coaching and recommendations
- **Kashier**: Egyptian payment gateway (card payments)
- **Paymob**: Alternative payment gateway
- **Twilio**: SMS delivery for OTP
- **Facebook Graph API**: Lead Ads webhook integration

### Development Tools

- **ESLint** + **TypeScript ESLint**: Code linting
- **Vitest**: Unit testing
- **Playwright**: E2E testing
- **tsx**: TypeScript execution for scripts

---

## Domain Model

The SaleMate platform is organized into 8 major domains:

### 1. Authentication & Authorization

**Responsibilities**:
- User signup with phone OTP verification
- Email/password + 2FA login
- Session management
- Role-based access control (RBAC)

**Key Entities**: `profiles`, `otp_challenges`, `otp_attempts`

**Roles**:
- `admin`: Full system access
- `support`: User moderation, support tickets
- `manager`: Team management, view team leads
- `user`: Basic agent functionality

### 2. Lead Management (CRM)

**Responsibilities**:
- Lead lifecycle tracking (New → Contacted → Potential → Meeting → Closed)
- Lead filtering, search, and bulk actions
- Feedback and notes on each lead
- Lead assignment and reassignment
- Stage-based playbooks

**Key Entities**: `leads`, `case_feedback`, `case_actions`, `lead_events`

**Lead Stages**:
1. `new_lead`: Just assigned to agent
2. `contacted`: First contact made
3. `potential`: Shows interest
4. `low_budget`: Budget constraints identified
5. `meeting_scheduled`: Site visit or meeting planned
6. `closed_deal`: Successfully closed
7. `no_response`: Unable to reach
8. `not_interested`: Declined offer
9. `future_follow_up`: Interested but timing not right

### 3. Marketplace (Shop)

**Responsibilities**:
- Browse available projects with lead counts
- Purchase leads (minimum 30 per transaction)
- Wallet-based or payment gateway purchases
- Lead request system for unavailable projects

**Key Entities**: `projects`, `purchase_requests`, `lead_requests`

**Payment Methods**:
- **Wallet**: Instant purchase, leads assigned immediately
- **Card** (Kashier/Paymob): Redirect to gateway, webhook confirmation
- **InstaPay**: Manual approval by admin
- **Bank Transfer**: Manual approval with receipt upload

### 4. Wallet & Payments

**Responsibilities**:
- Wallet balance management
- Top-up via payment gateways
- Transaction history
- Deductions for lead purchases

**Key Entities**: `transactions` (type: wallet_topup, lead_purchase), `payment_transactions`

**Flow**:
1. User initiates wallet top-up
2. Create payment transaction (status: pending)
3. Redirect to payment gateway (Kashier/Paymob) or manual approval
4. Webhook receives payment confirmation
5. Update wallet balance (profiles.wallet_balance)
6. Transaction recorded in `transactions` table

### 5. Case Manager (AI-Powered)

**Responsibilities**:
- Stage-aware playbooks and automation
- AI coaching with GPT-4 (recommendations, scripts, risk flags)
- Inventory matching for low-budget clients
- Smart reminders and follow-ups
- Face switching (lead reassignment with context)

**Key Entities**: `case_feedback`, `case_actions`, `case_faces`, `inventory_matches`

**AI Coaching Features**:
- Context-aware recommendations based on stage
- Ready-to-use follow-up scripts
- Risk detection (red flags)
- Property matching for budget-constrained leads

### 6. Admin Panel & CMS

**Responsibilities**:
- User management (roles, permissions)
- Project management (CRUD, lead upload)
- Content management (banners, email templates, SMS templates)
- System configuration (feature flags, settings)
- Financial reports and analytics
- Audit logs

**Key Entities**: `profiles`, `projects`, `leads`, `content`, `system_data`, `events` (audit logs)

### 7. Team Management

**Responsibilities**:
- Team hierarchy (managers → agents)
- Team invitations
- Lead distribution among team members
- Team performance tracking

**Key Entities**: `teams`, `team_members`, `team_invitations`

### 8. Support System

**Responsibilities**:
- Support ticket creation and tracking
- Admin/support response system
- User moderation (ban/unban)
- Topic-based categorization

**Key Entities**: `support_cases`, `support_threads` (consolidated from old schema)

---

## Data Flow Patterns

### State Management Strategy

SaleMate uses a **hybrid state management** approach:

1. **Zustand for Domain State** (client-side, persistent across routes)
   - Auth state (`useAuthStore`)
   - UI preferences
   - Application-level caching

2. **TanStack Query for Server State** (server data with caching)
   - Lead lists
   - Project data
   - User profiles
   - Wallet balances

3. **React Context for Dependency Injection** (rarely used)
   - Theme provider
   - Toast notifications

### Typical Request Flow

**Example: Updating a Lead Stage**

```
User clicks "Mark as Contacted" button
    ↓
Component calls useStageChange hook
    ↓
Hook validates with stateMachine.validateStageChange()
    ↓
caseApi.changeStage() called
    ↓
HTTP POST to Supabase Edge Function (case-stage-change)
    ↓
Edge Function:
  • Validates auth & permissions
  • Updates leads.stage in database
  • Triggers stateMachine.onEnter() logic
  • Creates case_actions for reminders
  • Calls case-coach for AI recommendations (if applicable)
  • Calls notify-user for notifications
    ↓
Database write with RLS checks
    ↓
Realtime subscription broadcasts change
    ↓
Frontend TanStack Query cache invalidates
    ↓
UI re-renders with updated data
```

### Authentication Flow

**Signup with OTP**:
1. User enters phone number
2. Frontend calls `sendOTP()` → `otp-request` Edge Function
3. Backend sends SMS via Twilio, creates `otp_challenges` record
4. User enters OTP code
5. Frontend calls `verifyOTP()` → `otp-verify` Edge Function
6. Backend validates code, updates `otp_attempts`
7. On success, user completes registration form
8. `signUpWithOTP()` creates auth user and profile

**Login with 2FA**:
1. User enters email/password
2. If 2FA enabled, send OTP to phone
3. User enters OTP
4. Both credentials + OTP verified
5. Session created

### Realtime Data Sync

Supabase Realtime is used for:
- **Lead updates**: When stage changes or feedback is added
- **Notifications**: New case actions, reminders
- **Wallet balance**: After payment confirmation
- **Team updates**: Member joins/leaves

---

## Database Schema

SaleMate uses a **consolidated 8-table schema** designed for efficiency and clarity:

### Core Tables

#### 1. `profiles`
User accounts with wallet balances and metadata.

**Key Fields**:
- `id` (UUID, links to auth.users)
- `email`, `name`, `phone`
- `role` (admin, support, manager, user)
- `wallet_balance` (numeric)
- `manager_id` (self-referencing for hierarchy)
- `created_at`, `last_login_at`

#### 2. `leads`
All lead records with full lifecycle tracking.

**Key Fields**:
- `id` (UUID)
- `profile_id` (owner)
- `project_id` (source project)
- `name`, `phone`, `email`
- `stage` (enum: new_lead, contacted, potential, etc.)
- `platform` (Facebook, Website, WhatsApp, etc.)
- `region`, `budget`
- `notes`, `last_feedback`
- `assigned_at`, `updated_at`

#### 3. `projects`
Real estate projects with available leads.

**Key Fields**:
- `id` (UUID)
- `name`, `developer_name`, `region`
- `project_code` (unique identifier)
- `price_per_lead` (numeric)
- `available_count` (integer)
- `description`, `image_url`
- `status` (active, inactive, sold_out)

#### 4. `content`
CMS content (banners, email templates, SMS templates, settings).

**Key Fields**:
- `id` (UUID)
- `content_type` (banner, email_template, sms_template, setting, feature_flag)
- `title`, `body`, `media_url`
- `status` (active, draft, archived)
- `metadata` (JSONB for flexible data)
- `start_at`, `end_at` (for scheduled content)

#### 5. `transactions`
All financial transactions (wallet top-ups, lead purchases, refunds).

**Key Fields**:
- `id` (UUID)
- `profile_id`
- `amount`, `currency`
- `ledger_entry_type` (credit, debit)
- `transaction_type` (wallet_topup, lead_purchase, refund)
- `status` (pending, completed, failed)
- `reference_id` (links to purchase_requests, etc.)
- `metadata` (JSONB)

#### 6. `events`
Unified activity log (notifications, system logs, audit trail).

**Key Fields**:
- `id` (UUID)
- `event_type` (notification, activity, system_log, audit)
- `profile_id` (actor or recipient)
- `entity_type`, `entity_id` (polymorphic reference)
- `action` (created, updated, deleted, etc.)
- `metadata` (JSONB with event details)
- `created_at`

#### 7. `teams`
Team structure with hierarchy.

**Key Fields**:
- `id` (UUID)
- `name`, `description`
- `manager_id` (profile)
- `created_at`

#### 8. `system_data`
System-level data (entities, sessions, configuration).

**Key Fields**:
- `id` (UUID)
- `data_type` (entity, session, config)
- `key` (unique identifier)
- `value` (JSONB)
- `metadata` (JSONB)

### Additional Tables (Domain-Specific)

- `purchase_requests`: Pending lead purchases awaiting admin approval
- `lead_requests`: Requests for leads when project is out of stock
- `case_feedback`: AI coaching feedback on leads
- `case_actions`: Scheduled actions/reminders for leads
- `case_faces`: Face change history (lead reassignments)
- `team_invitations`: Pending team invitations
- `otp_challenges`, `otp_attempts`: OTP verification tracking
- `payment_transactions`: Payment gateway transaction records

### Inventory Table (Separate)

- `salemate-inventory`: 23,000+ property records for inventory matching (kept separate for performance)

---

## External Integrations

### 1. OpenAI GPT-4 (AI Coaching)

**Purpose**: Provide intelligent recommendations for lead management

**Integration Point**: `case-coach` Edge Function

**Flow**:
1. User submits feedback on lead
2. Edge function builds context (lead info, stage, history)
3. Calls OpenAI API with structured prompt
4. Parses JSON response
5. Returns recommendations, scripts, and risk flags

**Configuration**: `OPENAI_API_KEY` secret in Supabase

### 2. Kashier Payment Gateway

**Purpose**: Process card payments for Egyptian market

**Integration Points**:
- `create-kashier-payment` Edge Function (initiate payment)
- `kashier-webhook` Edge Function (payment confirmation)

**Flow**:
1. User initiates payment
2. Create payment transaction
3. Redirect to Kashier checkout page
4. User completes payment
5. Kashier sends webhook to our backend
6. Verify signature, update transaction, credit wallet

**Configuration**:
- `KASHIER_MERCHANT_ID`
- `KASHIER_PAYMENT_KEY`
- `KASHIER_SECRET_KEY` (for webhook verification)

### 3. Twilio (SMS/OTP)

**Purpose**: Send OTP codes for authentication

**Integration Point**: `otp-request` Edge Function

**Configuration**:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

### 4. Facebook Lead Ads

**Purpose**: Automatically import leads from Facebook campaigns

**Integration Point**: `facebook-leads-webhook` Edge Function

**Flow**:
1. Facebook sends webhook when new lead is captured
2. Verify webhook signature
3. Parse lead data
4. Insert into `leads` table
5. Notify project owner

**Configuration**:
- `FACEBOOK_APP_SECRET`
- Webhook verification token

---

## Security & Authentication

### Authentication Methods

1. **Phone OTP** (Primary for signup)
2. **Email/Password** (Standard login)
3. **Two-Factor Authentication** (Optional for enhanced security)

### Row Level Security (RLS)

All database tables have RLS policies enforcing:
- Users can only see their own data (unless admin/manager)
- Managers can view their team's data
- Admins have full access
- Public tables (projects, inventory) are read-only for all users

### Permission Model

```typescript
Permissions by Role:
- admin: ALL
- support: users.moderate, support.manage
- manager: team.manage, leads.view_team
- user: leads.manage_own, wallet.manage_own
```

### API Security

- All Edge Functions validate auth tokens
- Input validation with Zod schemas
- Rate limiting on sensitive endpoints (OTP)
- CORS configured for known origins
- Webhook signature verification for external services

---

## Key Design Decisions

### 1. Why Supabase?

**Chosen for**:
- Built-in auth with RLS (security by default)
- Realtime subscriptions (live updates)
- Edge Functions (serverless backend)
- PostgreSQL (reliable, feature-rich)
- Storage included
- Generous free tier

**Trade-offs**:
- Vendor lock-in (mitigated by PostgreSQL standard)
- Edge Functions limited to Deno (acceptable)

### 2. Why Zustand + TanStack Query?

**Rationale**:
- **Zustand**: Lightweight, simple API, perfect for domain state
- **TanStack Query**: Best-in-class server state management, automatic caching and invalidation
- **Combined**: Clear separation of concerns (client vs server state)

**Alternative considered**: Redux (rejected as too heavy for this use case)

### 3. Why Consolidated Schema (8 tables)?

**Original**: 15+ tables with complex relationships

**Consolidated**: 8 core tables with JSONB metadata columns

**Benefits**:
- Simpler mental model
- Fewer joins
- Flexible schema evolution via JSONB
- Better performance (fewer tables to scan)

**Trade-offs**:
- JSONB querying requires care
- Some data normalization sacrificed

### 4. Why Domain-Based Folder Structure?

**Rationale**:
- Features are naturally scoped (easy to find all related code)
- Enables feature-based teams
- Reduces coupling between domains
- Makes onboarding faster

**Alternative considered**: Layer-based (components/, hooks/, services/) - rejected as it splits related code

### 5. Why AI Case Manager?

**Rationale**:
- Differentiation from competitors
- Proven to improve conversion rates (early feedback)
- GPT-4 quality is sufficient for real estate domain

**Risks**:
- API costs (mitigated with caching and rate limits)
- Response quality (mitigated with structured prompts)

---

## Development Workflow

### Getting Started

```bash
# 1. Clone repo
git clone <repo-url>
cd "Sale Mate Final"

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# 4. Start dev server
npm run dev

# 5. Run migrations (if needed)
npm run db:migrate
```

### Common Tasks

**Run tests**:
```bash
npm run test        # Unit tests
npm run test:e2e    # E2E tests
```

**Type checking**:
```bash
npm run typecheck
```

**Linting**:
```bash
npm run lint        # Check
npm run lint:fix    # Fix
```

**Database**:
```bash
npm run db:reset    # Reset local DB
npm run db:types    # Regenerate types
```

### Deployment

**Frontend** (Vercel):
```bash
npm run build       # Build for production
vercel deploy       # Deploy to Vercel
```

**Backend** (Supabase):
```bash
cd supabase
supabase functions deploy  # Deploy all functions
```

### Adding a New Feature

1. **Plan**: Define domain, entities, and API contracts
2. **Backend**: Create migrations, Edge Functions
3. **Types**: Generate or update TypeScript types
4. **Services**: Create service layer for API calls
5. **Hooks**: Create custom hooks wrapping services
6. **Components**: Build UI components
7. **Pages**: Compose components into pages
8. **Routes**: Add routes to router
9. **Tests**: Write unit and integration tests
10. **Docs**: Update domain documentation

---

## File Structure Map

```
Sale Mate Final/
├── src/
│   ├── core/              # Core infrastructure (NEW)
│   ├── features/          # Domain features (NEW)
│   ├── shared/            # Shared utilities (NEW)
│   ├── app/               # App shell
│   ├── components/        # Legacy components (to be migrated)
│   ├── pages/             # Legacy pages (to be migrated)
│   ├── store/             # Zustand stores (to be migrated)
│   ├── lib/               # Utilities (to be migrated)
│   └── main.tsx           # Entry point
│
├── supabase/
│   ├── functions/         # Edge Functions
│   ├── migrations/        # Database migrations
│   └── seed/              # Seed data
│
├── docs/                  # Documentation
├── tests/                 # Test files
├── public/                # Static assets
├── archive/               # Archived code/docs
└── [config files]
```

---

## Next Steps

1. **Complete refactoring** according to REFACTOR_PLAN.md
2. **Add comprehensive tests** for critical paths
3. **Set up monitoring** (error tracking, performance)
4. **Optimize performance** (bundle size, query efficiency)
5. **Scale team** as needed

---

## Questions?

- Check `/docs/` for domain-specific documentation
- Review `REFACTOR_PLAN.md` for ongoing refactoring work
- See `DEVELOPER_QUICK_START.md` for quick onboarding

---

**Maintained by**: SaleMate Engineering Team  
**Last Review**: November 2024

