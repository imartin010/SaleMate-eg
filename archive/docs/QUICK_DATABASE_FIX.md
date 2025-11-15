# Quick Database Fix for SaleMate

## 🚨 **Immediate Fix Required**

The app is showing "Page failed to load" errors because database views are missing. Follow these steps:

### **Step 1: Run Database Setup**

1. **Open Supabase Dashboard** → Go to your project
2. **Navigate to SQL Editor**
3. **Copy and paste** the contents of `fix_missing_database_views.sql`
4. **Click "Run"** to execute the script

### **Step 2: Alternative Quick Fix**

If you can't access Supabase right now, the app will fall back to mock data, but you'll need to run this SQL eventually:

```sql
-- Create missing views
CREATE OR REPLACE VIEW public.lead_availability AS
SELECT
  p.id AS project_id,
  p.name,
  p.developer,
  p.region,
  p.description,
  COUNT(l.*) FILTER (WHERE l.buyer_user_id IS NULL) AS available_leads,
  COALESCE(p.price_per_lead, 125.00) as current_cpl
FROM public.projects p
LEFT JOIN public.leads l ON l.project_id = p.id
GROUP BY p.id, p.name, p.developer, p.region, p.description, p.price_per_lead;

CREATE OR REPLACE VIEW public.partner_commissions_view AS
SELECT p.* FROM public.partners p;
```

### **Step 3: Restart Development Server**

After running the database script:
1. Stop the dev server (Ctrl+C)
2. Run `npm run dev` again
3. Test the pages

## ✅ **What Was Fixed**

1. **Select Components** - Fixed empty string values causing React errors
2. **Database Fallbacks** - Added graceful fallbacks when views don't exist
3. **Error Boundaries** - Better error handling for page failures
4. **Navigation Routes** - Fixed all sidebar links to use correct `/app/*` paths

## 🔧 **Files Modified**

- `src/pages/Shop/Shop.tsx` - Fixed Select components and added database fallbacks
- `src/app/layout/Sidebar.tsx` - Fixed navigation links
- `src/app/layout/BottomNav.tsx` - Fixed navigation links  
- `src/pages/Auth/Login.tsx` - Fixed login redirect
- `src/components/common/PageErrorBoundary.tsx` - New error boundary
- `fix_missing_database_views.sql` - Database setup script

## 🎯 **Expected Result**

After running the database script, all pages should load correctly:
- ✅ Shop page shows projects
- ✅ CRM page shows leads  
- ✅ Deals page loads properly
- ✅ Partners page shows commission data
- ✅ Navigation works without redirects to home page
