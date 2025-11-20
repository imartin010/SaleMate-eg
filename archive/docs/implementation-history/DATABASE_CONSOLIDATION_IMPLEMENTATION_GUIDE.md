# 📘 Database Consolidation Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the 3-phase database consolidation to reduce your table count from **15 tables to 12 tables** (71% total reduction from the original 41+ tables).

---

## Prerequisites

### Before You Begin

1. ✅ **Backup your database**
   ```bash
   # Using Supabase CLI
   supabase db dump -f backup_before_consolidation.sql
   ```

2. ✅ **Test in staging environment first**
   - Never run these migrations directly on production
   - Verify all functionality after each phase

3. ✅ **Review current table usage**
   - Identify which parts of your codebase use affected tables
   - Plan code updates accordingly

4. ✅ **Notify your team**
   - Schedule maintenance window if needed
   - Coordinate with frontend/backend developers

---

## Migration Files

Three migration files have been created:

1. **20241118000001_phase1_wallet_consolidation.sql**
   - Merges `wallet_ledger_entries` → `payments`
   - Risk: LOW | Impact: HIGH
   
2. **20241118000002_phase2_analytics_consolidation.sql**
   - Merges `content_metrics` → `system_logs`
   - Risk: LOW | Impact: MEDIUM
   
3. **20241118000003_phase3_notification_consolidation.sql**
   - Merges `notifications` → `activities`
   - Risk: MEDIUM | Impact: HIGH

---

## Phase 1: Wallet Consolidation

### Objective
Merge `wallet_ledger_entries` into `payments` table for unified financial transactions.

### Estimated Time
- Migration: 5 minutes
- Testing: 1-2 hours
- Code updates: 2-4 hours

### Steps

#### 1. Review Current Usage

```bash
# Find all references to wallet_ledger_entries in your codebase
cd "/Users/martin2/Desktop/Sale Mate Final"
grep -r "wallet_ledger_entries" src/ --include="*.ts" --include="*.tsx"
```

#### 2. Run Migration

```bash
# Using Supabase CLI (recommended)
cd "/Users/martin2/Desktop/Sale Mate Final"
supabase db push

# Or apply directly via SQL
psql $DATABASE_URL -f supabase/migrations/20241118000001_phase1_wallet_consolidation.sql
```

#### 3. Verify Migration

```sql
-- Check that data was migrated
SELECT COUNT(*) as total_payments FROM public.payments;
SELECT COUNT(*) as ledger_entries FROM public.payments WHERE ledger_entry_type IS NOT NULL;

-- Check compatibility view works
SELECT * FROM public.wallet_ledger_entries LIMIT 5;

-- Verify balances are correct
SELECT 
  profile_id, 
  COUNT(*) as transaction_count, 
  MAX(running_balance) as final_balance 
FROM public.payments 
WHERE ledger_entry_type IS NOT NULL 
GROUP BY profile_id;
```

#### 4. Update Application Code

**Option A: Use Compatibility View (Quick)**
```typescript
// No code changes needed!
// The wallet_ledger_entries view provides backward compatibility
const { data, error } = await supabase
  .from('wallet_ledger_entries')
  .select('*')
  .eq('profile_id', userId);
```

**Option B: Update to Use Payments Table (Recommended)**
```typescript
// Update to query payments table directly
const { data, error } = await supabase
  .from('payments')
  .select('*')
  .eq('profile_id', userId)
  .not('ledger_entry_type', 'is', null);
```

#### 5. Testing Checklist

- [ ] Wallet balance displays correctly
- [ ] Transaction history shows all entries
- [ ] Deposits work correctly
- [ ] Withdrawals work correctly
- [ ] Balance calculations are accurate
- [ ] Running balance is maintained properly

#### 6. Monitor for 1 Week

Watch for:
- Any wallet-related errors in logs
- Balance discrepancies
- Performance issues

---

## Phase 2: Analytics Consolidation

### Objective
Merge `content_metrics` into `system_logs` table for unified analytics.

### Estimated Time
- Migration: 3 minutes
- Testing: 1 hour
- Code updates: 1-2 hours

### Steps

#### 1. Review Current Usage

```bash
# Find all references to content_metrics
grep -r "content_metrics" src/ --include="*.ts" --include="*.tsx"
```

#### 2. Run Migration

```bash
supabase db push
# Or apply directly:
# psql $DATABASE_URL -f supabase/migrations/20241118000002_phase2_analytics_consolidation.sql
```

#### 3. Verify Migration

