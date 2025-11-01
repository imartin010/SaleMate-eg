# Twilio SMS Not Receiving - Troubleshooting Guide

## Issue
OTP codes are not being received on real phone numbers during signup.

## Common Reasons & Solutions

### 1. ✅ Twilio Trial Account Limitations

**Problem:** Twilio trial accounts can ONLY send SMS to verified phone numbers.

**Solution:**
1. Go to https://console.twilio.com/us1/develop/phone-numbers/manage/verified
2. Click "Add a new number"
3. Enter your phone number in E.164 format (e.g., +201234567890)
4. Verify it with the OTP Twilio sends
5. After verification, try the signup flow again

**Note:** This is the #1 reason for not receiving SMS on trial accounts!

### 2. ✅ Check Twilio Account Balance

**Problem:** No credits in Twilio account

**Check:**
1. Go to https://console.twilio.com/us1/billing/manage-billing/billing-overview
2. Verify you have credits (trial accounts get $15.50 free)
3. If balance is $0, add credits

### 3. ✅ Verify Twilio Credentials

**Check the credentials we set:**
- Account SID: `AC73463e4086874fd5d132d212a7fba9e7`
- Auth Token: `8c778bcf5f1002c5a7499c038ab8831f`
- Messaging Service SID: `MGba4a7ef40574982c512a71d4828fbece`

**How to verify:**
1. Go to https://console.twilio.com
2. Click on "Account" → "API keys & tokens"
3. Check if the Account SID matches
4. Check if the Auth Token is correct (you may need to reveal it)
5. Go to "Messaging" → "Services"
6. Verify the Messaging Service SID matches

### 4. ✅ Check Supabase Secrets

**Verify secrets are set correctly:**

```bash
cd "/Users/martin2/Desktop/Sale Mate Final"
supabase secrets list
```

**Should show:**
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_MESSAGING_SERVICE_SID

**If missing or wrong, reset them:**
```bash
supabase secrets set TWILIO_ACCOUNT_SID=AC73463e4086874fd5d132d212a7fba9e7
supabase secrets set TWILIO_AUTH_TOKEN=8c778bcf5f1002c5a7499c038ab8831f
supabase secrets set TWILIO_MESSAGING_SERVICE_SID=MGba4a7ef40574982c512a71d4828fbece
```

### 5. ✅ Phone Number Format

**Problem:** Phone number not in E.164 format

**Correct Format:**
- Egypt: `+201234567890` (not `01234567890` or `1234567890`)
- Country code (+20) + number (10 digits)

**In the signup form:**
- Select Egypt flag (+20)
- Enter: `1234567890`
- System converts to: `+201234567890`

### 6. ✅ Check Twilio Console for Errors

**View SMS logs:**
1. Go to https://console.twilio.com/us1/monitor/logs/sms
2. Check for recent SMS attempts
3. Look for error messages:
   - "To number is not a valid mobile number" → Wrong format
   - "Unverified numbers" → Need to verify number (trial account)
   - "Insufficient funds" → Add credits
   - "Authentication failed" → Wrong credentials

### 7. ✅ Test Twilio Directly

**Send a test SMS via Twilio console:**
1. Go to https://console.twilio.com/us1/develop/sms/try-it-out/send-an-sms
2. Select your Messaging Service
3. Enter your verified phone number
4. Send test message
5. If this works, issue is in our code; if not, issue is with Twilio setup

### 8. ✅ Check Edge Function Logs

**Via Supabase Dashboard:**
1. Go to: https://supabase.com/dashboard/project/wkxbhvckmgrmdkdkhnqo/functions/send-otp/logs
2. Look for error messages
3. Common errors:
   - "Missing Twilio configuration" → Secrets not set
   - "Failed to send verification code" → Twilio API error
   - "Invalid phone format" → Wrong E.164 format

**Via CLI:**
```bash
cd "/Users/martin2/Desktop/Sale Mate Final"
# This will show recent function invocations
supabase functions logs send-otp
```

### 9. ✅ Development Mode Fallback

**If Twilio isn't configured, the system logs OTP to console:**

