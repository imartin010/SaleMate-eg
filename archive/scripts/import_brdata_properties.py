#!/usr/bin/env python3
"""
Import BRData Properties CSV files into Supabase salemate-inventory table
This script processes all 5 CSV files and imports them directly to Supabase
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

# CSV files to process
CSV_FILES = [
    "/Users/martin2/Desktop/Sale Mate Final/brdata_properties_part_01.csv",
    "/Users/martin2/Desktop/Sale Mate Final/brdata_properties_part_02.csv", 
    "/Users/martin2/Desktop/Sale Mate Final/brdata_properties_part_03.csv",
    "/Users/martin2/Desktop/Sale Mate Final/brdata_properties_part_04.csv",
    "/Users/martin2/Desktop/Sale Mate Final/brdata_properties_part_05.csv"
]

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
        # Handle PostgreSQL timestamp format
        if '+' in value:
            value = value.split('+')[0]
        # Convert to ISO format for PostgreSQL
        if ' ' in value and 'T' not in value:
            value = value.replace(' ', 'T')
        return value.strip()
    except:
        return None

def parse_boolean(value):
    """Parse boolean values safely"""
    if not value or value.strip() == '' or value.strip().lower() in ['null', 'none']:
        return None
    return str(value).lower() in ['true', '1', 'yes', 't']

def import_batch_to_supabase(records, batch_num):
    """Import a batch of records to Supabase"""
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
    }
    
    url = f"{SUPABASE_URL}/rest/v1/salemate-inventory"
    
    # Ensure all records have the same keys by using a consistent schema
    expected_keys = {
        'id', 'unit_id', 'original_unit_id', 'sale_type', 'unit_number', 'unit_area',
        'number_of_bedrooms', 'number_of_bathrooms', 'ready_by', 'finishing',
        'garden_area', 'roof_area', 'floor_number', 'building_number', 'price_per_meter',
        'price_in_egp', 'last_inventory_update', 'currency', 'payment_plans', 'image',
        'offers', 'is_launch', 'compound', 'area', 'developer', 'phase', 'property_type'
    }
    
    # Normalize all records to have the same keys
    normalized_records = []
    for record in records:
        normalized_record = {}
        for key in expected_keys:
            normalized_record[key] = record.get(key)
        normalized_records.append(normalized_record)
    
    try:
        response = requests.post(url, headers=headers, json=normalized_records)
        if response.status_code in [200, 201]:
            print(f"✅ Batch {batch_num}: Successfully imported {len(records)} records")
            return True
        else:
            print(f"❌ Batch {batch_num}: Failed - {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Batch {batch_num}: Error - {e}")
        return False

def process_csv_file(csv_file, file_num):
    """Process a single CSV file and return records"""
    print(f"\n📄 Processing file {file_num}: {os.path.basename(csv_file)}")
    
    if not os.path.exists(csv_file):
        print(f"❌ File not found: {csv_file}")
        return []
    
    records = []
    row_count = 0
    
    with open(csv_file, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        
        for row_num, row in enumerate(reader, 1):
            try:
                # Process the row according to the CSV structure
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
                    'is_launch': parse_boolean(row.get('is_launch')),
                    'compound': parse_json_field(row.get('compound')),
                    'area': parse_json_field(row.get('area')),
                    'developer': parse_json_field(row.get('developer')),
                    'phase': parse_json_field(row.get('phase')),
                    'property_type': parse_json_field(row.get('property_type'))
                }
                
                # Keep all fields, even if None, to ensure consistent schema
                
                records.append(record)
                row_count += 1
                
                if row_count % 1000 == 0:
                    print(f"   📊 Processed {row_count} rows from {os.path.basename(csv_file)}...")
            
            except Exception as e:
                print(f"⚠️  Error processing row {row_num} in {os.path.basename(csv_file)}: {e}")
                continue
    
    print(f"✅ File {file_num}: Processed {row_count} records from {os.path.basename(csv_file)}")
    return records

def import_records_to_supabase(records, batch_size=100):
    """Import records to Supabase in batches"""
    total_imported = 0
    total_failed = 0
    batch_num = 1
    
    print(f"\n🚀 Starting import of {len(records)} records to Supabase...")
    
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        
        if import_batch_to_supabase(batch, batch_num):
            total_imported += len(batch)
        else:
            total_failed += len(batch)
        
        batch_num += 1
        time.sleep(0.1)  # Small delay to avoid rate limiting
    
    return total_imported, total_failed

def main():
    """Main function to process all CSV files and import to Supabase"""
    print("🏠 BRData Properties Import Tool")
    print("=" * 50)
    print("This will import all 5 CSV files into the salemate-inventory table")
    print()
    
    # Check if API key is configured
    if SUPABASE_ANON_KEY == "your-anon-key-here":
        print("❌ Please update the SUPABASE_ANON_KEY in the script with your actual Supabase anon key")
        print("You can find it in: Supabase Dashboard → Settings → API → anon public key")
        return False
    
    # Check if all CSV files exist
    missing_files = []
    for csv_file in CSV_FILES:
        if not os.path.exists(csv_file):
            missing_files.append(csv_file)
    
    if missing_files:
        print("❌ Missing CSV files:")
        for file in missing_files:
            print(f"   - {file}")
        return False
    
    print("✅ All CSV files found")
    print()
    
    # Process all CSV files
    all_records = []
    total_records = 0
    
    for i, csv_file in enumerate(CSV_FILES, 1):
        records = process_csv_file(csv_file, i)
        all_records.extend(records)
        total_records += len(records)
    
    print(f"\n📊 Total records to import: {total_records}")
    
    if total_records == 0:
        print("❌ No records found to import")
        return False
    
    # Confirm before importing
    print(f"\n⚠️  About to import {total_records} records to Supabase")
    print("Press Enter to continue or Ctrl+C to cancel...")
    input()
    
    # Import to Supabase
    total_imported, total_failed = import_records_to_supabase(all_records)
    
    print(f"\n🎉 Import completed!")
    print(f"✅ Successfully imported: {total_imported} records")
    print(f"❌ Failed to import: {total_failed} records")
    print(f"📊 Success rate: {(total_imported/total_records)*100:.1f}%")
    
    return total_failed == 0

if __name__ == "__main__":
    main()