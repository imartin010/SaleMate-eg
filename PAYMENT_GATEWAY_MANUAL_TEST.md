# Payment Gateway Manual Testing Guide

## Quick Start Testing

This guide will help you test the payment gateway step-by-step to ensure everything works perfectly.

## Prerequisites

1. ✅ Application is running (`npm run dev`)
2. ✅ You have a user account (can login)
3. ✅ Environment variables are configured
4. ✅ Database tables exist
5. ✅ Edge functions are deployed

## Test 1: Test Mode Card Payment (Easiest - Start Here)

### Steps:

1. **Login to your account**
   - Navigate to login page
   - Enter your credentials
   - Verify you're logged in

2. **Open Top Up Modal**
   - Look for "Add Money" or "Top Up Wallet" button
   - Click it to open the modal

3. **Select Payment Method**
   - Click on "Debit/Credit Card" option
   - Verify it's selected (should be highlighted)

4. **Enter Amount**
   - Enter: `100` (or any amount you want to test)
   - Or click one of the quick amount buttons

5. **Submit Payment**
   - Click "Pay Now" button
   - Wait for processing (should be instant in test mode)

6. **Verify Success**
   - ✅ Should see success message
   - ✅ Modal should close automatically
   - ✅ Wallet balance should increase by 5000 EGP

### What to Check:

- [ ] No errors in browser console (F12 → Console)
- [ ] Success message appears
- [ ] Wallet balance updates immediately
- [ ] Modal closes after success

### Database Verification:

1. Open Supabase Dashboard
2. Go to **Table Editor** → `payment_transactions`
3. Find your latest transaction:
   - ✅ `status` = `'completed'`
   - ✅ `test_mode` = `true`
   - ✅ `gateway` = `'test'`
   - ✅ `amount` = `5000`
   - ✅ `payment_method` = `'card'`

4. Go to **Table Editor** → `wallet_topup_requests`
5. Find your latest request:
   - ✅ `status` = `'approved'`
   - ✅ `amount` = `5000`

6. Go to **Table Editor** → `profiles`
7. Find your profile:
   - ✅ `wallet_balance` increased by 5000

## Test 2: Multiple Test Payments

### Steps:

1. Repeat Test 1 with different amounts:
   - First payment: 5000 EGP
   - Second payment: 10000 EGP
   - Third payment: 15000 EGP

2. After each payment:
   - ✅ Verify wallet balance increases correctly
   - ✅ Check transaction records are created
   - ✅ Verify no duplicate transactions

### Expected Result:

- Wallet balance should be: 5000 + 10000 + 15000 = 30000 EGP
- Three separate transaction records
- All transactions marked as `completed`

## Test 3: Error Handling

### Test Invalid Amount (Zero or Negative):

1. Open Top Up Modal
2. Select "Debit/Credit Card"
3. Enter amount: `0` or `-100`
4. Click "Pay Now"

**Expected**: Error message "Please enter a valid amount"

### Test Invalid Amount:

1. Open Top Up Modal
2. Select "Debit/Credit Card"
3. Enter amount: `0` or negative number
4. Click "Pay Now"

**Expected**: Error message about invalid amount

### Test Missing Payment Method:

1. Open Top Up Modal
2. Enter amount: `5000`
3. Don't select payment method
4. Click "Pay Now"

**Expected**: Error message "Please select a payment method"

## Test 4: Manual Payment Methods (Instapay/Bank Transfer)

### Steps:

1. **Open Top Up Modal**
   - Click "Add Money" or "Top Up Wallet"

2. **Select Instapay or Bank Transfer**
   - Click on "Instapay" or "Bank Transfer"
   - Verify it's selected

3. **Enter Amount**
   - Enter: `5000` EGP

4. **Upload Receipt**
   - Click on the upload area
   - Select an image file (JPEG, PNG) or PDF
   - Verify preview appears

5. **Submit Request**
   - Click "Submit Request"
   - Wait for confirmation

6. **Verify**
   - ✅ Success message appears
   - ✅ Request submitted message
   - ✅ Wallet balance does NOT change (pending approval)

### Database Verification:

1. Check `wallet_topup_requests` table:
   - ✅ `status` = `'pending'`
   - ✅ `receipt_file_url` is not null
   - ✅ `payment_method` = `'Instapay'` or `'BankTransfer'`

