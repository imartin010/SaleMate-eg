#!/usr/bin/env python3
"""
Test script to check which inventory table exists in Supabase
"""

import requests

# Supabase configuration
SUPABASE_URL = "https://wkxbhvckmgrmdkdkhnqo.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndreGJodmNrbWdybWRrZGtobnFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0OTgzNTQsImV4cCI6MjA3MjA3NDM1NH0.Vg48-ld0anvU4OQJWf5ZlEqTKjXiHBK0A14fz0vGvU8"

def test_table(table_name):
    """Test if a table exists by trying to query it"""
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'Content-Type': 'application/json'
    }
    
    url = f"{SUPABASE_URL}/rest/v1/{table_name}?select=id&limit=1"
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            print(f"✅ Table '{table_name}' exists and is accessible")
            return True
        else:
            print(f"❌ Table '{table_name}' - Status: {response.status_code}, Message: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Table '{table_name}' - Error: {e}")
        return False

def main():
    print("🔍 Testing which inventory table exists in Supabase...")
    print("=" * 60)
    
    # Test both possible table names
    tables_to_test = [
        "salemate-inventory",
        "sale_mate_inventory"
    ]
    
    existing_tables = []
    for table in tables_to_test:
        if test_table(table):
            existing_tables.append(table)
    
    print("\n" + "=" * 60)
    if existing_tables:
        print(f"✅ Found {len(existing_tables)} existing table(s): {existing_tables}")
        print(f"🎯 Recommended table to use: {existing_tables[0]}")
    else:
        print("❌ No inventory tables found!")
        print("💡 You may need to create the table first using the migration files.")

if __name__ == "__main__":
    main()
