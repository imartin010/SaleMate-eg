# 🔧 Send OTP Function - Troubleshooting Guide

## Problem
The `send-otp` edge function is returning a 500 error: "Failed to send verification code"

## Root Causes

### 1. Missing Twilio Secrets in Supabase (Most Common)
The edge function needs Twilio credentials configured as secrets.

**Fix:**
1. Go to: https://supabase.com/dashboard/project/wkxbhvckmgrmdkdkhnqo/settings/functions
2. Find the `send-otp` function
3. Go to "Secrets" tab
4. Add these secrets:
   - `TWILIO_ACCOUNT_SID` = Your Twilio Account SID
   - `TWILIO_AUTH_TOKEN` = Your Twilio Auth Token
   - `TWILIO_MESSAGING_SERVICE_SID` = Your Twilio Messaging Service SID

**Or via CLI:**
```bash
cd "/Users/martin2/Desktop/Sale Mate Final"
supabase secrets set TWILIO_ACCOUNT_SID=your_account_sid
supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token
supabase secrets set TWILIO_MESSAGING_SERVICE_SID=your_messaging_service_sid
```

### 2. Missing Supabase Environment Variables
The function also needs Supabase credentials (usually auto-set, but verify).

**Check:**
- `SUPABASE_URL` should be auto-set
- `SUPABASE_SERVICE_ROLE_KEY` should be auto-set

### 3. Twilio API Issues
- **Invalid credentials**: Check Twilio console for correct SIDs
- **Insufficient balance**: Check Twilio account balance
- **Unverified phone (trial account)**: Twilio trial accounts can only send to verified numbers
- **Alphanumeric sender issue**: The function tries to use "SaleMate" as sender for Egypt numbers - this requires a paid Twilio account with alphanumeric sender ID registration

### 4. Database Error
The function stores OTP in `otp_verifications` table. Check:
- Table exists
- RLS policies allow service role inserts
- Table schema matches expected format

## Quick Fix Steps

### Step 1: Check Supabase Edge Function Logs
1. Go to: https://supabase.com/dashboard/project/wkxbhvckmgrmdkdkhnqo/functions
2. Click on `send-otp`
3. Click "Logs" tab
4. Look for error messages

### Step 2: Verify Secrets Are Set
```bash
cd "/Users/martin2/Desktop/Sale Mate Final"
supabase secrets list
```

Should show:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`  
- `TWILIO_MESSAGING_SERVICE_SID`
- `SUPABASE_URL` (auto-set)
- `SUPABASE_SERVICE_ROLE_KEY` (auto-set)

### Step 3: Test Development Mode
If Twilio credentials are missing, the function should:
- Log OTP to console
- Return `dev_otp` in response
- Still work for testing

### Step 4: Redeploy Function (After Fixing Secrets)
```bash
cd "/Users/martin2/Desktop/Sale Mate Final"
supabase functions deploy send-otp
```

## Expected Behavior

### Development Mode (No Twilio Credentials)
- Function logs OTP to console
- Returns `{ success: true, dev_otp: "123456" }`
- OTP is stored in database

### Production Mode (With Twilio Credentials)
- Function sends SMS via Twilio
- Returns `{ success: true, message: "Verification code sent successfully" }`
- OTP is stored in database

## Common Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| "Failed to send verification code" | Twilio API call failed | Check Twilio credentials, balance, phone verification |
| "Server configuration error" | Missing SUPABASE_URL or SERVICE_ROLE_KEY | These should be auto-set, check Supabase dashboard |
| "Failed to store verification code" | Database error | Check `otp_verifications` table exists and RLS policies |
| "Too many requests" | Rate limiting | Wait 30 seconds between requests |

## Next Steps

1. **Check Supabase function logs** for detailed error
2. **Verify Twilio secrets** are set correctly
3. **Test with a verified phone number** (if using Twilio trial)
4. **Check Twilio account balance** and status
5. **Redeploy function** after fixing secrets

