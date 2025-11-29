# GTM Launch Plan - CRM-First Strategy

## Overview

This document outlines the phased rollout strategy for SaleMate's Go-To-Market (GTM) launch. The platform is launching as an **AI-Enabled CRM** first, with marketplace and partner features launching in subsequent phases.

## Launch Phases

### Phase 1: CRM Launch (Month 0) - CURRENT

**Focus**: AI-Enabled CRM with lead management, performance tracking, and financial tracking

**Features Available**:
- Lead Management (CRUD operations)
- Pipeline stages (10 stages)
- Basic filtering and search
- Lead assignment
- Basic analytics dashboard
- Agent performance tracking
- Financial tracking (revenue, budgets, basic ROI)
- Inventory browsing (primary market inventory)

**Features Hidden**:
- Lead Marketplace/Shop (coming Month 2)
- Partner Deals (coming Month 6)
- Wallet system (enabled with shop)

### Phase 2: Lead Marketplace Launch (Month 2)

**New Features**:
- Lead Marketplace/Shop
- Wallet system
- Lead purchase flow
- Integration with CRM

**Feature Flag**: `LEADS_SHOP_ENABLED: true`
**Feature Flag**: `WALLET_ENABLED: true`

### Phase 3: Partner Deals Launch (Month 6)

**New Features**:
- Deal submission
- Partner commission tracking
- Deal management workflow

**Feature Flag**: `PARTNER_DEALS_ENABLED: true`

## Feature Flags

All feature flags are managed in `src/core/config/features.ts`:

```typescript
export const FEATURES = {
  // GTM Launch Features
  LEADS_SHOP_ENABLED: false, // Enable at Month 2
  PARTNER_DEALS_ENABLED: false, // Enable at Month 6
  WALLET_ENABLED: false, // Enable when shop launches
  CRM_LAUNCH_MODE: true, // Master flag for CRM-first mode
  // ... other flags
}
```

### How to Enable Features

1. **For Lead Marketplace (Month 2)**:
   - Set `LEADS_SHOP_ENABLED: true`
   - Set `WALLET_ENABLED: true`

2. **For Partner Deals (Month 6)**:
   - Set `PARTNER_DEALS_ENABLED: true`

## Implementation Details

### Navigation

Navigation items are automatically shown/hidden based on feature flags:
- **Sidebar** (`src/app/layout/Sidebar.tsx`): Uses `useFeatureFlags()` hook
- **Bottom Nav** (`src/app/layout/BottomNav.tsx`): Filters navigation items based on flags

### Route Protection

Routes are protected using `FeatureGuard` component:
- `/app/shop` - Redirects to home if `LEADS_SHOP_ENABLED` is false
- `/app/partners` - Redirects to home if `PARTNER_DEALS_ENABLED` is false
- `/app/deals` - Redirects to home if `PARTNER_DEALS_ENABLED` is false

### Homepage Components

Homepage components check feature flags and show "Coming Soon" placeholders:
- `ShopWindowSection` - Shows Coming Soon card when shop is disabled
- `PartnersSection` - Shows Coming Soon card when deals are disabled
- `WalletCreditSection` - Hidden when wallet is disabled
- `QuickActionsSection` - Filters actions based on feature flags

### Dashboard

Two dashboard options:
1. **CRM Launch Dashboard** (`/app/crm/dashboard`) - Simplified, CRM-focused dashboard
2. **Advanced Analytics** (`/app/crm/analysis`) - Full analytics dashboard

## Marketing Messaging

### Current Messaging (CRM Launch)
- **Headline**: "AI-Enabled CRM for Real Estate Professionals"
- **Value Props**: Lead Management, Performance Tracking, AI-Powered Insights, Financial Tracking
- **CTA**: "Start Managing Leads" / "Get Started"

### Future Messaging Updates
- **Month 2**: Add "Lead Marketplace Now Available"
- **Month 6**: Add "Partner Deals Now Available"

## Testing Checklist

### Before Launch
- [ ] All feature flags set correctly
- [ ] Navigation items hidden/shown correctly
- [ ] Routes redirect properly when features disabled
- [ ] Homepage shows "Coming Soon" placeholders
- [ ] Dashboard loads and displays correctly
- [ ] Marketing homepage focuses on CRM value

### Before Month 2 Launch
- [ ] Test enabling `LEADS_SHOP_ENABLED`
- [ ] Test enabling `WALLET_ENABLED`
- [ ] Verify shop page loads
- [ ] Verify wallet section appears
- [ ] Test purchase flow

### Before Month 6 Launch
- [ ] Test enabling `PARTNER_DEALS_ENABLED`
- [ ] Verify partners page loads
- [ ] Verify deals page loads
- [ ] Test deal submission flow

## Rollback Plan

If issues arise, feature flags can be quickly disabled:
1. Set feature flag to `false` in `src/core/config/features.ts`
2. Deploy changes
3. Features will be hidden and routes will redirect

## Support

For questions or issues with the GTM launch plan, contact the development team.

