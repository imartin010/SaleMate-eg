# Kashier Payment Webhook

## Overview

This Edge Function handles server-to-server payment notifications from Kashier. It ensures wallet balances are updated even if the user closes their browser before the redirect completes.

## Purpose

- **Primary reliability mechanism**: Processes payments independently of user redirects
- **Idempotent**: Safe to call multiple times (checks `completed_at` timestamp)
- **Secure**: Validates HMAC-SHA256 signature from Kashier
- **Robust**: Handles all Kashier payment statuses

## Architecture

```
┌──────────┐         ┌──────────────────┐         ┌────────────┐
│ Kashier  │ ─POST──>│ kashier-webhook  │ ─RPC──>│  Supabase  │
│ Gateway  │         │  Edge Function   │         │  Database  │
└──────────┘         └──────────────────┘         └────────────┘
     │                        │                          │
     │                   1. Validate                     │
     │                   signature                       │
     │                        │                          │
     │                   2. Extract                      │
     │                   transaction ID                  │
     │                        │                          │
     │                   3. Check                        │
     │                   idempotency                     │
     │                        │                          │
     │                   4. Call                         │
     │                   process_payment_               │
     │                   and_topup RPC ─────────────────>│
     │                        │                          │
     │                   5. Update wallet               │
     │                        │                          │
     └────────────────────────┴──────────────────────────┘
```

## Webhook Configuration

### 1. Environment Variables Required

Add these to your Supabase project settings:

```bash
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
KASHIER_SECRET_KEY=<your-kashier-secret-key>
```

**IMPORTANT**: The `KASHIER_SECRET_KEY` is used for signature verification. Get this from your Kashier dashboard.

### 2. Deploy the Function

```bash
supabase functions deploy kashier-webhook
```

### 3. Get the Webhook URL

After deployment, your webhook URL will be:
```
https://<project-ref>.supabase.co/functions/v1/kashier-webhook
```

### 4. Configure in Kashier Dashboard

