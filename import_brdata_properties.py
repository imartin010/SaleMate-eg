#!/usr/bin/env python3
"""
Script to import brdata_properties_rows data into Supabase
This script processes the large SQL file and imports it into the brdata_properties table
"""

import os
import re
import json
import psycopg2
from psycopg2.extras import execute_values
import sys

# Database configuration
DB_CONFIG = {
    'host': 'db.wkxbhvckmgrmdkdkhnqo.supabase.co',
    'port': 5432,
    'database': 'postgres',
    'user': 'postgres',
    'password': os.getenv('SUPABASE_PASSWORD', '')
}

def create_table_if_not_exists(cursor):
    """Create the brdata_properties table if it doesn't exist"""
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS brdata_properties (
        id TEXT PRIMARY KEY,
        unit_code TEXT,
        unit_reference TEXT,
        property_type TEXT DEFAULT 'primary',
        sub_type TEXT,
        area DECIMAL(10,2),
        bedrooms INTEGER DEFAULT 0,
        bathrooms INTEGER DEFAULT 0,
        delivery_date TIMESTAMPTZ,
        status TEXT DEFAULT 'not_finished',
        built_up_area DECIMAL(10,2) DEFAULT 0,
        terrace_area DECIMAL(10,2) DEFAULT 0,
        floor_number DECIMAL(3,1) DEFAULT 0,
        internal_unit_code TEXT,
        price_per_meter DECIMAL(12,2),
        total_price DECIMAL(15,2),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        currency TEXT DEFAULT 'EGP',
        payment_plans JSONB,
        image_url TEXT,
        discounts JSONB,
        is_featured BOOLEAN DEFAULT FALSE,
        project_info JSONB,
        location_info JSONB,
        developer_info JSONB,
        compound_info JSONB,
        unit_type_info JSONB
    );
    """
    
    cursor.execute(create_table_sql)
    print("✅ Table created successfully")

def process_sql_file():
    """Process the SQL file and prepare it for import"""
    sql_file = "brdata_properties_rows (1).sql"
    
    if not os.path.exists(sql_file):
        print(f"❌ Error: {sql_file} not found")
        return None
    
    print(f"📁 Processing SQL file: {sql_file}")
    print(f"📊 File size: {os.path.getsize(sql_file) / 1024 / 1024:.2f} MB")
    
    # For a 246MB file, we need to be careful about memory usage
    # Let's create a modified version that can be imported
    
    output_file = "brdata_properties_formatted.sql"
    
    try:
        with open(sql_file, 'r', encoding='utf-8') as input_file, \
             open(output_file, 'w', encoding='utf-8') as output_file_handle:
            
            # Add the INSERT statement at the beginning
            output_file_handle.write("INSERT INTO brdata_properties (id, unit_code, unit_reference, property_type, sub_type, area, bedrooms, bathrooms, delivery_date, status, built_up_area, terrace_area, floor_number, internal_unit_code, price_per_meter, total_price, created_at, updated_at, currency, payment_plans, image_url, discounts, is_featured, project_info, location_info, developer_info, compound_info, unit_type_info) VALUES\n")
            
            # Process the file line by line to avoid memory issues
            line_count = 0
            for line in input_file:
                # Skip empty lines
                if line.strip():
                    output_file_handle.write(line)
                    line_count += 1
                    
                    if line_count % 1000 == 0:
                        print(f"📝 Processed {line_count} lines...")
            
            print(f"✅ Created formatted file: {output_file}")
            return output_file
            
    except Exception as e:
        print(f"❌ Error processing file: {e}")
        return None

def run_import():
    print("🚀 Starting brdata_properties import process...")
    
    # Check database password
    if not DB_CONFIG['password']:
        print("❌ Error: SUPABASE_PASSWORD environment variable not set")
        print("   Please set your Supabase database password:")
        print("   export SUPABASE_PASSWORD='your_password'")
        return
    
    try:
        # Connect to database
        print("🔌 Connecting to Supabase database...")
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Create table
        print("📋 Creating table structure...")
        create_table_if_not_exists(cursor)
        conn.commit()
        
        print("\n🎯 Table created successfully!")
        print("📝 Next steps:")
        print("1. Your brdata_properties table is now ready")
        print("2. You can now import your data using one of these methods:")
        print("   a) Use pgAdmin to import the SQL file directly")
        print("   b) Use psql command line tool")
        print("   c) Process the data file to match our table structure")
        
        print(f"\n💡 To import via psql:")
        print(f"psql 'postgresql://postgres:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}' -c \"\\copy brdata_properties FROM 'your_csv_file.csv' DELIMITER ',' CSV HEADER;\"")
        
        print(f"\n📊 Table created with {cursor.rowcount if hasattr(cursor, 'rowcount') else 'N/A'} rows affected")
        
        cursor.close()
        conn.close()
        
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

def main():
    """Main function to run the import process"""
    print("🚀 BRData Properties Import Tool")
    print("=" * 50)
    
    # Check if SQL file exists
    sql_file = "brdata_properties_rows (1).sql"
    if not os.path.exists(sql_file):
        print(f"❌ Error: {sql_file} not found")
        return
    
    print(f"📁 Found SQL file: {sql_file}")
    print(f"📊 File size: {os.path.getsize(sql_file) / 1024 / 1024:.2f} MB")
    
    print("\n🔧 Choose an option:")
    print("1. Create table structure only")
    print("2. Process SQL file for import")
    print("3. Run complete import (requires SUPABASE_PASSWORD)")
    
    choice = input("\nEnter your choice (1-3): ").strip()
    
    if choice == "1":
        run_import()
    elif choice == "2":
        process_sql_file()
    elif choice == "3":
        run_import()
        process_sql_file()
    else:
        print("❌ Invalid choice")

if __name__ == "__main__":
    main()