Check your Supabase function logs for lines like:
```
===================================
📱 DEVELOPMENT MODE - OTP CODE
===================================
Phone: +201234567890
OTP Code: 123456
Purpose: signup
Expires: [timestamp]
===================================
```

This means Twilio credentials aren't being picked up.

### 10. ✅ Messaging Service Configuration

**Verify Messaging Service setup:**
1. Go to https://console.twilio.com/us1/develop/sms/services
2. Click on your Messaging Service (MGba4a7ef40574982c512a71d4828fbece)
3. Check:
   - "Sender Pool" has at least one number
   - If using trial: Sender number must be your Twilio trial number
   - "Compliance" → Make sure it's approved for your use case

## Step-by-Step Testing

### Test 1: Verify Your Twilio Account
```bash
# Visit these URLs and verify:
1. https://console.twilio.com - Login and check account status
2. https://console.twilio.com/us1/billing/manage-billing/billing-overview - Check credits
3. https://console.twilio.com/us1/develop/phone-numbers/manage/verified - Add your phone
```

### Test 2: Check Supabase Configuration
```bash
cd "/Users/martin2/Desktop/Sale Mate Final"

# List secrets
supabase secrets list

# If any are missing, set them again
supabase secrets set TWILIO_ACCOUNT_SID=AC73463e4086874fd5d132d212a7fba9e7
supabase secrets set TWILIO_AUTH_TOKEN=8c778bcf5f1002c5a7499c038ab8831f
supabase secrets set TWILIO_MESSAGING_SERVICE_SID=MGba4a7ef40574982c512a71d4828fbece

# Redeploy the function after setting secrets
supabase functions deploy send-otp
```

### Test 3: Try Signup Again
1. Go to http://localhost:5174/auth/signup
2. Enter details with YOUR VERIFIED phone number
3. Click Continue
4. Check for SMS

### Test 4: Check Logs
```bash
# Check Supabase function logs
supabase functions logs send-otp

# Or check in browser:
# https://supabase.com/dashboard/project/wkxbhvckmgrmdkdkhnqo/functions/send-otp/logs
```

## Most Likely Issue (Trial Account)

🎯 **If you're using a Twilio trial account:**

You MUST verify your phone number first:
1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
2. Click "Add a new number"
3. Enter: `+20` + your phone number (e.g., `+201234567890`)
4. Verify with the OTP Twilio sends
5. Then try signup again

Trial accounts have this limitation for anti-spam protection.

## Upgrade to Production (Removes Limitations)

If you need to send to ANY phone number without verification:

1. Upgrade Twilio account to paid/production
2. Go to: https://console.twilio.com/us1/billing/manage-billing/upgrade-account
3. Complete verification
4. Once upgraded, you can send to any number

## Quick Check Checklist

✅ Twilio trial account has verified phone numbers
✅ Twilio account has credits (check billing)
✅ Messaging Service is configured with sender number
✅ Supabase secrets are set correctly
✅ Edge function is deployed
✅ Phone number is in E.164 format (+20XXXXXXXXXX)
✅ Checked Twilio SMS logs for errors
✅ Tested sending SMS directly from Twilio console

## Need More Help?

**Check these resources:**
1. Twilio SMS Logs: https://console.twilio.com/us1/monitor/logs/sms
2. Twilio Debugger: https://console.twilio.com/us1/monitor/debugger
3. Supabase Logs: https://supabase.com/dashboard/project/wkxbhvckmgrmdkdkhnqo/logs/explorer

**Common Error Codes:**
- **21211**: Invalid 'To' phone number
- **21408**: Permission to send SMS has not been enabled
- **21610**: Unverified number (trial account)
- **20003**: Authentication error (wrong credentials)

---

## For Testing Without Real SMS

If you want to test the flow without actual SMS:

**Option 1: Use Development Mode**
- Don't set Twilio secrets in Supabase
- Function will log OTP to console
- Check Supabase logs for the OTP code
- Enter it manually

**Option 2: Use Hardcoded OTP (Dev Only)**
Temporarily modify `send-otp` function to always return success and log a fixed OTP.

---

**Most likely solution:** Add your phone number to Twilio verified numbers if using trial account!

