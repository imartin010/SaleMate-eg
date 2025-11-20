# SaleMate Documentation Index

> **Single Source of Truth for all SaleMate documentation**  
> **Last Updated**: November 19, 2024

---

## 🚀 Getting Started

**New to SaleMate? Start here:**

1. **[README.md](../README.md)** - Project overview and quick start
2. **[START_HERE.md](../START_HERE.md)** - Case Manager feature introduction
3. **[DEVELOPER_QUICK_START.md](../DEVELOPER_QUICK_START.md)** - Developer onboarding guide
4. **[ARCHITECTURE_OVERVIEW.md](../ARCHITECTURE_OVERVIEW.md)** - Complete system architecture
5. **[REFACTOR_PLAN.md](../REFACTOR_PLAN.md)** - Current refactoring plan and progress

---

## 📁 Documentation Structure

```
/
├── README.md                      # Project overview
├── START_HERE.md                  # Case Manager introduction
├── DEVELOPER_QUICK_START.md       # Developer onboarding
├── ARCHITECTURE_OVERVIEW.md       # System architecture
├── REFACTOR_PLAN.md              # Refactor plan and progress
├── BRAND_GUIDELINES.md           # Brand and design system
│
├── docs/
│   ├── DOCUMENTATION_INDEX.md    # This file
│   │
│   ├── domains/                  # Domain-specific documentation
│   │   ├── auth/                 # Authentication & OTP
│   │   ├── case-manager/         # AI Case Management
│   │   ├── crm/                  # Lead/CRM Management
│   │   ├── payments/             # Payments & Wallet
│   │   ├── team/                 # Team Management
│   │   ├── admin/                # Admin Panel
│   │   └── performance/          # Performance Tracking
│   │
│   ├── deployment/               # Deployment guides
│   ├── technical/                # Technical documentation
│   └── api/                      # API documentation
│
└── archive/
    └── docs/
        └── implementation-history/  # Historical implementation logs
```

---

## 📚 Core Documentation

### Essential Reading

| Document | Description | Audience |
|----------|-------------|----------|
| [ARCHITECTURE_OVERVIEW.md](../ARCHITECTURE_OVERVIEW.md) | Complete system architecture, tech stack, domains | All developers |
| [REFACTOR_PLAN.md](../REFACTOR_PLAN.md) | Current refactoring plan, folder structure, naming conventions | All developers |
| [DEVELOPER_QUICK_START.md](../DEVELOPER_QUICK_START.md) | Quick onboarding guide | New developers |
| [BRAND_GUIDELINES.md](../BRAND_GUIDELINES.md) | Brand identity, colors, typography | Frontend developers, designers |

---

## 🎯 Domain Documentation

### Authentication & Authorization

**Location**: `docs/domains/auth/`

| Document | Description |
|----------|-------------|
| `REGISTER_SALEMATE_SENDER_ID.md` | SMS sender ID registration |
| `OTP_RESEND_COOLDOWN_UPDATE.md` | OTP cooldown mechanism |
| `EMAIL_CONFIRMATION_FEATURE.md` | Email verification flow |
| `UPDATE_TWILIO_CREDENTIALS.md` | Twilio setup for SMS |

**Key Topics**:
- Phone OTP authentication
- Email/password login
- Two-factor authentication
- Role-based access control (RBAC)

---

### Case Manager (AI-Powered)

**Location**: `docs/domains/case-manager/`

| Document | Description |
|----------|-------------|
| `README_CASE_MANAGER.md` | Main case manager documentation |
| `GETTING_STARTED_CASE_MANAGER.md` | Quick start guide |
| `docs/CASE_MANAGER_ARCHITECTURE.md` | Technical architecture |
| `docs/CASE_MANAGER_WORKFLOWS.md` | Workflow documentation |
| `docs/CASE_MANAGER_DEPLOYMENT.md` | Deployment instructions |
| `docs/CASE_MANAGER_QUICK_START.md` | User quick start |

