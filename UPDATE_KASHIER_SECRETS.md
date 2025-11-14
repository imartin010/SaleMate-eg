# Update Kashier API Secrets in Supabase

## Current Issue
The Edge Function is using old/incorrect API keys, causing "Forbidden request" errors.

## Required Actions

### Step 1: Update Supabase Edge Function Secrets

Go to your **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets** and set:

```
KASHIER_PAYMENT_KEY=bc7597b7-530e-408c-b74d-26d9a6dc2221
KASHIER_SECRET_KEY=7584092edd0f54b591591ba0cf479314$3ebcac07e6b67f3468e3b49218ee2dcc1092d7221cfcb5215f80fb29c8cae4e10a0d97fe902e88819044b0956bd9edfa
KASHIER_MERCHANT_ID=MID-40169-389
```

### Step 2: Or Use Supabase CLI

```bash
supabase secrets set KASHIER_PAYMENT_KEY=bc7597b7-530e-408c-b74d-26d9a6dc2221
supabase secrets set KASHIER_SECRET_KEY=7584092edd0f54b591591ba0cf479314$3ebcac07e6b67f3468e3b49218ee2dcc1092d7221cfcb5215f80fb29c8cae4e10a0d97fe902e88819044b0956bd9edfa
supabase secrets set KASHIER_MERCHANT_ID=MID-40169-389
```

## Changes Made

1. ✅ **Removed hardcoded fallback keys** - Edge Function now requires secrets to be set
2. ✅ **Updated hash format** - Now uses base currency (EGP) instead of piasters for both hash and URL
3. ✅ **Added validation** - Function will error clearly if secrets are missing
4. ✅ **Added debug logging** - Hash string is logged (with masked secret key) for troubleshooting

## Testing

After updating the secrets:
1. Try a payment again
2. Check Edge Function logs for the hash string format
3. Verify the amount displays correctly on Kashier checkout page

## References

- [Kashier Developer Docs](https://developers.kashier.io/)
- [Kashier API Keys](https://developers.kashier.io/getting-started/api-keys)
- [Kashier Authentication](https://developers.kashier.io/dashboard-api/authentication)

