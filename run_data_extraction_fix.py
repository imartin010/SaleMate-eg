#!/usr/bin/env python3
"""
Script to fix the data extraction issue
"""

def main():
    print("🔧 Data Extraction Fix")
    print("=" * 50)
    print()
    print("The error 'operator does not exist: text ->> unknown' means:")
    print("❌ The compound/developer/area columns in salemate-inventory are TEXT, not JSON")
    print("❌ The query was trying to use JSON operators (->>) on text columns")
    print()
    print("🚀 SOLUTION:")
    print("1. Go to Supabase Dashboard → SQL Editor")
    print("2. Run the SQL from: fix_projects_data_extraction.sql")
    print("3. This will:")
    print("   - Handle both TEXT and JSON formats in the inventory data")
    print("   - Extract projects correctly from your 23,000+ properties")
    print("   - Create Mountain View and Palm Hills projects (prioritized)")
    print("   - Set up proper RLS policies")
    print()
    print("📋 After running the SQL:")
    print("1. Refresh your browser (Ctrl+F5 or Cmd+Shift+R)")
    print("2. Go to the CRM/My Leads page")
    print("3. The error should be gone and you should see the leads interface")
    print()
    print("✅ Expected Result:")
    print("- No more 'operator does not exist' error")
    print("- Projects table populated with real data from inventory")
    print("- Mountain View and Palm Hills projects created first")
    print("- CRM page loads without errors")
    print("- Full leads functionality restored")
    print()
    print("🔍 The fix handles both data formats:")
    print("- JSON format: {'name': 'Project Name'}")
    print("- TEXT format: 'Project Name'")
    print("- Automatically detects and converts as needed")
    
    return 0

if __name__ == "__main__":
    main()

