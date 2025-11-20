# Payment Gateway Quick Test Guide

## 🚀 Fastest Way to Test (30 seconds)

### Step 1: Start Your App
```bash
npm run dev
```

### Step 2: Login
- Open your app in browser
- Login with your account

### Step 3: Make a Test Payment
1. Click **"Add Money"** or **"Top Up Wallet"** button
2. Select **"Debit/Credit Card"**
3. Enter amount: **5000** EGP
4. Click **"Pay Now"**

### Step 4: Verify Success
✅ Should see success message immediately  
✅ Wallet balance should increase by 5000 EGP  
✅ No errors in browser console (F12)

**If this works → Your payment gateway is working! 🎉**

---

## 📋 Complete Test Checklist

### Basic Functionality
- [ ] Can open Top Up Modal
- [ ] Can select payment method
- [ ] Can enter amount
- [ ] Payment processes successfully
- [ ] Wallet balance updates
- [ ] Success message appears

### Database Verification
- [ ] Transaction created in `payment_transactions`
- [ ] Top-up request created in `wallet_topup_requests`
- [ ] Wallet balance updated in `profiles`

### Error Handling
- [ ] Amount validation (must be greater than 0)
- [ ] Invalid amount validation
- [ ] Missing payment method validation

### Manual Payments
- [ ] Instapay submission works
- [ ] Bank Transfer submission works
- [ ] Receipt upload works

---

## 🔍 Detailed Testing

### Test Mode Payment (Recommended First)

**What to test:**
- Card payment with any amount (e.g., 100 EGP)
- Card payment with larger amount (10000 EGP)
- Multiple payments in sequence

**Expected:**
- Instant processing
- Immediate wallet update
- Transaction records created

### Production Mode (Kashier)

**Prerequisites:**
- Set `VITE_PAYMENT_TEST_MODE=false`
- Restart dev server
- Verify Kashier credentials

**What to test:**
- Payment redirects to Kashier
- Payment completion redirects back
- Wallet updates after callback

---

## 🐛 Troubleshooting

### Payment Not Processing?
1. Check browser console (F12)
2. Check Network tab for failed requests
3. Verify environment variables
4. Check Supabase Edge Function logs

### Wallet Not Updating?
1. Check `payment_transactions` table - is status `completed`?
2. Check `profiles.wallet_balance` - did it update?
3. Verify `process_payment_and_topup` RPC function exists

### Redirect Not Working?
1. Check `BASE_URL` environment variable
2. Verify callback route exists: `/payment/kashier/callback`
3. Check Edge Function logs

---

## ✅ Success Indicators

Your payment gateway is working correctly if:

1. ✅ Test mode payments process instantly
2. ✅ Wallet balance updates immediately
3. ✅ Transaction records are created
4. ✅ No console errors
5. ✅ Success messages appear
6. ✅ Error handling works (minimum amount, etc.)

---

## 📚 More Information

- **Full Test Plan**: See `PAYMENT_GATEWAY_TEST_PLAN.md`
- **Manual Testing**: See `PAYMENT_GATEWAY_MANUAL_TEST.md`
- **Integration Guide**: See `KASHIER_INTEGRATION.md`
- **System Documentation**: See `PAYMENT_GATEWAY_SYSTEM.md`

---

## 🎯 Next Steps

Once testing passes:

1. ✅ Document any issues
2. ✅ Fix bugs if found
3. ✅ Re-test after fixes
4. ✅ Prepare for production
5. ✅ Set up monitoring

---

**Quick Test Summary: Login → Add Money → Card → 5000 EGP → Pay → ✅ Success!**

