#!/usr/bin/env python3
"""
Simple CSV to SQL converter for sale_mate_inventory
Uses only built-in Python modules
"""

import csv
import json
import os
from datetime import datetime

def clean_value(value):
    """Clean and return appropriate value"""
    if not value or value.strip() == '' or value.strip().lower() == 'null':
        return None
    return value.strip()

def parse_json_field(value):
    """Parse JSON-like string fields"""
    if not value or value.strip() == '' or value.strip().lower() == 'null':
        return None
    
    try:
        # Replace single quotes with double quotes for valid JSON
        cleaned = value.replace("'", '"').replace('None', 'null').replace('True', 'true').replace('False', 'false')
        return json.loads(cleaned)
    except (json.JSONDecodeError, TypeError):
        return None

def sql_escape(value):
    """Escape single quotes for SQL"""
    if value is None:
        return 'NULL'
    elif isinstance(value, bool):
        return 'true' if value else 'false'
    elif isinstance(value, (int, float)):
        return str(value)
    elif isinstance(value, (dict, list)):
        json_str = json.dumps(value).replace("'", "''")
        return f"'{json_str}'"
    else:
        escaped = str(value).replace("'", "''")
        return f"'{escaped}'"

def process_csv():
    """Process the CSV file and create a smaller SQL file for testing"""
    
    csv_file = "/Users/martin2/Desktop/Sale Mate Final/sale_mate_inventory.csv"
    sql_file = "/Users/martin2/Desktop/Sale Mate Final/import_inventory_sample.sql"
    
    if not os.path.exists(csv_file):
        print(f"Error: CSV file not found at {csv_file}")
        return False
    
    print("Processing CSV file (first 50 rows for testing)...")
    
    with open(csv_file, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        
        with open(sql_file, 'w') as sqlfile:
            sqlfile.write("-- Sample import for sale_mate_inventory\n")
            sqlfile.write("-- First 50 rows for testing\n\n")
            sqlfile.write("BEGIN;\n\n")
            
            count = 0
            values = []
            
            for row in reader:
                if count >= 50:  # Limit to first 50 rows for testing
                    break
                
                # Extract and clean values
                id_val = clean_value(row.get('id'))
                unit_id = clean_value(row.get('unit_id'))
                original_unit_id = clean_value(row.get('original_unit_id'))
                sale_type = clean_value(row.get('sale_type'))
                unit_number = clean_value(row.get('unit_number'))
                
                # Numeric fields
                unit_area = clean_value(row.get('unit_area'))
                if unit_area:
                    try:
                        unit_area = float(unit_area)
                    except ValueError:
                        unit_area = None
                
                bedrooms = clean_value(row.get('number_of_bedrooms'))
                if bedrooms:
                    try:
                        bedrooms = int(float(bedrooms))
                    except ValueError:
                        bedrooms = None
                
                bathrooms = clean_value(row.get('number_of_bathrooms'))
                if bathrooms:
                    try:
                        bathrooms = int(float(bathrooms))
                    except ValueError:
                        bathrooms = None
                
                # Date field
                ready_by = clean_value(row.get('ready_by'))
                if ready_by:
                    try:
                        # Simple date parsing
                        if '+' in ready_by:
                            ready_by = ready_by.split('+')[0]
                        # Keep as string for now
                    except:
                        ready_by = None
                
                finishing = clean_value(row.get('finishing'))
                
                # More numeric fields
                garden_area = clean_value(row.get('garden_area'))
                if garden_area:
                    try:
                        garden_area = float(garden_area)
                    except ValueError:
                        garden_area = None
                
                price_in_egp = clean_value(row.get('price_in_egp'))
                if price_in_egp:
                    try:
                        price_in_egp = float(price_in_egp)
                    except ValueError:
                        price_in_egp = None
                
                # JSON fields
                compound = parse_json_field(row.get('compound'))
                developer = parse_json_field(row.get('developer'))
                property_type = parse_json_field(row.get('property_type'))
                
                # Create SQL values
                value_parts = [
                    sql_escape(id_val),
                    sql_escape(unit_id),
                    sql_escape(original_unit_id),
                    sql_escape(sale_type),
                    sql_escape(unit_number),
                    sql_escape(unit_area),
                    sql_escape(bedrooms),
                    sql_escape(bathrooms),
                    sql_escape(ready_by),
                    sql_escape(finishing),
                    sql_escape(garden_area),
                    'NULL',  # roof_area
                    'NULL',  # floor_number
                    'NULL',  # building_number
                    'NULL',  # price_per_meter
                    sql_escape(price_in_egp),
                    'NULL',  # last_inventory_update
                    "'EGP'",  # currency
                    'NULL',  # payment_plans
                    'NULL',  # image
                    'NULL',  # offers
                    'false',  # is_launch
                    sql_escape(compound),
                    'NULL',  # area
                    sql_escape(developer),
                    'NULL',  # phase
                    sql_escape(property_type)
                ]
                
                values.append(f"({', '.join(value_parts)})")
                count += 1
                
                if count % 10 == 0:
                    print(f"Processed {count} rows...")
            
            if values:
                sqlfile.write("INSERT INTO sale_mate_inventory (\n")
                sqlfile.write("    id, unit_id, original_unit_id, sale_type, unit_number,\n")
                sqlfile.write("    unit_area, number_of_bedrooms, number_of_bathrooms, ready_by, finishing,\n")
                sqlfile.write("    garden_area, roof_area, floor_number, building_number, price_per_meter,\n")
                sqlfile.write("    price_in_egp, last_inventory_update, currency, payment_plans, image,\n")
                sqlfile.write("    offers, is_launch, compound, area, developer, phase, property_type\n")
                sqlfile.write(") VALUES\n")
                sqlfile.write(",\n".join(values))
                sqlfile.write("\nON CONFLICT (id) DO UPDATE SET\n")
                sqlfile.write("    unit_id = EXCLUDED.unit_id,\n")
                sqlfile.write("    price_in_egp = EXCLUDED.price_in_egp,\n")
                sqlfile.write("    updated_at = NOW();\n\n")
            
            sqlfile.write("COMMIT;\n\n")
            sqlfile.write("-- Verify import\n")
            sqlfile.write("SELECT COUNT(*) as total_records FROM sale_mate_inventory;\n")
            sqlfile.write("SELECT compound->>'name' as compound_name, COUNT(*) as count \n")
            sqlfile.write("FROM sale_mate_inventory \n")
            sqlfile.write("WHERE compound IS NOT NULL \n")
            sqlfile.write("GROUP BY compound->>'name' \n")
            sqlfile.write("ORDER BY count DESC;\n")
    
    print(f"\n✅ SQL import file generated: {sql_file}")
    print(f"Processed {count} rows (sample)")
    return True

if __name__ == "__main__":
    if process_csv():
        print("\nNext steps:")
        print("1. Review the generated SQL file")
        print("2. Apply it to your Supabase database")
        print("3. Run the full import if the sample works")
    else:
        print("Failed to process CSV")
