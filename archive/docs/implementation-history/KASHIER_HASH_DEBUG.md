# Kashier Hash Debugging

## Current Issue
"Forbidden request" error persists after trying both SHA256 and HMAC-SHA256.

## Credentials Being Used
- Merchant ID: `MID-40169-389`
- Payment Key: `bc7597b7-530e-408c-b74d-26d9a6dc2221`
- Secret Key: `7584092edd0f54b591591ba0cf479314$3ebcac07e6b67f3468e3b49218ee2dcc1092d7221cfcb5215f80fb29c8cae4e10a0d97fe902e88819044b0956bd9edfa`

## Hash Formats Tried
1. ❌ HMAC-SHA256 (using full secret key)
2. ❌ SHA256 (using full secret key in string)

## Possible Solutions to Try

### Option 1: Split Secret Key
The Kashier secret key has a `$` separator. This might indicate two parts:
- First part (before `$`): `7584092edd0f54b591591ba0cf479314`
- Second part (after `$`): `3ebcac07e6b67f3468e3b49218ee2dcc1092d7221cfcb5215f80fb29c8cae4e10a0d97fe902e88819044b0956bd9edfa`

Maybe we should use ONLY the first part for hashing?

### Option 2: Contact Kashier Support
Ask for:
1. Exact hash calculation method
2. Test credentials to verify integration
3. Documentation on hash format

### Option 3: Check API vs Checkout
We're using `checkout.kashier.io` but there's also `iframe.kashier.io`. Different integration methods might need different hash formats.

### Option 4: Verify Environment
The credentials might be for test/sandbox environment, not live. Check with Kashier which environment these credentials are for.

## Next Steps
1. Try using only the first part of secret key (before `$`)
2. If that fails, contact Kashier support for clarification