```sql
-- Check that metrics were migrated
SELECT COUNT(*) as total_system_logs FROM public.system_logs;
SELECT COUNT(*) as content_metrics FROM public.system_logs WHERE log_type = 'content_metric';

-- Check event distribution
SELECT event_name, COUNT(*) as event_count 
FROM public.system_logs 
WHERE log_type = 'content_metric' 
GROUP BY event_name;

-- Test compatibility view
SELECT * FROM public.content_metrics LIMIT 10;
```

#### 4. Update Application Code

**Option A: Use Compatibility View**
```typescript
// No changes needed - view provides compatibility
const { data, error } = await supabase
  .from('content_metrics')
  .select('*')
  .eq('content_id', contentId);
```

**Option B: Use New Analytics Functions**
```typescript
// Use new helper functions for better performance
const { data, error } = await supabase
  .rpc('get_content_analytics', {
    p_content_id: contentId,
    p_start_date: '2024-01-01',
    p_end_date: '2024-12-31'
  });

// Get top performing content
const { data: topContent } = await supabase
  .rpc('get_top_performing_content', {
    p_event_type: 'click',
    p_limit: 10
  });
```

#### 5. Testing Checklist

- [ ] Content impressions tracked correctly
- [ ] Click tracking works
- [ ] Analytics dashboard displays data
- [ ] View/interaction events recorded
- [ ] Helper functions return correct data

---

## Phase 3: Notification Consolidation

### Objective
Merge `notifications` into `activities` table for unified event stream.

### Estimated Time
- Migration: 10 minutes
- Testing: 2-4 hours
- Code updates: 4-8 hours

### ⚠️ Important Considerations

This is the most complex consolidation because:
- Notifications are used in real-time features
- May affect UI responsiveness
- Requires careful testing of notification delivery

### Recommended Approach: Gradual Cutover

Consider implementing a **dual-write period** where:
1. Write to both old and new locations
2. Read from new location
3. Monitor for issues
4. After 1 week, stop writing to old location

### Steps

#### 1. Review Current Usage

```bash
# Find all references to notifications
grep -r "notifications" src/ --include="*.ts" --include="*.tsx"
grep -r "from('notifications')" src/
```

#### 2. Create Backup

```bash
# Create explicit backup of notifications table
pg_dump $DATABASE_URL -t public.notifications > notifications_backup.sql
```

#### 3. Run Migration

```bash
supabase db push
```

#### 4. Verify Migration

```sql
-- Check that notifications were migrated
SELECT COUNT(*) as total_activities FROM public.activities;
SELECT COUNT(*) as notifications FROM public.activities WHERE activity_type = 'notification';

-- Check status distribution
SELECT notification_status, COUNT(*) 
FROM public.activities 
WHERE activity_type = 'notification' 
GROUP BY notification_status;

-- Verify unread counts
SELECT target_profile_id, COUNT(*) as unread_count
FROM public.activities
WHERE activity_type = 'notification' AND notification_status != 'read'
GROUP BY target_profile_id;
```

#### 5. Update Application Code

**Option A: Use Compatibility View (Minimal Changes)**
```typescript
// Continue using notifications table (it's now a view)
const { data, error } = await supabase
  .from('notifications')
  .select('*')
  .eq('target_profile_id', userId)
  .order('created_at', { ascending: false });
```

**Option B: Use New Notification Functions (Recommended)**
```typescript
// Get unread notification count
const { data: unreadCount } = await supabase
  .rpc('get_unread_notification_count', { p_profile_id: userId });

// Mark notification as read
const { data: success } = await supabase
  .rpc('mark_notification_read', {
    p_notification_id: notificationId,
    p_profile_id: userId
  });

// Mark all as read
const { data: markedCount } = await supabase
  .rpc('mark_all_notifications_read', { p_profile_id: userId });

// Create new notification
const { data: notificationId } = await supabase
  .rpc('create_notification', {
    p_profile_id: userId,
    p_title: 'New Lead Assigned',
    p_body: 'You have been assigned a new lead',
    p_url: '/leads/123',
    p_channels: ['inapp', 'email'],
    p_context_type: 'lead',
    p_context_id: leadId
  });

// Get unified timeline
const { data: timeline } = await supabase
  .rpc('get_user_timeline', {
    p_profile_id: userId,
    p_limit: 50,
    p_offset: 0
  });
```

#### 6. Testing Checklist

- [ ] Notifications appear in UI
- [ ] Unread count is accurate
- [ ] Mark as read works
- [ ] Mark all as read works
- [ ] Real-time notifications work
- [ ] Email notifications sent
- [ ] SMS notifications sent (if applicable)
- [ ] Push notifications work (if applicable)
- [ ] Notification links work correctly
- [ ] Timeline view shows all activities
- [ ] No duplicate notifications

#### 7. Real-time Subscriptions

