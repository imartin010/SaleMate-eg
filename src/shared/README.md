# Shared

This folder contains code that's shared across multiple features.

## Structure

```
shared/
├── components/       # Reusable UI components
│   ├── ui/          # Base components (Button, Input, Card, etc.)
│   ├── layout/      # Layout components (Sidebar, AppLayout, etc.)
│   └── common/      # Common composed components
├── hooks/           # Shared custom hooks
├── utils/           # Pure utility functions
├── constants/       # Shared constants
└── types/           # Shared TypeScript types
```

## Guidelines

1. **Only truly shared code** - Don't move code here prematurely
2. **Pure utilities** - Utils should be pure functions with no side effects
3. **Well-documented** - Add JSDoc comments for public APIs
4. **Well-tested** - Shared code should have tests
5. **No feature-specific logic** - Keep business logic in features

## When to Use

✅ **DO use shared/** for:
- Generic UI components (Button, Input, etc.)
- Common utilities (formatDate, formatCurrency, etc.)
- Shared type definitions
- Reusable hooks (useDebounce, useLocalStorage, etc.)

❌ **DON'T use shared/** for:
- Feature-specific components
- Business logic
- API calls
- Domain-specific utilities