**Key Topics**:
- AI coaching with GPT-4
- Stage-based playbooks
- Inventory matching
- Smart reminders
- Face switching (lead reassignment)

---

### Lead Management (CRM)

**Location**: `docs/domains/crm/`

| Document | Description |
|----------|-------------|
| `SETUP_PURCHASE_REQUESTS.md` | Purchase request system |
| `LEAD_PURCHASE_WORKFLOW_ANALYSIS.md` | Purchase workflow details |
| `docs/CRM_SYSTEM_DOCUMENTATION.md` | Complete CRM documentation |

**Key Topics**:
- Lead lifecycle stages
- Lead filtering and search
- Bulk operations
- Lead assignment

---

### Payments & Wallet

**Location**: `docs/domains/payments/`

| Document | Description |
|----------|-------------|
| `KASHIER_INTEGRATION.md` | Kashier payment gateway setup |
| `KASHIER_WEBHOOK_SETUP_ALTERNATIVE.md` | Alternative webhook setup |
| `PAYMENT_GATEWAY_SYSTEM.md` | Payment gateway architecture |
| `PAYMENT_GATEWAY_MANUAL_TEST.md` | Manual testing guide |
| `PAYMENT_GATEWAY_QUICK_TEST.md` | Quick testing guide |
| `UPDATE_KASHIER_SECRETS.md` | Update Kashier credentials |
| `WALLET_AND_PAYMENT_SYSTEM_DOCUMENTATION.md` | Complete wallet docs |
| `WALLET_AND_LEAD_REQUEST_SETUP.md` | Wallet + lead request setup |
| `docs/wallet-and-payments.md` | Technical documentation |

**Key Topics**:
- Wallet balance management
- Payment methods (Card, InstaPay, Bank Transfer)
- Kashier/Paymob integration
- Transaction history
- Webhook handling

---

### Team Management

**Location**: `docs/domains/team/`

| Document | Description |
|----------|-------------|
| `TEAM_INVITATION_SETUP.md` | Team invitation system setup |
| `TEAM_INVITATION_SYSTEM.md` | Invitation system documentation |
| `TEAM_PAGE_FINAL_IMPLEMENTATION.md` | Team page implementation |

**Key Topics**:
- Team hierarchy (managers → agents)
- Team invitations
- Lead distribution
- Team performance tracking

---

### Admin Panel

**Location**: `docs/domains/admin/`

| Document | Description |
|----------|-------------|
| `PROJECT_CODE_FACEBOOK_INTEGRATION.md` | Facebook Lead Ads integration |
| `docs/admin_cms.md` | Admin CMS documentation |

**Key Topics**:
- User management
- Project management
- Lead upload (CSV/Facebook)
- Content management (CMS)
- System configuration
- Analytics and reports

---

### Performance Tracking

**Location**: `docs/domains/performance/`

| Document | Description |
|----------|-------------|
| `PERFORMANCE_PROGRAM_SCHEMA.md` | Performance program database schema |

**Key Topics**:
- Agent performance metrics
- Commission tracking
- Franchise comparison

---

## 🚀 Deployment Documentation

**Location**: `docs/deployment/`

| Document | Description | Priority |
|----------|-------------|----------|
| `DEPLOYMENT_READY.md` | General deployment checklist | High |
| `DEPLOYMENT_PAYMENT_READY.md` | Payment system deployment | High |
| `DEPLOY_SUPPORT_SYSTEM.md` | Support system deployment | Medium |
| `PRODUCTION_PAYMENT_SETUP.md` | Production payment setup | High |
| `SETUP_PAYMENT_GATEWAY.md` | Payment gateway configuration | High |
| `VERCEL_ENV_VARIABLES_REQUIRED.md` | Required environment variables | High |
| `STORAGE_BUCKET_SETUP.md` | Supabase storage setup | Medium |
| `CREATE_PUBLIC_BUCKET.md` | Public bucket configuration | Medium |
| `PARTNER_LOGOS_README.md` | Partner logo upload | Low |

