#!/usr/bin/env python3
"""
Script to properly import CSV data with JSON columns into Supabase
This handles the conversion of JSON strings to proper JSONB format
"""

import csv
import json
import os
import re
from supabase import create_client, Client

def clean_json_string(json_str):
    """
    Clean and convert Python-style dictionary strings to proper JSON
    """
    if not json_str or json_str.strip() == '':
        return None
    
    try:
        # Handle Python-style dictionary strings like "{'id': 6, 'name': 'Hacienda Bay'}"
        # Replace single quotes with double quotes for JSON compliance
        cleaned = json_str.strip()
        
        # Remove any extra quotes around the string
        if cleaned.startswith('"') and cleaned.endswith('"'):
            cleaned = cleaned[1:-1]
        
        # Replace single quotes with double quotes, but be careful with apostrophes in names
        # Use regex to replace single quotes that are dictionary/list delimiters
        cleaned = re.sub(r"'(\w+)':", r'"\1":', cleaned)  # Replace 'key': with "key":
        cleaned = re.sub(r":\s*'([^']*)'", r': "\1"', cleaned)  # Replace : 'value' with : "value"
        
        # Handle None values
        cleaned = cleaned.replace('None', 'null')
        
        # Try to parse as JSON
        parsed = json.loads(cleaned)
        return parsed
    except (json.JSONDecodeError, Exception) as e:
        print(f"Error parsing JSON string: {json_str}")
        print(f"Error: {e}")
        return None

def process_csv_row(row):
    """
    Process a CSV row and convert JSON string columns to proper JSON objects
    """
    processed_row = {}
    
    # JSON columns that need special processing
    json_columns = ['compound', 'area', 'developer', 'phase', 'property_type', 'payment_plans']
    
    for key, value in row.items():
        if key in json_columns:
            processed_row[key] = clean_json_string(value)
        else:
            # Handle other data types
            if value == '':
                processed_row[key] = None
            elif key in ['unit_area', 'number_of_bedrooms', 'number_of_bathrooms', 
                        'garden_area', 'roof_area', 'floor_number', 'price_per_meter', 'price_in_egp']:
                try:
                    processed_row[key] = float(value) if value else None
                except:
                    processed_row[key] = None
            elif key in ['is_launch']:
                processed_row[key] = value.lower() == 'true' if value else False
            else:
                processed_row[key] = value if value else None
    
    return processed_row

def main():
    """
    Main function to process and import CSV files
    """
    # You'll need to set these environment variables or replace with your actual values
    SUPABASE_URL = "YOUR_SUPABASE_URL"
    SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY"
    
    print("=== BR Data Properties JSON Import Fixer ===")
    print("This script will properly import your CSV with JSON columns")
    print()
    print("Before running this script:")
    print("1. Set your SUPABASE_URL and SUPABASE_KEY in this script")
    print("2. Clear the existing data: DELETE FROM brdata_properties;")
    print("3. Run this script with one of your split CSV files")
    print()
    
    # For now, just show what the conversion would look like
    sample_file = "/Users/martin2/Desktop/Sale Mate Final/brdata_split_files/brdata_properties_part_01.csv"
    
    if not os.path.exists(sample_file):
        print(f"Sample file not found: {sample_file}")
        return
    
    print("Sample conversion from first few rows:")
    print("=" * 50)
    
    with open(sample_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for i, row in enumerate(reader):
            if i >= 3:  # Show only first 3 rows
                break
                
            processed = process_csv_row(row)
            
            print(f"\nRow {i+1} - ID: {processed.get('id', 'N/A')}")
            print(f"Compound: {processed['compound']}")
            print(f"Area: {processed['area']}")
            print(f"Developer: {processed['developer']}")
            print(f"Phase: {processed['phase']}")
            print(f"Property Type: {processed['property_type']}")
            
            # Show first payment plan if it exists
            if processed['payment_plans'] and isinstance(processed['payment_plans'], list):
                if len(processed['payment_plans']) > 0:
                    first_plan = processed['payment_plans'][0]
                    print(f"First Payment Plan: {first_plan.get('years')} years, {first_plan.get('down_payment')}% down")

if __name__ == "__main__":
    main()