2. Check `payment_transactions` table:
   - ❌ Should NOT have a transaction (manual payments don't create payment_transactions)

## Test 5: Kashier Payment (Production Mode)

⚠️ **Note**: This requires setting `VITE_PAYMENT_TEST_MODE=false`

### Setup:

1. **Update Environment Variable**
   ```bash
   # In your .env file:
   VITE_PAYMENT_TEST_MODE=false
   ```

2. **Restart Dev Server**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

3. **Verify Edge Function Secrets**
   - Go to Supabase Dashboard
   - Navigate to Edge Functions → Settings
   - Verify these secrets are set:
     - `KASHIER_PAYMENT_KEY`
     - `KASHIER_SECRET_KEY`
     - `KASHIER_MERCHANT_ID`
     - `BASE_URL` (your app URL)

### Steps:

1. **Open Top Up Modal**
   - Click "Add Money"

2. **Select Card Payment**
   - Click "Debit/Credit Card"

3. **Enter Amount**
   - Enter: `10000` EGP

4. **Submit Payment**
   - Click "Pay Now"
   - Should redirect to Kashier payment page

5. **Complete Payment on Kashier**
   - Use test card details (if in test mode on Kashier)
   - Complete the payment
   - Should redirect back to your app

6. **Verify Callback**
   - Should see "Processing Payment" message
   - Then "Payment Successful" message
   - Wallet balance should update
   - Should redirect to home page

### Database Verification:

1. Check `payment_transactions`:
   - ✅ `status` = `'completed'`
   - ✅ `test_mode` = `false`
   - ✅ `gateway` = `'kashier'`
   - ✅ `gateway_transaction_id` is set

2. Check wallet balance updated

## Test 6: Edge Function Verification

### Test create-kashier-payment:

1. Open browser console (F12)
2. Navigate to Network tab
3. Make a payment (Test 5)
4. Look for request to `create-kashier-payment`
5. Check response:
   - ✅ `success: true`
   - ✅ `redirectUrl` is a valid Kashier URL
   - ✅ `orderId` is present

### Test payment-webhook:

1. Go to Supabase Dashboard
2. Navigate to Edge Functions → Logs
3. Select `payment-webhook`
4. Make a payment
5. Check logs for:
   - ✅ Webhook received
   - ✅ Payment processed
   - ✅ No errors

## Test 7: Wallet Balance Refresh

### Steps:

1. Make a payment (Test 1)
2. Before modal closes, note the wallet balance
3. After payment completes:
   - ✅ Balance should update immediately
   - ✅ No need to refresh page
   - ✅ Balance is accurate

### Test Multiple Tabs:

1. Open app in two browser tabs
2. Make payment in Tab 1
3. Check Tab 2:
   - ⚠️ Balance might not update automatically (expected)
   - Refresh Tab 2 to see updated balance

## Test 8: Transaction History

### Steps:

1. Make several payments (different amounts)
2. Check if there's a transaction history page
3. Verify:
   - ✅ All transactions are listed
   - ✅ Correct amounts
   - ✅ Correct statuses
   - ✅ Correct dates

## Common Issues & Solutions

### Issue: Payment not processing

**Check:**
- Browser console for errors
- Network tab for failed requests
- Edge function logs in Supabase

**Solution:**
- Verify environment variables
- Check database tables exist
- Verify RPC function exists

### Issue: Wallet not updating

**Check:**
- `payment_transactions` table - is status `completed`?
- `profiles` table - did balance update?
- RPC function logs

**Solution:**
- Manually check `process_payment_and_topup` function
- Verify user has correct permissions

### Issue: Redirect not working (Kashier)

**Check:**
- Edge function logs
- `BASE_URL` environment variable
- Kashier credentials

**Solution:**
- Verify `BASE_URL` is set correctly
- Check callback route exists: `/payment/kashier/callback`

## Success Checklist

After completing all tests, verify:

- [ ] Test mode payments work instantly
- [ ] Wallet balance updates correctly
- [ ] Transaction records are created
- [ ] Error handling works (minimum amount, etc.)
- [ ] Manual payment methods work
- [ ] Receipt upload works
- [ ] Kashier redirect works (if production mode)
- [ ] Payment callback works
- [ ] Database records are accurate
- [ ] No console errors
- [ ] Edge functions respond correctly

## Next Steps

Once all tests pass:

1. ✅ Document any issues found
2. ✅ Fix any bugs
3. ✅ Re-test after fixes
4. ✅ Prepare for production
5. ✅ Set up monitoring

## Quick Test Summary

**Fastest way to verify everything works:**

1. Login
2. Click "Add Money"
3. Select "Debit/Credit Card"
4. Enter 5000 EGP
5. Click "Pay Now"
6. ✅ Should see success immediately
7. ✅ Wallet balance should increase

If this works, the payment gateway is functioning correctly! 🎉

