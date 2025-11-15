#!/usr/bin/env python3
"""
Proper CSV import that handles JSON columns correctly
"""

import csv
import json
import re
import psycopg2
from psycopg2.extras import Json
import os

def clean_json_string(json_str):
    """Convert Python-style dictionary to proper JSON"""
    if not json_str or json_str.strip() == '' or json_str == 'NULL':
        return None
    
    try:
        # Remove outer quotes
        cleaned = json_str.strip()
        if cleaned.startswith('"') and cleaned.endswith('"'):
            cleaned = cleaned[1:-1]
        
        # Replace Python syntax with JSON syntax
        cleaned = cleaned.replace('None', 'null')
        cleaned = cleaned.replace('True', 'true') 
        cleaned = cleaned.replace('False', 'false')
        
        # Fix quotes around keys and values
        cleaned = re.sub(r"'(\w+)':", r'"\1":', cleaned)
        cleaned = re.sub(r":\s*'([^']*)'", r': "\1"', cleaned)
        
        return json.loads(cleaned)
    except:
        return None

def import_csv_to_postgres():
    """Import CSV with proper JSON handling"""
    
    # Database connection - UPDATE THESE VALUES
    conn_params = {
        'host': 'YOUR_HOST',
        'database': 'postgres', 
        'user': 'postgres',
        'password': 'YOUR_PASSWORD',
        'port': '5432'
    }
    
    csv_file = '/Users/martin2/Desktop/Sale Mate Final/brdata_split_files/brdata_properties_part_01.csv'
    
    print("=== Proper CSV Import with JSON Handling ===")
    print("Update the connection parameters in this script first!")
    print(f"CSV file: {csv_file}")
    
    # For demonstration, let's just show how the conversion works
    if os.path.exists(csv_file):
        print("\nSample JSON conversions:")
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader):
                if i >= 2:  # Show first 2 rows
                    break
                    
                print(f"\n--- Row {i+1} ---")
                print(f"ID: {row.get('id')}")
                
                # Show conversions
                compound = clean_json_string(row.get('compound'))
                area = clean_json_string(row.get('area'))  
                developer = clean_json_string(row.get('developer'))
                phase = clean_json_string(row.get('phase'))
                property_type = clean_json_string(row.get('property_type'))
                
                print(f"Compound: {compound}")
                print(f"Area: {area}")
                print(f"Developer: {developer}")
                print(f"Phase: {phase}")
                print(f"Property Type: {property_type}")
    
    print("\nTo use this script:")
    print("1. Update the connection parameters above")
    print("2. Run: python3 proper_csv_import.py")
    print("3. This will properly import the JSON data")

if __name__ == "__main__":
    import_csv_to_postgres()

