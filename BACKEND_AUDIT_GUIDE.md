# Backend-Frontend Connection Audit Guide

## Overview

A comprehensive audit tool has been created to test all aspects of the Supabase backend connection. This tool checks:

1. **Environment Variables** - Verifies Supabase URL and API keys are configured
2. **Supabase Client** - Tests client initialization and required methods
3. **Network Connectivity** - Tests network connection to Supabase servers
4. **Authentication Service** - Verifies auth service is working
5. **Database Connection** - Tests database connectivity
6. **RLS Policies** - Checks Row Level Security policies
7. **Critical Tables** - Verifies access to essential tables (profiles, projects, leads)
8. **Edge Functions** - Tests edge functions endpoint
9. **Realtime Connection** - Tests Supabase realtime subscriptions
10. **Performance** - Measures query response times

## How to Use

### Option 1: Via Settings Page

1. Navigate to `/app/settings` in your application
2. Scroll down to the "Backend Connection Audit" section
3. Click "Run Audit" to start the comprehensive test
4. Review the results - each test shows:
   - ✅ **Pass** (Green) - Test successful
   - ⚠️ **Warning** (Yellow) - Test passed but with concerns
   - ❌ **Fail** (Red) - Test failed

### Option 2: Programmatic Access

```typescript
import { auditBackendConnection } from '../utils/backendAudit';

// Run the audit
const report = await auditBackendConnection();

console.log('Overall Status:', report.overall);
console.log('Summary:', report.summary);
console.log('Results:', report.results);
```

## Understanding Results

### Overall Status

- **Healthy** - All tests passed, no warnings
- **Degraded** - Some warnings but no failures
- **Critical** - One or more tests failed

### Common Issues and Solutions

#### 1. Environment Variables Missing
**Symptom:** "Missing required environment variables"
**Solution:** 
- Check `.env` file exists
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Restart dev server after adding variables

#### 2. Network Connectivity Issues
**Symptom:** "Network request failed" or high latency
**Solution:**
- Check internet connection
- Verify Supabase project is active
- Check firewall/proxy settings

#### 3. RLS Policy Issues
**Symptom:** "RLS policies may be blocking access"
**Solution:**
- Review Row Level Security policies in Supabase
- Ensure user has proper permissions
- Check if policies allow SELECT operations

#### 4. Table Access Issues
**Symptom:** "Some critical tables are not accessible"
**Solution:**
- Verify tables exist in Supabase
- Check RLS policies for those tables
- Ensure user has SELECT permissions

#### 5. Authentication Service Issues
**Symptom:** "Auth service error"
**Solution:**
- Check Supabase auth configuration
- Verify auth settings in Supabase dashboard
- Check if session is valid

## Test Details

### Environment Variables Test
- Checks for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Validates URL format (should use HTTPS)
- Reports key length (for security verification)

### Network Connectivity Test
- Tests connection to Supabase REST endpoint
- Measures latency
- Flags high latency (>5 seconds) as warning

### Database Connection Test
- Attempts simple query to `projects` table
- Distinguishes between connection errors and RLS issues
- Reports specific error codes

### RLS Policies Test
- Tests access to own profile (should always work)
- Tests access to leads table
- Identifies overly restrictive policies

### Critical Tables Test
- Tests access to: `profiles`, `projects`, `leads`
- Reports which tables are accessible
- Helps identify missing tables or permission issues

### Performance Test
- Runs parallel queries
- Measures total response time
- Flags slow performance (>3 seconds) as warning

## Integration

The audit tool is automatically available on the Settings page (`/app/settings`). It runs automatically when the page loads and can be manually triggered with the "Run Audit" button.

## Best Practices

1. **Run audit regularly** - Especially after:
   - Environment changes
   - Supabase configuration updates
   - RLS policy changes
   - Deployment

2. **Monitor warnings** - Even if tests pass, warnings indicate potential issues

3. **Check details** - Expand test details to see specific error messages

4. **Compare results** - Track audit results over time to identify trends

## Troubleshooting

If the audit panel doesn't appear:

1. Check browser console for errors
2. Verify the component is imported correctly
3. Check if Settings page is accessible
4. Verify user has proper permissions

## Files Created

- `src/utils/backendAudit.ts` - Core audit logic
- `src/components/admin/BackendAuditPanel.tsx` - UI component
- Updated `src/pages/Settings.tsx` - Added audit panel

## Next Steps

After running the audit:

1. Address any **critical** failures first
2. Review **warnings** and fix if needed
3. Document any expected warnings (e.g., no active session)
4. Set up monitoring if needed


