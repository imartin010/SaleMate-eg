# Wallet and Payment System Documentation

## Overview

The Sale Mate wallet and payment system provides secure, idempotent financial operations for wallet top-ups and lead purchases. The system is designed with zero tolerance for double-charging or missed credits.

## Architecture

### Single Source of Truth
- **Wallet Balance**: `profiles.wallet_balance` (numeric(10,2))
- **Payment Tracking**: `payment_transactions` table
- **Audit Trail**: `wallet_transactions` table (optional, for logging)

### Key Components

#### Database Tables

**`profiles`**
```sql
wallet_balance numeric(10,2) default 0  -- SINGLE SOURCE OF TRUTH
```

**`payment_transactions`**
```sql
id uuid PK
user_id uuid (FK → profiles)
amount numeric(10,2)
currency text default 'EGP'
payment_method text ('card', 'instapay', 'bank_transfer')
gateway text ('stripe', 'paymob', 'kashier', 'test')
status text ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')
transaction_type text ('wallet_topup', 'lead_purchase', 'subscription')
reference_id uuid  -- References other tables
metadata jsonb     -- Contains payment_method, transaction_type, etc.
completed_at timestamptz  -- CRITICAL: When wallet was updated
```

#### RPC Functions

**`process_payment_and_topup(p_transaction_id uuid, p_status text)`**
- **Purpose**: Processes payment completion and updates wallet balance
- **Idempotency**: Uses `completed_at` timestamp to prevent double crediting
- **Security**: SECURITY DEFINER with proper RLS
- **Returns**: JSON with success status, wallet_updated flag, etc.

**`deduct_from_wallet(p_user_id uuid, p_amount numeric, p_description text)`**
- **Purpose**: Deducts from wallet for lead purchases
- **Race Condition Protection**: Uses `FOR UPDATE` on profile row
- **Balance Check**: Validates sufficient funds before deduction
- **Returns**: JSON with new balance and transaction details

#### Frontend Services

**`PaymentGatewayService`**
- Handles payment gateway integration (Kashier, Paymob, Stripe, Test)
- Creates `payment_transactions` rows
- Manages gateway redirects and callbacks
- Calls RPC functions for payment confirmation

**`WalletContext`**
- Provides wallet balance and operations
- Uses `PaymentGatewayService` for top-ups
- Calls `deduct_from_wallet` RPC for purchases
- Reads balance from `profiles.wallet_balance`

## Payment Flow

### Wallet Top-up Flow

#### Test Gateway (Development)
1. User clicks "Top Up" → `TopUpModal` opens
2. User selects card payment → `PaymentGatewayService.createPayment()`
3. Creates `payment_transactions` row with `status = 'pending'`
4. For test gateway: immediately calls `PaymentGatewayService.confirmPayment()`
5. `confirmPayment()` calls `process_payment_and_topup(transaction_id, 'completed')`
6. RPC updates `profiles.wallet_balance` + sets `completed_at`
7. UI refreshes balance and shows success

#### Kashier Gateway (Production)
1. User clicks "Top Up" → `TopUpModal` opens
2. User selects card payment → `PaymentGatewayService.createPayment()`
3. Creates `payment_transactions` row with `status = 'pending'`
4. Redirects to Kashier payment page
5. User completes payment on Kashier
6. **Option A**: Kashier calls webhook → `payment-webhook` Edge Function
7. **Option B**: Kashier redirects to `/payment/kashier/callback`
8. Both paths call `process_payment_and_topup()` → updates wallet balance
9. UI shows success and updated balance

### Lead Purchase Flow
1. User purchases lead → calls `deduct_from_wallet()`
2. RPC locks profile row, checks balance, deducts amount
3. Updates `wallet_balance` and logs transaction
4. Returns new balance to frontend
5. UI updates balance display

## Idempotency and Safety

### Double Credit Prevention
- **`completed_at` Timestamp**: Set only when wallet balance is actually updated
- **Check Logic**: `IF completed_at IS NOT NULL AND status IN ('completed', 'failed', 'cancelled') THEN skip`
- **Result**: Safe to call `process_payment_and_topup()` multiple times

### Race Condition Prevention
- **`FOR UPDATE`**: Locks profile row during balance operations
- **Sequential Processing**: Only one wallet update at a time per user

### Error Handling
- **Rollback**: Failed operations don't leave inconsistent state
- **Logging**: All wallet changes are logged (when `wallet_transactions` table exists)
- **Validation**: Amount validation, balance checks, transaction existence checks

## Testing

### Manual Testing Checklist

