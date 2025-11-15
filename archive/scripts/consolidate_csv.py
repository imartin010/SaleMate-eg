#!/usr/bin/env python3
"""
Consolidate all CSV files into one properly formatted file for Supabase import
This creates a single CSV that can be imported via the Supabase dashboard
"""

import csv
import json
import os
from datetime import datetime

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
        return ''
    return value.strip()

def parse_json_field(value):
    """Parse JSON-like string fields"""
    if not value or value.strip() == '' or value.strip().lower() in ['null', 'none']:
        return ''
    
    try:
        # Replace single quotes with double quotes for valid JSON
        cleaned = value.replace("'", '"').replace('None', 'null').replace('True', 'true').replace('False', 'false')
        # Validate it's proper JSON
        json.loads(cleaned)
        return cleaned
    except (json.JSONDecodeError, TypeError):
        return ''

def parse_numeric(value):
    """Parse numeric values safely"""
    if not value or value.strip() == '' or value.strip().lower() in ['null', 'none']:
        return ''
    try:
        return str(float(value))
    except (ValueError, TypeError):
        return ''

def parse_integer(value):
    """Parse integer values safely"""
    if not value or value.strip() == '' or value.strip().lower() in ['null', 'none']:
        return ''
    try:
        return str(int(float(value)))
    except (ValueError, TypeError):
        return ''

def parse_date(value):
    """Parse date values safely"""
    if not value or value.strip() == '' or value.strip().lower() in ['null', 'none']:
        return ''
    try:
        # Handle PostgreSQL timestamp format
        if '+' in value:
            value = value.split('+')[0]
        # Convert to ISO format for PostgreSQL
        if ' ' in value and 'T' not in value:
            value = value.replace(' ', 'T')
        return value.strip()
    except:
        return ''

def parse_boolean(value):
    """Parse boolean values safely"""
    if not value or value.strip() == '' or value.strip().lower() in ['null', 'none']:
        return ''
    return 'true' if str(value).lower() in ['true', '1', 'yes', 't'] else 'false'

def process_csv_files():
    """Process all CSV files and create a consolidated file"""
    print("🏠 Consolidating CSV files for Supabase import")
    print("=" * 50)
    
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
    
    # Define the output CSV structure matching the database schema
    output_file = "/Users/martin2/Desktop/Sale Mate Final/consolidated_inventory.csv"
    
    # Define the exact column order and names for the database
    fieldnames = [
        'id', 'unit_id', 'original_unit_id', 'sale_type', 'unit_number', 'unit_area',
        'number_of_bedrooms', 'number_of_bathrooms', 'ready_by', 'finishing',
        'garden_area', 'roof_area', 'floor_number', 'building_number', 'price_per_meter',
        'price_in_egp', 'last_inventory_update', 'currency', 'payment_plans', 'image',
        'offers', 'is_launch', 'compound', 'area', 'developer', 'phase', 'property_type'
    ]
    
    total_records = 0
    
    with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        
        for file_num, csv_file in enumerate(CSV_FILES, 1):
            print(f"\n📄 Processing file {file_num}: {os.path.basename(csv_file)}")
            
            file_records = 0
            with open(csv_file, 'r', encoding='utf-8') as input_file:
                reader = csv.DictReader(input_file)
                
                for row_num, row in enumerate(reader, 1):
                    try:
                        # Process the row according to the CSV structure
                        processed_row = {
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
                        if not processed_row['id']:
                            continue
                        
                        writer.writerow(processed_row)
                        file_records += 1
                        total_records += 1
                        
                        if file_records % 1000 == 0:
                            print(f"   📊 Processed {file_records} rows from {os.path.basename(csv_file)}...")
                    
                    except Exception as e:
                        print(f"⚠️  Error processing row {row_num} in {os.path.basename(csv_file)}: {e}")
                        continue
            
            print(f"✅ File {file_num}: Processed {file_records} records from {os.path.basename(csv_file)}")
    
    print(f"\n🎉 Consolidation completed!")
    print(f"📊 Total records: {total_records}")
    print(f"📁 Output file: {output_file}")
    print(f"📏 File size: {os.path.getsize(output_file) / (1024*1024):.1f} MB")
    
    print(f"\n📋 Next steps:")
    print(f"1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/wkxbhvckmgrmdkdkhnqo/editor/48330")
    print(f"2. Click on the 'salemate-inventory' table")
    print(f"3. Click 'Import data' or 'Insert' button")
    print(f"4. Upload the file: {output_file}")
    print(f"5. Map the columns correctly and import")
    
    return True

if __name__ == "__main__":
    process_csv_files()
