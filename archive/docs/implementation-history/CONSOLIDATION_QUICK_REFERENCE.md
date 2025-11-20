# 🚀 Database Consolidation - Quick Reference Card

## Overview
**Goal:** Reduce from 15 tables → 12 tables  
**Method:** Merge 3 redundant tables into existing consolidated tables  
**Timeline:** 4-6 weeks  
**Risk:** LOW to MEDIUM

---

## The 3 Merges

### ⚡ Phase 1: Wallet
```
wallet_ledger_entries  →  payments
```
**Why:** Both handle financial transactions  
**Risk:** 🟢 LOW | **Effort:** 6-8 hours  
**File:** `20241118000001_phase1_wallet_consolidation.sql`

### 🔸 Phase 2: Analytics  
```
content_metrics  →  system_logs
```
**Why:** Both are logging systems  
**Risk:** 🟢 LOW | **Effort:** 3-4 hours  
**File:** `20241118000002_phase2_analytics_consolidation.sql`

### ⚠️ Phase 3: Notifications
```
notifications  →  activities
```
**Why:** Notifications are activity events  
**Risk:** 🟡 MEDIUM | **Effort:** 12-16 hours  
**File:** `20241118000003_phase3_notification_consolidation.sql`

---

## Quick Commands

### Run Migration
```bash
cd "/Users/martin2/Desktop/Sale Mate Final"
supabase db push
```

### Regenerate Types
```bash
bash regenerate_types.sh
```

### Verify Migration
```sql
-- Check table count
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Check specific migration
SELECT COUNT(*) FROM payments WHERE ledger_entry_type IS NOT NULL; -- Phase 1
SELECT COUNT(*) FROM system_logs WHERE log_type = 'content_metric'; -- Phase 2
SELECT COUNT(*) FROM activities WHERE activity_type = 'notification'; -- Phase 3
```

### Rollback (if needed)
```bash
# Restore from backup
psql $DATABASE_URL < backup_before_consolidation.sql
```

---

## Testing Checklist

### Phase 1 (Wallet)
- [ ] Wallet balance correct
- [ ] Transaction history complete
- [ ] Deposits work
- [ ] Withdrawals work
- [ ] Running balance accurate

### Phase 2 (Analytics)
- [ ] Content impressions tracked
- [ ] Click tracking works
- [ ] Dashboard displays data
- [ ] Analytics queries work

### Phase 3 (Notifications)
- [ ] Notifications display
- [ ] Unread count correct
- [ ] Mark as read works
- [ ] Real-time updates work
- [ ] Email delivery works

---

## Key Files

| File | Purpose |
|------|---------|
| `DATABASE_CONSOLIDATION_AUDIT_2024.md` | Full analysis & recommendations |
| `DATABASE_CONSOLIDATION_IMPLEMENTATION_GUIDE.md` | Step-by-step instructions |
| `CONSOLIDATION_RECOMMENDATIONS_SUMMARY.md` | Executive summary |
| `20241118000001_phase1_wallet_consolidation.sql` | Phase 1 migration |
| `20241118000002_phase2_analytics_consolidation.sql` | Phase 2 migration |
| `20241118000003_phase3_notification_consolidation.sql` | Phase 3 migration |

---

## New Helper Functions

### Phase 1: Wallet
```sql
-- Recalculate balances
SELECT recalculate_wallet_balances(user_id);
```

### Phase 2: Analytics
```sql
-- Get content analytics
SELECT * FROM get_content_analytics(content_id, start_date, end_date);

-- Top performing content
SELECT * FROM get_top_performing_content('click', 10);
```

### Phase 3: Notifications
```sql
-- Unread count
SELECT get_unread_notification_count(user_id);

-- Mark as read
SELECT mark_notification_read(notification_id, user_id);

-- Mark all as read
SELECT mark_all_notifications_read(user_id);

-- Create notification
SELECT create_notification(user_id, 'Title', 'Body', '/url');

-- User timeline
SELECT * FROM get_user_timeline(user_id, 50, 0);
```

---

## Backward Compatibility

✅ **All old table names work as views**
- No immediate code changes required
- Views automatically sync to new tables
- Gradual code updates recommended

```typescript
// Still works (uses compatibility view)
await supabase.from('wallet_ledger_entries').select('*');
await supabase.from('content_metrics').select('*');
await supabase.from('notifications').select('*');
```

---

## Timeline

| Week | Activity |
|------|----------|
| Week 1 | Phase 1 - Test & Deploy |
| Week 2 | Phase 1 - Monitor |
| Week 3 | Phase 2 - Test & Deploy |
| Week 4 | Phase 2 - Monitor |
| Week 5-6 | Phase 3 - Test & Deploy |
| Week 7 | Phase 3 - Monitor |

---

## Success Metrics

✅ **After completion:**
- 12 tables (down from 15)
- 71% total reduction (from 41+)
- 100% RLS coverage
- All data preserved
- All functionality working

---

## Emergency Contacts

**If something breaks:**
1. Check application logs
2. Run verification queries
3. Check compatibility views
4. Consider rollback if critical
5. Review implementation guide

---

## Final Schema (12 Tables)

### Core (5)
1. profiles
2. leads  
3. projects
4. teams
5. team_members

### Consolidated (5)
6. activities *(includes notifications)*
7. commerce
8. payments *(includes wallet ledger)*
9. content
10. system_logs *(includes content metrics)*

### Reference (2)
11. entities
12. auth_sessions

---

**Status:** ✅ Ready to implement  
**Risk Level:** 🟢 LOW (with proper testing)  
**Expected Duration:** 4-6 weeks  
**Expected Result:** 🎯 12-table optimized schema

---

*Quick Reference | November 18, 2024*

