# SaleMate Refactor Plan

> **Status**: In Progress  
> **Started**: November 19, 2024  
> **Expected Completion**: Q1 2025 (14 weeks)  
> **Approach**: Incremental, backwards-compatible refactoring

---

## Table of Contents

1. [Goals & Principles](#goals--principles)
2. [Target Folder Structure](#target-folder-structure)
3. [Naming Conventions](#naming-conventions)
4. [Code Organization Patterns](#code-organization-patterns)
5. [Migration Strategy](#migration-strategy)
6. [Import Path Standards](#import-path-standards)
7. [Progress Tracking](#progress-tracking)

---

## Goals & Principles

### Primary Goals

1. **Clarity**: Any developer should understand the codebase structure in < 2 hours
2. **Maintainability**: Easy to modify, extend, and debug
3. **Scalability**: Structure supports team growth and feature additions
4. **Type Safety**: Comprehensive TypeScript coverage
5. **Testability**: Easy to write and maintain tests

### Guiding Principles

✅ **Incremental Changes**: No big rewrites, gradual migration  
✅ **Backwards Compatibility**: Keep old paths working during migration  
✅ **Zero Downtime**: App must build and run after every commit  
✅ **Document Decisions**: Record architectural choices in this file  
✅ **Test Coverage**: Add tests before refactoring critical code

---

## Target Folder Structure

### Frontend Structure (src/)

```
src/
├── core/                          # Core infrastructure layer
│   ├── api/                       # API clients and utilities
│   │   ├── client.ts              # Supabase client (single source of truth)
│   │   ├── admin-client.ts        # Admin Supabase client (elevated permissions)
│   │   ├── types.ts               # Shared API types
│   │   ├── error-handling.ts      # Error standardization utilities
│   │   └── query-client.ts        # TanStack Query configuration
│   │
│   ├── config/                    # Application configuration
│   │   ├── env.ts                 # Environment variables with validation
│   │   ├── routes.ts              # Route constants and helpers
│   │   ├── features.ts            # Feature flags
│   │   └── constants.ts           # Global constants
│   │
│   ├── providers/                 # Global context providers
│   │   ├── QueryProvider.tsx      # TanStack Query provider
│   │   ├── ThemeProvider.tsx      # Theme/dark mode provider
│   │   ├── AuthProvider.tsx       # Auth initialization provider
│   │   └── ToastProvider.tsx      # Toast notification provider
│   │
│   └── router/                    # Routing configuration
│       ├── index.tsx              # Main router setup
│       ├── guards.tsx             # Route guards (AuthGuard, RoleGuard, etc.)
│       ├── lazy-routes.tsx        # Lazy loaded route configurations
│       └── routes.ts              # Route path constants
│
├── features/                      # Domain features (business logic)
│   │
│   ├── auth/                      # Authentication & Authorization
│   │   ├── components/            # Auth-specific components
│   │   │   ├── OTPInput.tsx
│   │   │   ├── PhoneInput.tsx
│   │   │   └── index.ts           # Barrel export
│   │   ├── hooks/                 # Auth hooks
│   │   │   ├── useAuth.ts         # Main auth hook
│   │   │   ├── useOTP.ts          # OTP verification hook
│   │   │   └── index.ts
│   │   ├── services/              # Auth service layer
│   │   │   ├── auth.service.ts    # Auth API calls
│   │   │   └── otp.service.ts     # OTP API calls
│   │   ├── store/                 # Auth Zustand store
│   │   │   └── auth.store.ts
│   │   ├── types/                 # Auth-specific types
│   │   │   └── index.ts
│   │   ├── pages/                 # Auth pages
│   │   │   ├── Login.tsx
│   │   │   ├── Signup.tsx
│   │   │   └── ResetPassword.tsx
│   │   └── index.ts               # Feature barrel export
│   │
│   ├── leads/                     # Lead/CRM Management
│   │   ├── components/
│   │   │   ├── LeadTable.tsx
│   │   │   ├── LeadCard.tsx
│   │   │   ├── LeadActions.tsx
│   │   │   ├── FilterBar.tsx
│   │   │   ├── StatsHeader.tsx
│   │   │   ├── EditLeadDialog.tsx
│   │   │   ├── AddLeadModal.tsx
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useLeads.ts
│   │   │   ├── useLeadFilters.ts
│   │   │   ├── useLeadStats.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   └── leads.service.ts
│   │   ├── store/
│   │   │   └── leads.store.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── pages/
│   │   │   └── CRMPage.tsx
│   │   └── index.ts
│   │
│   ├── marketplace/               # Lead Marketplace (Shop)
│   │   ├── components/
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── PurchaseDialog.tsx
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useMarketplace.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   └── marketplace.service.ts
│   │   ├── pages/
│   │   │   └── ShopPage.tsx
│   │   └── index.ts
│   │
│   ├── wallet/                    # Wallet & Payments
│   │   ├── components/
│   │   │   ├── WalletDisplay.tsx
│   │   │   ├── TopUpModal.tsx
│   │   │   ├── TransactionHistory.tsx
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useWallet.ts       # Migrated from Context to React Query
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── wallet.service.ts
│   │   │   └── payment.service.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── case-manager/              # AI Case Management
│   │   ├── components/
│   │   │   ├── CaseStageTimeline.tsx
│   │   │   ├── CaseCoachPanel.tsx
│   │   │   ├── FeedbackEditor.tsx
│   │   │   ├── ActivityLog.tsx
│   │   │   ├── QuickActions.tsx
│   │   │   ├── ChangeFaceModal.tsx
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useCase.ts
│   │   │   ├── useStageChange.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   └── case.service.ts
│   │   ├── lib/
│   │   │   └── stateMachine.ts    # Stage transition logic
│   │   ├── pages/
│   │   │   └── CaseManagerPage.tsx
│   │   └── index.ts
│   │
│   ├── admin/                     # Admin Panel
│   │   ├── components/
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── DataTable.tsx
│   │   │   ├── RichTextEditor.tsx
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useAdminData.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   └── admin.service.ts
│   │   ├── pages/
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── UserManagement.tsx
│   │   │   ├── Projects.tsx
│   │   │   ├── Leads.tsx
│   │   │   └── [others].tsx
│   │   └── index.ts
│   │
│   ├── team/                      # Team Management
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   ├── pages/
│   │   └── index.ts
│   │
│   ├── support/                   # Support System
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   ├── pages/
│   │   └── index.ts
│   │
│   ├── deals/                     # Deals Management
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   ├── pages/
│   │   └── index.ts
│   │
│   └── home/                      # Home/Dashboard
│       ├── components/
│       │   ├── BannerSection.tsx
│       │   ├── WalletCreditSection.tsx
│       │   └── index.ts
│       ├── pages/
│       │   └── HomePage.tsx
│       └── index.ts
│
├── shared/                        # Shared utilities and components
│   │
│   ├── components/                # Reusable UI components
│   │   ├── ui/                    # Base components (shadcn-inspired)
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Dialog.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── [others].tsx
│   │   ├── layout/                # Layout components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   ├── AppLayout.tsx
│   │   │   └── AdminLayout.tsx
│   │   └── common/                # Common composed components
│   │       ├── ErrorBoundary.tsx
│   │       ├── PageTitle.tsx
│   │       ├── EmptyState.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── index.ts
│   │
│   ├── hooks/                     # Shared custom hooks
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useMediaQuery.ts
│   │   └── index.ts
│   │
│   ├── utils/                     # Pure utility functions
│   │   ├── format.ts              # Formatting utilities
│   │   ├── validation.ts          # Validation utilities
│   │   ├── date.ts                # Date utilities
│   │   ├── currency.ts            # Currency formatting
│   │   ├── phone.ts               # Phone number utilities
│   │   └── index.ts
│   │
│   ├── constants/                 # Shared constants
│   │   ├── stages.ts              # Lead stages
│   │   ├── roles.ts               # User roles
│   │   └── index.ts
│   │
│   └── types/                     # Shared TypeScript types
│       ├── database.ts            # Generated from Supabase (DO NOT EDIT)
│       ├── api.ts                 # API request/response types
│       ├── entities.ts            # Domain entities
│       ├── enums.ts               # Enums
│       └── index.ts               # Re-exports
│
├── app/                           # App shell
│   └── App.tsx                    # Root component
│
└── main.tsx                       # Application entry point
```

### Backend Structure (supabase/functions/)

```
supabase/functions/
│
├── _core/                         # Shared utilities (NEW)
│   ├── cors.ts                    # CORS configuration
│   ├── auth.ts                    # Auth helpers
│   ├── db.ts                      # Database utilities
│   ├── errors.ts                  # Error handling
│   ├── validation.ts              # Input validation with Zod
│   └── types.ts                   # Shared types
│
├── _templates/                    # Function templates (NEW)
│   ├── basic-function.ts          # Basic function template
│   └── authenticated-function.ts  # Authenticated function template
│
├── auth/                          # Authentication domain (NEW)
│   ├── otp-request/
│   │   └── index.ts
│   ├── otp-verify/
│   │   └── index.ts
│   └── admin-create-user/
│       └── index.ts
│
├── marketplace/                   # Lead marketplace (NEW)
│   ├── marketplace/               # Get projects
│   │   └── index.ts
│   ├── purchase-leads/
│   │   └── index.ts
│   └── admin-marketplace/
│       └── index.ts
│
├── leads/                         # Lead management (NEW)
│   ├── assign-leads/
│   │   └── index.ts
│   ├── bulk-lead-upload/
│   │   └── index.ts
│   └── facebook-leads-webhook/
│       └── index.ts
│
├── case-manager/                  # AI case management (NEW)
│   ├── case-stage-change/
│   │   └── index.ts
│   ├── case-coach/
│   │   └── index.ts
│   ├── case-chat/
│   │   └── index.ts
│   ├── case-actions/
│   │   └── index.ts
│   ├── case-face-change/
│   │   └── index.ts
│   ├── inventory-matcher/
│   │   └── index.ts
│   └── reminder-scheduler/
│       └── index.ts
│
├── payments/                      # Payment processing (NEW)
│   ├── create-payment-intent/
│   │   └── index.ts
│   ├── create-kashier-payment/
│   │   └── index.ts
│   ├── payment-webhook/
│   │   └── index.ts
│   └── kashier-webhook/
│       └── index.ts
│
├── cms/                           # Content management (NEW)
│   ├── banners-resolve/
│   │   └── index.ts
│   ├── cms-preview/
│   │   └── index.ts
│   └── config-update/
│       └── index.ts
│
├── notifications/                 # Notifications (NEW)
│   └── notify-user/
│       └── index.ts
│
├── team/                          # Team management (NEW)
│   └── send-team-invitation/
│       └── index.ts
│
├── deals/                         # Deals (NEW)
│   ├── deals/
│   │   └── index.ts
│   └── upload-deal-files/
│       └── index.ts
│
└── admin/                         # Admin utilities (NEW)
    └── recalc-analytics/
        └── index.ts
```

---

## Naming Conventions

### Files & Folders

#### Frontend

| Type | Convention | Example |
|------|-----------|---------|
| **React Components** | PascalCase.tsx | `UserProfile.tsx` |
| **Pages** | PascalCase.tsx | `LoginPage.tsx` |
| **Hooks** | camelCase.ts with `use` prefix | `useAuth.ts` |
| **Services** | camelCase.service.ts | `leads.service.ts` |
| **Stores** | camelCase.store.ts | `auth.store.ts` |
| **Utils** | camelCase.ts | `format.ts` |
| **Types** | camelCase.ts or index.ts | `auth-types.ts` |
| **Constants** | camelCase.ts | `api-routes.ts` |
| **Test files** | Same as source + .test.ts | `auth.service.test.ts` |
| **Barrel exports** | index.ts | `index.ts` |

#### Backend (Edge Functions)

| Type | Convention | Example |
|------|-----------|---------|
| **Function folders** | kebab-case | `otp-request/` |
| **Entry file** | index.ts | `index.ts` |
| **Utilities** | camelCase.ts | `validation.ts` |

### Code Elements

#### TypeScript/JavaScript

| Element | Convention | Example |
|---------|-----------|---------|
| **Interfaces** | PascalCase with `I` prefix (optional) | `User`, `IUserProfile` |
| **Types** | PascalCase | `LeadStage`, `PaymentMethod` |
| **Enums** | PascalCase | `UserRole` |
| **Classes** | PascalCase | `PaymentService` |
| **Functions** | camelCase | `getUserById()` |
| **Variables** | camelCase | `userName` |
| **Constants** | UPPER_SNAKE_CASE | `API_BASE_URL` |
| **Private props** | camelCase with `_` prefix | `_internalState` |
| **React Components** | PascalCase | `<UserProfile />` |
| **Custom Hooks** | camelCase with `use` prefix | `useAuth()` |

#### Database

| Element | Convention | Example |
|---------|-----------|---------|
| **Tables** | snake_case, plural | `profiles`, `leads` |
| **Columns** | snake_case | `created_at`, `user_id` |
| **Functions** | snake_case | `get_wallet_balance()` |
| **Triggers** | snake_case with suffix | `update_updated_at_trigger` |
| **Indexes** | `idx_` + table + column | `idx_leads_profile_id` |

### Comments & Documentation

```typescript
// ✅ GOOD: JSDoc for public APIs
/**
 * Fetches leads for a given user with optional filters
 * @param userId - The user's ID
 * @param filters - Optional filters to apply
 * @returns Promise resolving to array of leads
 */
export async function getLeads(userId: string, filters?: LeadFilters): Promise<Lead[]> {
  // Implementation
}

// ✅ GOOD: Inline comments for complex logic
// Calculate wallet balance by summing credits and subtracting debits
const balance = credits.reduce((sum, t) => sum + t.amount, 0) - 
                debits.reduce((sum, t) => sum + t.amount, 0);

// ❌ BAD: Obvious comments
// Set the user name
setUserName(name);

// ❌ BAD: Commented-out code (use git history instead)
// const oldFunction = () => { ... }
```

---

## Code Organization Patterns

### Pattern 1: Feature Structure

Each feature follows this structure:

```
feature-name/
├── components/        # UI components specific to this feature
├── hooks/            # Custom hooks for this feature
├── services/         # API service layer
├── store/            # Zustand store (if needed)
├── types/            # TypeScript types
├── pages/            # Page components
├── lib/              # Feature-specific utilities
└── index.ts          # Barrel export (public API)
```

**Rule**: Only export what's needed by other features from `index.ts`

### Pattern 2: Service Layer

Every feature should have a service layer that encapsulates API calls:

```typescript
// features/leads/services/leads.service.ts
import { supabase } from '@/core/api/client';
import { Lead, LeadFilters } from '../types';

export class LeadsService {
  /**
   * Fetch all leads for a user
   */
  static async getLeads(userId: string, filters?: LeadFilters): Promise<Lead[]> {
    let query = supabase
      .from('leads')
      .select('*')
      .eq('profile_id', userId);

    if (filters?.stage) {
      query = query.eq('stage', filters.stage);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data as Lead[];
  }

  /**
   * Update a lead
   */
  static async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Lead;
  }
}
```

### Pattern 3: Custom Hooks

Hooks wrap service calls and provide state management:

```typescript
// features/leads/hooks/useLeads.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LeadsService } from '../services/leads.service';
import { useAuthStore } from '@/features/auth';

export function useLeads(filters?: LeadFilters) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Fetch leads
  const { data: leads, isLoading, error } = useQuery({
    queryKey: ['leads', user?.id, filters],
    queryFn: () => LeadsService.getLeads(user!.id, filters),
    enabled: !!user,
  });

  // Update lead mutation
  const updateLead = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Lead> }) =>
      LeadsService.updateLead(id, updates),
    onSuccess: () => {
      // Invalidate and refetch leads
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  return {
    leads,
    isLoading,
    error,
    updateLead: updateLead.mutate,
  };
}
```

### Pattern 4: Component Organization

```typescript
// features/leads/components/LeadCard.tsx
import { Card } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Lead } from '../types';
import { formatPhoneNumber } from '@/shared/utils/phone';

interface LeadCardProps {
  lead: Lead;
  onEdit: (lead: Lead) => void;
}

export function LeadCard({ lead, onEdit }: LeadCardProps) {
  return (
    <Card>
      <div className="p-4">
        <h3 className="font-semibold">{lead.name}</h3>
        <p className="text-sm text-gray-600">{formatPhoneNumber(lead.phone)}</p>
        <Badge>{lead.stage}</Badge>
        <button onClick={() => onEdit(lead)}>Edit</button>
      </div>
    </Card>
  );
}
```

### Pattern 5: Error Handling

```typescript
// core/api/error-handling.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleSupabaseError(error: any): never {
  if (error.code === 'PGRST301') {
    throw new ApiError('Resource not found', 'NOT_FOUND', 404);
  }
  if (error.code === '23505') {
    throw new ApiError('Duplicate entry', 'DUPLICATE', 409);
  }
  throw new ApiError(error.message || 'Unknown error', 'UNKNOWN', 500);
}
```

---

## Migration Strategy

### Phase-by-Phase Approach

#### Phase 1: Create New Structure (Non-Breaking)

1. Create new folder structure alongside existing code
2. No file moves yet, just new empty folders
3. Add deprecation warnings to old imports

```typescript
// OLD: src/lib/supabase.ts
import { supabase as newClient } from '@/core/api/client';

console.warn('DEPRECATED: Import from @/core/api/client instead');

export const supabase = newClient;
```

#### Phase 2: Migrate Core Infrastructure

1. **Supabase Clients**: Consolidate into `core/api/client.ts`
2. **Providers**: Move to `core/providers/`
3. **Router**: Refactor into `core/router/`
4. **Update main.tsx** to use new paths

**Rule**: Keep old exports working with deprecation warnings

#### Phase 3: Migrate Feature by Feature

For each feature (e.g., `auth`, `leads`, `wallet`):

1. Create feature folder structure
2. Move components to `features/[name]/components/`
3. Extract service layer into `features/[name]/services/`
4. Create custom hooks in `features/[name]/hooks/`
5. Move store to `features/[name]/store/`
6. Update all imports within the feature
7. Export public API from `features/[name]/index.ts`
8. Update external references

**Example Migration Checklist** (for auth feature):

- [ ] Create `features/auth/` structure
- [ ] Move `components/auth/*` → `features/auth/components/`
- [ ] Move `store/auth.ts` → `features/auth/store/auth.store.ts`
- [ ] Create `features/auth/services/auth.service.ts`
- [ ] Create `features/auth/hooks/useAuth.ts`
- [ ] Move `pages/Auth/*` → `features/auth/pages/`
- [ ] Update imports in auth components
- [ ] Create `features/auth/index.ts` barrel export
- [ ] Update external imports to use `@/features/auth`
- [ ] Add deprecation warnings to old paths
- [ ] Test auth flow thoroughly
- [ ] Remove old files (after 100% migration)

#### Phase 4: Clean Up

1. Remove old files (only after 100% migration confirmed)
2. Remove deprecation warnings
3. Update tests
4. Update documentation

### Backwards Compatibility Pattern

```typescript
// OLD PATH: src/lib/supabaseClient.ts
import { supabase } from '@/core/api/client';

if (process.env.NODE_ENV === 'development') {
  console.warn(
    'DEPRECATED: src/lib/supabaseClient.ts is deprecated. ' +
    'Please import from @/core/api/client instead.'
  );
}

export { supabase };
export default supabase;
```

### Tracking Migration Progress

Use comments in code to track migration status:

```typescript
// TODO(refactor): Migrate this component to features/leads/components/
// @deprecated Use features/leads/components/LeadCard instead
export function OldLeadCard() {
  // ...
}
```

---

## Import Path Standards

### Use Path Aliases

**Configure in `tsconfig.json`**:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/core/*": ["./src/core/*"],
      "@/features/*": ["./src/features/*"],
      "@/shared/*": ["./src/shared/*"]
    }
  }
}
```

**Configure in `vite.config.ts`**:
```typescript
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Import Order

```typescript
// 1. External dependencies
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Core/infrastructure
import { supabase } from '@/core/api/client';
import { ROUTES } from '@/core/config/routes';

// 3. Features (other features)
import { useAuth } from '@/features/auth';

// 4. Shared utilities
import { Button } from '@/shared/components/ui/Button';
import { formatDate } from '@/shared/utils/date';

// 5. Local imports (same feature)
import { LeadsService } from '../services/leads.service';
import { Lead } from '../types';

// 6. Styles (if any)
import './LeadCard.css';
```

### Import Rules

✅ **DO**:
- Use `@/` alias for absolute imports
- Import types separately when useful
- Use barrel exports from `index.ts`

```typescript
import { Button, Input, Card } from '@/shared/components/ui';
import type { Lead, LeadFilters } from '@/features/leads';
```

❌ **DON'T**:
- Use relative imports for shared code: `import { Button } from '../../../shared/components/ui/Button'`
- Import from internal feature files: `import { LeadCard } from '@/features/leads/components/LeadCard'` (use barrel export instead)
- Mix default and named exports inconsistently

---

## Progress Tracking

### Migration Status

| Feature | Structure Created | Components Migrated | Services Created | Hooks Created | Tests Added | Complete |
|---------|-------------------|---------------------|------------------|---------------|-------------|----------|
| **Core** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| **Auth** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| **Leads** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| **Marketplace** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| **Wallet** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| **Case Manager** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| **Admin** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| **Team** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| **Support** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| **Deals** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

### Backend Migration Status

| Domain | Folder Created | Functions Moved | Utilities Created | Tests Added | Complete |
|--------|----------------|-----------------|-------------------|-------------|----------|
| **_core** | ⬜ | N/A | ⬜ | ⬜ | ⬜ |
| **Auth** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| **Marketplace** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| **Leads** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| **Case Manager** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| **Payments** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| **CMS** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| **Team** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

---

## Architecture Decision Records (ADRs)

### ADR-001: Use Zustand + TanStack Query

**Date**: 2024-11-19  
**Status**: Accepted  
**Context**: Need clear state management strategy  
**Decision**: Use Zustand for client state, TanStack Query for server state  
**Consequences**: Clear separation, better caching, less boilerplate

### ADR-002: Domain-Based Folder Structure

**Date**: 2024-11-19  
**Status**: Accepted  
**Context**: Current flat structure is hard to navigate  
**Decision**: Organize by domain (features/), not by type (components/)  
**Consequences**: Related code grouped together, easier feature development

### ADR-003: Service Layer Pattern

**Date**: 2024-11-19  
**Status**: Accepted  
**Context**: Direct Supabase calls in components hard to test and maintain  
**Decision**: Create service layer for all API calls  
**Consequences**: Better separation, easier mocking, reusable logic

---

## Questions & Decisions Log

### Q: Should we use Redux instead of Zustand?
**A**: No. Zustand is lighter, simpler, and sufficient for our needs. Redux would add unnecessary complexity.

### Q: Why not use Next.js for SSR?
**A**: SaleMate is a B2B SaaS app behind authentication. SEO is not critical. Vite provides faster DX for our use case.

### Q: Should all Edge Functions be reorganized?
**A**: Yes, for consistency. But it's lower priority than frontend refactor since backend is already working well.

---

## Resources

- [React Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

---

**Last Updated**: November 19, 2024  
**Maintained By**: SaleMate Engineering Team

