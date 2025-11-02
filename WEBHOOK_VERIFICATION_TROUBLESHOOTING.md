# Facebook Webhook Verification Troubleshooting

## Current Status
- ✅ Tokens added to Supabase Secrets
- ✅ Edge function redeployed with improved logging
- ✅ Webhook configured in Facebook (Page product)
- ❌ Verification still failing

## Error Message
"The callback URL or verify token couldn't be validated. Please verify the provided information or try again later."

## Verification Endpoint Details
- **URL**: `https://wkxbhvckmgrmdkdkhnqo.supabase.co/functions/v1/facebook-leads-webhook`
- **Product**: Page
- **Verify Token**: `salemate_verify_2024_secure_webhook_token`

## Troubleshooting Steps

### 1. Test the Endpoint Manually
Run this curl command to test if the endpoint responds:

```bash
curl "https://wkxbhvckmgrmdkdkhnqo.supabase.co/functions/v1/facebook-leads-webhook?hub.mode=subscribe&hub.verify_token=salemate_verify_2024_secure_webhook_token&hub.challenge=test_challenge_123"
```

**Expected response**: Just the challenge string `test_challenge_123` (plain text, no JSON)

### 2. Check Supabase Function Logs
1. Go to: https://supabase.com/dashboard/project/wkxbhvckmgrmdkdkhnqo/functions/facebook-leads-webhook/logs
2. Look for recent GET requests
3. Check if the verification attempt logs appear

### 3. Verify Secrets Are Set Correctly
1. Go to: https://supabase.com/dashboard/project/wkxbhvckmgrmdkdkhnqo/functions/secrets
2. Confirm both secrets exist:
   - `FACEBOOK_APP_SECRET`
   - `FACEBOOK_VERIFY_TOKEN`

### 4. Try a Simpler Verify Token
Facebook sometimes has issues with long tokens. Try:
- Token: `salemate2024`
- Update in Supabase Secrets first
- Update in Facebook webhook config
- Redeploy function if needed

### 5. Check Function Code
The function should:
- Return **plain text** (not JSON) for GET requests
- Return **exactly** the `hub.challenge` value
- Use `Content-Type: text/plain` header
- Respond within 3 seconds

### 6. Network/Firewall Check
- Ensure Supabase function is publicly accessible (it should be by default)
- Check if there are any IP restrictions
- Try accessing the URL directly in a browser

## Alternative: Use Graph API to Subscribe
Instead of webhook verification, you can subscribe to the `leadgen` field using the Graph API:

```
POST https://graph.facebook.com/v18.0/{page-id}/subscribed_apps
```

But first, the webhook needs to be verified.

## Current Function Code Location
`supabase/functions/facebook-leads-webhook/index.ts`

The verification handler (GET request) should:
1. Extract `hub.mode`, `hub.verify_token`, `hub.challenge` from query params
2. Check if `hub.mode === 'subscribe'` and token matches
3. Return the challenge as plain text

