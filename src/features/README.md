# Features

This folder contains domain-specific features, organized by business domain.

## Structure

Each feature follows this structure:

```
feature-name/
├── components/        # UI components specific to this feature
├── hooks/            # Custom hooks for this feature
├── services/         # API service layer
├── store/            # Zustand store (if needed)
├── types/            # TypeScript types
├── pages/            # Page components
├── lib/              # Feature-specific utilities (optional)
└── index.ts          # Barrel export (public API)
```

## Features

- **auth/** - Authentication & authorization (OTP, email/password, RBAC)
- **leads/** - Lead/CRM management
- **marketplace/** - Lead marketplace (shop)
- **wallet/** - Wallet & payments
- **case-manager/** - AI-powered case management
- **admin/** - Admin panel & CMS
- **team/** - Team management & collaboration
- **support/** - Support ticket system
- **deals/** - Deal management
- **home/** - Home/dashboard

## Guidelines

1. **Keep features independent** - Minimize dependencies between features
2. **Export through index.ts** - Only export what's needed by other features
3. **Use services for API calls** - Don't call Supabase directly in components
4. **Co-locate related code** - Keep components, hooks, and services together
5. **Clear naming** - Use descriptive names that reflect business domain

