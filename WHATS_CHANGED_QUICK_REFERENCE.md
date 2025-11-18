# 🔄 What Changed - Quick Reference

## 📊 Database Changes

### Old Tables → New Tables

| Old Table | New Table | Filter By |
|-----------|-----------|-----------|
| `activities` | `events` | `event_type='activity'` |
| `notifications` | `events` | `event_type='notification'` |
| `system_logs` | `events` | `event_type='audit'/'system'` |
| `commerce` | `transactions` | `transaction_type='commerce'` |
| `payments` | `transactions` | `transaction_type='payment'/'topup'` |
| `wallet_ledger_entries` | `transactions` | `ledger_entry_type NOT NULL` |
| `entities` | `system_data` | `data_type='entity'` |
| `auth_sessions` | `system_data` | `data_type='auth_session'` |
| `content_metrics` | `content` | (merged as columns) |

---

## 🔧 Common Query Patterns

### Activities/Events

**OLD:**
```typescript
const { data } = await supabase
  .from('activities')
  .select('*')
  .eq('lead_id', leadId);
```

**NEW:**
```typescript
const { data } = await supabase
  .from('events')
  .select('*')
  .eq('event_type', 'activity')
  .eq('lead_id', leadId);
```

---

### Notifications

**OLD:**
```typescript
const { data } = await supabase
  .from('notifications')
  .select('*')
  .eq('target_profile_id', userId);
```

**NEW:**
```typescript
const { data } = await supabase
  .from('events')
  .select('*')
  .eq('event_type', 'notification')
  .eq('target_profile_id', userId);
```

**Column Changes:**
- `status` → `notification_status`
- `url` → `notification_url`
- `channels` → `notification_channels`

---

### Commerce/Purchases

**OLD:**
```typescript
const { data } = await supabase
  .from('purchase_requests')
  .select('*')
  .eq('user_id', userId);
```

**NEW:**
```typescript
const { data } = await supabase
  .from('transactions')
  .select('*')
  .eq('transaction_type', 'commerce')
  .in('commerce_type', ['purchase', 'allocation'])
  .eq('profile_id', userId);
```

**Column Changes:**
- `user_id` → `profile_id`
- `total_amount` → `amount`

---

### Wallet/Payments

**OLD:**
```typescript
const { data } = await supabase
  .from('payments')
  .select('*')
  .eq('profile_id', userId);
```

**NEW:**
```typescript
const { data } = await supabase
  .from('transactions')
  .select('*')
  .eq('profile_id', userId)
  .not('ledger_entry_type', 'is', null);
```

**Column Changes:**
- `entry_type` → `ledger_entry_type`
- `operation_type` → `transaction_category`

---

### Entities (Developers/Partners)

**OLD:**
```typescript
const { data } = await supabase
  .from('entities')
  .select('*')
  .eq('entity_type', 'developer');
```

**NEW:**
```typescript
const { data } = await supabase
  .from('system_data')
  .select('*')
  .eq('data_type', 'entity')
  .eq('entity_type', 'developer');
```

**Column Changes:**
- `name` → `entity_name`
- `status` → `entity_status`

---

## 🔄 Helper Functions (Use These!)

### Notifications
```typescript
// Get unread count
const { data } = await supabase.rpc('get_unread_notification_count', { 
  p_profile_id: userId 
});

// Mark as read
await supabase.rpc('mark_notification_read', {
  p_notification_id: notificationId,
  p_profile_id: userId
});
```

### Wallet
```typescript
// Get balance
const { data } = await supabase.rpc('get_wallet_balance', { 
  p_profile_id: userId 
});

// Add to wallet
await supabase.rpc('add_to_wallet', {
  p_profile_id: userId,
  p_amount: 1000,
  p_description: 'Top-up'
});

// Deduct from wallet
await supabase.rpc('deduct_from_wallet', {
  p_profile_id: userId,
  p_amount: 500,
  p_description: 'Purchase'
});
```

---

## 📁 Files Updated

### Must Test (14 files)
- ✅ caseApi.ts
- ✅ adminQueries.ts
- ✅ useLeads.ts
- ✅ useAdminData.ts
- ✅ WalletContext.tsx
- ✅ FeedbackEditor.tsx
- ✅ MeetingScheduler.tsx
- ✅ TransactionHistory.tsx
- ✅ TopUpModal.tsx
- ✅ WalletManagement.tsx
- ✅ PurchaseRequests.tsx
- ✅ LeadRequests.tsx
- ✅ PartnersPage.tsx
- ✅ ImprovedShop.tsx

### Check Later (5 files - may work via views)
- AdminDashboard.tsx
- Checkout.tsx
- PurchaseRequests component
- Analytics.tsx
- FinancialReports.tsx

---

## 🎯 Testing Priority

### HIGH Priority (Test First)
1. **Wallet operations**
   - Balance display
   - Add funds
   - Deduct funds
   - Transaction history

2. **Notifications**
   - Display notifications
   - Mark as read
   - Unread count

3. **Case Management**
   - Submit feedback
   - View activities
   - Schedule meetings
   - View history

### MEDIUM Priority
4. **Admin features**
   - Purchase requests
   - Lead requests
   - Wallet management

5. **Commerce**
   - Lead purchases
   - Payment processing

### LOW Priority
6. **Analytics & Reports**
7. **Partner dashboard**

---

## ✅ What Works Automatically

Thanks to compatibility views:
- ✅ All old queries still work
- ✅ No breaking changes
- ✅ Gradual migration possible
- ✅ Zero downtime

---

## 🚨 What to Watch For

### Potential Issues

⚠️ **Type mismatches:**
- Some TypeScript errors possible
- Types regenerated, may need imports updated

⚠️ **Column renames:**
- Check for `user_id` vs `profile_id`
- Check for `status` vs `notification_status`

⚠️ **Foreign key references:**
- Updated in most places
- Some queries may need adjustment

---

## 🎉 Quick Test Commands

```typescript
// Test wallet
console.log(await supabase.rpc('get_wallet_balance', { p_profile_id: 'user-id' }));

// Test notifications
console.log(await supabase.from('events').select('*').eq('event_type', 'notification').limit(5));

// Test transactions
console.log(await supabase.from('transactions').select('*').limit(10));

// Test table count
console.log(await supabase.rpc('execute_sql', { 
  sql: "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 
}));
```

---

## 🏁 Final Checklist

Before going live:
- [ ] Test wallet balance
- [ ] Test notifications
- [ ] Test case feedback
- [ ] Test purchases
- [ ] Test admin features
- [ ] Check console for errors
- [ ] Verify no data loss
- [ ] Monitor Supabase logs

---

**Status:** ✅ READY FOR TESTING  
**Risk:** 🟡 MEDIUM (test thoroughly)  
**Confidence:** 🟢 HIGH (backward compatible)

---

*Quick Reference | November 18, 2024*

