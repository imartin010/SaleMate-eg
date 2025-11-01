# Alphanumeric Sender ID Setup - "SaleMate"

## Overview
Updated the SMS system to send messages from "SaleMate" instead of a phone number for Egyptian recipients.

## ✅ What Changed

### Code Update
- Modified `send-otp` Edge Function to use alphanumeric sender "SaleMate"
- Automatically detects Egyptian phone numbers (+20)
- Falls back to Messaging Service for other countries
- **Deployed to Supabase** ✅

## 📱 How It Will Appear

**Before:**
```
From: +1 555 123 4567
Your SaleMate verification code is: 123456
```

**After:**
```
From: SaleMate
Your SaleMate verification code is: 123456
```

## 🔧 Setup Steps in Twilio

### Step 1: Enable Egypt Geo-Permissions

1. **Go to:** https://console.twilio.com/us1/develop/sms/settings/geo-permissions
2. **Find:** Egypt in the list
3. **Enable:** Make sure Egypt is checked/enabled
4. **Save changes**

### Step 2: Register Alphanumeric Sender ID

⚠️ **Important:** Egypt may require sender ID registration.

**Option A: Try Without Registration (Quick Test)**
- Some countries allow immediate use
- Just deploy and test
- If it fails, proceed to Option B

**Option B: Register Your Sender ID**
1. Go to: https://console.twilio.com/us1/develop/sms/settings/alpha-senders
2. Click "Register Alpha Sender" or "Get Started"
3. Fill in:
   - **Sender ID:** `SaleMate`
   - **Country:** Egypt
   - **Use Case:** Transactional/OTP
   - **Description:** "SMS OTP verification codes for SaleMate platform"
4. **Submit** and wait for approval (1-5 business days)

### Step 3: Check Registration Status

**Egypt-Specific Requirements:**
- Egypt may require pre-registration with telecom authorities
- Twilio will guide you through the process
- You may need to provide:
  - Business documentation
  - Use case justification
  - Sample message content

**Check Status:**
Visit: https://console.twilio.com/us1/develop/sms/settings/alpha-senders

## 🧪 Testing

### Test 1: Send Test SMS
1. Go to your signup page: http://localhost:5174/auth/signup
2. Enter details with Egyptian phone number (+20XXXXXXXXXX)
3. Click Continue
4. **Check SMS** - Should show "From: SaleMate"

### Test 2: Check Twilio Logs
1. Visit: https://console.twilio.com/us1/monitor/logs/sms
2. Look for recent messages
3. Check:
   - **To:** Your phone number
   - **From:** Should show "SaleMate"
   - **Status:** Delivered (or error message)

### Common Error Codes

If you get errors:

**Error 21408:** "Permission to send an SMS has not been enabled for the region indicated by the 'To' number"
- **Fix:** Enable Egypt in Geo-Permissions

**Error 21612:** "The 'From' phone number provided is not a valid, SMS-capable inbound phone number or short code for your account"
- **Fix:** Sender ID not registered/approved for Egypt
- **Action:** Register sender ID or use phone number temporarily

**Error 63007:** "Alphanumeric Sender ID is not currently supported in this region"
- **Fix:** Egypt DOES support it, but may need registration

## 🌍 Country Support

### Supported Countries (Alphanumeric)
- ✅ Egypt
- ✅ UAE
- ✅ Saudi Arabia
- ✅ UK
- ✅ Most European countries
- ✅ Most Asian countries

### NOT Supported
- ❌ USA
- ❌ Canada

**For unsupported countries:** The code automatically falls back to using Messaging Service (phone number).

## 📋 Important Notes

### Limitations of Alphanumeric Sender IDs

1. **One-Way Only**
   - Recipients CANNOT reply to alphanumeric senders
   - Perfect for OTP/notifications
   - Not suitable for two-way conversations

2. **Character Limits**
   - Maximum 11 characters
   - Letters and numbers only
   - No special characters
   - "SaleMate" = 8 characters ✅

3. **Registration Required**
   - Some countries require pre-registration
   - Can take 1-5 business days
   - May need business documentation

4. **No International Numbers**
   - Alphanumeric senders are country-specific
   - Each country may need separate registration

## 🔄 Fallback Strategy

The code includes automatic fallback:

```typescript
// Egypt numbers: Use "SaleMate"
if (phone.startsWith('+20')) {
  From: 'SaleMate'
}

// Other countries: Use phone number from Messaging Service
else {
  MessagingServiceSid: 'MGba4a7ef40574982c512a71d4828fbece'
}
```

This ensures:
- ✅ Egyptian users see "SaleMate"
- ✅ Other countries still receive SMS (from phone number)
- ✅ No service disruption

## 📊 Status Check

### Current Status
- ✅ Code updated and deployed
- ⏳ Awaiting Twilio sender ID approval (if required)
- ⏳ Needs testing with real Egyptian number

### Next Actions

**For Immediate Testing:**
1. Enable Egypt in Geo-Permissions
2. Try sending OTP to Egyptian number
3. Check if "SaleMate" appears

**If It Doesn't Work:**
1. Check Twilio SMS logs for error codes
2. Register sender ID if required
3. Wait for approval
4. Meanwhile, comment out alphanumeric code to use phone number

### Temporary Rollback (If Needed)

If you need to revert while waiting for approval:

```typescript
// Temporary: Always use Messaging Service
const bodyParams: Record<string, string> = {
  To: phone,
  Body: message,
  MessagingServiceSid: messagingServiceSid, // Use phone number
};

// Comment out alphanumeric logic
// if (isEgyptPhone) {
//   bodyParams.From = 'SaleMate';
// }
```

## 🎯 Expected Timeline

1. **Immediate:** Code deployed ✅
2. **0-24 hours:** Test with Egyptian number
3. **1-5 days:** Sender ID approval (if registration needed)
4. **After approval:** All Egyptian users see "SaleMate"

## 🔗 Useful Links

- **Twilio Alpha Senders:** https://console.twilio.com/us1/develop/sms/settings/alpha-senders
- **Geo Permissions:** https://console.twilio.com/us1/develop/sms/settings/geo-permissions
- **SMS Logs:** https://console.twilio.com/us1/monitor/logs/sms
- **Twilio Egypt Guide:** https://www.twilio.com/docs/sms/send-messages#include-an-alphanumeric-sender-id

## 💡 Tips

1. **Test First:** Try sending without registration - it might work!
2. **Monitor Logs:** Always check Twilio SMS logs for delivery status
3. **Be Patient:** Registration can take time, don't worry
4. **Fallback Works:** Non-Egyptian numbers still get SMS from phone number
5. **Professional Look:** "SaleMate" looks much more professional than a random number!

---

**Status:** Code deployed and ready! Now test with real Egyptian phone number. 🚀

**Need Help?** Check Twilio SMS logs or contact Twilio support if you encounter issues.

