# Payment Gateway System - Test Mode

## Overview

A comprehensive payment gateway system has been implemented to support wallet top-ups and future lead purchases. The system is currently configured in **test mode** for safe development and testing.

## Features

### ✅ Payment Methods Supported

1. **Debit/Credit Card** (via Payment Gateway)
   - Instant processing
   - Auto-approved in test mode
   - No receipt required
   - Real-time wallet balance update

2. **Instapay** (Manual)
   - Requires receipt upload
   - Admin approval required
   - 1-2 business days processing

3. **Bank Transfer** (Manual)
   - Requires receipt upload
   - Admin approval required
   - 1-2 business days processing

### ✅ Payment Gateways Supported

- **Test Gateway** (Default) - Simulated payments for development
- **Stripe** - Ready for production integration
- **Paymob** - Ready for production integration

## Architecture

### Database Tables

1. **`payment_transactions`** - Main transaction log
   - Tracks all payment attempts
   - Links to wallet top-ups or purchases
   - Stores gateway transaction IDs
   - Supports test mode flag

2. **`wallet_topup_requests`** - Extended with gateway support
   - Added `payment_transaction_id` reference
   - Added `gateway` field
   - Added `gateway_transaction_id` field

### Services

1. **`PaymentGatewayService`** (`src/services/paymentGateway.ts`)
   - Creates payment transactions
   - Processes payments via different gateways
   - Handles payment confirmation
   - Manages transaction history

2. **Edge Functions**
   - `create-payment-intent` - Creates Stripe payment intents
   - `payment-webhook` - Handles payment callbacks

### Database Functions

- `process_payment_and_topup` - RPC function that:
  - Updates payment transaction status
  - Updates wallet balance on successful payment
  - Creates wallet transaction records
  - Updates wallet top-up request status

## How It Works

### Card Payment Flow (Test Mode)

1. User selects "Debit/Credit Card" payment method
2. User enters amount (any amount > 0)
3. User clicks "Pay Now"
4. System creates `wallet_topup_request` record
5. System creates `payment_transaction` record
6. Payment gateway processes payment (test mode: auto-approve)
7. System calls `process_payment_and_topup` RPC
8. Wallet balance is updated instantly
9. Success message displayed

### Manual Payment Flow (Instapay/Bank Transfer)

1. User selects payment method (Instapay or Bank Transfer)
2. User enters amount and uploads receipt
3. User submits request
4. System creates `wallet_topup_request` with `status: 'pending'`
5. Admin reviews and approves
6. Wallet balance updated upon approval

## Configuration

### Environment Variables

Add to your `.env` file:

```env
# Payment Gateway Test Mode (default: true)
VITE_PAYMENT_TEST_MODE=true

# Stripe (for production)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_... # Edge Function secret

# Paymob (for production)
VITE_PAYMOB_API_KEY=your_paymob_api_key

# Payment Webhook Secret
PAYMENT_WEBHOOK_SECRET=test-secret
```

### Database Migration

Run the migration to create payment tables:

```bash
# Apply migration
supabase migration up
```

Or manually apply `supabase/migrations/20251104000001_create_payment_gateway_tables.sql`

## Test Mode

In test mode:
- ✅ Card payments are automatically approved
- ✅ No real money is processed
- ✅ All transactions are marked with `test_mode: true`
- ✅ Payment processing is instant
- ✅ Wallet balance updates immediately

### Test Mode Indicators

- UI shows "Test Mode" badge for card payments
- Transaction records have `test_mode: true`
- Success messages indicate instant processing

## Production Setup

### To Enable Production Mode:

1. **Disable Test Mode**
   ```env
   VITE_PAYMENT_TEST_MODE=false
   ```

2. **Configure Stripe**
   - Get Stripe API keys from dashboard
   - Add `VITE_STRIPE_PUBLISHABLE_KEY` to frontend
   - Add `STRIPE_SECRET_KEY` to Edge Function secrets

3. **Configure Webhook**
   - Set up Stripe webhook endpoint
   - Point to: `https://your-project.supabase.co/functions/v1/payment-webhook`
   - Add webhook secret to `PAYMENT_WEBHOOK_SECRET`

4. **Update Edge Function Secrets**
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_live_...
   supabase secrets set PAYMENT_WEBHOOK_SECRET=whsec_...
   ```

## Usage Examples

### Create Payment Transaction

```typescript
import PaymentGatewayService from '@/services/paymentGateway';

const result = await PaymentGatewayService.createPayment({
  amount: 5000,
  currency: 'EGP',
  paymentMethod: 'card',
  gateway: 'test',
  transactionType: 'wallet_topup',
  referenceId: topupRequestId,
  userId: user.id,
});

if (result.success) {
  // Payment created, process confirmation
  await PaymentGatewayService.confirmPayment(
    result.transactionId!,
    'completed'
  );
}
```

### Get User Transactions

```typescript
const transactions = await PaymentGatewayService.getUserTransactions(
  user.id,
  50 // limit
);
```

## Security

- ✅ RLS policies protect payment transactions
- ✅ Users can only view their own transactions
- ✅ Admins can view all transactions
- ✅ Webhook signature validation
- ✅ Transaction amount validation
- ✅ Duplicate payment prevention

## Error Handling

The system handles:
- Invalid amounts
- Missing payment methods
- Gateway failures
- Network errors
- Duplicate transactions
- Invalid webhook signatures

## Future Enhancements

- [ ] Stripe Elements integration for card input
- [ ] Paymob payment page integration
- [ ] Refund functionality
- [ ] Payment retry mechanism
- [ ] Transaction analytics
- [ ] Email notifications for payments
- [ ] SMS notifications for large transactions

## Testing

### Test Card Payments

1. Open Top Up Modal
2. Select "Debit/Credit Card"
3. Enter amount (any amount > 0)
4. Click "Pay Now"
5. Verify wallet balance updates instantly

### Test Manual Payments

1. Open Top Up Modal
2. Select "Instapay" or "Bank Transfer"
3. Enter amount and upload receipt
4. Submit request
5. Verify request appears in admin panel

## Troubleshooting

### Payment Not Processing

- Check `payment_transactions` table for error messages
- Verify `VITE_PAYMENT_TEST_MODE` is set correctly
- Check Edge Function logs in Supabase dashboard

### Wallet Not Updating

- Verify `process_payment_and_topup` RPC is called
- Check transaction status in `payment_transactions`
- Verify user has correct permissions

### Webhook Not Receiving Callbacks

- Verify webhook URL is correct
- Check webhook secret matches
- Review Edge Function logs

## Support

For issues or questions:
1. Check Edge Function logs in Supabase Dashboard
2. Review `payment_transactions` table for errors
3. Verify environment variables are set correctly
4. Check browser console for frontend errors