**Deployment Checklist**:

1. ✅ Set up Supabase project
2. ✅ Configure environment variables (see `VERCEL_ENV_VARIABLES_REQUIRED.md`)
3. ✅ Run database migrations
4. ✅ Deploy Edge Functions
5. ✅ Set up storage buckets
6. ✅ Configure payment gateway (Kashier/Paymob)
7. ✅ Deploy frontend to Vercel
8. ✅ Test authentication flow
9. ✅ Test payment flow
10. ✅ Set up monitoring

---

## 🔧 Technical Documentation

**Location**: `docs/technical/`

| Document | Description |
|----------|-------------|
| `ARCH_NOTES_CONNECTIVITY.md` | Architecture and connectivity notes |
| `FRONTEND_BACKEND_MAP.md` | Frontend-backend API mapping |
| `SALEMATE_PLATFORM_DOCUMENTATION.md` | Platform documentation |
| `TECHNICAL_REPORT.md` | Technical analysis report |
| `MIGRATIONS_ANALYSIS.md` | Database migrations analysis |
| `SCHEMA_CONFLICT_ANALYSIS.md` | Schema conflict resolution |
| `setup_brdata_properties.md` | Property data setup |
| `IMPORT_INSTRUCTIONS.md` | Data import instructions |
| `UI_UX_DOCUMENTATION_INDEX.md` | UI/UX documentation index |
| `UI_UX_REVIEW.md` | UI/UX review and recommendations |
| `BRANDING_IMPLEMENTATION.md` | Brand implementation guide |

**Key Topics**:
- Database schema design
- API endpoints and contracts
- Frontend-backend integration
- Data import/export
- UI/UX patterns

---

## 📖 API Documentation

**Location**: `docs/api/`

### Supabase Edge Functions

**Authentication Domain**:
- `POST /functions/v1/otp-request` - Request OTP code
- `POST /functions/v1/otp-verify` - Verify OTP code
- `POST /functions/v1/admin-create-user` - Admin user creation

**Marketplace Domain**:
- `GET /functions/v1/marketplace` - Get available projects
- `POST /functions/v1/purchase-leads` - Purchase leads
- `GET /functions/v1/admin-marketplace` - Admin marketplace view

**Leads Domain**:
- `POST /functions/v1/assign-leads` - Assign leads to user
- `POST /functions/v1/bulk-lead-upload` - Bulk upload leads
- `POST /functions/v1/facebook-leads-webhook` - Facebook webhook

**Case Manager Domain**:
- `POST /functions/v1/case-stage-change` - Change lead stage
- `POST /functions/v1/case-coach` - Get AI coaching
- `POST /functions/v1/case-chat` - Chat with AI
- `POST /functions/v1/case-actions` - Manage case actions
- `POST /functions/v1/case-face-change` - Reassign lead
- `POST /functions/v1/inventory-matcher` - Match inventory
- `POST /functions/v1/reminder-scheduler` - Schedule reminders

**Payments Domain**:
- `POST /functions/v1/create-payment-intent` - Create payment (Stripe)
- `POST /functions/v1/create-kashier-payment` - Create payment (Kashier)
- `POST /functions/v1/payment-webhook` - Payment webhook
- `POST /functions/v1/kashier-webhook` - Kashier webhook

**CMS Domain**:
- `GET /functions/v1/banners-resolve` - Get active banners
- `POST /functions/v1/cms-preview` - Preview CMS content
- `POST /functions/v1/config-update` - Update config

**Other**:
- `POST /functions/v1/notify-user` - Send notification
- `POST /functions/v1/send-team-invitation` - Send invitation
- `POST /functions/v1/deals` - Manage deals
- `POST /functions/v1/upload-deal-files` - Upload deal files
- `POST /functions/v1/recalc-analytics` - Recalculate analytics

