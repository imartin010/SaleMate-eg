# Wallet and Payment System - Technical Documentation

## Overview
This document provides comprehensive information about how the wallet and payment system works in the Sale Mate platform. Use this to understand the architecture, data flow, and potential issues.

---

## 1. Database Schema

### 1.1 Core Tables

#### `profiles` Table
- **Primary wallet storage**: `wallet_balance` (numeric(10, 2), default 0)
- This is the **single source of truth** for wallet balance
- Updated directly by the `process_payment_and_topup` RPC function
- Location: `supabase/migrations/20251113000001_create_profiles_table.sql`

#### `payment_transactions` Table
- **Purpose**: Tracks all payment gateway transactions (Kashier, Stripe, Paymob, Test)
- **Key Columns**:
  - `id` (uuid, PK)
  - `user_id` (uuid, FK to profiles)
  - `amount` (numeric(10, 2))
  - `currency` (text, default 'EGP')
  - `payment_method` ('card', 'instapay', 'bank_transfer')
  - `gateway` ('stripe', 'paymob', 'kashier', 'test')
  - `status` ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')
  - `transaction_type` ('wallet_topup', 'lead_purchase', 'subscription')
  - `reference_id` (uuid, references wallet_topup_requests or purchase_requests)
  - `gateway_transaction_id` (text, from payment gateway)
  - `gateway_payment_intent_id` (text)
  - `metadata` (jsonb, stores payment_method, transaction_type, reference_id, test_mode)
  - `completed_at` (timestamptz, **critical** - indicates wallet was updated)
  - `created_at`, `updated_at`
- **Location**: `supabase/migrations/20251104000001_create_payment_gateway_tables.sql`

#### `payments` Table (Legacy/Consolidated)
- **Purpose**: Unified payment and wallet system (legacy consolidation)
- Used for historical data and fallback balance calculations
- **Location**: `supabase/migrations/20250120000001_create_consolidated_schema.sql`

#### `wallet_transactions` Table (Optional)
- **Purpose**: Transaction history/audit log
- May not exist in all environments
- Structure varies (handled gracefully in code)

---

## 2. Payment Flow

### 2.1 Frontend Payment Initiation

**Entry Point**: User initiates wallet top-up
- **Service**: `src/services/paymentGateway.ts` → `PaymentGatewayService.createPayment()`
- **Context**: `src/contexts/WalletContext.tsx` → `addToWalletWithPayment()`

**Flow**:
1. User enters amount and selects payment method
2. Frontend calls `PaymentGatewayService.createPayment(request)`
3. Service creates transaction record in `payment_transactions` table:
   ```typescript
   {
     user_id: userId,
     amount: amount,
     currency: 'EGP',
     gateway: 'kashier' | 'stripe' | 'paymob' | 'test',
     status: 'pending',
     metadata: {
       payment_method: 'card' | 'instapay' | 'bank_transfer',
       transaction_type: 'wallet_topup',
       reference_id: walletTopupRequestId,
       test_mode: true/false
     }
   }
   ```
4. Gateway-specific processing:
   - **Kashier**: Creates payment order, returns redirect URL
   - **Stripe**: Creates payment intent, returns client secret
   - **Paymob**: Creates payment, returns redirect URL
   - **Test**: Simulates payment (auto-approves)

### 2.2 Payment Gateway Processing

**Kashier Flow** (Primary Gateway):
1. Frontend redirects to Kashier payment page
2. User completes payment on Kashier
3. Kashier redirects back to: `/payment/kashier/callback?status=success&transactionId={id}`
4. **Callback Handler**: `src/pages/Payment/PaymentCallback.tsx`

**Callback Processing**:
```typescript
// PaymentCallback.tsx extracts:
- transactionId (from URL)
- status/paymentStatus (success/failed from gateway)
- orderId, paymentId (from Kashier)

// Then calls:
PaymentGatewayService.confirmPayment(transactionId, 'completed' | 'failed')
```

### 2.3 Backend Payment Confirmation

**RPC Function**: `process_payment_and_topup(p_transaction_id, p_status)`
- **Location**: `supabase/migrations/20251115010000_fix_payment_wallet_update_logic.sql`
- **Security**: `SECURITY DEFINER` (runs with elevated privileges)

