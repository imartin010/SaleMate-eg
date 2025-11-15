#!/usr/bin/env python3
"""
Split brdata_properties_rows.csv into 5 equal parts
Each part will have approximately the same number of rows (excluding header)
"""

import csv
import os
import math

def split_csv_into_5():
    input_file = 'brdata_properties_rows.csv'
    
    if not os.path.exists(input_file):
        print(f"❌ Error: {input_file} not found!")
        return False
    
    print(f"📊 Analyzing {input_file}...")
    
    # Count total rows (excluding header)
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)  # Skip header
        total_rows = sum(1 for row in reader)
    
    print(f"📈 Total data rows: {total_rows:,}")
    print(f"📋 Columns: {len(header)}")
    
    # Calculate rows per file
    rows_per_file = math.ceil(total_rows / 5)
    print(f"📄 Rows per file: ~{rows_per_file:,}")
    
    # Create output files
    output_files = []
    file_writers = []
    
    for i in range(5):
        filename = f'brdata_properties_part_{i+1:02d}.csv'
        output_files.append(filename)
        file_handle = open(filename, 'w', newline='', encoding='utf-8')
        writer = csv.writer(file_handle)
        writer.writerow(header)  # Write header to each file
        file_writers.append((file_handle, writer))
    
    print(f"📂 Created 5 output files...")
    
    # Split the data
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            next(reader)  # Skip header
            
            row_count = 0
            file_index = 0
            rows_in_current_file = 0
            
            for row in reader:
                # Write row to current file
                file_writers[file_index][1].writerow(row)
                rows_in_current_file += 1
                row_count += 1
                
                # Check if we should move to next file
                if rows_in_current_file >= rows_per_file and file_index < 4:
                    print(f"✅ File {file_index + 1}: {rows_in_current_file:,} rows")
                    file_index += 1
                    rows_in_current_file = 0
                
                # Progress indicator
                if row_count % 1000 == 0:
                    print(f"   Processing row {row_count:,}/{total_rows:,}...")
        
        # Print final count for last file
        print(f"✅ File {file_index + 1}: {rows_in_current_file:,} rows")
        
    finally:
        # Close all files
        for file_handle, _ in file_writers:
            file_handle.close()
    
    print(f"\n🎉 Successfully split {input_file} into 5 files:")
    
    # Verify the splits
    total_verify = 0
    for i, filename in enumerate(output_files):
        with open(filename, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            next(reader)  # Skip header
            file_rows = sum(1 for row in reader)
            total_verify += file_rows
            print(f"   📄 {filename}: {file_rows:,} rows")
    
    print(f"\n✅ Verification: {total_verify:,} total rows (should match {total_rows:,})")
    
    if total_verify == total_rows:
        print("🎯 Perfect split! All rows accounted for.")
        return True
    else:
        print("⚠️  Warning: Row count mismatch!")
        return False

if __name__ == "__main__":
    print("🔄 Starting CSV split process...")
    success = split_csv_into_5()
    if success:
        print("✅ Split completed successfully!")
    else:
        print("❌ Split failed!")
