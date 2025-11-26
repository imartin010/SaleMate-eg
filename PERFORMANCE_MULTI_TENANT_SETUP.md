# Performance Program - Multi-Tenant Setup

## Overview

The Performance Program now supports multi-tenant franchise management with complete data isolation:

- **CEO Account**: Views all franchises and aggregated data
- **Franchise Employee Accounts**: Each franchise has one employee who manages their own data
- **Data Isolation**: RLS policies ensure franchises cannot see each other's data

## System Architecture

### User Roles

1. **CEO** (`ceo`): 
   - View all franchises
   - Access CEO Dashboard with aggregated metrics
   - Can drill down into individual franchises
   
2. **Franchise Employee** (`franchise_employee`):
   - Manage their own franchise only
   - Add/edit transactions, expenses, and settings
   - Cannot view other franchises

3. **Admin** (`admin`):
   - Full system access (existing role)
   - Can manage all franchises

### Database Structure

#### Roles
- Added `ceo` and `franchise_employee` to profiles.role enum
- RLS policies updated to grant CEO same permissions as admin for performance tables

#### Franchises
- Each franchise linked to one user via `owner_user_id`
- 22 Coldwell Banker franchises with individual employee accounts

## User Accounts

### CEO Account
```
Email: ceo@coldwellbanker.com
Password: CWB_CEO_2024
Role: ceo
```

### Franchise Employee Accounts

Pattern: `{franchise-slug}@coldwellbanker.com`
Password: `CWB2024` (all franchises)

**All 22 Franchise Accounts**:
```
meeting-point@coldwellbanker.com
infinity@coldwellbanker.com
peak@coldwellbanker.com
elite@coldwellbanker.com
legacy@coldwellbanker.com
empire@coldwellbanker.com
advantage@coldwellbanker.com
core@coldwellbanker.com
gate@coldwellbanker.com
rangers@coldwellbanker.com
ninety@coldwellbanker.com
tm@coldwellbanker.com
winners@coldwellbanker.com
trust@coldwellbanker.com
stellar@coldwellbanker.com
skyward@coldwellbanker.com
hills@coldwellbanker.com
wealth@coldwellbanker.com
new-alex@coldwellbanker.com
platinum@coldwellbanker.com
hub@coldwellbanker.com
experts@coldwellbanker.com
```

## How It Works

### For CEO

1. Login at: `http://performance.localhost:5173/auth/login`
2. Use credentials: `ceo@coldwellbanker.com` / `CWB_CEO_2024`
3. Automatically redirected to CEO Dashboard
4. View all 22 franchises with aggregated metrics
5. Click on any franchise to drill down into details

### For Franchise Employees

1. Login at: `http://performance.localhost:5173/auth/login`
2. Use franchise-specific credentials (e.g., `meeting-point@coldwellbanker.com` / `CWB2024`)
3. Automatically redirected to their franchise dashboard
4. Can only view and manage their own franchise data
5. Cannot access other franchises (blocked by RLS and route guards)

### Data Isolation

**Database Level (RLS Policies)**:
- Franchise employees' queries automatically filtered to their franchise
- CEO queries return all data
- Enforced at PostgreSQL level - impossible to bypass

**Application Level (Route Guards)**:
- `PerformanceRoleGuard`: Checks user role and redirects appropriately
- `FranchiseOwnerGuard`: Verifies franchise ownership before rendering
- `PerformanceDashboardRouter`: Routes users to correct dashboard on login

## Daily Workflow

### Franchise Employee Daily Tasks

1. **Add Transactions**:
   - Navigate to "Transactions" tab
   - Click "Add Transaction"
   - Enter transaction details (project, amount, stage)
   - Commission automatically calculated

2. **Add Expenses**:
   - Navigate to "Expenses" tab
   - Click "Add Expense"
   - Categorize as Fixed or Variable
   - Enter amount and description

3. **Update Settings**:
   - Navigate to "Settings" tab
   - Update headcount if agents join/leave
   - Update franchise status if needed

4. **View Performance**:
   - "Overview" tab shows key metrics
   - "P&L Statement" shows financial overview
   - AI Insights provide recommendations