**Critical Logic**:
```sql
-- 1. Get transaction
SELECT * INTO v_transaction FROM payment_transactions WHERE id = p_transaction_id;

-- 2. Check if wallet already updated (prevents double-crediting)
v_wallet_updated := (v_transaction.completed_at IS NOT NULL);

-- 3. Prevent duplicate processing
IF v_transaction.status IN ('completed', 'failed', 'cancelled') 
   AND v_wallet_updated THEN
    RETURN jsonb_build_object('success', true, 'message', 'Already processed');
END IF;

-- 4. Update transaction status
UPDATE payment_transactions
SET status = p_status,
    updated_at = now(),
    completed_at = CASE 
        WHEN p_status = 'completed' AND completed_at IS NULL 
        THEN now() 
        ELSE completed_at 
    END
WHERE id = p_transaction_id;

-- 5. Update wallet balance (ONLY if completed AND wallet_topup AND not already updated)
IF p_status = 'completed' 
   AND v_transaction.transaction_type = 'wallet_topup' 
   AND NOT v_wallet_updated THEN
    
    -- CRITICAL: Update profiles.wallet_balance
    UPDATE profiles
    SET wallet_balance = wallet_balance + v_transaction.amount
    WHERE id = v_transaction.user_id;
    
    -- Optional: Update wallet_topup_request (may fail if it's a view)
    -- Optional: Create wallet_transactions record (may not exist)
END IF;
```

**Key Safety Features**:
- ✅ Checks `completed_at` to prevent double-crediting
- ✅ Only processes `wallet_topup` transactions
- ✅ Gracefully handles missing optional tables/views
- ✅ Returns success even if already processed (idempotent)

### 2.4 Webhook Processing

**Edge Function**: `supabase/functions/payment-webhook/index.ts`
- **Purpose**: Handles server-to-server payment confirmations
- **Trigger**: Payment gateway sends webhook after payment completion

**Webhook Flow**:
1. Gateway sends POST to `/payment-webhook` with:
   ```json
   {
     "transaction_id": "uuid",
     "status": "completed" | "failed",
     "gateway_transaction_id": "gateway_txn_123",
     "amount": 100.00,
     "signature": "webhook_signature"
   }
   ```
2. Edge function validates signature and amount
3. Calls `process_payment_and_topup` RPC
4. Returns success/error response

**Important**: Webhook and callback can both trigger wallet updates. The `completed_at` check prevents double-crediting.

---

## 3. Wallet Balance Management

### 3.1 Reading Wallet Balance

**Frontend**: `src/contexts/WalletContext.tsx` → `refreshBalance()`

**Priority Order**:
1. **Primary**: Read `profiles.wallet_balance` directly
   ```typescript
   const { data: profile } = await supabase
     .from('profiles')
     .select('wallet_balance')
     .eq('id', user.id)
     .single();
   ```

2. **Fallback 1**: Use `get_wallet_balance` RPC function
   ```typescript
   await supabase.rpc('get_wallet_balance', { p_profile_id: user.id });
   ```

3. **Fallback 2**: Calculate from `payments` table
   ```typescript
   // Sum deposits - withdrawals
   const depositTotal = deposits.reduce((sum, t) => sum + amount, 0);
   const withdrawalTotal = withdrawals.reduce((sum, t) => sum + amount, 0);
   const balance = depositTotal - withdrawalTotal;
   ```

### 3.2 Updating Wallet Balance

**Only Updated By**:
- `process_payment_and_topup` RPC function (for wallet top-ups)
- Manual admin adjustments (via admin panel)
- Lead purchase deductions (via `deduct_from_wallet` RPC)

**Never Updated By**:
- Direct frontend calls
- Direct database updates (should use RPC functions)

### 3.3 Wallet Deductions

**RPC Function**: `deduct_from_wallet(p_user_id, p_amount, p_description)`
- **Location**: `supabase/migrations/20241102000013_wallet_deduct_rpc.sql`
- **Purpose**: Deducts balance for lead purchases
- **Safety**: Checks sufficient balance, uses row locking to prevent race conditions

---

## 4. Key Functions and Services

### 4.1 Frontend Services

#### `PaymentGatewayService` (`src/services/paymentGateway.ts`)
- `createPayment(request)`: Creates transaction and initiates payment
- `confirmPayment(transactionId, status)`: Confirms payment and updates wallet
- `getTransaction(transactionId)`: Retrieves transaction details
- `getUserTransactions(userId)`: Gets user's payment history

#### `WalletContext` (`src/contexts/WalletContext.tsx`)
- `refreshBalance()`: Refreshes wallet balance from database
- `addToWallet(amount)`: Direct wallet addition (admin/manual)
- `addToWalletWithPayment(amount, method)`: Wallet top-up via payment gateway
- `deductFromWallet(amount)`: Deducts balance (for lead purchases)

### 4.2 Backend RPC Functions

