#!/usr/bin/env python3
"""
Script to import sale_mate_inventory.csv into Supabase
"""

import pandas as pd
import json
import os
from datetime import datetime
import sys

def clean_json_field(field_str):
    """Clean and parse JSON-like string fields"""
    if pd.isna(field_str) or field_str == '' or field_str == 'null':
        return None
    
    try:
        # Handle string representations of dictionaries
        if isinstance(field_str, str):
            # Replace single quotes with double quotes for valid JSON
            field_str = field_str.replace("'", '"')
            # Handle None values
            field_str = field_str.replace('None', 'null')
            return json.loads(field_str)
        return field_str
    except (json.JSONDecodeError, TypeError):
        # If parsing fails, return as string
        return str(field_str) if not pd.isna(field_str) else None

def clean_numeric_field(field):
    """Clean numeric fields"""
    if pd.isna(field) or field == '' or field == 'null':
        return None
    try:
        return float(field)
    except (ValueError, TypeError):
        return None

def clean_integer_field(field):
    """Clean integer fields"""
    if pd.isna(field) or field == '' or field == 'null':
        return None
    try:
        return int(float(field))
    except (ValueError, TypeError):
        return None

def clean_date_field(field):
    """Clean date fields"""
    if pd.isna(field) or field == '' or field == 'null':
        return None
    try:
        # Handle different date formats
        if isinstance(field, str):
            # Remove timezone info if present and parse
            if '+' in field:
                field = field.split('+')[0]
            return pd.to_datetime(field).isoformat()
        return pd.to_datetime(field).isoformat()
    except (ValueError, TypeError):
        return None

