# How to Update Twilio Credentials

The Twilio authentication is currently failing (401 error). To fix SMS delivery, update your Twilio credentials:

## Steps:

1. **Get your Twilio credentials from Twilio Console:**
   - Go to: https://console.twilio.com/
   - Account SID: Found on the dashboard
   - Auth Token: Click "Show" next to Auth Token on the dashboard
   - Messaging Service SID: Go to Messaging > Services

2. **Update Supabase secrets:**
   ```bash
   supabase secrets set TWILIO_ACCOUNT_SID=your_account_sid_here
   supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token_here
   supabase secrets set TWILIO_MESSAGING_SERVICE_SID=your_messaging_service_sid_here
   ```

3. **Redeploy the function (optional, but recommended):**
   ```bash
   supabase functions deploy otp-request
   ```

4. **Test again** - The OTP should now be sent via SMS instead of showing the dev code.

## Troubleshooting:

- Make sure your Twilio account has sufficient balance
- Verify the phone number you're testing with is verified (if using a trial account)
- Check that the Messaging Service SID is correct and active
- Ensure your Twilio account is not suspended


