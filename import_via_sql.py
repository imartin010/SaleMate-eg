#!/usr/bin/env python3
"""
Import inventory data using SQL files
This creates a single large SQL file that can be imported via Supabase Dashboard
"""

import os
import glob

def combine_sql_files():
    """Combine all the part files into one large SQL file"""
    
    # Find all the part files
    part_files = sorted(glob.glob("/Users/martin2/Desktop/Sale Mate Final/import_inventory_part_*.sql"))
    
    if not part_files:
        print("❌ No import part files found!")
        return False
    
    output_file = "/Users/martin2/Desktop/Sale Mate Final/COMPLETE_INVENTORY_IMPORT.sql"
    
    print(f"🔄 Combining {len(part_files)} SQL files...")
    
    with open(output_file, 'w') as outfile:
        outfile.write("-- COMPLETE SALE MATE INVENTORY IMPORT\n")
        outfile.write("-- This file contains all 23,157 inventory records\n")
        outfile.write("-- Generated automatically from CSV data\n\n")
        outfile.write("-- Disable RLS temporarily for bulk import\n")
        outfile.write("ALTER TABLE sale_mate_inventory DISABLE ROW LEVEL SECURITY;\n\n")
        
        for i, part_file in enumerate(part_files, 1):
            print(f"📄 Processing file {i}/{len(part_files)}: {os.path.basename(part_file)}")
            
            with open(part_file, 'r') as infile:
                content = infile.read()
                
                # Remove BEGIN/COMMIT from individual files
                content = content.replace('BEGIN;', '').replace('COMMIT;', '')
                
                # Add the content
                outfile.write(f"-- Part {i} from {os.path.basename(part_file)}\n")
                outfile.write(content)
                outfile.write("\n\n")
        
        # Re-enable RLS and add verification queries
        outfile.write("-- Re-enable RLS\n")
        outfile.write("ALTER TABLE sale_mate_inventory ENABLE ROW LEVEL SECURITY;\n\n")
        outfile.write("-- Verification queries\n")
        outfile.write("SELECT COUNT(*) as total_records FROM sale_mate_inventory;\n\n")
        outfile.write("SELECT \n")
        outfile.write("    compound->>'name' as compound_name, \n")
        outfile.write("    developer->>'name' as developer_name,\n")
        outfile.write("    COUNT(*) as property_count,\n")
        outfile.write("    AVG(price_in_egp) as avg_price\n")
        outfile.write("FROM sale_mate_inventory \n")
        outfile.write("WHERE compound IS NOT NULL AND developer IS NOT NULL\n")
        outfile.write("GROUP BY compound->>'name', developer->>'name'\n")
        outfile.write("ORDER BY property_count DESC\n")
        outfile.write("LIMIT 20;\n")
    
    print(f"\n✅ Combined SQL file created: {output_file}")
    
    # Get file size
    file_size = os.path.getsize(output_file)
    file_size_mb = file_size / (1024 * 1024)
    print(f"📊 File size: {file_size_mb:.1f} MB")
    
    if file_size_mb > 50:
        print("⚠️  File is quite large. Consider importing in smaller chunks.")
        return create_smaller_chunks(output_file)
    
    return True

def create_smaller_chunks(large_file):
    """Create smaller chunks if the file is too large"""
    print("🔄 Creating smaller chunks for easier import...")
    
    chunk_size = 5000  # 5000 lines per chunk
    chunk_num = 1
    
    with open(large_file, 'r') as infile:
        lines = infile.readlines()
    
    # Split into chunks
    for i in range(0, len(lines), chunk_size):
        chunk_file = f"/Users/martin2/Desktop/Sale Mate Final/IMPORT_CHUNK_{chunk_num:02d}.sql"
        chunk_lines = lines[i:i + chunk_size]
        
        with open(chunk_file, 'w') as outfile:
            if chunk_num == 1:
                # Add header and RLS disable only to first chunk
                outfile.write("-- SALE MATE INVENTORY IMPORT - CHUNK 1\n")
                outfile.write("ALTER TABLE sale_mate_inventory DISABLE ROW LEVEL SECURITY;\n\n")
            else:
                outfile.write(f"-- SALE MATE INVENTORY IMPORT - CHUNK {chunk_num}\n\n")
            
            outfile.writelines(chunk_lines)
            
            # Add RLS enable only to last chunk
            if i + chunk_size >= len(lines):
                outfile.write("\n-- Re-enable RLS\n")
                outfile.write("ALTER TABLE sale_mate_inventory ENABLE ROW LEVEL SECURITY;\n")
        
        print(f"📄 Created chunk {chunk_num}: {os.path.basename(chunk_file)}")
        chunk_num += 1
    
    print(f"\n✅ Created {chunk_num - 1} smaller import chunks")
    return True

if __name__ == "__main__":
    print("🚀 Starting SQL file combination...")
    
    if combine_sql_files():
        print("\n🎯 Import files ready!")
        print("\nNext steps:")
        print("1. Go to Supabase Dashboard → SQL Editor")
        print("2. Copy and paste the contents of COMPLETE_INVENTORY_IMPORT.sql")
        print("3. Or use the smaller chunks if the file is too large")
        print("4. Execute the SQL to import all inventory data")
    else:
        print("\n❌ Failed to prepare import files")
