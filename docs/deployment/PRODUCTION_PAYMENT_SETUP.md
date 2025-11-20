# Production Payment Setup Guide

This guide will help you enable **real card payments** using Kashier payment gateway.

## Prerequisites

- ✅ Kashier API keys are configured
- ✅ Database migrations are applied
- ✅ Edge Functions are deployed

## Step 1: Update Environment Variables

### Frontend (.env.local)

Update your `.env.local` file (or create it if it doesn't exist):

```env
# Disable test mode to enable real payments
VITE_PAYMENT_TEST_MODE=false

# Kashier Configuration (already configured)
VITE_KASHIER_PAYMENT_KEY=d02f9fd0-d7c3-408e-84ac-c4c3ae6fe8a2
VITE_KASHIER_MERCHANT_ID=MID-40169-389
```

**Important**: After updating `.env.local`, restart your development server:
```bash
npm run dev
```

### Production Environment Variables

If deploying to Vercel/Netlify, set these in your platform's environment variables dashboard:
- `VITE_PAYMENT_TEST_MODE=false`
- `VITE_KASHIER_PAYMENT_KEY=d02f9fd0-d7c3-408e-84ac-c4c3ae6fe8a2`
- `VITE_KASHIER_MERCHANT_ID=MID-40169-389`

## Step 2: Update Edge Function Secrets

Set the Edge Function secrets in Supabase Dashboard:

1. Go to **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets**
2. Set the following secrets:

```bash
PAYMENT_TEST_MODE=false
BASE_URL=https://your-domain.com  # Replace with your actual domain
KASHIER_PAYMENT_KEY=d02f9fd0-d7c3-408e-84ac-c4c3ae6fe8a2
KASHIER_SECRET_KEY=86d1f6ad6358c144a45b9cd918522f71$ea45afd990143d51dce936af207a94ff9ef7bf30f2fbed1a185625a490094ebd7eb1ec264e521ca9ea91a925dd95b8fe
KASHIER_MERCHANT_ID=MID-40169-389
```

**Or via CLI:**
```bash
supabase secrets set PAYMENT_TEST_MODE=false
supabase secrets set BASE_URL=https://your-domain.com
supabase secrets set KASHIER_PAYMENT_KEY=d02f9fd0-d7c3-408e-84ac-c4c3ae6fe8a2
supabase secrets set KASHIER_SECRET_KEY=86d1f6ad6358c144a45b9cd918522f71$ea45afd990143d51dce936af207a94ff9ef7bf30f2fbed1a185625a490094ebd7eb1ec264e521ca9ea91a925dd95b8fe
supabase secrets set KASHIER_MERCHANT_ID=MID-40169-389
```

## Step 3: Configure Kashier Webhook

1. Log in to your **Kashier Dashboard**
2. Go to **Settings** → **Webhooks**
3. Add a new webhook with:
   - **URL**: `https://your-project.supabase.co/functions/v1/payment-webhook`
   - **Events**: Select all payment events (success, failure, etc.)
   - **Secret**: Use your `PAYMENT_WEBHOOK_SECRET` (set in Edge Function secrets)

4. Copy the webhook secret from Kashier and update your Edge Function secret:
   ```bash
   supabase secrets set PAYMENT_WEBHOOK_SECRET=your-kashier-webhook-secret
   ```

## Step 4: Deploy Edge Functions

Make sure the updated Edge Functions are deployed:

```bash
supabase functions deploy create-kashier-payment
supabase functions deploy payment-webhook
```

## Step 5: Test Real Payment

### Test Flow

1. **Start your app** (after updating `.env.local`)
2. **Navigate to Home** → Click **"Top Up"**
3. **Enter amount** (minimum 5,000 EGP)
4. **Select "Debit/Credit Card"**
5. **Click "Pay Now"**
6. You should be **redirected to Kashier checkout page**
7. **Complete payment** using a test card (if in test mode) or real card
8. **Redirect back** to your app's callback page
9. **Wallet balance** should update automatically

### Test Cards (Kashier Test Mode)

If using Kashier's test mode, you can use these test cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

**Note**: Even with `PAYMENT_TEST_MODE=false`, Kashier may still use test mode if your merchant account is in test mode. Check your Kashier dashboard.

## Step 6: Verify Production Mode

### Check Edge Function Logs

1. Go to **Supabase Dashboard** → **Edge Functions** → **Logs**
2. Look for `create-kashier-payment` function calls
3. Verify `testMode: false` in the logs
4. Check that `mode: 'live'` is set in the payment URL

### Check Payment Transactions

1. Go to **Supabase Dashboard** → **Table Editor** → `payment_transactions`
2. Verify new transactions have:
   - `test_mode: false`
   - `gateway: 'kashier'`
   - `status: 'completed'` (after successful payment)

## Troubleshooting

### Issue: Still redirecting to test mode

**Solution**: 
- Check that `PAYMENT_TEST_MODE=false` is set in both `.env.local` (frontend) and Edge Function secrets
- Restart your dev server after updating `.env.local`
- Clear browser cache

### Issue: Payment callback not working

**Solution**:
- Verify `BASE_URL` is set correctly in Edge Function secrets
- Check that the callback route `/payment/kashier/callback` is accessible
- Check browser console for errors

### Issue: Wallet not updating after payment

**Solution**:
- Check Edge Function logs for `payment-webhook` errors
- Verify `process_payment_and_topup` RPC function is working
- Check `payment_transactions` table for transaction status
- Verify webhook is configured correctly in Kashier dashboard

### Issue: "Transaction ID not found" error

**Solution**:
- Ensure `transactionId` is passed correctly in the redirect URL
- Check that the transaction was created in `payment_transactions` table
- Verify the callback route is receiving the correct query parameters

## Security Checklist

- ✅ Never commit `.env.local` to git
- ✅ Use environment variables for all sensitive keys
- ✅ Enable webhook signature verification
- ✅ Use HTTPS in production
- ✅ Regularly rotate API keys
- ✅ Monitor payment transactions for suspicious activity

## Support

If you encounter issues:
1. Check **Supabase Edge Function logs**
2. Check **Kashier Dashboard** → **Transactions**
3. Review **browser console** for frontend errors
4. Contact Kashier support if payment gateway issues persist

---

**Last Updated**: November 4, 2024

