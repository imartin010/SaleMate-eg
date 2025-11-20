# OTP Resend Cooldown Update - 30 Seconds

## Changes Made

Updated the OTP resend cooldown from 45 seconds to 30 seconds as requested.

### 1. Backend Changes ✅

**File:** `supabase/functions/send-otp/index.ts`

**Changes:**
- Updated rate limiting cooldown from 45 seconds to 30 seconds
- Updated error message to reflect new cooldown time

```typescript
// Before: 45 second cooldown
if (now - record.lastSent < 45 * 1000) {
  return true;
}

// After: 30 second cooldown  
if (now - record.lastSent < 30 * 1000) {
  return true;
}
```

**Error Message Updated:**
```typescript
// Before
error: 'Too many requests. Please wait 45 seconds before requesting another code.'

// After
error: 'Too many requests. Please wait 30 seconds before requesting another code.'
```

**Status:** Deployed to Supabase ✅

### 2. Frontend Changes ✅

**File:** `src/components/auth/OTPInput.tsx`

**Changes:**
- Added separate `resendCooldown` state (30 seconds)
- Added separate countdown timer for resend button
- Updated UI to show countdown: "Resend in Xs"
- Resend button becomes enabled after 30 seconds instead of waiting for full OTP expiration

**Implementation:**
```typescript
const [resendCooldown, setResendCooldown] = useState(30); // 30 second cooldown
const [canResend, setCanResend] = useState(false);

// Separate timer for resend cooldown
useEffect(() => {
  if (resendCooldown <= 0) {
    setCanResend(true);
    return;
  }
  
  const timer = setInterval(() => {
    setResendCooldown((prev) => {
      if (prev <= 1) {
        setCanResend(true);
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
  
  return () => clearInterval(timer);
}, [resendCooldown]);
```

**UI Update:**
```tsx
{!canResend && resendCooldown > 0 ? (
  <>
    <RefreshCw className="h-4 w-4" />
    <span>Resend in {resendCooldown}s</span>
  </>
) : (
  <>
    <RefreshCw className="h-4 w-4" />
    <span>Resend Code</span>
  </>
)}
```

## User Experience

### Before
- Users had to wait 45 seconds before they could resend OTP
- OR wait for the full 5-minute expiration timer
- No visual countdown for resend cooldown

### After
- Users wait only 30 seconds before resend button becomes active
- Visual countdown shows "Resend in Xs" where X counts down from 30
- Better UX with clear feedback on when resend will be available
- Main expiration timer (5 minutes) still shows separately

## Testing Results ✅

**Tested in Chromium:**
1. ✅ Signup form submission triggers OTP
2. ✅ OTP screen shows "Resend in 29s" (counting down from 30)
3. ✅ Countdown updates every second
4. ✅ Resend button is disabled during cooldown
5. ✅ After 30 seconds, button becomes active and shows "Resend Code"
6. ✅ Clicking resend resets cooldown back to 30 seconds

**Screenshot:** `otp-30-second-cooldown.png` shows the feature working with "Resend in 24s" displayed.

## Files Modified

1. `supabase/functions/send-otp/index.ts` - Backend rate limiting
2. `src/components/auth/OTPInput.tsx` - Frontend countdown timer

## Deployment Status

✅ **Backend:** Deployed to Supabase
✅ **Frontend:** Ready for production (runs on Vite dev server)

## Summary

The resend cooldown has been successfully reduced from 45 seconds to 30 seconds, with both backend rate limiting and frontend UI updates. The change provides a better user experience with faster resend availability and clear visual feedback.

---

**Updated:** November 1, 2024
**Status:** Complete and Tested ✅

