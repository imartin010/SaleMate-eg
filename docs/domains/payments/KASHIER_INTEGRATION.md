# Kashier Payment Gateway Integration

## Overview

Kashier has been integrated into the payment gateway system. Kashier is a popular payment gateway in Egypt and the Middle East, supporting multiple payment methods including cards, wallets, and bank transfers.

## Configuration

### API Keys Provided

- **Payment API Key**: `d02f9fd0-d7c3-408e-84ac-c4c3ae6fe8a2`
- **Secret Key**: `86d1f6ad6358c144a45b9cd918522f71$ea45afd990143d51dce936af207a94ff9ef7bf30f2fbed1a185625a490094ebd7eb1ec264e521ca9ea91a925dd95b8fe`

### Environment Variables

Add to your `.env` file:

```env
# Kashier Configuration
KASHIER_PAYMENT_KEY=d02f9fd0-d7c3-408e-84ac-c4c3ae6fe8a2
KASHIER_SECRET_KEY=86d1f6ad6358c144a45b9cd918522f71$ea45afd990143d51dce936af207a94ff9ef7bf30f2fbed1a185625a490094ebd7eb1ec264e521ca9ea91a925dd95b8fe
KASHIER_MERCHANT_ID=MID-40169-389
VITE_KASHIER_PAYMENT_KEY=d02f9fd0-d7c3-408e-84ac-c4c3ae6fe8a2
VITE_KASHIER_MERCHANT_ID=MID-40169-389
```

### Edge Function Secrets

Set these in Supabase Dashboard or via CLI:

```bash
supabase secrets set KASHIER_PAYMENT_KEY=d02f9fd0-d7c3-408e-84ac-c4c3ae6fe8a2
supabase secrets set KASHIER_SECRET_KEY=86d1f6ad6358c144a45b9cd918522f71$ea45afd990143d51dce936af207a94ff9ef7bf30f2fbed1a185625a490094ebd7eb1ec264e521ca9ea91a925dd95b8fe
supabase secrets set KASHIER_MERCHANT_ID=MID-40169-389
```

## How It Works

### Payment Flow

1. User selects "Debit/Credit Card" payment method
2. User enters amount (minimum 5,000 EGP)
3. User clicks "Pay Now"
4. System creates `wallet_topup_request` record
5. System creates `payment_transaction` record
6. Edge Function `create-kashier-payment` is called:
   - Generates order hash (HMAC-SHA256)
   - Creates Kashier payment URL
7. User is redirected to Kashier payment page
8. User completes payment on Kashier
9. Kashier redirects back with payment status
10. Webhook callback updates transaction status
11. Wallet balance is updated automatically

### Order Hash Generation

Kashier requires an order hash for security. The hash is generated using HMAC-SHA256:

```
Hash String Format: merchantId:amount:currency:orderId:secretKey
Example: MID-1234:500000:EGP:order_xxx:secret_key
```

The hash is then included in the payment URL as a query parameter.

## Edge Function

### `create-kashier-payment`

Located at: `supabase/functions/create-kashier-payment/index.ts`

**Features:**
- Generates secure order hash
- Creates Kashier payment URL
- Supports test mode
- Handles authentication

**Request Body:**
```json
{
  "amount": 5000,
  "currency": "EGP",
  "payment_method": "card",
  "transaction_id": "uuid",
  "metadata": {
    "user_id": "uuid",
    "transaction_type": "wallet_topup",
    "reference_id": "uuid"
  }
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "order_xxx",
  "redirectUrl": "https://checkout.kashier.io/...",
  "transactionId": "uuid",
  "hash": "generated_hash",
  "testMode": false
}
```

## Webhook Configuration

### Setup in Kashier Dashboard

1. Log in to Kashier Portal
2. Navigate to Settings > Webhooks
3. Add webhook URL: `https://your-project.supabase.co/functions/v1/payment-webhook`
4. Select events: `payment.success`, `payment.failed`
5. Save webhook

### Webhook Handler

The existing `payment-webhook` Edge Function handles Kashier callbacks:

- Validates webhook signature
- Updates payment transaction status
- Processes wallet top-up automatically
- Creates wallet transaction records

## Test Mode

In test mode, Kashier payments are simulated:

- Mock payment URL is generated
- No real payment processing
- Instant wallet updates for testing

To enable test mode:
```env
VITE_PAYMENT_TEST_MODE=true
```

## Production Setup

### 1. Get Merchant ID

1. Log in to Kashier Portal
2. Navigate to Settings > Account
3. Copy your Merchant ID (format: `MID-XXXXX`)

### 2. Update Environment Variables

```env
VITE_PAYMENT_TEST_MODE=false
KASHIER_MERCHANT_ID=MID-40169-389
KASHIER_PAYMENT_KEY=d02f9fd0-d7c3-408e-84ac-c4c3ae6fe8a2
KASHIER_SECRET_KEY=86d1f6ad6358c144a45b9cd918522f71$ea45afd990143d51dce936af207a94ff9ef7bf30f2fbed1a185625a490094ebd7eb1ec264e521ca9ea91a925dd95b8fe
```

### 3. Configure Webhook

- Set webhook URL in Kashier dashboard
- Verify webhook secret matches

### 4. Update Edge Function

In `create-kashier-payment/index.ts`, change:
```typescript
paymentUrl.searchParams.set('mode', 'live'); // Change from 'test' to 'live'
```

## Payment Methods Supported

Kashier supports:
- ✅ Debit/Credit Cards
- ✅ Mobile Wallets (Vodafone Cash, Instapay, etc.)
- ✅ Bank Transfers
- ✅ Other local payment methods

Configure in the payment URL:
```typescript
paymentUrl.searchParams.set('allowedMethods', 'card,wallet,bank');
```

## Security

- ✅ Order hash prevents tampering
- ✅ Webhook signature validation
- ✅ Secure key storage (Edge Function secrets)
- ✅ Transaction ID tracking
- ✅ Amount validation

## Troubleshooting

### Payment Not Redirecting

- Check `KASHIER_MERCHANT_ID` is set correctly
- Verify `KASHIER_PAYMENT_KEY` matches dashboard
- Check Edge Function logs for errors

### Webhook Not Receiving Callbacks

- Verify webhook URL in Kashier dashboard
- Check webhook secret matches
- Review Edge Function logs
- Ensure webhook is enabled in Kashier

### Hash Validation Failed

- Verify secret key is correct
- Check hash generation format matches Kashier docs
- Ensure amount is in piasters (cents) for EGP

## References

- [Kashier Documentation](https://docs.kashier.io)
- [Kashier Portal](https://portal.kashier.io)
- [Payment Gateway System Documentation](./PAYMENT_GATEWAY_SYSTEM.md)

