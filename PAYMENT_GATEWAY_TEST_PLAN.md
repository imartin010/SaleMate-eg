# Payment Gateway Testing Plan

## Overview
This document outlines comprehensive testing procedures for the payment gateway system to ensure it works perfectly.

## Test Environment Setup

### Prerequisites
1. ✅ User account with authentication
2. ✅ Database tables created (`payment_transactions`, `wallet_topup_requests`, `profiles`)
3. ✅ Edge functions deployed (`create-kashier-payment`, `payment-webhook`)
4. ✅ Environment variables configured
5. ✅ RPC function `process_payment_and_topup` exists

### Environment Variables to Verify
```bash
# Check these are set:
VITE_PAYMENT_TEST_MODE=true (or false for production)
VITE_KASHIER_PAYMENT_KEY=d02f9fd0-d7c3-408e-84ac-c4c3ae6fe8a2
VITE_KASHIER_MERCHANT_ID=MID-40169-389
KASHIER_SECRET_KEY=86d1f6ad6358c144a45b9cd918522f71$...
```

## Test Scenarios

### 1. Test Mode Payment (Card Payment)
**Objective**: Verify test mode card payments work instantly

**Steps**:
1. Open Top Up Modal
2. Select "Debit/Credit Card"
3. Enter amount: 100 EGP (or any amount > 0)
4. Click "Pay Now"
5. Verify payment processes instantly
6. Check wallet balance updates
7. Verify transaction record created

**Expected Results**:
- ✅ Payment processes without redirect
- ✅ Wallet balance increases by payment amount
- ✅ Transaction status = 'completed'
- ✅ `payment_transactions` record created with `test_mode: true`
- ✅ `wallet_topup_requests` record created and approved
- ✅ Success message displayed

### 2. Kashier Payment (Production Mode)
**Objective**: Verify Kashier payment redirect and callback

**Steps**:
1. Set `VITE_PAYMENT_TEST_MODE=false`
2. Open Top Up Modal
3. Select "Debit/Credit Card"
4. Enter amount: 10000 EGP
5. Click "Pay Now"
6. Verify redirect to Kashier payment page
7. Complete payment on Kashier (use test card)
8. Verify callback redirects back
9. Check wallet balance updates

**Expected Results**:
- ✅ Redirects to Kashier payment page
- ✅ Payment URL contains correct parameters
- ✅ Order hash is valid
- ✅ After payment, redirects to callback page
- ✅ Wallet balance updates
- ✅ Transaction status = 'completed'

### 3. Manual Payment Methods
**Objective**: Verify Instapay and Bank Transfer flows

**Steps**:
1. Open Top Up Modal
2. Select "Instapay" or "Bank Transfer"
3. Enter amount: 5000 EGP
4. Upload receipt image
5. Submit request
6. Verify request created

**Expected Results**:
- ✅ Top-up request created with `status: 'pending'`
- ✅ Receipt uploaded to storage
- ✅ Request visible in admin panel
- ✅ No wallet balance change (until admin approval)

### 4. Database Function Tests
**Objective**: Verify `process_payment_and_topup` RPC function

**Test Cases**:
- ✅ Valid transaction ID
- ✅ Invalid transaction ID
- ✅ Already processed transaction
- ✅ Wallet balance update
- ✅ Transaction record update
- ✅ Wallet transaction log creation

### 5. Edge Function Tests
**Objective**: Verify edge functions work correctly

**Test Cases**:
- ✅ `create-kashier-payment` with valid request
- ✅ `create-kashier-payment` with invalid amount
- ✅ `create-kashier-payment` authentication
- ✅ `payment-webhook` with valid payload
- ✅ `payment-webhook` signature validation

### 6. Error Handling Tests
**Objective**: Verify error scenarios

**Test Cases**:
- ✅ Invalid amount (0 or negative)
- ✅ Invalid payment method
- ✅ Missing receipt for manual methods
- ✅ Network errors
- ✅ Gateway failures
- ✅ Duplicate transactions

### 7. Wallet Balance Verification
**Objective**: Verify wallet balance updates correctly

**Test Cases**:
- ✅ Balance increases after successful payment
- ✅ Balance doesn't change on failed payment
- ✅ Balance doesn't change on pending manual payment
- ✅ Multiple payments accumulate correctly
- ✅ Balance refresh works

### 8. Transaction History
**Objective**: Verify transaction records are created correctly

**Test Cases**:
- ✅ Transaction appears in `payment_transactions`
- ✅ Correct status values
- ✅ Correct gateway information
- ✅ Correct user association
- ✅ Test mode flag set correctly

## Test Execution Checklist

### Pre-Testing
- [ ] Verify database tables exist
- [ ] Verify RPC function exists
- [ ] Verify edge functions are deployed
- [ ] Check environment variables
- [ ] Verify user authentication works

### Test Mode Testing
- [ ] Test card payment (5000 EGP)
- [ ] Test card payment (10000 EGP)
- [ ] Test card payment (50000 EGP)
- [ ] Verify wallet balance updates
- [ ] Verify transaction records
- [ ] Test error scenarios

### Production Mode Testing (Kashier)
- [ ] Test payment redirect
- [ ] Test payment callback
- [ ] Test successful payment
- [ ] Test failed payment
- [ ] Verify webhook handling

### Manual Payment Testing
- [ ] Test Instapay submission
- [ ] Test Bank Transfer submission
- [ ] Verify receipt upload
- [ ] Verify admin approval flow

### Database Verification
- [ ] Check `payment_transactions` records
- [ ] Check `wallet_topup_requests` records
- [ ] Check `profiles.wallet_balance` updates
- [ ] Check `wallet_transactions` records (if exists)

## Automated Test Script

Run the test script to verify all components:
```bash
node test-payment-gateway.js
```

## Manual Testing Steps

1. **Start Application**
   ```bash
   npm run dev
   ```

2. **Login as User**
   - Navigate to login page
   - Enter credentials
   - Verify authentication

3. **Test Card Payment (Test Mode)**
   - Click "Add Money" or "Top Up"
   - Select "Debit/Credit Card"
   - Enter 5000 EGP
   - Click "Pay Now"
   - Verify success message
   - Check wallet balance

4. **Verify Database**
   - Open Supabase Dashboard
   - Check `payment_transactions` table
   - Check `wallet_topup_requests` table
   - Check `profiles.wallet_balance`

5. **Test Kashier (Production Mode)**
   - Set `VITE_PAYMENT_TEST_MODE=false`
   - Repeat card payment
   - Verify redirect to Kashier
   - Complete payment
   - Verify callback

## Success Criteria

✅ All test scenarios pass
✅ No errors in console
✅ Database records created correctly
✅ Wallet balance updates accurately
✅ Transaction history is complete
✅ Error handling works properly
✅ Edge functions respond correctly
✅ Webhook processing works

## Troubleshooting

### Payment Not Processing
- Check browser console for errors
- Verify edge function logs
- Check database for transaction records
- Verify environment variables

### Wallet Not Updating
- Check `process_payment_and_topup` RPC function
- Verify transaction status
- Check user permissions
- Verify wallet_balance column exists

### Redirect Not Working
- Check Kashier credentials
- Verify edge function deployment
- Check redirect URL configuration
- Verify BASE_URL environment variable

## Next Steps After Testing

1. Document any issues found
2. Fix any bugs discovered
3. Re-test after fixes
4. Prepare for production deployment
5. Set up monitoring and alerts