#### Wallet Top-up Test
```sql
-- 1. Check starting balance
SELECT wallet_balance FROM profiles WHERE id = 'user-id';

-- 2. Create test payment transaction
INSERT INTO payment_transactions (user_id, amount, currency, gateway, payment_method, status, transaction_type, metadata)
VALUES ('user-id', 100.00, 'EGP', 'test', 'card', 'pending', 'wallet_topup', '{"test_mode": true}'::jsonb)
RETURNING id;

-- 3. Process payment
SELECT * FROM process_payment_and_topup('transaction-id', 'completed');

-- 4. Verify balance updated
SELECT wallet_balance FROM profiles WHERE id = 'user-id'; -- Should be +100

-- 5. Test idempotency
SELECT * FROM process_payment_and_topup('transaction-id', 'completed'); -- Should not double credit
SELECT wallet_balance FROM profiles WHERE id = 'user-id'; -- Should still be +100
```

#### Lead Purchase Test
```sql
-- 1. Check starting balance
SELECT wallet_balance FROM profiles WHERE id = 'user-id';

-- 2. Deduct from wallet
SELECT * FROM deduct_from_wallet('user-id', 50.00, 'Test purchase');

-- 3. Verify balance updated
SELECT wallet_balance FROM profiles WHERE id = 'user-id'; -- Should be -50
```

### End-to-End Testing
1. **Login** to Sale Mate application
2. **Navigate** to wallet section
3. **Click "Top Up"** button
4. **Enter amount** and select card payment
5. **Complete payment** (test mode auto-approves)
6. **Verify**:
   - Success message appears
   - Wallet balance updates in UI
   - Database shows correct balance
   - `payment_transactions` row has `completed_at` set

## Troubleshooting

### Common Issues

#### Wallet Balance Not Updating After Payment
**Symptoms**: Payment successful but wallet balance unchanged

**Diagnosis**:
```sql
-- Check payment transaction
SELECT id, status, completed_at, transaction_type FROM payment_transactions WHERE id = 'transaction-id';

-- Check if RPC was called
SELECT * FROM process_payment_and_topup('transaction-id', 'completed');
```

**Fix**: Ensure webhook/callback is calling the RPC correctly

#### Double Crediting
**Symptoms**: Wallet balance increases more than payment amount

**Diagnosis**:
```sql
-- Check for multiple completed_at entries
SELECT id, status, completed_at FROM payment_transactions WHERE user_id = 'user-id' AND status = 'completed';
```

**Fix**: Check idempotency logic in `process_payment_and_topup`

#### Insufficient Balance Errors
**Symptoms**: Valid purchases failing with "insufficient funds"

**Diagnosis**:
```sql
-- Check actual balance
SELECT wallet_balance FROM profiles WHERE id = 'user-id';

-- Check recent transactions
SELECT * FROM payment_transactions WHERE user_id = 'user-id' ORDER BY created_at DESC LIMIT 5;
```

**Fix**: Reconcile balance from transaction history if needed

### Debug Logging

#### Enable Frontend Logging
```typescript
// Add to PaymentGatewayService methods
console.log('PaymentGatewayService.createPayment:', { request, result });

// Add to WalletContext
console.log('WalletContext.refreshBalance:', { balance, error });
```

#### Check Database Logs
```sql
-- Recent payment transactions
SELECT id, user_id, amount, status, completed_at, gateway, transaction_type
FROM payment_transactions
ORDER BY created_at DESC LIMIT 10;

-- Wallet balance history
SELECT user_id, wallet_balance, updated_at FROM profiles ORDER BY updated_at DESC LIMIT 10;
```

## Security Considerations

### RLS Policies
- Users can only see/modify their own payment transactions
- Admins can view all transactions
- RPC functions run with service role privileges

### Data Validation
- Amount ranges validated
- Transaction types restricted by enum
- User authentication required for all operations

### Audit Trail
- All wallet changes logged in `wallet_transactions` (when available)
- Payment transactions provide full audit history
- Timestamps on all operations

## Migration Notes

### From Legacy System
- Old system used `user_wallets` table (deprecated)
- New system uses `profiles.wallet_balance` as single source of truth
- Migration required updating all wallet operations
- Backward compatibility maintained through views

### Environment Variables
```env
# Payment Gateway Configuration
VITE_KASHIER_PAYMENT_KEY=your_kashier_key
VITE_KASHIER_MERCHANT_ID=your_merchant_id
VITE_PAYMENT_TEST_MODE=true  # Set to false in production
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
VITE_PAYMOB_API_KEY=your_paymob_key
```

## Future Improvements

### Planned Enhancements
- Add refund processing
- Implement subscription payments
- Add multi-currency support
- Enhanced audit logging
- Real-time balance updates via WebSocket

### Monitoring
- Add payment success/failure metrics
- Monitor webhook delivery
- Track balance discrepancies
- Alert on unusual transaction patterns