### CEO Daily Review

1. **View All Franchises**:
   - CEO Dashboard shows all 22 franchises
   - Aggregated metrics: Total revenue, agents, franchises

2. **Compare Performance**:
   - Click "Compare Franchises" button
   - See side-by-side comparison

3. **Drill Down**:
   - Click on any franchise card
   - View detailed performance, transactions, expenses
   - Access all franchise data

## Security Features

### Data Isolation
- RLS policies at database level
- Franchise A cannot query franchise B's data
- Enforced by PostgreSQL, not application code

### Access Control
- Route guards prevent unauthorized navigation
- CEO can view all, franchises can view only theirs
- Settings tab only editable by franchise owner or CEO

### Audit Trail
- All transactions track `created_by` user
- Timestamps on all data modifications
- Can see who made changes

## Migrations

Three migrations created:

1. `20251126125738_add_ceo_franchise_employee_roles.sql`
   - Adds CEO and franchise_employee roles to profiles

2. `20251126125800_update_performance_rls_for_ceo.sql`
   - Updates all performance table RLS policies for CEO access

3. `20251126125900_create_franchise_employees_and_ceo.sql`
   - Creates CEO account
   - Creates 22 franchise employee accounts
   - Links employees to franchises

**To apply migrations**:
```bash
# Via Supabase CLI
supabase db push

# Or via MCP tools
# Use the database MCP connection to run these migrations
```

## Testing Checklist

### Test CEO Access
- [ ] Login as CEO
- [ ] Verify all 22 franchises visible
- [ ] Click on each franchise
- [ ] Add transaction to franchise A
- [ ] Verify transaction appears in franchise A's dashboard
- [ ] Compare franchises feature works

### Test Franchise Employee Access
- [ ] Login as meeting-point@coldwellbanker.com
- [ ] Verify only "Meeting Point" franchise visible
- [ ] Try to navigate to /franchise/infinity (should redirect)
- [ ] Add transaction - verify it saves
- [ ] Add expense - verify it saves
- [ ] Update settings - verify it saves
- [ ] Logout and login as different franchise
- [ ] Verify previous franchise's data NOT visible

### Test Data Isolation
- [ ] Login as franchise A employee
- [ ] Add 5 transactions
- [ ] Logout and login as franchise B employee
- [ ] Verify franchise B sees 0 transactions (not franchise A's)
- [ ] Login as CEO
- [ ] Verify CEO sees transactions from both franchises

## Technical Implementation

### Frontend Components

- **FranchiseContext** (`src/contexts/FranchiseContext.tsx`): Manages user's franchise and role
- **PerformanceRoleGuard** (`src/components/auth/PerformanceRoleGuard.tsx`): Route protection
- **FranchiseOwnerGuard** (`src/components/auth/PerformanceRoleGuard.tsx`): Franchise ownership verification
- **PerformanceDashboardRouter** (`src/pages/Performance/PerformanceDashboardRouter.tsx`): Auto-routes based on role

### Routes Updated

- `/`: Auto-routes to appropriate dashboard
- `/dashboard`: CEO Dashboard (CEO/admin only)
- `/franchise/:slug`: Franchise Dashboard (owner or CEO/admin)
- `/admin`: Admin Panel (CEO/admin only)

### Hooks

The existing hooks in `src/hooks/performance/usePerformanceData.ts` work correctly:
- RLS policies handle data filtering automatically
- No changes needed to hooks - database enforces isolation

## Troubleshooting

### Franchise employee sees no franchises
- Check `owner_user_id` is set in `performance_franchises` table
- Run migration #3 to link users to franchises

### CEO sees no franchises
- Check role is set to 'ceo' in profiles table
- Verify RLS policies include 'ceo' role

### Cannot add transactions/expenses
- Verify user is linked to franchise
- Check RLS policies allow INSERT
- Verify franchise is active

## Future Enhancements

- Multiple employees per franchise (team system)
- Franchise admin + employees hierarchy
- More granular permissions (view-only employees)
- Franchise-to-franchise comparison for franchise employees
- Email notifications for daily task reminders
