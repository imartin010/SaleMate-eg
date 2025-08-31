#!/usr/bin/env python3
"""
Create 5 CSV batches from the original CSV file for manual upload
"""

import csv
import os

def create_csv_batches():
    """Split the original CSV into 5 smaller CSV files"""
    
    original_csv = "/Users/martin2/Desktop/Sale Mate Final/sale_mate_inventory.csv"
    
    if not os.path.exists(original_csv):
        print(f"❌ Original CSV file not found at {original_csv}")
        return False
    
    print("🔄 Creating 10 CSV batches for manual upload...")
    
    # Calculate records per batch (approximately)
    total_lines = sum(1 for line in open(original_csv)) - 1  # Subtract header
    records_per_batch = total_lines // 10
    
    print(f"📊 Total records: {total_lines}")
    print(f"📦 Records per batch: ~{records_per_batch}")
    
    with open(original_csv, 'r', encoding='utf-8') as infile:
        reader = csv.reader(infile)
        header = next(reader)  # Get the header row
        
        current_batch = 1
        current_file = None
        current_writer = None
        row_count = 0
        
        for row in reader:
            # Start new batch file
            if row_count % records_per_batch == 0 and current_batch <= 10:
                if current_file:
                    current_file.close()
                    print(f"✅ Completed batch_{current_batch-1}.csv with {row_count - (current_batch-2)*records_per_batch if current_batch > 1 else row_count} records")
                
                batch_filename = f"/Users/martin2/Desktop/Sale Mate Final/inventory_batch_{current_batch}.csv"
                current_file = open(batch_filename, 'w', newline='', encoding='utf-8')
                current_writer = csv.writer(current_file)
                
                # Write header to each batch
                current_writer.writerow(header)
                
                print(f"📄 Creating inventory_batch_{current_batch}.csv...")
                current_batch += 1
            
            # Write the row
            if current_writer:
                current_writer.writerow(row)
            
            row_count += 1
        
        # Close the last file
        if current_file:
            current_file.close()
            print(f"✅ Completed batch_{current_batch-1}.csv")
    
    print(f"\n🎉 Created 10 CSV batch files!")
    
    # Show file sizes
    for i in range(1, 11):
        batch_file = f"/Users/martin2/Desktop/Sale Mate Final/inventory_batch_{i}.csv"
        if os.path.exists(batch_file):
            size_mb = os.path.getsize(batch_file) / (1024 * 1024)
            with open(batch_file, 'r') as f:
                line_count = sum(1 for line in f) - 1  # Subtract header
            print(f"📦 inventory_batch_{i}.csv: {line_count:,} records, {size_mb:.1f} MB")
    
    return True

if __name__ == "__main__":
    if create_csv_batches():
        print("\n🎯 CSV batches ready for manual upload!")
        print("\nNext steps:")
        print("1. Go to Supabase Dashboard → Table Editor → sale_mate_inventory")
        print("2. Click 'Insert' → 'Import data from CSV'")
        print("3. Upload inventory_batch_1.csv first")
        print("4. Repeat for inventory_batch_2.csv through inventory_batch_10.csv")
        print("5. Supabase will handle the data mapping automatically!")
    else:
        print("❌ Failed to create CSV batches")
