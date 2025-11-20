# Performance System - Seed Data Guide

## Overview

This migration seeds realistic performance data for all Coldwell Banker franchises with:
- **Realistic expenses** based on franchise size
- **Transaction data** with varied commission rates and payout periods
- **Data for October and November 2024** for trend analysis

## Data Specifications

### Expenses (Per Franchise)

#### Fixed Expenses
- **Rent**: `headcount × 5 meters × 750 EGP/meter`
  - Small franchise (15 agents): 56,250 EGP/month
  - Medium franchise (25 agents): 93,750 EGP/month
  - Large franchise (50 agents): 187,500 EGP/month

#### Variable Expenses
- **Phone Bills**: `700 EGP per agent`
- **Other Expenses**: `1,000 EGP per agent` (utilities, supplies, etc.)
- **Marketing**: 
  - < 20 agents: 15,000 EGP
  - 20-34 agents: 25,000 EGP
  - 35-49 agents: 40,000 EGP
  - 50+ agents: 60,000 EGP

### Transactions

#### Sales Volume
- **Average**: 3.5M EGP per agent per month
- **Implementation**: 2 deals per agent
- **Deal Size**: 800K - 3M EGP (average ~1.75M per deal)

#### Commission Rates (Varied by Developer)
- **3.5%**: 60% of transactions (most common)
- **4.0%**: 30% of transactions (premium developers)
- **3.0%**: 10% of transactions (standard developers)

#### Payout Periods (Varied by Developer)
- **3 months**: 60% of transactions
- **6 months**: 40% of transactions

#### Deal Stages
- **Contracted**: 70% (revenue-generating)
- **Reservation**: 20% (pipeline)
- **EOI**: 5% (early stage)
- **Cancelled**: 5% (lost deals)

### Commission Cuts (Per Million in Sales)
- **Sales Agent**: 8,000 EGP
- **Team Leader**: 2,500 EGP
- **Sales Director**: 1,500 EGP
- **Head of Sales**: 750 EGP
- **Royalty**: 10,000 EGP

## Data Generated

### November 2024 (Full Month)
- Complete transaction data for all active franchises
- All expense categories
- Varied commission rates and payout periods

### October 2024 (Historical Comparison)
- 80% of November volume (for trend analysis)
- Same expense structure
- Slightly lower conversion rates (65% vs 70%)

## Running the Migration

### Option 1: Using Supabase MCP Tools

```bash
# The migration is already in the migrations folder
# It will be applied automatically with other migrations
```

### Option 2: Using SQL Editor in Supabase Dashboard

1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/20251119000000_seed_performance_data.sql`
4. Paste and run

### Option 3: Using Supabase CLI

```bash
supabase db push
```

## Expected Results

After running this migration, you should see:

### Per Franchise (Example: 25 agents)
- **Transactions**: ~50 deals (40 average)
- **Contracted Deals**: ~28-35 deals
- **Monthly Expenses**: ~125,000 - 150,000 EGP
  - Rent: 93,750 EGP
  - Phone: 17,500 EGP
  - Other: 25,000 EGP
  - Marketing: 25,000 EGP
- **Monthly Revenue**: ~87,500 - 122,500 EGP (3.5M × 25 × 3.5% average rate)
- **Expected Profit Margin**: 10-20% (varies by efficiency)

### All Franchises Combined
- **22 active franchises**
- **~1,000+ transactions** total
- **~88 expense records** (4 per franchise per month × 2 months)
- **Commission schemes** for all franchise-project combinations

## Verification Queries

After seeding, verify the data:

```sql
-- Check franchise data
SELECT 
  f.name,
  f.headcount,
  COUNT(DISTINCT t.id) as total_transactions,
  COUNT(DISTINCT CASE WHEN t.stage = 'contracted' THEN t.id END) as contracted_deals,
  SUM(CASE WHEN t.stage = 'contracted' THEN t.commission_amount ELSE 0 END) as revenue,
  SUM(e.amount) as expenses
FROM performance_franchises f
LEFT JOIN performance_transactions t ON f.id = t.franchise_id
LEFT JOIN performance_expenses e ON f.id = e.franchise_id
WHERE f.is_active = true
GROUP BY f.id, f.name, f.headcount
ORDER BY f.headcount DESC;

-- Check commission rates distribution
SELECT 
  commission_rate,
  COUNT(*) as scheme_count,
  COUNT(DISTINCT franchise_id) as franchises_using
FROM performance_commission_schemes
GROUP BY commission_rate
ORDER BY commission_rate;

-- Check payout periods distribution
SELECT 
  developer_payout_months as months,
  COUNT(*) as scheme_count
FROM performance_commission_schemes
GROUP BY developer_payout_months
ORDER BY developer_payout_months;
```

## What Makes Each Franchise Different

1. **Size**: Headcount ranges from 15 to 62 agents
2. **Rent**: Proportional to size (5m² × 750 EGP/m² per agent)
3. **Transaction Volume**: Proportional to agent count
4. **Deal Mix**: Random distribution of commission rates and payout periods
5. **Performance**: Natural variation in conversion rates and deal sizes

## Benefits for Testing

- **Comparison Feature**: Compare franchises of different sizes
- **Time Frame Analysis**: Monthly and quarterly trends
- **Break-Even Analysis**: See which franchises are profitable
- **Cashflow Forecasting**: Different payout periods create varied cashflow
- **P&L Statements**: Realistic revenue and expense breakdowns
- **AI Insights**: Enough data for meaningful recommendations

## Notes

- All dates use November 2024 as the primary month
- October 2024 data is included for historical comparison
- Transaction amounts are randomized within realistic ranges
- Each franchise gets a unique mix of commission rates and payout periods
- The database trigger `calculate_transaction_commission` automatically calculates commission amounts and payout dates

