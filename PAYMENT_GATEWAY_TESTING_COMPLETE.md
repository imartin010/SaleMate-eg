# Payment Gateway Testing - Complete Guide

## 📦 What's Been Created

I've set up a comprehensive testing suite for your payment gateway. Here's what's available:

### 1. **Test Documentation**
- ✅ `PAYMENT_GATEWAY_TEST_PLAN.md` - Complete test plan with all scenarios
- ✅ `PAYMENT_GATEWAY_MANUAL_TEST.md` - Step-by-step manual testing guide
- ✅ `PAYMENT_GATEWAY_QUICK_TEST.md` - Quick 30-second test guide
- ✅ `test-payment-gateway.mjs` - Automated test script (Node.js)

### 2. **Browser Test Page**
- ✅ `public/test-payment.html` - Interactive browser-based test page

---

## 🚀 Quick Start (Recommended)

### Option 1: Manual Test (Fastest - 30 seconds)

1. **Start your app:**
   ```bash
   npm run dev
   ```

2. **Login to your account**

3. **Make a test payment:**
   - Click "Add Money" or "Top Up Wallet"
   - Select "Debit/Credit Card"
   - Enter: **5000** EGP
   - Click "Pay Now"

4. **Verify:**
   - ✅ Success message appears
   - ✅ Wallet balance increases
   - ✅ No console errors

**If this works → Payment gateway is working! 🎉**

### Option 2: Browser Test Page

1. **Open test page:**
   ```
   http://localhost:5173/test-payment.html
   ```
   (Adjust port if different)

2. **Set Supabase credentials** (if needed):
   ```javascript
   window.SUPABASE_URL = 'your-supabase-url';
   window.SUPABASE_ANON_KEY = 'your-anon-key';
   ```

3. **Click "Run All Tests"**

4. **Review results**

### Option 3: Automated Script

1. **Set environment variables:**
   ```bash
   export VITE_SUPABASE_URL="your-url"
   export VITE_SUPABASE_ANON_KEY="your-key"
   ```

2. **Run test:**
   ```bash
   node test-payment-gateway.mjs
   ```

---

## 📋 Test Scenarios Covered

### ✅ Basic Functionality
- [x] Test mode card payments
- [x] Wallet balance updates
- [x] Transaction record creation
- [x] Success/error handling

### ✅ Database Tests
- [x] Table existence verification
- [x] RPC function testing
- [x] Transaction flow testing
- [x] Wallet balance updates

### ✅ Edge Function Tests
- [x] create-kashier-payment function
- [x] payment-webhook function
- [x] Authentication verification

### ✅ Error Handling
- [x] Minimum amount validation
- [x] Invalid input handling
- [x] Missing data handling

### ✅ Production Mode (Kashier)
- [x] Payment redirect
- [x] Callback handling
- [x] Webhook processing

---

## 🔍 What Gets Tested

### Database Tables
- `payment_transactions` - Payment transaction records
- `wallet_topup_requests` - Top-up request records
- `profiles` - User wallet balance

### RPC Functions
- `process_payment_and_topup` - Processes payments and updates wallet

### Edge Functions
- `create-kashier-payment` - Creates Kashier payment URLs
- `payment-webhook` - Handles payment callbacks

### Frontend Components
- Top Up Modal
- Payment method selection
- Amount input validation
- Receipt upload (manual payments)
- Payment callback page

---

## 📊 Expected Test Results

### Test Mode Payment
```
✅ payment_transactions table exists
✅ wallet_topup_requests table exists
✅ profiles table with wallet_balance exists
✅ Payment Test Mode is set
✅ Card payment processes instantly
✅ Wallet balance updates correctly
✅ Transaction status = 'completed'
✅ test_mode = true
```

### Production Mode (Kashier)
```
✅ Redirects to Kashier payment page
✅ Payment URL contains correct parameters
✅ Order hash is valid
✅ Callback redirects back to app
✅ Wallet balance updates after payment
✅ Transaction status = 'completed'
✅ test_mode = false
✅ gateway = 'kashier'
```

