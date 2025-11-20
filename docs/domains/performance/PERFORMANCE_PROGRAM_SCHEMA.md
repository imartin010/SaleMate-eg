# Salemate Performance - Database Schema Design

## Overview
Minimal table design for B2B brokerage franchise financial management system.

## Tables

### 1. `performance_franchises`
Stores franchise information for Coldwell Banker branches.

```sql
- id (uuid, primary key)
- name (text) - e.g., "Meeting Point", "Infinity", etc.
- slug (text, unique) - URL-friendly identifier
- owner_user_id (uuid) - References auth.users
- headcount (integer) - Number of agents/employees
- created_at (timestamp)
- updated_at (timestamp)
- is_active (boolean)
```

### 2. `performance_commission_schemes`
Commission rates per project/developer for each franchise.
Links to `salemate_inventory` for project/developer data.

```sql
- id (uuid, primary key)
- franchise_id (uuid) - References performance_franchises
- project_id (uuid) - References salemate_inventory.id
- commission_rate (decimal) - Percentage (e.g., 2.5 for 2.5%)
- developer_payout_months (integer) - Months until commission payout (e.g., 3)
- created_at (timestamp)
- updated_at (timestamp)
- UNIQUE(franchise_id, project_id)
```

### 3. `performance_transactions`
Sales transactions with deal cycle tracking.

```sql
- id (uuid, primary key)
- franchise_id (uuid) - References performance_franchises
- project_id (uuid) - References salemate_inventory.id
- transaction_amount (decimal) - Sale amount in EGP
- stage (text) - 'eoi', 'reservation', 'contracted', 'cancelled'
- stage_updated_at (timestamp) - When stage last changed
- contracted_at (timestamp) - When deal was contracted (for payout calculation)
- expected_payout_date (timestamp) - Calculated based on contracted_at + payout_months
- commission_amount (decimal) - Calculated commission
- notes (text)
- created_by (uuid) - References auth.users
- created_at (timestamp)
- updated_at (timestamp)
```

### 4. `performance_expenses`
Fixed and variable expenses per franchise.

```sql
- id (uuid, primary key)
- franchise_id (uuid) - References performance_franchises
- expense_type (text) - 'fixed' or 'variable'
- category (text) - 'rent', 'salaries', 'marketing', 'phone_bills', 'other'
- description (text)
- amount (decimal) - Monthly amount in EGP
- date (date) - Expense date/month
- created_at (timestamp)
- updated_at (timestamp)
```

### 5. `performance_commission_cuts`
Commission cuts per million in sales (agent, team leader, director, etc.).

```sql
- id (uuid, primary key)
- franchise_id (uuid) - References performance_franchises
- role (text) - 'sales_agent', 'team_leader', 'sales_director', 'head_of_sales', 'royalty'
- cut_per_million (decimal) - Amount in EGP per million in sales
- created_at (timestamp)
- updated_at (timestamp)
- UNIQUE(franchise_id, role)
```

## Key Relationships

1. **Franchises** are the core entity
2. **Commission Schemes** define rates per project (fetches project/developer from `salemate_inventory`)
3. **Transactions** track sales with stages and calculate expected payouts
4. **Expenses** track all costs (fixed + variable)
5. **Commission Cuts** define role-based cuts per million

## Calculations

### Gross Revenue
Sum of all `contracted` transactions' commission_amount for a franchise.

### Expected Revenue Timeline
Group transactions by `expected_payout_date` to show when commissions will be collected.

### Total Expenses
Sum of all expenses + calculated commission cuts based on total sales volume.

### Commission Cuts Calculation
```
total_sales_volume = sum(transaction_amount) for contracted deals
millions = total_sales_volume / 1,000,000
for each role:
  cut_expense = cut_per_million * millions
```

### Net Revenue
```
net_revenue = gross_revenue - total_expenses - total_commission_cuts
```

### Cost Per Agent
```
cost_per_agent = total_expenses / headcount
```

### Breakeven Point
```
breakeven_commission_needed = total_monthly_expenses / average_commission_rate
breakeven_sales_volume = breakeven_commission_needed / average_commission_rate
```

## Initial Data

### Coldwell Banker Franchises
- Meeting Point
- Infinity
- Peak
- Elite
- Legacy
- Empire
- Advantage
- Core
- Gate
- Rangers
- Ninety
- TM
- Winners
- Trust
- Stellar
- Skyward
- Hills
- Wealth
- New Alex
- Platinum
- Hub
- Experts