def process_csv_to_sql():
    """Process the CSV file and generate SQL INSERT statements"""
    
    csv_file = "/Users/martin2/Desktop/Sale Mate Final/sale_mate_inventory.csv"
    
    if not os.path.exists(csv_file):
        print(f"Error: CSV file not found at {csv_file}")
        return False
    
    print("Loading CSV file...")
    try:
        # Read CSV with proper handling of large fields
        df = pd.read_csv(csv_file, dtype=str, keep_default_na=False)
        print(f"Loaded {len(df)} rows from CSV")
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return False
    
    # Create SQL file for import
    sql_file = "/Users/martin2/Desktop/Sale Mate Final/import_inventory_data.sql"
    
    print("Processing data and generating SQL...")
    
    with open(sql_file, 'w') as f:
        f.write("-- Import sale_mate_inventory data\n")
        f.write("-- Generated automatically from CSV\n\n")
        f.write("BEGIN;\n\n")
        
        # Process data in chunks to avoid memory issues
        chunk_size = 100
        total_rows = len(df)
        
        for start_idx in range(0, total_rows, chunk_size):
            end_idx = min(start_idx + chunk_size, total_rows)
            chunk = df.iloc[start_idx:end_idx]
            
            f.write(f"-- Rows {start_idx + 1} to {end_idx}\n")
            f.write("INSERT INTO sale_mate_inventory (\n")
            f.write("    id, unit_id, original_unit_id, sale_type, unit_number,\n")
            f.write("    unit_area, number_of_bedrooms, number_of_bathrooms, ready_by, finishing,\n")
            f.write("    garden_area, roof_area, floor_number, building_number, price_per_meter,\n")
            f.write("    price_in_egp, last_inventory_update, currency, payment_plans, image,\n")
            f.write("    offers, is_launch, compound, area, developer, phase, property_type\n")
            f.write(") VALUES\n")
            
            values = []
            for _, row in chunk.iterrows():
                # Clean and prepare each field
                id_val = clean_integer_field(row.get('id'))
                unit_id = row.get('unit_id') if row.get('unit_id') and row.get('unit_id') != '' else None
                original_unit_id = row.get('original_unit_id') if row.get('original_unit_id') and row.get('original_unit_id') != '' else None
                sale_type = row.get('sale_type') if row.get('sale_type') and row.get('sale_type') != '' else None
                unit_number = row.get('unit_number') if row.get('unit_number') and row.get('unit_number') != '' else None
                
                unit_area = clean_numeric_field(row.get('unit_area'))
                number_of_bedrooms = clean_integer_field(row.get('number_of_bedrooms'))
                number_of_bathrooms = clean_integer_field(row.get('number_of_bathrooms'))
                ready_by = clean_date_field(row.get('ready_by'))
                finishing = row.get('finishing') if row.get('finishing') and row.get('finishing') != '' else None
                
                garden_area = clean_numeric_field(row.get('garden_area'))
                roof_area = clean_numeric_field(row.get('roof_area'))
                floor_number = clean_numeric_field(row.get('floor_number'))
                building_number = row.get('building_number') if row.get('building_number') and row.get('building_number') != '' else None
                
                price_per_meter = clean_numeric_field(row.get('price_per_meter'))
                price_in_egp = clean_numeric_field(row.get('price_in_egp'))
                last_inventory_update = clean_date_field(row.get('last_inventory_update'))
                currency = row.get('currency', 'EGP')
                
                # Handle JSON fields
                payment_plans = clean_json_field(row.get('payment_plans'))
                image = row.get('image') if row.get('image') and row.get('image') != '' else None
                offers = clean_json_field(row.get('offers'))
                is_launch = str(row.get('is_launch', 'false')).lower() == 'true'
                
                compound = clean_json_field(row.get('compound'))
                area = clean_json_field(row.get('area'))
                developer = clean_json_field(row.get('developer'))
                phase = clean_json_field(row.get('phase'))
                property_type = clean_json_field(row.get('property_type'))
                
                # Format values for SQL
                def sql_value(val):
                    if val is None:
                        return 'NULL'
                    elif isinstance(val, bool):
                        return 'true' if val else 'false'
                    elif isinstance(val, (int, float)):
                        return str(val)
                    elif isinstance(val, (dict, list)):
                        json_str = json.dumps(val).replace("'", "''")
                        return f"'{json_str}'"
                    else:
                        escaped_str = str(val).replace("'", "''")
                        return f"'{escaped_str}'"
                
                value_str = f"({sql_value(id_val)}, {sql_value(unit_id)}, {sql_value(original_unit_id)}, " \
                           f"{sql_value(sale_type)}, {sql_value(unit_number)}, {sql_value(unit_area)}, " \
                           f"{sql_value(number_of_bedrooms)}, {sql_value(number_of_bathrooms)}, " \
                           f"{sql_value(ready_by)}, {sql_value(finishing)}, {sql_value(garden_area)}, " \
                           f"{sql_value(roof_area)}, {sql_value(floor_number)}, {sql_value(building_number)}, " \
                           f"{sql_value(price_per_meter)}, {sql_value(price_in_egp)}, " \
                           f"{sql_value(last_inventory_update)}, {sql_value(currency)}, " \
                           f"{sql_value(payment_plans)}, {sql_value(image)}, {sql_value(offers)}, " \
                           f"{sql_value(is_launch)}, {sql_value(compound)}, {sql_value(area)}, " \
                           f"{sql_value(developer)}, {sql_value(phase)}, {sql_value(property_type)})"
                
                values.append(value_str)
            
            f.write(",\n".join(values))
            f.write("\nON CONFLICT (id) DO UPDATE SET\n")
            f.write("    unit_id = EXCLUDED.unit_id,\n")
            f.write("    original_unit_id = EXCLUDED.original_unit_id,\n")
            f.write("    sale_type = EXCLUDED.sale_type,\n")
            f.write("    unit_number = EXCLUDED.unit_number,\n")
            f.write("    unit_area = EXCLUDED.unit_area,\n")
            f.write("    number_of_bedrooms = EXCLUDED.number_of_bedrooms,\n")
            f.write("    number_of_bathrooms = EXCLUDED.number_of_bathrooms,\n")
            f.write("    ready_by = EXCLUDED.ready_by,\n")
            f.write("    finishing = EXCLUDED.finishing,\n")
            f.write("    garden_area = EXCLUDED.garden_area,\n")
            f.write("    roof_area = EXCLUDED.roof_area,\n")
            f.write("    floor_number = EXCLUDED.floor_number,\n")
            f.write("    building_number = EXCLUDED.building_number,\n")
            f.write("    price_per_meter = EXCLUDED.price_per_meter,\n")
            f.write("    price_in_egp = EXCLUDED.price_in_egp,\n")
            f.write("    last_inventory_update = EXCLUDED.last_inventory_update,\n")
            f.write("    currency = EXCLUDED.currency,\n")
            f.write("    payment_plans = EXCLUDED.payment_plans,\n")
            f.write("    image = EXCLUDED.image,\n")
            f.write("    offers = EXCLUDED.offers,\n")
            f.write("    is_launch = EXCLUDED.is_launch,\n")
            f.write("    compound = EXCLUDED.compound,\n")
            f.write("    area = EXCLUDED.area,\n")
            f.write("    developer = EXCLUDED.developer,\n")
            f.write("    phase = EXCLUDED.phase,\n")
            f.write("    property_type = EXCLUDED.property_type,\n")
            f.write("    updated_at = NOW();\n\n")
            
            print(f"Processed rows {start_idx + 1} to {end_idx}")
        
        f.write("COMMIT;\n\n")
        f.write("-- Verify import\n")
        f.write("SELECT COUNT(*) as total_records FROM sale_mate_inventory;\n")
        f.write("SELECT compound->>'name' as compound_name, COUNT(*) as count \n")
        f.write("FROM sale_mate_inventory \n")
        f.write("WHERE compound IS NOT NULL \n")
        f.write("GROUP BY compound->>'name' \n")
        f.write("ORDER BY count DESC \n")
        f.write("LIMIT 10;\n")
    
    print(f"\nSQL import file generated: {sql_file}")
    print(f"Total rows processed: {total_rows}")
    
    return True

if __name__ == "__main__":
    success = process_csv_to_sql()
    if success:
        print("\n✅ CSV processing completed successfully!")
        print("\nNext steps:")
        print("1. Apply the table migration: npx supabase db push")
        print("2. Import the data using the generated SQL file")
    else:
        print("\n❌ CSV processing failed!")
        sys.exit(1)