---

## 🗂️ Archived Documentation

**Location**: `archive/docs/implementation-history/`

Contains historical implementation logs, completed features, migration guides, and troubleshooting docs. These are kept for reference but are no longer actively maintained.

**Categories**:
- Implementation completion logs
- Migration execution logs
- Troubleshooting guides
- Fix documentation
- Old planning documents

---

## 🔍 Finding Documentation

### By Role

**New Developer**:
1. Start with [README.md](../README.md)
2. Read [DEVELOPER_QUICK_START.md](../DEVELOPER_QUICK_START.md)
3. Study [ARCHITECTURE_OVERVIEW.md](../ARCHITECTURE_OVERVIEW.md)
4. Review [REFACTOR_PLAN.md](../REFACTOR_PLAN.md)

**Frontend Developer**:
1. [ARCHITECTURE_OVERVIEW.md](../ARCHITECTURE_OVERVIEW.md) - Frontend architecture
2. [BRAND_GUIDELINES.md](../BRAND_GUIDELINES.md) - Design system
3. `docs/technical/UI_UX_DOCUMENTATION_INDEX.md` - UI/UX patterns
4. [REFACTOR_PLAN.md](../REFACTOR_PLAN.md) - Code organization

**Backend Developer**:
1. [ARCHITECTURE_OVERVIEW.md](../ARCHITECTURE_OVERVIEW.md) - Backend architecture
2. `docs/technical/ARCH_NOTES_CONNECTIVITY.md` - System connectivity
3. `docs/technical/FRONTEND_BACKEND_MAP.md` - API mappings
4. `docs/api/` - API documentation

**DevOps/Deployment**:
1. `docs/deployment/DEPLOYMENT_READY.md` - General deployment
2. `docs/deployment/VERCEL_ENV_VARIABLES_REQUIRED.md` - Environment setup
3. `docs/deployment/PRODUCTION_PAYMENT_SETUP.md` - Payment setup
4. `docs/deployment/STORAGE_BUCKET_SETUP.md` - Storage setup

**Product Manager**:
1. [README.md](../README.md) - Product overview
2. [ARCHITECTURE_OVERVIEW.md](../ARCHITECTURE_OVERVIEW.md) - System capabilities
3. Domain docs in `docs/domains/` - Feature details
4. `docs/technical/UI_UX_REVIEW.md` - UX analysis

---

## 📝 Documentation Standards

### File Naming

- Use `SCREAMING_SNAKE_CASE.md` for root-level docs
- Use `kebab-case.md` for docs in subfolders
- Use descriptive names (not abbreviations)

### Structure

Every documentation file should include:
1. Title and brief description
2. Last updated date
3. Table of contents (for long docs)
4. Main content sections
5. Related links

### Maintenance

- Update `Last Updated` date when modifying docs
- Link related documentation
- Archive outdated docs (don't delete)
- Keep DOCUMENTATION_INDEX.md in sync

---

## 🆘 Need Help?

**Can't find what you're looking for?**

1. Search this index
2. Check `docs/technical/` for technical deep-dives
3. Browse `docs/domains/[feature]/` for feature-specific docs
4. Look in `archive/docs/implementation-history/` for historical context
5. Ask the team in Slack/Discord

**Contributing to Documentation**:

See `CONTRIBUTING.md` (coming soon) for guidelines on adding/updating documentation.

---

## 📊 Documentation Health

| Category | Files | Status |
|----------|-------|--------|
| **Core Docs** | 6 | ✅ Up to date |
| **Domain Docs** | 25+ | ✅ Up to date |
| **Deployment Docs** | 9 | ✅ Up to date |
| **Technical Docs** | 11 | ✅ Up to date |
| **Archived Docs** | 100+ | 🗃️ Historical |

**Last Audit**: November 19, 2024

---

**Maintained by**: SaleMate Engineering Team  
**Questions?**: Check the docs or ask in the team channel

