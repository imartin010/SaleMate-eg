# Contributing to SaleMate

Thank you for your interest in contributing to SaleMate! This document provides guidelines and best practices for contributing to the project.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Code Organization](#code-organization)
4. [Coding Standards](#coding-standards)
5. [Commit Guidelines](#commit-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Testing](#testing)
8. [Documentation](#documentation)

---

## Getting Started

### Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **Git**: Latest version
- **Supabase CLI**: For local database development

### Initial Setup

```bash
# Clone the repository
git clone <repo-url>
cd "Sale Mate Final"

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

### Project Structure

Before contributing, familiarize yourself with the project structure:

- **`/src/core/`** - Core infrastructure (API clients, config, providers, router)
- **`/src/features/`** - Domain features organized by business domain
- **`/src/shared/`** - Shared utilities, components, hooks, types
- **`/supabase/`** - Backend (database migrations, Edge Functions)
- **`/docs/`** - Documentation

📖 **Read**: [ARCHITECTURE_OVERVIEW.md](../ARCHITECTURE_OVERVIEW.md) and [REFACTOR_PLAN.md](../REFACTOR_PLAN.md)

---

## Development Workflow

### 1. Create a Branch

```bash
# Feature branch
git checkout -b feature/your-feature-name

# Bug fix branch
git checkout -b fix/bug-description

# Documentation branch
git checkout -b docs/what-youre-documenting
```

### 2. Make Changes

- Follow the [Code Organization](#code-organization) guidelines
- Write clean, self-documenting code
- Add comments for complex logic only
- Follow [Coding Standards](#coding-standards)

### 3. Test Your Changes

```bash
# Run type checking
npm run typecheck

# Run linter
npm run lint

# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e
```

### 4. Commit Changes

Follow [Commit Guidelines](#commit-guidelines) below.

### 5. Push and Create PR

```bash
git push origin your-branch-name
```

Then create a Pull Request on GitHub.

---

## Code Organization

### Feature-Based Structure

All business logic is organized by domain in `/src/features/`:

```
features/[domain]/
├── components/   # UI components
├── hooks/        # Custom hooks
├── services/     # API calls
├── store/        # Zustand store (if needed)
├── types/        # TypeScript types
├── pages/        # Page components
└── index.ts      # Public API (barrel export)
```

### Adding a New Feature

1. Create the feature folder: `mkdir -p src/features/your-feature/{components,hooks,services,types,pages}`
2. Create `index.ts` to export public API
3. Keep feature self-contained
4. Minimize dependencies on other features

### Service Layer Pattern

All API calls must go through a service layer:

```typescript
// features/leads/services/leads.service.ts
import { supabase } from '@/core/api/client';

export class LeadsService {
  static async getLeads(userId: string) {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('profile_id', userId);
    
    if (error) throw error;
    return data;
  }
}
```

### Custom Hooks Pattern

Hooks should wrap service calls and provide state management:

```typescript
// features/leads/hooks/useLeads.ts
import { useQuery } from '@tanstack/react-query';
import { LeadsService } from '../services/leads.service';

export function useLeads(userId: string) {
  return useQuery({
    queryKey: ['leads', userId],
    queryFn: () => LeadsService.getLeads(userId),
    enabled: !!userId,
  });
}
```

---

## Coding Standards

### TypeScript

- ✅ **Always use TypeScript** - No `any` types unless absolutely necessary
- ✅ **Explicit return types** for functions
- ✅ **Interfaces over types** for object shapes
- ✅ **Type imports** - Use `import type` when importing types only

```typescript
// ✅ Good
import type { User } from '@/shared/types';

export function getUser(id: string): Promise<User> {
  // ...
}

// ❌ Bad
export function getUser(id) {
  // ...
}
```

### React Components

- ✅ **Functional components** with hooks
- ✅ **Named exports** (not default exports)
- ✅ **Props interface** with clear naming
- ✅ **Destructure props** in component signature

```typescript
// ✅ Good
interface LeadCardProps {
  lead: Lead;
  onEdit: (lead: Lead) => void;
}

export function LeadCard({ lead, onEdit }: LeadCardProps) {
  return <div>{lead.name}</div>;
}

// ❌ Bad
export default (props) => {
  return <div>{props.lead.name}</div>;
}
```

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| **Files** | PascalCase for components, camelCase for others | `UserProfile.tsx`, `useAuth.ts` |
| **Components** | PascalCase | `<UserProfile />` |
| **Hooks** | camelCase with `use` prefix | `useAuth()` |
| **Functions** | camelCase | `getUserById()` |
| **Constants** | UPPER_SNAKE_CASE | `API_BASE_URL` |
| **Types/Interfaces** | PascalCase | `User`, `LeadFilters` |

### Import Order

```typescript
// 1. External dependencies
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Core/infrastructure
import { supabase } from '@/core/api/client';

// 3. Features (other)
import { useAuth } from '@/features/auth';

// 4. Shared
import { Button } from '@/shared/components/ui/Button';
import { formatDate } from '@/shared/utils/date';

// 5. Local
import { LeadsService } from '../services/leads.service';
import type { Lead } from '../types';
```

### Error Handling

```typescript
// ✅ Good - Explicit error handling
try {
  const data = await LeadsService.getLeads(userId);
  return data;
} catch (error) {
  console.error('Failed to fetch leads:', error);
  throw new ApiError('Failed to fetch leads', error);
}

// ❌ Bad - Silent failures
const data = await LeadsService.getLeads(userId).catch(() => []);
```

---

## Commit Guidelines

### Commit Message Format

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(auth): add OTP login support

fix(leads): resolve stage update race condition

docs(contributing): add service layer guidelines

refactor(wallet): migrate to React Query for server state
```

---

## Pull Request Process

### Before Creating a PR

1. ✅ Code compiles (`npm run typecheck`)
2. ✅ Linter passes (`npm run lint`)
3. ✅ Tests pass (`npm run test`)
4. ✅ No console errors in dev mode
5. ✅ Updated relevant documentation
6. ✅ Added/updated tests for new functionality

### PR Title Format

Same as commit message format:

```
feat(leads): add bulk lead upload feature
```

### PR Description Template

```markdown
## What does this PR do?

Brief description of the changes.

## Related Issue

Closes #123

## Changes Made

- Added bulk upload component
- Created upload service
- Updated lead types

## Testing

- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manually tested in browser

## Screenshots (if applicable)

[Add screenshots here]

## Checklist

- [ ] Code follows project standards
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] No breaking changes
- [ ] Backward compatible
```

### Review Process

1. Code review by at least one team member
2. All checks must pass (TypeScript, Linter, Tests)
3. No unresolved comments
4. Approved by reviewer
5. Squash and merge

---

## Testing

### Unit Tests (Vitest)

```typescript
// features/leads/services/leads.service.test.ts
import { describe, it, expect, vi } from 'vitest';
import { LeadsService } from './leads.service';

describe('LeadsService', () => {
  it('should fetch leads for a user', async () => {
    const userId = 'user-123';
    const leads = await LeadsService.getLeads(userId);
    
    expect(leads).toBeInstanceOf(Array);
  });
});
```

Run tests:
```bash
npm run test        # Watch mode
npm run test:unit   # Single run
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('should login with valid credentials', async ({ page }) => {
  await page.goto('/auth/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('/app/home');
});
```

Run E2E tests:
```bash
npm run test:e2e     # Headless mode
npm run test:e2e:ui  # Interactive UI mode
```

### Test Coverage

Aim for:
- **80%+** coverage for services
- **70%+** coverage for hooks
- **60%+** coverage for components
- **100%** coverage for critical business logic (payments, lead assignment, wallet)

---

## Documentation

### Code Documentation

Use JSDoc for public APIs:

```typescript
/**
 * Fetches leads for a specific user with optional filters
 * @param userId - The user's ID
 * @param filters - Optional filters to apply
 * @returns Promise resolving to array of leads
 * @throws {ApiError} If the API request fails
 */
export async function getLeads(
  userId: string,
  filters?: LeadFilters
): Promise<Lead[]> {
  // Implementation
}
```

### Feature Documentation

When adding a new feature:

1. Add overview to `ARCHITECTURE_OVERVIEW.md`
2. Create feature-specific doc in `docs/domains/[feature]/`
3. Update `docs/DOCUMENTATION_INDEX.md`
4. Add API docs if applicable

### Migration Documentation

When refactoring existing code:

1. Add entry to `REFACTOR_PLAN.md` migration tracking table
2. Leave deprecation warnings in old code
3. Update import paths incrementally
4. Document breaking changes

---

## Questions?

- Check [ARCHITECTURE_OVERVIEW.md](../ARCHITECTURE_OVERVIEW.md)
- Review [REFACTOR_PLAN.md](../REFACTOR_PLAN.md)
- Look at existing code for patterns
- Ask in team chat/Slack

---

**Thank you for contributing to SaleMate!** 🎉

