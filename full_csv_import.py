#!/usr/bin/env python3
"""
Full CSV import script for sale_mate_inventory
Handles large datasets by creating multiple SQL files
"""

import csv
import json
import os
from datetime import datetime

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
        # Return as string for SQL
        return value.strip()
    except:
        return None

def process_full_csv():
    """Process the entire CSV file and create SQL import files"""
    
    csv_file = "/Users/martin2/Desktop/Sale Mate Final/sale_mate_inventory.csv"
    
    if not os.path.exists(csv_file):
        print(f"Error: CSV file not found at {csv_file}")
        return False
    
    print("Processing full CSV file...")
    print("This may take a few minutes due to the large dataset...")
    
    # Create multiple SQL files to handle large dataset
    chunk_size = 1000  # Process 1000 rows per file
    file_counter = 1
    row_counter = 0
    current_sql_file = None
    current_file_handle = None
    
    try:
        with open(csv_file, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            
            for row in reader:
                # Create new SQL file every chunk_size rows
                if row_counter % chunk_size == 0:
                    if current_file_handle:
                        # Close previous file
                        current_file_handle.write("\nCOMMIT;\n")
                        current_file_handle.close()
                        print(f"Completed file {file_counter-1} with {chunk_size} rows")
                    
                    # Start new file
                    current_sql_file = f"/Users/martin2/Desktop/Sale Mate Final/import_inventory_part_{file_counter:03d}.sql"
                    current_file_handle = open(current_sql_file, 'w')
                    current_file_handle.write(f"-- Import sale_mate_inventory data - Part {file_counter}\n")
                    current_file_handle.write(f"-- Rows {row_counter + 1} to {row_counter + chunk_size}\n\n")
                    current_file_handle.write("BEGIN;\n\n")
                    current_file_handle.write("INSERT INTO sale_mate_inventory (\n")
                    current_file_handle.write("    id, unit_id, original_unit_id, sale_type, unit_number,\n")
                    current_file_handle.write("    unit_area, number_of_bedrooms, number_of_bathrooms, ready_by, finishing,\n")
                    current_file_handle.write("    garden_area, roof_area, floor_number, building_number, price_per_meter,\n")
                    current_file_handle.write("    price_in_egp, last_inventory_update, currency, payment_plans, image,\n")
                    current_file_handle.write("    offers, is_launch, compound, area, developer, phase, property_type\n")
                    current_file_handle.write(") VALUES\n")
                    
                    file_counter += 1
                    values_in_current_file = 0
                
                # Process the row
                try:
                    # Extract and clean all values
                    id_val = parse_integer(row.get('id'))
                    unit_id = clean_value(row.get('unit_id'))
                    original_unit_id = clean_value(row.get('original_unit_id'))
                    sale_type = clean_value(row.get('sale_type'))
                    unit_number = clean_value(row.get('unit_number'))
                    
                    unit_area = parse_numeric(row.get('unit_area'))
                    bedrooms = parse_integer(row.get('number_of_bedrooms'))
                    bathrooms = parse_integer(row.get('number_of_bathrooms'))
                    ready_by = parse_date(row.get('ready_by'))
                    finishing = clean_value(row.get('finishing'))
                    
                    garden_area = parse_numeric(row.get('garden_area'))
                    roof_area = parse_numeric(row.get('roof_area'))
                    floor_number = parse_numeric(row.get('floor_number'))
                    building_number = clean_value(row.get('building_number'))
                    price_per_meter = parse_numeric(row.get('price_per_meter'))
                    
                    price_in_egp = parse_numeric(row.get('price_in_egp'))
                    last_inventory_update = parse_date(row.get('last_inventory_update'))
                    currency = clean_value(row.get('currency')) or 'EGP'
                    
                    # Parse JSON fields
                    payment_plans = parse_json_field(row.get('payment_plans'))
                    image = clean_value(row.get('image'))
                    offers = parse_json_field(row.get('offers'))
                    is_launch = str(row.get('is_launch', 'false')).lower() == 'true'
                    
                    compound = parse_json_field(row.get('compound'))
                    area = parse_json_field(row.get('area'))
                    developer = parse_json_field(row.get('developer'))
                    phase = parse_json_field(row.get('phase'))
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
                        sql_escape(roof_area),
                        sql_escape(floor_number),
                        sql_escape(building_number),
                        sql_escape(price_per_meter),
                        sql_escape(price_in_egp),
                        sql_escape(last_inventory_update),
                        sql_escape(currency),
                        sql_escape(payment_plans),
                        sql_escape(image),
                        sql_escape(offers),
                        sql_escape(is_launch),
                        sql_escape(compound),
                        sql_escape(area),
                        sql_escape(developer),
                        sql_escape(phase),
                        sql_escape(property_type)
                    ]
                    
                    # Add comma if not first row in file
                    if values_in_current_file > 0:
                        current_file_handle.write(",\n")
                    
                    current_file_handle.write(f"({', '.join(value_parts)})")
                    values_in_current_file += 1
                    row_counter += 1
                    
                    if row_counter % 100 == 0:
                        print(f"Processed {row_counter} rows...")
                
                except Exception as e:
                    print(f"Error processing row {row_counter}: {e}")
                    continue
            
            # Close the last file
            if current_file_handle:
                current_file_handle.write("\nON CONFLICT (id) DO UPDATE SET\n")
                current_file_handle.write("    unit_id = EXCLUDED.unit_id,\n")
                current_file_handle.write("    original_unit_id = EXCLUDED.original_unit_id,\n")
                current_file_handle.write("    sale_type = EXCLUDED.sale_type,\n")
                current_file_handle.write("    unit_area = EXCLUDED.unit_area,\n")
                current_file_handle.write("    price_in_egp = EXCLUDED.price_in_egp,\n")
                current_file_handle.write("    compound = EXCLUDED.compound,\n")
                current_file_handle.write("    developer = EXCLUDED.developer,\n")
                current_file_handle.write("    property_type = EXCLUDED.property_type,\n")
                current_file_handle.write("    updated_at = NOW();\n\n")
                current_file_handle.write("COMMIT;\n")
                current_file_handle.close()
        
        print(f"\n✅ CSV processing completed!")
        print(f"Total rows processed: {row_counter}")
        print(f"SQL files created: {file_counter - 1}")
        print(f"Files are named: import_inventory_part_001.sql to import_inventory_part_{file_counter-1:03d}.sql")
        
        # Create a master import script
        master_file = "/Users/martin2/Desktop/Sale Mate Final/import_all_inventory.sh"
        with open(master_file, 'w') as f:
            f.write("#!/bin/bash\n")
            f.write("# Master script to import all inventory data\n")
            f.write("echo 'Starting full inventory import...'\n")
            for i in range(1, file_counter):
                f.write(f"echo 'Importing part {i}...'\n")
                f.write(f"# You can apply this via Supabase Dashboard SQL Editor:\n")
                f.write(f"# cat import_inventory_part_{i:03d}.sql\n")
            f.write("echo 'All parts ready for import!'\n")
        
        os.chmod(master_file, 0o755)
        
        return True
        
    except Exception as e:
        print(f"Error processing CSV: {e}")
        if current_file_handle:
            current_file_handle.close()
        return False

if __name__ == "__main__":
    if process_full_csv():
        print("\n🎯 Next Steps:")
        print("1. Import each SQL file via Supabase Dashboard SQL Editor")
        print("2. Or use the provided shell script as a guide")
        print("3. Files are split into manageable chunks for easier import")
    else:
        print("❌ Failed to process CSV")
