# SaleMate Supabase Backend

Complete backend implementation for the SaleMate real estate platform using Supabase.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase CLI: `npm install -g supabase`

### Local Development

1. **Start Supabase locally**
   ```bash
   supabase start
   ```

2. **Reset database (applies migrations + seeds)**
   ```bash
   supabase db reset
   ```

3. **Serve Edge Functions locally**
   ```bash
   # Payment webhook function
   supabase functions serve payment_webhook --env-file supabase/env.example
   
   # Assign leads function
   supabase functions serve assign_leads --env-file supabase/env.example
   
   # Analytics function
   supabase functions serve recalc_analytics --env-file supabase/env.example
   ```

4. **Test the setup**
   ```bash
   # Test RPC functions
   curl -X POST "http://localhost:54321/rest/v1/rpc/rpc_leads_stats" \
     -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
     -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
     -H "Content-Type: application/json" \
     -d '{"for_user": "00000000-0000-0000-0000-000000000000"}'
   ```

## 🏗️ Architecture

### Database Schema
- **Authentication**: Supabase Auth with email OTP
- **Profiles**: User management with role-based access
- **Projects**: Real estate projects with available leads
- **Leads**: Customer leads linked to projects
- **Orders**: Lead purchase orders with payment tracking
- **Support**: Ticket-based support system
- **Partners**: Partnership program with commissions
- **Community**: Posts and comments system

### Security Features
- **Row Level Security (RLS)**: Granular access control
- **Role-based Access**: Admin, Manager, Support, User roles
- **Team Management**: Manager hierarchy with team access
- **Secure RPCs**: Business logic functions with proper validation

### Edge Functions
- **Payment Webhook**: Handles payment confirmations
- **Lead Assignment**: Bulk lead management
- **Analytics**: Automated reporting and metrics

## 📁 Project Structure

```
supabase/
├── migrations/           # Database schema migrations
│   └── 0001_init.sql   # Complete database setup
├── functions/           # Edge Functions (TypeScript)
│   ├── payment_webhook/ # Payment confirmation webhook
│   ├── assign_leads/    # Bulk lead management
│   └── recalc_analytics/# Analytics refresh
├── types/               # Generated TypeScript types
│   └── database.types.ts
├── seed/                # Database seed data
│   └── seed.sql        # Sample data for development
├── config.toml          # Supabase configuration
├── deploy.sh            # Deployment script
├── env.example          # Environment variables template
└── README.md            # This file
```

## 🔧 Configuration

### Environment Variables
Copy `env.example` to `.env.local` and configure:

```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Payment Webhook Secret (for production)
PAYMENT_WEBHOOK_SECRET=your_webhook_secret

# Storage Configuration
STORAGE_BUCKET=partners-logos
STORAGE_REGION=us-east-1
```

### Frontend Integration
The frontend client is available at `src/lib/supabaseClient.ts` with helper functions for:
- User authentication and profiles
- Lead management
- Order processing
- Support system
- Community features

## 🚀 Deployment

### Quick Deploy
Use the provided deployment script:

```bash
# Make script executable
chmod +x supabase/deploy.sh

# Deploy to your project
./supabase/deploy.sh <your-project-ref>
```

### Manual Deployment

1. **Link your project**
   ```bash
   supabase link --project-ref your-project-ref
   ```

2. **Deploy database changes**
   ```bash
   supabase db push
   ```

3. **Deploy Edge Functions**
   ```bash
   supabase functions deploy payment_webhook
   supabase functions deploy assign_leads
   supabase functions deploy recalc_analytics
   ```

4. **Set up cron jobs**
   ```bash
   # Analytics refresh (nightly at 2 AM)
   supabase functions deploy recalc_analytics --no-verify-jwt
   ```

## 🧪 Testing

### Test RPC Functions

```bash
# Start order
curl -X POST "http://localhost:54321/rest/v1/rpc/rpc_start_order" \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-uuid",
    "project_id": "project-uuid", 
    "quantity": 50,
    "payment_method": "Instapay"
  }'

# Get team user IDs
curl -X POST "http://localhost:54321/rest/v1/rpc/rpc_team_user_ids" \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"manager_id": "manager-uuid"}'
```

### Test Edge Functions

```bash
# Payment webhook (local)
curl -X POST "http://localhost:5433/functions/v1/payment_webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "order-uuid",
    "payment_reference": "PAY-123456",
    "signature": "fake-signature"
  }'

# Assign leads (local)
curl -X POST "http://localhost:5433/functions/v1/assign_leads" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "bulk_assign",
    "to_user_id": "user-uuid",
    "quantity": 25,
    "filters": {
      "project_id": "project-uuid",
      "platform": "Facebook"
    }
  }'
```

## 🔐 Authentication Flow

1. **User signs up** → Trigger creates profile with 'user' role
2. **User logs in** → JWT token with user claims
3. **Role-based access** → RLS policies enforce permissions
4. **Team access** → Managers can access team member data

## 💳 Payment Flow

1. **User starts order** → `rpc_start_order` creates pending order
2. **Payment processing** → External payment gateway
3. **Webhook received** → `payment_webhook` Edge Function
4. **Order confirmed** → `rpc_confirm_order` assigns leads
5. **Leads appear in CRM** → User can now manage leads

## 📊 Analytics & Reporting

- **Real-time metrics** via RPC functions
- **Automated nightly refresh** of materialized views
- **Role-based access** to analytics data
- **Team performance** tracking for managers

## 🛡️ Security Features

- **Row Level Security** on all tables
- **JWT validation** for all authenticated requests
- **Role-based permissions** with granular control
- **Input validation** in RPC functions
- **SQL injection protection** via parameterized queries

## 🔄 Database Migrations

All schema changes are versioned and can be applied incrementally:

```bash
# Apply specific migration
supabase db push --include-all

# Reset to clean state
supabase db reset

# Generate types after schema changes
supabase gen types typescript --local > types/database.types.ts
```

## 📈 Monitoring & Logs

- **Supabase Dashboard** for real-time monitoring
- **Edge Function logs** for debugging
- **Database query performance** insights
- **Authentication events** tracking

## 🆘 Troubleshooting

### Common Issues

1. **RLS policies not working**
   - Check `auth.uid()` is properly set
   - Verify user role in profiles table
   - Test with different user accounts

2. **Edge Functions not deploying**
   - Ensure TypeScript compilation succeeds
   - Check function dependencies
   - Verify environment variables

3. **Database connection issues**
   - Verify Supabase is running locally
   - Check connection strings
   - Restart Supabase: `supabase stop && supabase start`

### Getting Help

- Check Supabase documentation: https://supabase.com/docs
- Review RLS policies in migrations
- Test with different user roles
- Check Edge Function logs

## 🔑 Default Users

After running `supabase db reset`, you'll have these test users:

| Email | Password | Role | Description |
|-------|----------|------|-------------|
| admin@salemate.com | admin123 | Admin | Full system access |
| support@salemate.com | support123 | Support | Support and admin functions |
| manager@salemate.com | manager123 | Manager | Team management |
| user1@salemate.com | user123 | User | Regular user (John Doe) |
| user2@salemate.com | user123 | User | Regular user (Jane Smith) |

## 📝 License

This backend implementation is part of the SaleMate platform.
