#!/usr/bin/env python3
"""
Simple and reliable CSV import to Supabase
Uses individual record inserts to avoid "All object keys must match" errors
"""

import csv
import json
import os
import requests
import time
from datetime import datetime

# Supabase configuration
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

def insert_single_record(record):
    """Insert a single record to Supabase"""
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
    }
    
    # Try both table name variations
    table_names = ["salemate-inventory", "sale_mate_inventory"]
    
    for table_name in table_names:
        url = f"{SUPABASE_URL}/rest/v1/{table_name}"
        
        try:
            response = requests.post(url, headers=headers, json=record)
            if response.status_code in [200, 201]:
                return True, table_name
            elif response.status_code == 404:
                # Table not found, try next table name
                continue
            else:
                print(f"❌ Error with table '{table_name}': {response.status_code} - {response.text}")
                return False, table_name
        except Exception as e:
            print(f"❌ Exception with table '{table_name}': {e}")
            continue
    
    return False, "none"

def process_csv_file(csv_file, file_num):
    """Process a single CSV file and import records one by one"""
    print(f"\n📄 Processing file {file_num}: {os.path.basename(csv_file)}")
    
    if not os.path.exists(csv_file):
        print(f"❌ File not found: {csv_file}")
        return 0, 0
    
    success_count = 0
    error_count = 0
    row_count = 0
    working_table = None
    
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
                
                # Skip records with no ID
                if not record['id']:
                    continue
                
                # Insert the record
                success, table_name = insert_single_record(record)
                
                if success:
                    success_count += 1
                    if not working_table:
                        working_table = table_name
                        print(f"✅ Found working table: {table_name}")
                else:
                    error_count += 1
                
                row_count += 1
                
                # Progress update every 100 records
                if row_count % 100 == 0:
                    print(f"   📊 Processed {row_count} rows, {success_count} successful, {error_count} errors...")
                
                # Small delay to avoid rate limiting
                time.sleep(0.01)
            
            except Exception as e:
                print(f"⚠️  Error processing row {row_num} in {os.path.basename(csv_file)}: {e}")
                error_count += 1
                continue
    
    print(f"✅ File {file_num}: Processed {row_count} records, {success_count} successful, {error_count} errors")
    if working_table:
        print(f"   🎯 Using table: {working_table}")
    
    return success_count, error_count

def main():
    """Main function to process all CSV files and import to Supabase"""
    print("🏠 Simple BRData Properties Import Tool")
    print("=" * 50)
    print("This will import all 5 CSV files into the inventory table")
    print("Using individual record inserts to avoid batch errors")
    print()
    
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
    total_success = 0
    total_errors = 0
    
    for i, csv_file in enumerate(CSV_FILES, 1):
        success, errors = process_csv_file(csv_file, i)
        total_success += success
        total_errors += errors
    
    print(f"\n🎉 Import completed!")
    print(f"✅ Successfully imported: {total_success} records")
    print(f"❌ Failed to import: {total_errors} records")
    print(f"📊 Success rate: {(total_success/(total_success+total_errors))*100:.1f}%")
    
    return total_errors == 0

if __name__ == "__main__":
    main()
