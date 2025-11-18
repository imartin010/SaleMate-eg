# Salemate Performance - Setup Guide

## Overview

This is a comprehensive B2B franchise financial management system built for Coldwell Banker franchises. It tracks sales transactions, expenses, commission schemes, and provides detailed analytics for franchise owners and CEOs.

## Database Setup

### 1. Run Migrations

Execute the following migrations in order:

```bash
# Option 1: Via Supabase Dashboard (SQL Editor)
# Copy and paste each migration file from supabase/migrations/ in order:
# - 20251118115400_create_performance_franchises.sql
# - 20251118115500_create_performance_commission_schemes.sql
# - 20251118115600_create_performance_transactions.sql
# - 20251118115700_create_performance_expenses.sql
# - 20251118115800_create_performance_commission_cuts.sql
# - 20251118115900_seed_coldwell_banker_franchises.sql
```

### 2. Verify Tables

After running migrations, verify the following tables exist:
- `performance_franchises`
- `performance_commission_schemes`
- `performance_transactions`
- `performance_expenses`
- `performance_commission_cuts`

### 3. Verify Seed Data

Check that all 22 Coldwell Banker franchises were created:

```sql
SELECT * FROM performance_franchises ORDER BY name;
```

Expected franchises:
- Meeting Point, Infinity, Peak, Elite, Legacy, Empire, Advantage, Core, Gate, Rangers, Ninety, TM, Winners, Trust, Stellar, Skyward, Hills, Wealth, New Alex, Platinum, Hub, Experts

## Application Structure

### Frontend Architecture

```
src/
├── pages/Performance/
│   ├── PerformanceHome.tsx                  # CEO Dashboard (entry point)
│   ├── PerformanceCEODashboard.tsx          # Overview of all franchises
│   └── PerformanceFranchiseDashboard.tsx    # Individual franchise view
├── hooks/performance/
│   └── usePerformanceData.ts                # React Query hooks for data
├── types/
│   └── performance.ts                       # TypeScript types
└── app/routes/
    └── performanceRoutes.tsx                # Performance subdomain routing
```

### Routes

- `/` - CEO Dashboard (all franchises)
- `/franchise/:franchiseSlug` - Individual franchise dashboard (e.g., `/franchise/meeting-point`)

## Features

### CEO Dashboard Features

1. **Overview Cards**
   - Total franchises count
   - Active franchises count
   - Total headcount across all franchises
   - Combined revenue (coming soon)

2. **Franchise Grid**
   - Visual cards for each franchise
   - Quick metrics preview
   - Click to view detailed dashboard

### Franchise Dashboard Features

1. **Financial Overview**
   - Gross Revenue
   - Net Revenue (after expenses and commission cuts)
   - Total Expenses
   - Cost Per Agent

2. **Sales Metrics**
   - Total Sales Volume
   - Contracted Deals Count
   - Pending Deals (EOI + Reservation)
   - Cancelled Deals

3. **Expense Breakdown**
   - Fixed Expenses (rent, salaries)
   - Variable Expenses (marketing, phone bills, other)
   - Commission Cuts (calculated based on sales volume)

4. **Expected Payout Timeline**
   - Monthly breakdown of expected commission payouts
   - Based on developer payout timeframes
   - Shows deal count and amount per month

5. **AI Insights** (Placeholder)
   - Coming soon: AI-powered recommendations

## Commission System

### How It Works

1. **Commission Schemes**: Each franchise can have different commission rates for different projects
2. **Payout Timeframes**: Each developer has a specific payout period (e.g., 3 months after contract)
3. **Commission Cuts**: Per-million cuts for different roles:
   - Sales Agent
   - Team Leader
   - Sales Director
   - Head of Sales
   - Company Royalty

### Calculations

```typescript
// Gross Revenue
gross_revenue = sum(transaction.commission_amount) for contracted deals

// Commission Cuts
millions = total_sales_volume / 1,000,000
for each role:
  cut = role.cut_per_million * millions

// Net Revenue
net_revenue = gross_revenue - total_expenses - commission_cuts

// Cost Per Agent
cost_per_agent = total_expenses / headcount

// Expected Payout Date
expected_payout_date = contracted_at + developer_payout_months
```

## Data Flow

### Transaction Lifecycle

1. **EOI** (Expression of Interest) - Initial interest
2. **Reservation** - Deal reserved
3. **Contracted** - Deal signed (triggers commission calculation)
4. **Cancelled** - Deal cancelled

### Auto-Calculations

When a transaction is created or updated:
1. Commission amount is auto-calculated based on the commission scheme
2. Expected payout date is calculated when deal reaches "Contracted" stage
3. Analytics are updated in real-time

## Next Steps

### Immediate Implementation

1. **Transaction Management** (Priority 1)
   - Form to add new transactions
   - Ability to update transaction stage
   - Filter and search transactions

2. **Expense Management** (Priority 2)
   - Form to add expenses
   - Categorize as fixed/variable
   - Monthly expense tracking

3. **Commission Scheme Setup** (Priority 3)
   - Configure commission rates per project
   - Set developer payout timeframes
   - Bulk import from spreadsheet

4. **Commission Cuts Configuration** (Priority 4)
   - Set per-million cuts for each role
   - Per-franchise configuration

### Future Enhancements

1. **AI Insights**
   - Performance predictions
   - Cost optimization recommendations
   - Breakeven analysis

2. **Reports & Export**
   - PDF reports
   - Excel exports
   - Monthly/quarterly summaries

3. **Multi-User Access**
   - Assign franchise owners to their franchises
   - Role-based permissions
   - Invitation system

4. **Advanced Analytics**
   - Trend analysis
   - Comparative analytics (franchise vs franchise)
   - Forecasting

## Testing

### Manual Testing Steps

1. **Verify Database**
   ```sql
   SELECT * FROM performance_franchises LIMIT 5;
   ```

2. **Add Test Transaction**
   - Pick a franchise
   - Add a transaction with stage "contracted"
   - Verify commission is calculated
   - Check expected payout date

3. **Add Test Expenses**
   - Add fixed expense (e.g., rent)
   - Add variable expense (e.g., marketing)
   - Verify they appear in dashboard

4. **Check Analytics**
   - Open franchise dashboard
   - Verify all metrics calculate correctly
   - Check payout timeline

## Troubleshooting

### Common Issues

1. **Franchises not loading**
   - Check RLS policies
   - Verify user is authenticated
   - Check console for errors

2. **Analytics not calculating**
   - Verify transactions exist
   - Check commission schemes are configured
   - Verify expenses are entered

3. **Expected payouts not showing**
   - Verify transactions have "contracted" stage
   - Check commissioned_at timestamp
   - Verify developer_payout_months is set

## Support

For issues or questions, contact the development team or check the schema documentation in `PERFORMANCE_PROGRAM_SCHEMA.md`.