1. Login to [Kashier Dashboard](https://merchants.kashier.io/)
2. Go to **Settings** → **Webhooks**
3. Add webhook URL: `https://<project-ref>.supabase.co/functions/v1/kashier-webhook`
4. Select events: **Payment Success**, **Payment Failed**
5. Save configuration

## Webhook Payload Format

Kashier sends webhooks with this structure:

```json
{
  "orderId": "order_<transaction_id>_<timestamp>",
  "merchantOrderId": "<optional>",
  "transactionId": "<kashier_txn_id>",
  "amount": "100.00",
  "currency": "EGP",
  "status": "SUCCESS",
  "cardNumber": "****1234",
  "cardBrand": "Visa",
  "paymentMethod": "card",
  "createdAt": "2025-11-15T20:00:00Z",
  "hash": "<hmac_sha256_signature>"
}
```

## Status Mapping

Kashier statuses are mapped to our system statuses:

| Kashier Status | Our Status | Action |
|----------------|------------|--------|
| SUCCESS, SUCCESSFUL, PAID, APPROVED | `completed` | Credit wallet |
| FAILED, FAILURE, DECLINED, ERROR | `failed` | No action |
| CANCELLED, CANCELED, VOIDED | `cancelled` | No action |

## Security

### HMAC Signature Verification

The webhook validates every request using HMAC-SHA256:

1. Extracts the `hash` field from payload
2. Computes signature using: `amount.currency.orderId.transactionId`
3. Compares with `KASHIER_SECRET_KEY`
4. Rejects request if signatures don't match

**CRITICAL**: Always verify signatures in production to prevent fraudulent webhook calls.

## Idempotency

The webhook is fully idempotent:

- **Check**: `completed_at IS NULL` in transaction record
- **First call**: Processes payment, updates wallet, sets `completed_at`
- **Subsequent calls**: Returns "already processed", no changes

**Safe to retry**: Kashier may send webhooks multiple times. Our system handles this gracefully.

## Testing

### Local Testing

1. Start Supabase locally:
   ```bash
   supabase start
   ```

2. Serve the function:
   ```bash
   supabase functions serve kashier-webhook
   ```

3. Send test webhook:
   ```bash
   curl -X POST http://localhost:54321/functions/v1/kashier-webhook \
     -H "Content-Type: application/json" \
     -d '{
       "orderId": "order_<test-transaction-id>_1234567890",
       "transactionId": "kashier_test_123",
       "amount": "100.00",
       "currency": "EGP",
       "status": "SUCCESS",
       "hash": "<computed-hmac>"
     }'
   ```

### Production Testing

1. Create a small test transaction (e.g., 5 EGP)
2. Complete payment on Kashier
3. Check Supabase logs:
   ```bash
   supabase functions logs kashier-webhook
   ```
4. Verify wallet balance updated
5. Verify transaction has `completed_at` set

## Monitoring

### Check Webhook Logs

```bash
# View recent webhook calls
supabase functions logs kashier-webhook --limit 50

# Follow logs in real-time
supabase functions logs kashier-webhook --follow
```

### SQL Monitoring

```sql
-- Check for stuck transactions (status='completed' but completed_at=NULL)
SELECT 
  id, 
  user_id, 
  amount, 
  status, 
  completed_at,
  created_at
FROM payment_transactions
WHERE status = 'completed' 
  AND completed_at IS NULL
  AND created_at > now() - interval '24 hours'
ORDER BY created_at DESC;

-- Check recent webhook-processed transactions
SELECT 
  id,
  user_id,
  amount,
  status,
  gateway_transaction_id,
  completed_at
FROM payment_transactions
WHERE completed_at IS NOT NULL
  AND completed_at > now() - interval '1 hour'
ORDER BY completed_at DESC;
```

## Troubleshooting

### Issue 1: Webhook Not Receiving Calls

**Check**:
1. Webhook URL configured correctly in Kashier dashboard
2. Function deployed: `supabase functions list`
3. No firewall blocking Kashier IPs

**Fix**: Verify webhook URL and redeploy if needed

### Issue 2: Signature Validation Failing

**Check**:
1. `KASHIER_SECRET_KEY` is correct
2. Signature algorithm matches Kashier's format

**Fix**: Get correct secret key from Kashier dashboard

### Issue 3: Transaction Not Found

**Check**:
1. `orderId` format: `order_<transaction_id>_<timestamp>`
2. Transaction exists in database

**Fix**: Verify transaction was created before webhook fired

### Issue 4: Amount Mismatch

**Check**:
1. Currency matches (EGP)
2. No rounding issues (checks within 0.01)

**Fix**: Verify transaction amount in database

## Performance

- **Average processing time**: 100-300ms
- **Timeout**: 10 seconds (Supabase Edge Function default)
- **Retries**: Handled by Kashier (typically 3 attempts)

## Error Handling

The webhook returns appropriate HTTP status codes:

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Wallet updated or already processed |
| 400 | Bad Request | Invalid payload format |
| 401 | Unauthorized | Invalid signature |
| 404 | Not Found | Transaction doesn't exist |
| 500 | Server Error | Database or RPC error |

## Best Practices

1. **Always verify signatures** in production
2. **Log all webhook calls** for audit trail
3. **Monitor for stuck transactions** daily
4. **Test webhooks** after any changes
5. **Keep secret keys secure** (never commit to git)

## Integration with Callback

The webhook works alongside the callback page:

```
User completes payment on Kashier
         │
         ├─────> Webhook (server-to-server) ✓ Primary
         │       └─> Updates wallet
         │
         └─────> Callback (user redirect) ✓ Backup UX
                 └─> Shows success message
                 └─> Calls RPC (idempotent, safe if webhook already ran)
```

**Result**: 100% reliability even if user closes browser

## Support

For webhook issues:
1. Check function logs: `supabase functions logs kashier-webhook`
2. Verify signature validation
3. Check transaction in database
4. Contact Kashier support if needed

## References

- [Kashier API Documentation](https://developers.kashier.io/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [HMAC-SHA256 Specification](https://en.wikipedia.org/wiki/HMAC)

