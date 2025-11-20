# Performance Program - Commission Setup Complete ✅

## Summary

Successfully configured default commission schemes for all projects across all Coldwell Banker franchises.

## Configuration Details

### Commission Schemes Created
- **Total Schemes**: 13,421
- **Franchises Covered**: 22 (all Coldwell Banker franchises)
- **Projects Covered**: 611 (all unique projects from salemate-inventory)

### Default Settings
- **Commission Rate**: 3.5% per transaction
- **Payout Timeframe**: 3 months after contract
- **Coverage**: Universal (all franchises × all projects)

## How It Works

### Automatic Commission Calculation
When a transaction is added, the system automatically:

1. **Calculates Commission Amount**
   ```
   Commission = Transaction Amount × 3.5%
   ```

2. **Determines Payout Date**
   ```
   Expected Payout Date = Contract Date + 3 months
   ```

3. **Tracks Deal Stages**
   - EOI (Expression of Interest)
   - Reservation
   - Contracted
   - Cancelled

### Database Trigger
A PostgreSQL trigger (`calculate_transaction_commission`) runs on every transaction INSERT/UPDATE:
- Fetches commission rate from `performance_commission_schemes`
- Calculates `commission_amount` automatically
- Sets `expected_payout_date` when stage changes to "contracted"
- Updates `contracted_at` timestamp

## Example Transaction Flow

### Step 1: Add Transaction
```
Transaction Amount: EGP 5,000,000
Project: Hacienda Bay (Palm Hills)
Stage: EOI
```

### Step 2: Auto-Calculation
```
Commission Amount: EGP 175,000 (3.5% of 5M)
Expected Payout: NULL (not contracted yet)
```

### Step 3: Update to Contracted
```
Stage: Contracted
Contracted At: 2025-11-18
Expected Payout Date: 2026-02-18 (3 months later)
```

## Commission Breakdown per Million

| Transaction Amount | Commission (3.5%) |
|-------------------|-------------------|
| EGP 1,000,000     | EGP 35,000       |
| EGP 2,000,000     | EGP 70,000       |
| EGP 3,000,000     | EGP 105,000      |
| EGP 5,000,000     | EGP 175,000      |
| EGP 10,000,000    | EGP 350,000      |

## Future Enhancements

### Phase 1 (Current) ✅
- [x] Default 3.5% commission for all projects
- [x] Automatic commission calculation
- [x] 3-month payout timeframe

### Phase 2 (Planned)
- [ ] Custom commission rates per project
- [ ] Variable payout timeframes per developer
- [ ] Commission scheme management UI
- [ ] Bulk commission updates

### Phase 3 (Advanced)
- [ ] Commission tiers based on volume
- [ ] Multi-level commission cuts (agent, team leader, director, etc.)
- [ ] Dynamic commission adjustments
- [ ] Historical commission rate tracking

## Testing

To test the commission calculation:

1. Navigate to any franchise dashboard:
   ```
   http://performance.localhost:5173/franchise/meeting-point
   ```

2. Click "Add Transaction"

3. Fill in details:
   - **Project**: Select from dropdown (608 projects available)
   - **Transaction Amount**: e.g., 5,000,000
   - **Stage**: EOI, Reservation, or Contracted

4. Submit and verify:
   - Transaction appears in list
   - Commission is automatically calculated (EGP 175,000 for 5M)
   - If contracted, payout date is set 3 months out

## Database Queries

### View Commission Schemes
```sql
SELECT 
  pf.name as franchise,
  COUNT(*) as projects_configured,
  AVG(pcs.commission_rate) as avg_commission_rate
FROM performance_commission_schemes pcs
JOIN performance_franchises pf ON pf.id = pcs.franchise_id
GROUP BY pf.name
ORDER BY pf.name;
```

### Check Transaction Commission Calculation
```sql
SELECT 
  pt.transaction_amount,
  pt.commission_amount,
  pt.stage,
  pt.contracted_at,
  pt.expected_payout_date
FROM performance_transactions pt
ORDER BY pt.created_at DESC
LIMIT 10;
```

## Status

✅ **Commission setup complete and operational**

All transactions will now automatically calculate:
- Commission amounts (3.5% rate)
- Expected payout dates (3 months after contract)

---

*Last Updated: November 18, 2025*

