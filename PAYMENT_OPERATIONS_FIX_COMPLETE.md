# Payment Operations Fix - Complete

## Issue
The payment gateway was failing with the error:
```
null value in column "id" of relation "payment_operations" violates not-null constraint
```

And later:
```
cannot insert into column "payment_method" of view "payment_transactions"
```

## Root Cause
Both `wallet_topup_requests` and `payment_transactions` are VIEWs (not tables) that read from the underlying `payment_operations` table. When inserting into these views, `INSTEAD OF` triggers handle the inserts. The trigger functions were not properly handling:

1. **NULL IDs**: When no ID was provided, the functions tried to insert NULL into the `id` column, which violates the NOT NULL constraint.
2. **Computed columns**: `payment_method` is a computed column extracted from metadata in the view, so it cannot be inserted directly - it must be placed in the metadata JSONB.

## Fixes Applied

### 1. Fixed `sync_wallet_topup_requests_to_payment_operations()` function
- Added UUID generation: `v_id := COALESCE(NEW.id, gen_random_uuid());`
- Added NULL handling for currency, gateway, and payment_method
- Set `NEW.id := v_id;` before returning so the caller receives the generated ID

### 2. Fixed `sync_payment_transactions_to_payment_operations()` function
- Added UUID generation: `v_id := COALESCE(NEW.id, gen_random_uuid());`
- Added NULL handling for currency and payment_method
- **Critical**: Added `payment_method` to the metadata JSONB object since it's a computed column in the view
- Set `NEW.id := v_id;` before returning so the caller receives the generated ID

## SQL Applied via Supabase MCP

Both functions were updated directly in the database using the Supabase MCP connection. The fixes ensure:

1. ✅ IDs are always generated if not provided
2. ✅ All required fields have default values
3. ✅ Computed columns (like `payment_method`) are properly handled by placing them in metadata
4. ✅ The generated ID is returned to the caller

## Testing

The payment gateway should now work correctly. Test by:
1. Opening the "Top Up Wallet" modal
2. Entering an amount (any amount > 0)
3. Selecting "Debit/Credit Card" payment method
4. Clicking "Pay Now"

The payment should process successfully without the NULL ID or computed column errors.

## Status
✅ **FIXED** - Both trigger functions have been updated and verified in the database.

