# Edge Functions Organization Plan

## Current Status

**33 Edge Functions** currently in flat structure.

**New Structure Created**:
- Domain-based folders created
- Core utilities created (`_core/`)
- Templates created (`_templates/`)

## Target Organization

### Auth Domain (`auth/`)

- ✅ `otp-request/` - Request OTP code
- ✅ `otp-verify/` - Verify OTP code
- ✅ `auth-otp/` - Legacy OTP handler (to be deprecated)
- ✅ `admin-create-user/` - Admin user creation
- ✅ `send-otp/` - (Empty, to be removed)
- ✅ `verify-otp/` - (Empty, to be removed)

### Marketplace Domain (`marketplace/`)

- ✅ `marketplace/` - Get available projects
- ✅ `purchase-leads/` - Purchase leads with wallet
- ✅ `admin-marketplace/` - Admin marketplace operations

### Leads Domain (`leads/`)

- ✅ `assign_leads/` - Assign leads to user
- ✅ `bulk-lead-upload/` - Bulk upload leads (CSV)
- ✅ `facebook-leads-webhook/` - Facebook Lead Ads webhook

### Case Manager Domain (`case-manager/`)

- ✅ `case-stage-change/` - Change lead stage
- ✅ `case-coach/` - AI coaching with GPT-4
- ✅ `case-chat/` - Chat with AI coach
- ✅ `case-actions/` - Manage case actions
- ✅ `case-face-change/` - Reassign lead (face switching)
- ✅ `inventory-matcher/` - Match properties to budget
- ✅ `reminder-scheduler/` - Schedule reminders (cron job)

### Payments Domain (`payments/`)

- ✅ `create-payment-intent/` - Create Stripe payment
- ✅ `create-kashier-payment/` - Create Kashier payment
- ✅ `payment-webhook/` - Generic payment webhook
- ✅ `kashier-webhook/` - Kashier-specific webhook
- ✅ `payment_webhook/` - (Duplicate, to be removed)

### CMS Domain (`cms/`)

- ✅ `banners-resolve/` - Get active banners
- ✅ `cms-preview/` - Preview CMS content
- ✅ `config-update/` - Update configuration

### Notifications Domain (`notifications/`)

- ✅ `notify-user/` - Send user notification

### Team Domain (`team/`)

- ✅ `send-team-invitation/` - Send team invitation email

### Deals Domain (`deals/`)

- ✅ `deals/` - Manage deals
- ✅ `upload-deal-files/` - Upload deal documents

### Admin Domain (`admin/`)

- ✅ `recalc_analytics/` - Recalculate analytics
- ✅ `partners/` - Partner management

### Other

- ✅ `send-custom-email/` - Generic email sending
- ✅ `send-test-email/` - Email testing
- ✅ `send-test-sms/` - SMS testing

## Migration Strategy

### Phase 1: Non-Breaking (CURRENT)
✅ Create domain folders  
✅ Create core utilities  
✅ Create templates  
✅ Document organization plan

### Phase 2: Gradual Migration (FUTURE)
1. Create new functions in domain folders using templates
2. Update frontend calls to use new paths
3. Keep old functions as aliases pointing to new ones
4. Mark old functions as deprecated
5. Monitor usage of old vs new paths
6. Remove old functions after 100% migration

### Phase 3: Cleanup (FUTURE)
1. Remove deprecated functions
2. Update deployment scripts
3. Update documentation

## Using the New Structure

### Creating a New Function

```bash
# Copy template
cp _templates/authenticated-function.ts leads/my-new-function/index.ts

# Edit the function
# ... implement your logic ...

# Deploy
supabase functions deploy leads/my-new-function
```

### Frontend Integration

```typescript
// Old way (still works)
const { data } = await supabase.functions.invoke('purchase-leads', { body });

// New way (recommended for new code)
const { data } = await supabase.functions.invoke('marketplace/purchase-leads', { body });
```

## Benefits of New Structure

1. **Clear organization** - Find functions by business domain
2. **Reduced naming conflicts** - Namespaced by domain
3. **Better DX** - Templates and utilities for consistency
4. **Easier onboarding** - Clear structure for new developers
5. **Domain ownership** - Teams can own their function folders

## Notes

- Old flat structure still works (backward compatible)
- New functions should use domain folders
- Gradual migration over time
- No breaking changes to existing deployments

## Core Utilities Available

All functions can use:

- `_core/cors.ts` - CORS configuration
- `_core/errors.ts` - Error handling
- `_core/auth.ts` - Authentication helpers
- `_core/validation.ts` - Input validation

See `_templates/README.md` for usage examples.

