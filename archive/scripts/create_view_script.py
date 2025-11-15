#!/usr/bin/env python3
"""
Create partner_commissions_view in Supabase
"""

import requests
import json

# Your Supabase configuration
SUPABASE_URL = "https://wkxbhvckmgrmdkdkhnqo.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndreGJodmNrbWdybWRrZGtobnFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0OTgzNTQsImV4cCI6MjA3MjA3NDM1NH0.Vg48-ld0anvU4OQJWf5ZlEqTKjXiHBK0A14fz0vGvU8"

def execute_sql(sql_content, description="SQL"):
    """Execute SQL via Supabase RPC"""
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'Content-Type': 'application/json'
    }
    
    # Use the RPC endpoint to execute raw SQL
    url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
    payload = {"sql": sql_content}
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        if response.status_code in [200, 201]:
            print(f"✅ {description}: Success")
            return True
        else:
            print(f"❌ {description}: Failed - {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print(f"❌ {description}: Error - {e}")
        return False

def create_partner_commissions_view():
    """Create the partner_commissions_view"""
    
    sql = """
-- Drop the view if it exists
DROP VIEW IF EXISTS public.partner_commissions_view;

-- Create the view for easier querying
CREATE VIEW public.partner_commissions_view AS
SELECT 
    p.*,
    (
        CASE WHEN p.salemate_commission IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN p.address_investments_commission IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN p.bold_routes_commission IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN p.nawy_partners_commission IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN p.coldwell_banker_commission IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN p.connect_homes_commission IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN p.view_investments_commission IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN p.y_network_commission IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN p.byit_commission IS NOT NULL THEN 1 ELSE 0 END
    ) as active_partners_count,
    
    GREATEST(
        COALESCE(p.salemate_commission, 0),
        COALESCE(p.address_investments_commission, 0),
        COALESCE(p.bold_routes_commission, 0),
        COALESCE(p.nawy_partners_commission, 0),
        COALESCE(p.coldwell_banker_commission, 0),
        COALESCE(p.connect_homes_commission, 0),
        COALESCE(p.view_investments_commission, 0),
        COALESCE(p.y_network_commission, 0),
        COALESCE(p.byit_commission, 0)
    ) as highest_commission_rate
    
FROM public.partners p;

-- Grant permissions to the view
GRANT SELECT ON public.partner_commissions_view TO authenticated;
GRANT SELECT ON public.partner_commissions_view TO anon;
"""
    
    return execute_sql(sql, "Create partner_commissions_view")

def verify_view():
    """Verify the view was created successfully"""
    
    sql = """
SELECT 'partner_commissions_view created successfully' as status;
SELECT COUNT(*) as total_records FROM public.partner_commissions_view;
"""
    
    return execute_sql(sql, "Verify partner_commissions_view")

def main():
    print("🚀 Creating partner_commissions_view in Supabase...")
    
    # Create the view
    if create_partner_commissions_view():
        print("✅ View created successfully!")
        
        # Verify the view
        verify_view()
        
        print("\n🎉 partner_commissions_view is now available!")
        print("You can now access the Partners page without errors.")
    else:
        print("❌ Failed to create the view. Please check the Supabase dashboard for errors.")

if __name__ == "__main__":
    main()
