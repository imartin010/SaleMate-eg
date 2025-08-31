#!/usr/bin/env python3
"""
Direct import to Supabase using the REST API
This avoids the need to manually copy/paste large SQL files
"""

import csv
import json
import os
import requests
import time
from datetime import datetime

# Supabase configuration - you'll need to update these
SUPABASE_URL = "https://wkxbhvckmgrmdkdkhnqo.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndreGJodmNrbWdybWRrZGtobnFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0OTgzNTQsImV4cCI6MjA3MjA3NDM1NH0.Vg48-ld0anvU4OQJWf5ZlEqTKjXiHBK0A14fz0vGvU8"

def clean_value(value):
    """Clean and return appropriate value"""
    if not value or value.strip() == '' or value.strip().lower() in ['null', 'none']:
        return None
    return value.strip()

def parse_json_field(value):
    """Parse JSON-like string fields"""
    if not value or value.strip() == '' or value.strip().lower() in ['null', 'none']:
        return None
    
    try:
        # Replace single quotes with double quotes for valid JSON
        cleaned = value.replace("'", '"').replace('None', 'null').replace('True', 'true').replace('False', 'false')
        return json.loads(cleaned)
    except (json.JSONDecodeError, TypeError):
        return None

def parse_numeric(value):
    """Parse numeric values safely"""
    if not value or value.strip() == '' or value.strip().lower() in ['null', 'none']:
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None

def parse_integer(value):
    """Parse integer values safely"""
    if not value or value.strip() == '' or value.strip().lower() in ['null', 'none']:
        return None
    try:
        return int(float(value))
    except (ValueError, TypeError):
        return None

def parse_date(value):
    """Parse date values safely"""
    if not value or value.strip() == '' or value.strip().lower() in ['null', 'none']:
        return None
    try:
        # Simple date cleaning
        if '+' in value:
            value = value.split('+')[0]
        return value.strip()
    except:
        return None

def import_batch_to_supabase(records, batch_num):
    """Import a batch of records to Supabase"""
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
    }
    
    url = f"{SUPABASE_URL}/rest/v1/sale_mate_inventory"
    
    try:
        response = requests.post(url, headers=headers, json=records)
        if response.status_code in [200, 201]:
            print(f"✅ Batch {batch_num}: Successfully imported {len(records)} records")
            return True
        else:
            print(f"❌ Batch {batch_num}: Failed - {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Batch {batch_num}: Error - {e}")
        return False

def process_and_import_csv():
    """Process CSV and import directly to Supabase"""
    
    csv_file = "/Users/martin2/Desktop/Sale Mate Final/sale_mate_inventory.csv"
    
    if not os.path.exists(csv_file):
        print(f"Error: CSV file not found at {csv_file}")
        return False
    
    print("🚀 Starting direct import to Supabase...")
    print("⚠️  Make sure to update SUPABASE_ANON_KEY in the script first!")
    
    if SUPABASE_ANON_KEY == "your-anon-key-here":
        print("\n❌ Please update the SUPABASE_ANON_KEY in the script with your actual Supabase anon key")
        print("You can find it in: Supabase Dashboard → Settings → API → anon public key")
        return False
    
    batch_size = 100  # Smaller batches for API import
    batch = []
    batch_num = 1
    total_imported = 0
    total_failed = 0
    
    with open(csv_file, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        
        for row_num, row in enumerate(reader, 1):
            try:
                # Process the row
                record = {
                    'id': parse_integer(row.get('id')),
                    'unit_id': clean_value(row.get('unit_id')),
                    'original_unit_id': clean_value(row.get('original_unit_id')),
                    'sale_type': clean_value(row.get('sale_type')),
                    'unit_number': clean_value(row.get('unit_number')),
                    'unit_area': parse_numeric(row.get('unit_area')),
                    'number_of_bedrooms': parse_integer(row.get('number_of_bedrooms')),
                    'number_of_bathrooms': parse_integer(row.get('number_of_bathrooms')),
                    'ready_by': parse_date(row.get('ready_by')),
                    'finishing': clean_value(row.get('finishing')),
                    'garden_area': parse_numeric(row.get('garden_area')),
                    'roof_area': parse_numeric(row.get('roof_area')),
                    'floor_number': parse_numeric(row.get('floor_number')),
                    'building_number': clean_value(row.get('building_number')),
                    'price_per_meter': parse_numeric(row.get('price_per_meter')),
                    'price_in_egp': parse_numeric(row.get('price_in_egp')),
                    'last_inventory_update': parse_date(row.get('last_inventory_update')),
                    'currency': clean_value(row.get('currency')) or 'EGP',
                    'payment_plans': parse_json_field(row.get('payment_plans')),
                    'image': clean_value(row.get('image')),
                    'offers': parse_json_field(row.get('offers')),
                    'is_launch': str(row.get('is_launch', 'false')).lower() == 'true',
                    'compound': parse_json_field(row.get('compound')),
                    'area': parse_json_field(row.get('area')),
                    'developer': parse_json_field(row.get('developer')),
                    'phase': parse_json_field(row.get('phase')),
                    'property_type': parse_json_field(row.get('property_type'))
                }
                
                # Remove None values to avoid issues
                record = {k: v for k, v in record.items() if v is not None}
                
                batch.append(record)
                
                # Import batch when it reaches batch_size
                if len(batch) >= batch_size:
                    if import_batch_to_supabase(batch, batch_num):
                        total_imported += len(batch)
                    else:
                        total_failed += len(batch)
                    
                    batch = []
                    batch_num += 1
                    time.sleep(0.1)  # Small delay to avoid rate limiting
                
                if row_num % 1000 == 0:
                    print(f"📊 Processed {row_num} rows...")
            
            except Exception as e:
                print(f"⚠️  Error processing row {row_num}: {e}")
                continue
        
        # Import remaining records
        if batch:
            if import_batch_to_supabase(batch, batch_num):
                total_imported += len(batch)
            else:
                total_failed += len(batch)
    
    print(f"\n🎉 Import completed!")
    print(f"✅ Successfully imported: {total_imported} records")
    print(f"❌ Failed to import: {total_failed} records")
    
    return total_failed == 0

if __name__ == "__main__":
    print("📋 Supabase Direct Import Tool")
    print("=" * 50)
    
    # Show instructions for getting the API key
    print("\n🔑 Before running, you need your Supabase API key:")
    print("1. Go to Supabase Dashboard → Settings → API")
    print("2. Copy the 'anon public' key")
    print("3. Update SUPABASE_ANON_KEY in this script")
    print("4. Run the script again")
    
    if SUPABASE_ANON_KEY != "your-anon-key-here":
        process_and_import_csv()
    else:
        print("\n⏳ Waiting for API key update...")
