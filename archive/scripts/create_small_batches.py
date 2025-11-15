#!/usr/bin/env python3
"""
Create very small SQL batches for easy Supabase Dashboard import
"""

import csv
import json
import os

def create_small_batches():
    """Create small batches of 50 records each"""
    
    csv_file = "/Users/martin2/Desktop/Sale Mate Final/sale_mate_inventory.csv"
    
    if not os.path.exists(csv_file):
        print(f"Error: CSV file not found")
        return False
    
    print("Creating small batches (50 records each)...")
    
    batch_size = 50
    batch_num = 1
    records_in_batch = 0
    current_file = None
    
    def sql_escape(value):
        if value is None or value == '':
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
    
    def parse_json_field(value):
        if not value or value.strip() == '' or value.strip().lower() in ['null', 'none']:
            return None
        try:
            cleaned = value.replace("'", '"').replace('None', 'null').replace('True', 'true').replace('False', 'false')
            return json.loads(cleaned)
        except:
            return None
    
    def clean_numeric(value):
        if not value or value.strip() == '':
            return None
        try:
            return float(value)
        except:
            return None
    
    def clean_integer(value):
        if not value or value.strip() == '':
            return None
        try:
            return int(float(value))
        except:
            return None
    
    try:
        with open(csv_file, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            
            for row_num, row in enumerate(reader, 1):
                # Start new batch file
                if records_in_batch == 0:
                    if current_file:
                        current_file.write(";\n\nCOMMIT;\n")
                        current_file.close()
                    
                    filename = f"/Users/martin2/Desktop/Sale Mate Final/BATCH_{batch_num:03d}.sql"
                    current_file = open(filename, 'w')
                    current_file.write(f"-- Inventory Import Batch {batch_num}\n")
                    current_file.write(f"-- Records {row_num} to {row_num + batch_size - 1}\n\n")
                    
                    if batch_num == 1:
                        current_file.write("-- Disable RLS for import\n")
                        current_file.write("ALTER TABLE sale_mate_inventory DISABLE ROW LEVEL SECURITY;\n\n")
                    
                    current_file.write("BEGIN;\n\n")
                    current_file.write("INSERT INTO sale_mate_inventory (\n")
                    current_file.write("    id, unit_id, original_unit_id, sale_type, unit_number,\n")
                    current_file.write("    unit_area, number_of_bedrooms, number_of_bathrooms, ready_by, finishing,\n")
                    current_file.write("    garden_area, roof_area, floor_number, building_number, price_per_meter,\n")
                    current_file.write("    price_in_egp, last_inventory_update, currency, payment_plans, image,\n")
                    current_file.write("    offers, is_launch, compound, area, developer, phase, property_type\n")
                    current_file.write(") VALUES\n")
                
                # Process the row data
                try:
                    id_val = clean_integer(row.get('id'))
                    unit_id = row.get('unit_id') if row.get('unit_id') and row.get('unit_id').strip() else None
                    original_unit_id = row.get('original_unit_id') if row.get('original_unit_id') and row.get('original_unit_id').strip() else None
                    sale_type = row.get('sale_type') if row.get('sale_type') and row.get('sale_type').strip() else None
                    unit_number = row.get('unit_number') if row.get('unit_number') and row.get('unit_number').strip() else None
                    
                    unit_area = clean_numeric(row.get('unit_area'))
                    bedrooms = clean_integer(row.get('number_of_bedrooms'))
                    bathrooms = clean_integer(row.get('number_of_bathrooms'))
                    
                    ready_by = row.get('ready_by')
                    if ready_by and '+' in ready_by:
                        ready_by = ready_by.split('+')[0]
                    if not ready_by or ready_by.strip() == '':
                        ready_by = None
                    
                    finishing = row.get('finishing') if row.get('finishing') and row.get('finishing').strip() else None
                    garden_area = clean_numeric(row.get('garden_area'))
                    roof_area = clean_numeric(row.get('roof_area'))
                    floor_number = clean_numeric(row.get('floor_number'))
                    building_number = row.get('building_number') if row.get('building_number') and row.get('building_number').strip() else None
                    price_per_meter = clean_numeric(row.get('price_per_meter'))
                    price_in_egp = clean_numeric(row.get('price_in_egp'))
                    
                    last_update = row.get('last_inventory_update')
                    if last_update and '+' in last_update:
                        last_update = last_update.split('+')[0]
                    if not last_update or last_update.strip() == '':
                        last_update = None
                    
                    currency = row.get('currency', 'EGP')
                    
                    payment_plans = parse_json_field(row.get('payment_plans'))
                    image = row.get('image') if row.get('image') and row.get('image').strip() else None
                    offers = parse_json_field(row.get('offers'))
                    is_launch = str(row.get('is_launch', 'false')).lower() == 'true'
                    
                    compound = parse_json_field(row.get('compound'))
                    area = parse_json_field(row.get('area'))
                    developer = parse_json_field(row.get('developer'))
                    phase = parse_json_field(row.get('phase'))
                    property_type = parse_json_field(row.get('property_type'))
                    
                    # Write the record
                    if records_in_batch > 0:
                        current_file.write(",\n")
                    
                    values = [
                        sql_escape(id_val), sql_escape(unit_id), sql_escape(original_unit_id),
                        sql_escape(sale_type), sql_escape(unit_number), sql_escape(unit_area),
                        sql_escape(bedrooms), sql_escape(bathrooms), sql_escape(ready_by),
                        sql_escape(finishing), sql_escape(garden_area), sql_escape(roof_area),
                        sql_escape(floor_number), sql_escape(building_number), sql_escape(price_per_meter),
                        sql_escape(price_in_egp), sql_escape(last_update), sql_escape(currency),
                        sql_escape(payment_plans), sql_escape(image), sql_escape(offers),
                        sql_escape(is_launch), sql_escape(compound), sql_escape(area),
                        sql_escape(developer), sql_escape(phase), sql_escape(property_type)
                    ]
                    
                    current_file.write(f"({', '.join(values)})")
                    records_in_batch += 1
                    
                except Exception as e:
                    print(f"Error processing row {row_num}: {e}")
                    continue
                
                # Complete batch
                if records_in_batch >= batch_size:
                    current_file.write("\nON CONFLICT (id) DO UPDATE SET\n")
                    current_file.write("    unit_id = EXCLUDED.unit_id,\n")
                    current_file.write("    price_in_egp = EXCLUDED.price_in_egp,\n")
                    current_file.write("    updated_at = NOW()")
                    
                    # Add RLS re-enable to last batch
                    if row_num >= 23000:  # Near the end
                        current_file.write(";\n\n-- Re-enable RLS\n")
                        current_file.write("ALTER TABLE sale_mate_inventory ENABLE ROW LEVEL SECURITY;\n\n")
                        current_file.write("COMMIT;\n")
                    else:
                        current_file.write(";\n\nCOMMIT;\n")
                    
                    current_file.close()
                    print(f"✅ Created BATCH_{batch_num:03d}.sql with {records_in_batch} records")
                    
                    batch_num += 1
                    records_in_batch = 0
                    current_file = None
                
                if row_num % 500 == 0:
                    print(f"📊 Processed {row_num} rows...")
        
        # Handle remaining records
        if current_file and records_in_batch > 0:
            current_file.write("\nON CONFLICT (id) DO UPDATE SET\n")
            current_file.write("    unit_id = EXCLUDED.unit_id,\n")
            current_file.write("    price_in_egp = EXCLUDED.price_in_egp,\n")
            current_file.write("    updated_at = NOW();\n\n")
            current_file.write("-- Re-enable RLS\n")
            current_file.write("ALTER TABLE sale_mate_inventory ENABLE ROW LEVEL SECURITY;\n\n")
            current_file.write("COMMIT;\n")
            current_file.close()
            print(f"✅ Created BATCH_{batch_num:03d}.sql with {records_in_batch} records")
        
        print(f"\n🎉 Created {batch_num} small batch files!")
        print("Each file is small enough for Supabase Dashboard import")
        
        return True
        
    except Exception as e:
        print(f"Error: {e}")
        if current_file:
            current_file.close()
        return False

if __name__ == "__main__":
    if create_small_batches():
        print("\n🎯 Ready to import!")
        print("Import files: BATCH_001.sql through BATCH_XXX.sql")
        print("Each file contains 50 records and can be easily imported via Supabase Dashboard")
    else:
        print("❌ Failed to create batches")
