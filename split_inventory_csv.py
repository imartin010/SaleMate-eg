#!/usr/bin/env python3
"""
Split large inventory CSV into smaller batches to avoid rate limiting
"""

import pandas as pd
import sys
import os

def split_csv(input_file, batch_size=500):
    """Split CSV into smaller batches"""
    
    if not os.path.exists(input_file):
        print(f"Error: File {input_file} not found")
        return
    
    print(f"Reading {input_file}...")
    df = pd.read_csv(input_file)
    
    total_rows = len(df)
    num_batches = (total_rows + batch_size - 1) // batch_size
    
    print(f"Total rows: {total_rows}")
    print(f"Will create {num_batches} batches of max {batch_size} rows each")
    
    # Create output directory
    output_dir = "inventory_batches"
    os.makedirs(output_dir, exist_ok=True)
    
    # Split into batches
    for i in range(num_batches):
        start_idx = i * batch_size
        end_idx = min((i + 1) * batch_size, total_rows)
        
        batch_df = df.iloc[start_idx:end_idx]
        output_file = f"{output_dir}/inventory_batch_{i+1}.csv"
        
        batch_df.to_csv(output_file, index=False)
        print(f"Created {output_file} with {len(batch_df)} rows")
    
    print(f"\n✅ All batches created in '{output_dir}' directory")
    print("Upload these files one by one to Supabase Table Editor")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python split_inventory_csv.py <input_file.csv>")
        print("Example: python split_inventory_csv.py inventory_batch_1.csv")
        sys.exit(1)
    
    input_file = sys.argv[1]
    split_csv(input_file)

