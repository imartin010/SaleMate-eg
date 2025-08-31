#!/usr/bin/env python3
"""
Create manageable import files for Supabase Dashboard
Combines batches into 10 larger files that are still small enough for dashboard
"""

import os
import glob

def create_manageable_files():
    """Combine batches into 10 manageable files"""
    
    # Find all batch files
    batch_files = sorted(glob.glob("/Users/martin2/Desktop/Sale Mate Final/BATCH_*.sql"))
    
    if not batch_files:
        print("❌ No batch files found!")
        return False
    
    print(f"🔄 Combining {len(batch_files)} batches into 10 manageable files...")
    
    # Calculate files per group
    files_per_group = len(batch_files) // 10 + (1 if len(batch_files) % 10 != 0 else 0)
    
    for group_num in range(1, 11):
        start_idx = (group_num - 1) * files_per_group
        end_idx = min(start_idx + files_per_group, len(batch_files))
        
        if start_idx >= len(batch_files):
            break
            
        group_files = batch_files[start_idx:end_idx]
        output_file = f"/Users/martin2/Desktop/Sale Mate Final/IMPORT_GROUP_{group_num:02d}.sql"
        
        print(f"📄 Creating Group {group_num}: {len(group_files)} batches ({start_idx+1}-{end_idx})")
        
        with open(output_file, 'w') as outfile:
            outfile.write(f"-- INVENTORY IMPORT GROUP {group_num}\n")
            outfile.write(f"-- Contains batches {start_idx+1} to {end_idx}\n")
            outfile.write(f"-- Approximately {len(group_files) * 50} records\n\n")
            
            # Add RLS disable only to first group
            if group_num == 1:
                outfile.write("-- Disable RLS for import\n")
                outfile.write("ALTER TABLE sale_mate_inventory DISABLE ROW LEVEL SECURITY;\n\n")
            
            # Combine all files in this group
            for i, batch_file in enumerate(group_files):
                with open(batch_file, 'r') as infile:
                    content = infile.read()
                    
                    # Remove individual BEGIN/COMMIT and RLS commands
                    content = content.replace('BEGIN;', '')
                    content = content.replace('COMMIT;', '')
                    content = content.replace('-- Disable RLS for import\n', '')
                    content = content.replace('ALTER TABLE sale_mate_inventory DISABLE ROW LEVEL SECURITY;\n', '')
                    content = content.replace('-- Re-enable RLS\n', '')
                    content = content.replace('ALTER TABLE sale_mate_inventory ENABLE ROW LEVEL SECURITY;\n', '')
                    
                    # Clean up extra whitespace
                    content = content.strip()
                    if content:
                        outfile.write(content)
                        if i < len(group_files) - 1:  # Not the last file
                            outfile.write("\n\n")
            
            # Add RLS enable only to last group
            if group_num == 10 or end_idx >= len(batch_files):
                outfile.write("\n\n-- Re-enable RLS\n")
                outfile.write("ALTER TABLE sale_mate_inventory ENABLE ROW LEVEL SECURITY;\n")
        
        # Check file size
        file_size = os.path.getsize(output_file)
        file_size_mb = file_size / (1024 * 1024)
        print(f"   📊 Size: {file_size_mb:.1f} MB")
    
    print(f"\n✅ Created 10 manageable import files!")
    print("Files: IMPORT_GROUP_01.sql through IMPORT_GROUP_10.sql")
    
    return True

def create_simple_test():
    """Create a simple test file with just 10 records"""
    test_file = "/Users/martin2/Desktop/Sale Mate Final/TEST_IMPORT.sql"
    
    with open("/Users/martin2/Desktop/Sale Mate Final/BATCH_001.sql", 'r') as infile:
        lines = infile.readlines()
    
    with open(test_file, 'w') as outfile:
        outfile.write("-- TEST IMPORT - Just 10 records\n")
        outfile.write("-- Use this to test the import process first\n\n")
        outfile.write("ALTER TABLE sale_mate_inventory DISABLE ROW LEVEL SECURITY;\n\n")
        outfile.write("BEGIN;\n\n")
        
        # Find the INSERT statement and take only first few records
        in_insert = False
        record_count = 0
        for line in lines:
            if "INSERT INTO sale_mate_inventory" in line:
                in_insert = True
                outfile.write(line)
                continue
            elif in_insert and line.strip().startswith('('):
                if record_count < 10:
                    if record_count > 0:
                        outfile.write(",\n")
                    else:
                        outfile.write(") VALUES\n")
                    outfile.write(line.rstrip().rstrip(','))
                    record_count += 1
                else:
                    break
            elif in_insert and ")" in line and "VALUES" in line:
                continue
        
        outfile.write("\nON CONFLICT (id) DO UPDATE SET\n")
        outfile.write("    unit_id = EXCLUDED.unit_id,\n")
        outfile.write("    price_in_egp = EXCLUDED.price_in_egp,\n")
        outfile.write("    updated_at = NOW();\n\n")
        outfile.write("COMMIT;\n\n")
        outfile.write("-- Verify import\n")
        outfile.write("SELECT COUNT(*) as imported_records FROM sale_mate_inventory;\n")
        outfile.write("SELECT compound->>'name' as compound, COUNT(*) FROM sale_mate_inventory GROUP BY compound->>'name' LIMIT 5;\n")
    
    print(f"✅ Created test file: {test_file}")
    return True

if __name__ == "__main__":
    print("🛠️  Creating manageable import files...")
    
    # Create test file first
    create_simple_test()
    
    # Create manageable groups
    if create_manageable_files():
        print("\n🎯 Import files ready!")
        print("\nRecommended approach:")
        print("1. Start with TEST_IMPORT.sql (10 records)")
        print("2. If successful, import IMPORT_GROUP_01.sql through IMPORT_GROUP_10.sql")
        print("3. Each group file is manageable for Supabase Dashboard")
    else:
        print("❌ Failed to create import files")
