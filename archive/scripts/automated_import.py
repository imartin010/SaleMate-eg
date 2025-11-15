#!/usr/bin/env python3
"""
Automated import using your Supabase API key
Handles RLS and imports all batches automatically
"""

import os
import requests
import time
import glob

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

def import_all_batches():
    """Import all batch files automatically"""
    
    # Find all batch files
    batch_files = sorted(glob.glob("/Users/martin2/Desktop/Sale Mate Final/BATCH_*.sql"))
    
    if not batch_files:
        print("❌ No batch files found!")
        return False
    
    print(f"🚀 Starting automated import of {len(batch_files)} batches...")
    print(f"📊 Total records: ~{len(batch_files) * 50}")
    
    successful = 0
    failed = 0
    
    for i, batch_file in enumerate(batch_files, 1):
        try:
            print(f"📄 Importing batch {i}/{len(batch_files)}: {os.path.basename(batch_file)}")
            
            with open(batch_file, 'r') as f:
                sql_content = f.read()
            
            if execute_sql(sql_content, f"Batch {i}"):
                successful += 1
            else:
                failed += 1
            
            # Small delay to avoid overwhelming the API
            time.sleep(0.5)
            
            # Progress update every 10 batches
            if i % 10 == 0:
                print(f"🔄 Progress: {i}/{len(batch_files)} batches completed")
        
        except Exception as e:
            print(f"❌ Error processing batch {i}: {e}")
            failed += 1
            continue
    
    print(f"\n🎉 Import completed!")
    print(f"✅ Successful batches: {successful}")
    print(f"❌ Failed batches: {failed}")
    print(f"📊 Success rate: {(successful/len(batch_files)*100):.1f}%")
    
    return failed == 0

def test_connection():
    """Test the Supabase connection"""
    print("🔍 Testing Supabase connection...")
    
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'Content-Type': 'application/json'
    }
    
    # Test with a simple query
    url = f"{SUPABASE_URL}/rest/v1/sale_mate_inventory?select=id&limit=1"
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            print("✅ Connection successful!")
            return True
        else:
            print(f"❌ Connection failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Automated Supabase Import Tool")
    print("=" * 50)
    
    if test_connection():
        print("\n🎯 Starting automated import...")
        import_all_batches()
    else:
        print("\n❌ Connection test failed. Please check your API key and network connection.")
        print("\n📋 Manual import option:")
        print("Use the BATCH_XXX.sql files with Supabase Dashboard SQL Editor")