#### `process_payment_and_topup(p_transaction_id, p_status)`
- **Purpose**: Process payment completion and update wallet
- **Input**: Transaction ID and status ('completed' | 'failed')
- **Output**: JSONB with success status and transaction details
- **Critical**: Only updates wallet if `completed_at` is NULL (prevents double-crediting)

#### `get_wallet_balance(p_profile_id)`
- **Purpose**: Calculate wallet balance from payments table
- **Fallback**: Used when `profiles.wallet_balance` is unavailable

#### `deduct_from_wallet(p_user_id, p_amount, p_description)`
- **Purpose**: Deduct balance for purchases
- **Safety**: Row locking, balance validation

---

## 5. Common Issues and Fixes

### 5.1 Wallet Not Updating After Payment

**Symptoms**:
- Payment shows as completed in `payment_transactions`
- Wallet balance remains unchanged
- User sees payment success but balance doesn't reflect

**Possible Causes**:
1. **Transaction status is 'completed' but `completed_at` is NULL**
   - **Fix**: The migration `20251115010000_fix_payment_wallet_update_logic.sql` should handle this
   - **Check**: Verify `completed_at` is set when status becomes 'completed'

2. **Transaction type is not 'wallet_topup'**
   - **Check**: `SELECT transaction_type FROM payment_transactions WHERE id = '...'`
   - **Fix**: Ensure `metadata.transaction_type = 'wallet_topup'` in transaction

3. **Wallet already updated (double-processing prevented)**
   - **Check**: `SELECT completed_at FROM payment_transactions WHERE id = '...'`
   - **If set**: Wallet was already updated, this is expected behavior

4. **RPC function not being called**
   - **Check**: Verify `PaymentGatewayService.confirmPayment()` is called in callback
   - **Check**: Verify webhook is calling `process_payment_and_topup` RPC

**Debugging Steps**:
```sql
-- Check transaction status
SELECT id, status, completed_at, transaction_type, amount, user_id
FROM payment_transactions
WHERE id = 'transaction_id_here';

-- Check wallet balance
SELECT id, wallet_balance
FROM profiles
WHERE id = 'user_id_here';

-- Check if RPC was called (check logs)
-- In Supabase Dashboard → Logs → Postgres Logs
```

### 5.2 Double-Crediting Prevention