---

## 🐛 Common Issues & Solutions

### Issue: "Payment not processing"

**Check:**
1. Browser console (F12) for errors
2. Network tab for failed requests
3. Environment variables are set
4. Edge function logs in Supabase

**Solution:**
- Verify `VITE_PAYMENT_TEST_MODE` is set
- Check database tables exist
- Verify RPC function exists

### Issue: "Wallet not updating"

**Check:**
1. `payment_transactions` - is status `completed`?
2. `profiles.wallet_balance` - did it update?
3. RPC function logs

**Solution:**
- Manually verify `process_payment_and_topup` function
- Check user permissions
- Verify transaction was created

### Issue: "Redirect not working (Kashier)"

**Check:**
1. Edge function logs
2. `BASE_URL` environment variable
3. Kashier credentials

**Solution:**
- Verify `BASE_URL` is set correctly
- Check callback route exists: `/payment/kashier/callback`
- Verify Kashier credentials in Edge Function secrets

---

## ✅ Success Checklist

After running tests, verify:

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

---

## 📚 Documentation Files

1. **PAYMENT_GATEWAY_TEST_PLAN.md**
   - Complete test plan
   - All test scenarios
   - Database verification steps
   - Edge function tests

2. **PAYMENT_GATEWAY_MANUAL_TEST.md**
   - Step-by-step manual testing
   - Detailed verification steps
   - Database checks
   - Error scenarios

3. **PAYMENT_GATEWAY_QUICK_TEST.md**
   - 30-second quick test
   - Fast verification
   - Essential checks only

4. **test-payment-gateway.mjs**
   - Automated test script
   - Database verification
   - Edge function checks
   - RPC function tests

5. **public/test-payment.html**
   - Browser-based test page
   - Interactive testing
   - Visual results

---

## 🎯 Recommended Testing Flow

### Step 1: Quick Verification (2 minutes)
1. Run the quick test from `PAYMENT_GATEWAY_QUICK_TEST.md`
2. Verify basic functionality works
3. Check wallet balance updates

### Step 2: Comprehensive Testing (10 minutes)
1. Follow `PAYMENT_GATEWAY_MANUAL_TEST.md`
2. Test all payment methods
3. Test error scenarios
4. Verify database records

### Step 3: Production Testing (if applicable)
1. Set `VITE_PAYMENT_TEST_MODE=false`
2. Test Kashier payment flow
3. Verify redirect and callback
4. Check webhook processing

### Step 4: Automated Testing (optional)
1. Run `test-payment-gateway.mjs`
2. Review automated test results
3. Fix any failures

---

## 🚨 Important Notes

1. **Test Mode vs Production Mode**
   - Test mode: Payments are instant and simulated
   - Production mode: Uses real Kashier gateway

2. **Environment Variables**
   - `VITE_PAYMENT_TEST_MODE=true` (test mode)
   - `VITE_PAYMENT_TEST_MODE=false` (production mode)
   - Restart dev server after changing

3. **Database Verification**
   - Always check Supabase Dashboard
   - Verify transaction records
   - Check wallet balance updates

4. **Edge Functions**
   - Must be deployed to Supabase
   - Check logs for errors
   - Verify secrets are set

---

## 🎉 Next Steps

Once all tests pass:

1. ✅ **Document any issues found**
2. ✅ **Fix any bugs discovered**
3. ✅ **Re-test after fixes**
4. ✅ **Prepare for production deployment**
5. ✅ **Set up monitoring and alerts**

---

## 📞 Support

If you encounter issues:

1. Check browser console (F12)
2. Check Supabase Edge Function logs
3. Review database records
4. Check environment variables
5. Review test documentation

---

## ✨ Summary

You now have:
- ✅ Complete test documentation
- ✅ Automated test scripts
- ✅ Browser-based test page
- ✅ Step-by-step guides
- ✅ Troubleshooting guides

**Start with the Quick Test (30 seconds) to verify everything works!**

---

**Last Updated**: Payment Gateway Testing Suite
**Status**: Ready for Testing 🚀

