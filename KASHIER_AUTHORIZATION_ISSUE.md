# Kashier Authorization Issue

## Status
✅ **Hash validation working** - Checkout page loads successfully  
❌ **Payment processing failing** - "invalid authorization" error

## Error Details
```json
{
  "error": {
    "cause": "invalid authorization"
  },
  "messages": {
    "en": "Forbidden request",
    "ar": "Forbidden request"
  },
  "status": "FAILURE"
}
```

## Root Cause
The Payment API Key doesn't have authorization to process payments, likely because:

1. **Environment Mismatch**: Credentials are for test mode, but we're using `mode=live`
2. **Invalid API Key**: The Payment Key doesn't match the Merchant ID
3. **Account Not Activated**: Kashier account not approved for live transactions
4. **Permissions**: The API key doesn't have payment processing permissions

## Contact Kashier Support

**Email**: support@kashier.io

**Questions to Ask**:
1. Are these credentials for test or live environment?
   - Merchant ID: `MID-40169-389`
   - Payment Key: `bc7597b7-530e-408c-b74d-26d9a6dc2221`

2. Is our account activated for live payments?

3. Can you provide test credentials for integration testing?

4. What permissions does our Payment API Key need?

## Temporary Solution: Use Test Mode

Update Edge Function to use `mode=test` instead of `mode=live` to test if the credentials work in test mode.