**Current Protection**:
- `completed_at` timestamp check
- Status check (won't process if already 'completed')
- Combined check: `IF status IN ('completed', ...) AND completed_at IS NOT NULL`

**If Double-Crediting Occurs**:
1. Check if `completed_at` is being set correctly
2. Verify the migration `20251115010000_fix_payment_wallet_update_logic.sql` is applied
3. Check for race conditions (webhook + callback both processing)

**Fix**:
```sql
-- Manually correct double-credit (if needed)
UPDATE profiles
SET wallet_balance = wallet_balance - (duplicate_amount)
WHERE id = 'user_id';

-- Mark transaction as already processed
UPDATE payment_transactions
SET completed_at = now()
WHERE id = 'transaction_id' AND completed_at IS NULL;
```

### 5.3 Payment Status Mismatch

**Issue**: Payment gateway says success, but transaction shows 'failed'

**Causes**:
- Callback URL parameters not parsed correctly
- Status mapping incorrect (Kashier uses 'SUCCESS', code expects 'completed')
- Webhook and callback conflict

**Fix**: Check `PaymentCallback.tsx` status parsing logic:
```typescript
// Current logic handles:
- statusParam === 'success' → 'completed'
- paymentStatusParam === 'SUCCESS' → 'completed'
- paymentId or orderId exists → 'completed'
```

### 5.4 Wallet Balance Not Refreshing in UI

**Issue**: Balance updated in DB but UI shows old balance

**Causes**:
- `refreshBalance()` not called after payment
- Cache issue
- RLS policy blocking read

**Fix**:
1. Verify `refreshBalance()` is called in `PaymentCallback.tsx`
2. Check RLS policies on `profiles` table
3. Clear browser cache / hard refresh

---

## 6. Testing the System

### 6.1 Test Payment Flow

1. **Create Test Transaction**:
   ```typescript
   await PaymentGatewayService.createPayment({
     amount: 100,
     paymentMethod: 'card',
     gateway: 'test',
     transactionType: 'wallet_topup',
     userId: 'user_id_here'
   });
   ```

2. **Manually Confirm Payment**:
   ```typescript
   await PaymentGatewayService.confirmPayment(
     'transaction_id',
     'completed'
   );
   ```

3. **Verify Wallet Updated**:
   ```sql
   SELECT wallet_balance FROM profiles WHERE id = 'user_id';
   ```

### 6.2 Verify RPC Function

```sql
-- Test process_payment_and_topup
SELECT process_payment_and_topup(
    'transaction_id_here'::uuid,
    'completed'::text
);

-- Check result
SELECT * FROM payment_transactions WHERE id = 'transaction_id_here';
SELECT wallet_balance FROM profiles WHERE id = 'user_id_here';
```

---

## 7. Migration History

### Critical Migrations

1. **`20251104000001_create_payment_gateway_tables.sql`**
   - Creates `payment_transactions` table
   - Creates initial `process_payment_and_topup` function

2. **`20251115010000_fix_payment_wallet_update_logic.sql`** ⚠️ **CRITICAL**
   - Fixes double-crediting issue
   - Adds `completed_at` check to prevent duplicate wallet updates
   - **This migration must be applied for wallet updates to work correctly**

3. **`20251113000001_create_profiles_table.sql`**
   - Creates `profiles` table with `wallet_balance` column

4. **`20251104000002_fix_wallet_balance_column.sql`**
   - Ensures `wallet_balance` column exists and has correct constraints

---

## 8. Security Considerations

### 8.1 RLS Policies

**`payment_transactions` Table**:
- Users can view their own transactions
- Users can create their own transactions
- Only admins/support can update transactions

**`profiles` Table**:
- Users can view their own profile (including wallet_balance)
- Only admins can update wallet_balance directly

### 8.2 RPC Function Security

- `process_payment_and_topup` uses `SECURITY DEFINER`
- Runs with elevated privileges to update wallet
- Should only be called from:
  - Authenticated frontend (via `PaymentGatewayService.confirmPayment()`)
  - Edge function webhook (with service role key)
  - Admin operations

---

## 9. Data Flow Diagram

```
User Initiates Payment
    ↓
PaymentGatewayService.createPayment()
    ↓
Insert into payment_transactions (status: 'pending')
    ↓
Redirect to Payment Gateway (Kashier/Stripe/Paymob)
    ↓
User Completes Payment
    ↓
Gateway Redirects to /payment/callback
    ↓
PaymentCallback.tsx extracts transactionId and status
    ↓
PaymentGatewayService.confirmPayment(transactionId, 'completed')
    ↓
Calls RPC: process_payment_and_topup(transaction_id, 'completed')
    ↓
RPC Function:
    1. Check if already processed (completed_at IS NOT NULL)
    2. Update payment_transactions.status = 'completed'
    3. Set completed_at = now()
    4. IF transaction_type = 'wallet_topup' AND NOT already updated:
       - UPDATE profiles.wallet_balance = wallet_balance + amount
       - (Optional) Update wallet_topup_request
       - (Optional) Insert into wallet_transactions
    ↓
Return success
    ↓
Frontend: refreshBalance() → Read profiles.wallet_balance
    ↓
UI Updates with New Balance
```

---

## 10. Key Files Reference

| File | Purpose |
|------|---------|
| `src/services/paymentGateway.ts` | Payment gateway service (create, confirm) |
| `src/contexts/WalletContext.tsx` | Wallet state management and operations |
| `src/pages/Payment/PaymentCallback.tsx` | Payment callback handler |
| `supabase/migrations/20251115010000_fix_payment_wallet_update_logic.sql` | **Critical RPC function** |
| `supabase/migrations/20251104000001_create_payment_gateway_tables.sql` | Payment transactions table |
| `supabase/functions/payment-webhook/index.ts` | Webhook handler |

---

## 11. Troubleshooting Checklist

When wallet/payment issues occur, check:

- [ ] Is `payment_transactions` record created?
- [ ] Is transaction `status` = 'completed'?
- [ ] Is `completed_at` timestamp set?
- [ ] Is `transaction_type` = 'wallet_topup'?
- [ ] Is `process_payment_and_topup` RPC being called?
- [ ] Are there any errors in Supabase logs?
- [ ] Is `profiles.wallet_balance` column accessible?
- [ ] Are RLS policies allowing the operation?
- [ ] Is the migration `20251115010000_fix_payment_wallet_update_logic.sql` applied?
- [ ] Is `refreshBalance()` called after payment confirmation?

---

## 12. Contact Points for Issues

If you need to fix an issue:

1. **Check the migration**: `20251115010000_fix_payment_wallet_update_logic.sql` - this is the most recent fix
2. **Check Supabase logs**: Dashboard → Logs → Postgres Logs
3. **Check browser console**: For frontend errors
4. **Verify database state**: Run SQL queries to check transaction and wallet status
5. **Test RPC directly**: Call `process_payment_and_topup` with test data

---

**Last Updated**: Based on migration `20251115010000_fix_payment_wallet_update_logic.sql`
**Version**: 1.0

