# Wallet and Lead Request System Setup Guide

This guide explains how to set up the complete wallet and lead request system for SaleMate.

## 🗄️ Database Setup

### 1. Run the Database Schema
Execute the SQL script to create all necessary tables and functions:

```sql
-- Run this in your Supabase SQL editor
\i create_wallet_and_lead_request_system.sql
```

This creates:
- `user_wallets` - User wallet balances
- `wallet_transactions` - Transaction history
- `lead_requests` - Lead request submissions
- Views for easy data access
- RLS policies for security
- Functions for wallet operations

### 2. Verify Tables Created
Check that all tables exist in your Supabase dashboard:
- user_wallets
- wallet_transactions  
- lead_requests
- user_wallet_summary (view)
- lead_request_details (view)

## 🎨 Frontend Components

### 1. Wallet System
- **WalletContext** (`src/contexts/WalletContext.tsx`) - Global wallet state management
- **WalletDisplay** (`src/components/wallet/WalletDisplay.tsx`) - Wallet balance and add money UI

### 2. Lead Request System
- **LeadRequestDialog** (`src/components/leads/LeadRequestDialog.tsx`) - Request leads popup
- **LeadRequestManagement** (`src/components/admin/LeadRequestManagement.tsx`) - Admin panel

### 3. Updated Project Cards
- **ImprovedProjectCard** - Now shows "Request Leads" when sold out
- Integrated with wallet system for payment

## 🔧 Integration Steps

### 1. Add WalletProvider to App
The WalletProvider is already added to `src/main.tsx`:

```tsx
<WalletProvider>
  <RouterProvider router={router} />
</WalletProvider>
```

### 2. Add Wallet Display to Shop
The wallet display is already added to the shop page (`src/pages/Shop/ImprovedShop.tsx`).

### 3. Add Admin Panel (Optional)
Add the lead request management to your admin panel:

```tsx
import { LeadRequestManagement } from '../components/admin/LeadRequestManagement';

// In your admin component
<LeadRequestManagement />
```

## 🚀 Features

### For Users:
1. **Wallet System**
   - View current balance
   - Add money to wallet
   - Automatic wallet creation on signup

2. **Lead Requests**
   - Request leads when projects are sold out
   - Pay from wallet balance
   - Add notes to requests
   - Track request status

### For Admins:
1. **Lead Request Management**
   - View all lead requests
   - Approve/reject requests
   - Add admin notes
   - Track payment status

## 🔒 Security Features

1. **Row Level Security (RLS)**
   - Users can only see their own wallets and requests
   - Admins can see all data
   - Secure function access

2. **Transaction Integrity**
   - Atomic wallet operations
   - Balance validation
   - Transaction history tracking

## 📱 User Flow

### When Project Has Leads:
1. User clicks "Buy Leads"
2. Selects quantity
3. Proceeds to checkout
4. Pays via payment methods

### When Project is Sold Out:
1. User clicks "Request Leads"
2. Opens lead request dialog
3. User adds money to wallet if needed
4. Selects quantity and adds notes
5. Submits request (money deducted from wallet)
6. Admin reviews and approves/rejects
7. User gets notified of status

## 🛠️ API Functions

### Wallet Functions:
- `get_user_wallet_balance(user_id)` - Get current balance
- `add_to_wallet(user_id, amount, description)` - Add money
- `update_wallet_balance(user_id, amount, type, description, reference_id)` - Update balance

### Lead Request Functions:
- `create_lead_request(user_id, project_id, quantity, price_per_lead, notes)` - Create request

## 🎯 Testing

### Test Wallet System:
1. Create a new user account
2. Check wallet is automatically created with 0 balance
3. Add money to wallet
4. Verify balance updates

### Test Lead Request System:
1. Find a project with 0 available leads
2. Click "Request Leads"
3. Add money to wallet if needed
4. Submit a lead request
5. Check admin panel for the request

## 🔧 Troubleshooting

### Common Issues:

1. **Wallet not created automatically**
   - Check if trigger is created: `on_auth_user_created`
   - Verify RLS policies are enabled

2. **Permission denied errors**
   - Check RLS policies
   - Verify user has correct role in user_profiles

3. **Functions not found**
   - Run the SQL script completely
   - Check function permissions

### Debug Steps:
1. Check Supabase logs for errors
2. Verify all tables exist
3. Test functions in Supabase SQL editor
4. Check browser console for frontend errors

## 📊 Database Schema Overview

```
user_wallets
├── id (UUID, PK)
├── user_id (UUID, FK to auth.users)
├── balance (DECIMAL)
├── currency (VARCHAR)
└── timestamps

wallet_transactions
├── id (UUID, PK)
├── wallet_id (UUID, FK)
├── user_id (UUID, FK)
├── type (deposit/withdrawal/payment/refund/lead_request)
├── amount (DECIMAL)
├── description (TEXT)
├── reference_id (UUID)
└── timestamps

lead_requests
├── id (UUID, PK)
├── user_id (UUID, FK)
├── project_id (UUID, FK)
├── requested_quantity (INTEGER)
├── price_per_lead (DECIMAL)
├── total_amount (DECIMAL)
├── status (pending/approved/rejected/fulfilled/cancelled)
├── payment_status (pending/paid/refunded)
├── user_notes (TEXT)
├── admin_notes (TEXT)
└── timestamps
```

## ✅ Success Checklist

- [ ] Database schema created successfully
- [ ] All tables and functions exist
- [ ] RLS policies are active
- [ ] WalletProvider is integrated
- [ ] Wallet display shows in shop
- [ ] Project cards show "Request Leads" when sold out
- [ ] Lead request dialog works
- [ ] Admin panel can manage requests
- [ ] Users can add money to wallet
- [ ] Lead requests deduct from wallet
- [ ] All security policies working

The system is now ready for production use! 🎉