Update your real-time subscriptions:

```typescript
// Old way
const subscription = supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `target_profile_id=eq.${userId}`
  }, handleNotification)
  .subscribe();

// New way - subscribe to activities with filter
const subscription = supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'activities',
    filter: `activity_type=eq.notification&target_profile_id=eq.${userId}`
  }, handleNotification)
  .subscribe();
```

---

## Post-Migration Tasks

### 1. Regenerate TypeScript Types

```bash
cd "/Users/martin2/Desktop/Sale Mate Final"
bash regenerate_types.sh
```

### 2. Update Documentation

- [ ] Update API documentation
- [ ] Update developer onboarding docs
- [ ] Update database schema diagram
- [ ] Update README if necessary

### 3. Performance Monitoring

Monitor these metrics after each phase:

```sql
-- Query performance
EXPLAIN ANALYZE 
SELECT * FROM payments WHERE profile_id = 'user-id' AND ledger_entry_type IS NOT NULL;

-- Table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### 4. Enable Missing RLS

```sql
-- Enable RLS on team tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Create appropriate policies
CREATE POLICY "Users can view their teams" ON teams
  FOR SELECT USING (
    id IN (
      SELECT team_id FROM team_members WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their team memberships" ON team_members
  FOR SELECT USING (profile_id = auth.uid());
```

---

## Rollback Procedures

### If Something Goes Wrong

#### Phase 1 Rollback
```sql
-- Recreate wallet_ledger_entries table from payments
CREATE TABLE public.wallet_ledger_entries AS 
SELECT 
  id, profile_id, ledger_entry_type as entry_type,
  amount, currency, running_balance as balance_after,
  description, reference_type, reference_id, metadata,
  created_at, updated_at
FROM public.payments
WHERE ledger_entry_type IS NOT NULL;

-- Drop the view
DROP VIEW IF EXISTS public.wallet_ledger_entries CASCADE;

-- Restore indexes and constraints
-- (add appropriate indexes and foreign keys)
```

#### Phase 2 Rollback
```sql
-- Recreate content_metrics table
CREATE TABLE public.content_metrics AS
SELECT id, content_id, viewer_profile_id, event_name as event, created_at
FROM public.system_logs
WHERE log_type = 'content_metric';

-- Drop the view
DROP VIEW IF EXISTS public.content_metrics CASCADE;
```

#### Phase 3 Rollback
```sql
-- Recreate notifications table
CREATE TABLE public.notifications AS
SELECT 
  id, target_profile_id, notification_title as title,
  body, notification_url as url, notification_channels as channels,
  notification_status as status, read_at, sent_at,
  context_type as context, context_id, payload as metadata,
  created_at, updated_at
FROM public.activities
WHERE activity_type = 'notification';

-- Drop the view
DROP VIEW IF EXISTS public.notifications CASCADE;
```

---

## Success Criteria

After all 3 phases are complete:

✅ **Schema Metrics**
- Table count: 12 (down from 15, 71% reduction from original 41+)
- All tables have RLS enabled
- All foreign keys intact
- All indexes optimized

✅ **Functional Testing**
- All wallet operations work
- All analytics queries return correct data
- All notifications deliver properly
- Real-time features work
- No data loss
- No performance degradation

✅ **Code Quality**
- TypeScript types updated
- No TypeScript errors
- All tests passing
- Documentation updated

---

## Timeline

### Week 1: Phase 1
- **Monday**: Run Phase 1 migration in staging
- **Tuesday-Wednesday**: Test and update code
- **Thursday**: Deploy to production
- **Friday**: Monitor

### Week 2: Phase 2
- **Monday**: Run Phase 2 migration in staging
- **Tuesday**: Test and update code
- **Wednesday**: Deploy to production
- **Thursday-Friday**: Monitor

### Week 3-4: Phase 3
- **Week 3**: Implement dual-write, test thoroughly
- **Week 4**: Cutover and monitor

---

## Support

If you encounter issues:

1. **Check migration logs** for error messages
2. **Review verification queries** to confirm data integrity
3. **Check application logs** for runtime errors
4. **Test compatibility views** to ensure backward compatibility
5. **Consider rollback** if critical functionality is broken

---

## Conclusion

By following this guide carefully and testing each phase thoroughly, you will successfully consolidate your database from 15 tables to 12 tables, achieving:

- 🎯 **71% total reduction** from original schema
- 🚀 **Simpler architecture** and easier maintenance
- 📊 **Single source of truth** for each domain
- ⚡ **Better query performance** with optimized indexes
- 🛡️ **Improved security** with complete RLS coverage

Good luck with your consolidation! 🎉

---

*Last Updated: November 18, 2024*

