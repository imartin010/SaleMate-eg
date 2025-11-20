# Payment Gateway Setup - Step by Step Guide

Follow these steps to set up the payment gateway system with Kashier integration.

## Step 1: Apply Database Migration

### Option A: Via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Open the migration file: `supabase/migrations/20251104000001_create_payment_gateway_tables.sql`
6. Copy the entire contents of the file
7. Paste into the SQL Editor
8. Click **Run** (or press `Cmd+Enter` / `Ctrl+Enter`)
9. Verify success - you should see "Success. No rows returned"

### Option B: Via Supabase CLI

```bash
# Make sure you're in the project root directory
cd "/Users/martin2/Desktop/Sale Mate Final"

# Link to your Supabase project (if not already linked)
supabase link --project-ref your-project-ref

# Apply the migration
supabase db push
```

## Step 2: Set Up Environment Variables

1. Create a `.env` file in your project root (if it doesn't exist):
   ```bash
   cp env.example .env
   ```

2. Open the `.env` file and add/update these variables:

```env
# Supabase Configuration (use your actual values)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Payment Gateway Configuration
VITE_PAYMENT_TEST_MODE=true  # Set to 'false' when ready for production

# Kashier Configuration
KASHIER_PAYMENT_KEY=d02f9fd0-d7c3-408e-84ac-c4c3ae6fe8a2
KASHIER_SECRET_KEY=86d1f6ad6358c144a45b9cd918522f71$ea45afd990143d51dce936af207a94ff9ef7bf30f2fbed1a185625a490094ebd7eb1ec264e521ca9ea91a925dd95b8fe
KASHIER_MERCHANT_ID=MID-40169-389
VITE_KASHIER_PAYMENT_KEY=d02f9fd0-d7c3-408e-84ac-c4c3ae6fe8a2
VITE_KASHIER_MERCHANT_ID=MID-40169-389

# Payment Webhook Secret
PAYMENT_WEBHOOK_SECRET=test-secret
```

3. **Important**: Replace `your-project.supabase.co` and keys with your actual Supabase values from your Supabase Dashboard.

## Step 3: Configure Edge Function Secrets

These secrets are needed for the Edge Functions to access Kashier API.

### Option A: Via Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **Project Settings** → **Edge Functions** → **Secrets**
3. Add the following secrets:

   - **Key**: `KASHIER_PAYMENT_KEY`
     **Value**: `d02f9fd0-d7c3-408e-84ac-c4c3ae6fe8a2`

   - **Key**: `KASHIER_SECRET_KEY`
     **Value**: `86d1f6ad6358c144a45b9cd918522f71$ea45afd990143d51dce936af207a94ff9ef7bf30f2fbed1a185625a490094ebd7eb1ec264e521ca9ea91a925dd95b8fe`

   - **Key**: `KASHIER_MERCHANT_ID`
     **Value**: `MID-40169-389`

   - **Key**: `PAYMENT_TEST_MODE`
     **Value**: `true` (set to `false` for production)

   - **Key**: `BASE_URL`
     **Value**: `https://your-project.supabase.co` (your actual Supabase URL)

### Option B: Via Supabase CLI

```bash
# Make sure you're in the project root
cd "/Users/martin2/Desktop/Sale Mate Final"

# Set secrets
supabase secrets set KASHIER_PAYMENT_KEY=d02f9fd0-d7c3-408e-84ac-c4c3ae6fe8a2
supabase secrets set KASHIER_SECRET_KEY=86d1f6ad6358c144a45b9cd918522f71\$ea45afd990143d51dce936af207a94ff9ef7bf30f2fbed1a185625a490094ebd7eb1ec264e521ca9ea91a925dd95b8fe
supabase secrets set KASHIER_MERCHANT_ID=MID-40169-389
supabase secrets set PAYMENT_TEST_MODE=true
supabase secrets set BASE_URL=https://your-project.supabase.co
```

**Note**: The `$` in the secret key needs to be escaped with `\$` in the terminal.

## Step 4: Deploy Edge Functions

1. Make sure you're in the project root directory:
   ```bash
   cd "/Users/martin2/Desktop/Sale Mate Final"
   ```

2. Deploy the Edge Functions:
   ```bash
   supabase functions deploy create-kashier-payment
   supabase functions deploy payment-webhook
   ```

   Or deploy all functions:
   ```bash
   supabase functions deploy
   ```

3. Verify deployment in Supabase Dashboard:
   - Go to **Edge Functions** in your Supabase Dashboard
   - You should see `create-kashier-payment` and `payment-webhook` listed

## Step 5: Configure Kashier Webhook (For Production)

**Note**: This step is only needed when you're ready to go live. For testing, you can skip this.

1. Log in to Kashier Portal: https://portal.kashier.io
2. Navigate to **Settings** → **Webhooks** (or **Integrations** → **Webhooks`)
3. Click **Add Webhook** or **Create Webhook**
4. Set the webhook URL:
   ```
   https://your-project.supabase.co/functions/v1/payment-webhook
   ```
   Replace `your-project.supabase.co` with your actual Supabase project URL.

5. Select events to listen for:
   - ✅ `payment.success`
   - ✅ `payment.failed`
   - ✅ `payment.cancelled`

6. Save the webhook

## Step 6: Test the System

### Test in Test Mode (Recommended First)

1. Make sure `VITE_PAYMENT_TEST_MODE=true` in your `.env` file
2. Start your development server:
   ```bash
   npm run dev
   ```
3. Navigate to your app and log in
4. Go to the Home page and click the **Top Up** button in the wallet section
5. Enter an amount (minimum 5,000 EGP)
6. Select **Debit/Credit Card** as payment method
7. Click **Pay Now**
8. **Expected Result**: 
   - In test mode, payment should be auto-approved instantly
   - Wallet balance should update immediately
   - Success message should appear

### Test with Kashier (Production Mode)

1. Set `VITE_PAYMENT_TEST_MODE=false` in your `.env` file
2. Restart your development server
3. Repeat steps 3-7 from above
4. **Expected Result**:
   - You should be redirected to Kashier payment page
   - Complete the payment on Kashier
   - You'll be redirected back to your app
   - Wallet balance should update automatically

## Step 7: Verify Everything Works

### Check Database

1. Go to Supabase Dashboard → **Table Editor**
2. Check `payment_transactions` table:
   - Should have records for each payment attempt
   - Status should be `completed` for successful payments
   - `test_mode` should be `true` for test payments

3. Check `wallet_topup_requests` table:
   - Should have records linked to payment transactions
   - Status should be `approved` for successful payments

4. Check `profiles` table:
   - `wallet_balance` should be updated for successful top-ups

### Check Edge Function Logs

1. Go to Supabase Dashboard → **Edge Functions**
2. Click on `create-kashier-payment` or `payment-webhook`
3. Click **Logs** tab
4. Check for any errors or warnings

## Troubleshooting

### Payment Not Processing

- ✅ Check Edge Function secrets are set correctly
- ✅ Verify `KASHIER_MERCHANT_ID` is correct
- ✅ Check Edge Function logs for errors
- ✅ Ensure database migration was applied successfully

### Wallet Not Updating

- ✅ Check `payment_transactions` table has a record
- ✅ Verify transaction status is `completed`
- ✅ Check `process_payment_and_topup` RPC function exists
- ✅ Review Edge Function logs

### Redirect Not Working

- ✅ Verify `BASE_URL` secret is set correctly
- ✅ Check Kashier payment URL is generated correctly
- ✅ Ensure webhook URL is configured in Kashier dashboard (for production)

## Next Steps

Once everything is working:

1. **Test thoroughly** with small amounts
2. **Monitor transactions** in the database
3. **Set up production mode** when ready:
   - Set `VITE_PAYMENT_TEST_MODE=false`
   - Configure webhook in Kashier dashboard
   - Update `BASE_URL` to your production domain
4. **Set up monitoring** for payment failures
5. **Add error notifications** for failed payments

## Support

If you encounter issues:

1. Check Edge Function logs in Supabase Dashboard
2. Review `payment_transactions` table for error messages
3. Verify all environment variables are set correctly
4. Ensure database migration was applied successfully

