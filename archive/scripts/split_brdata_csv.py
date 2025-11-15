#!/usr/bin/env python3
"""
Script to split brdata_properties_rows.csv into 20 smaller files
while preserving complex JSON-like data in columns like payment_plans, compound, etc.
"""

import csv
import os
import math
from pathlib import Path

def split_csv_file(input_file, output_dir, num_files=20):
    """
    Split a large CSV file into smaller files while preserving data integrity.
    
    Args:
        input_file (str): Path to the input CSV file
        output_dir (str): Directory to save the split files
        num_files (int): Number of files to split into (default: 20)
    """
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # First, count total rows (excluding header)
    print("Counting rows in the CSV file...")
    with open(input_file, 'r', encoding='utf-8') as f:
        # Use csv.reader to properly handle quoted fields with commas and newlines
        reader = csv.reader(f)
        header = next(reader)  # Read header
        total_rows = sum(1 for _ in reader)
    
    print(f"Total data rows: {total_rows}")
    print(f"Header columns: {len(header)}")
    print("Columns:", header)
    
    # Calculate rows per file
    rows_per_file = math.ceil(total_rows / num_files)
    print(f"Rows per file: {rows_per_file}")
    
    # Now split the file
    print("\nSplitting the file...")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)  # Read header again
        
        current_file_num = 1
        current_row_count = 0
        current_writer = None
        current_file = None
        
        for row_num, row in enumerate(reader, 1):
            # Start a new file if needed
            if current_row_count == 0:
                if current_file:
                    current_file.close()
                
                output_filename = f"brdata_properties_part_{current_file_num:02d}.csv"
                output_path = os.path.join(output_dir, output_filename)
                
                print(f"Creating file {current_file_num}: {output_filename}")
                
                current_file = open(output_path, 'w', newline='', encoding='utf-8')
                current_writer = csv.writer(current_file, quoting=csv.QUOTE_MINIMAL)
                
                # Write header to each file
                current_writer.writerow(header)
                current_row_count = 0
            
            # Write the row
            current_writer.writerow(row)
            current_row_count += 1
            
            # Check if we need to start a new file
            if current_row_count >= rows_per_file and current_file_num < num_files:
                current_file_num += 1
                current_row_count = 0
            
            # Progress indicator
            if row_num % 1000 == 0:
                print(f"Processed {row_num} rows...")
        
        # Close the last file
        if current_file:
            current_file.close()
    
    print(f"\nSplit complete! Created {current_file_num} files in '{output_dir}' directory.")
    
    # Verify the split files
    print("\nVerifying split files...")
    total_split_rows = 0
    
    for i in range(1, current_file_num + 1):
        filename = f"brdata_properties_part_{i:02d}.csv"
        filepath = os.path.join(output_dir, filename)
        
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                reader = csv.reader(f)
                next(reader)  # Skip header
                file_rows = sum(1 for _ in reader)
                total_split_rows += file_rows
                print(f"  {filename}: {file_rows} rows")
        else:
            print(f"  {filename}: FILE NOT FOUND!")
    
    print(f"\nOriginal file rows: {total_rows}")
    print(f"Split files total rows: {total_split_rows}")
    print(f"Match: {'✓' if total_rows == total_split_rows else '✗'}")

def preview_complex_columns(input_file, num_rows=3):
    """
    Preview the complex JSON-like columns to verify they're preserved correctly.
    """
    print(f"\nPreviewing complex columns from first {num_rows} rows...")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        
        # Find indices of complex columns
        complex_columns = ['payment_plans', 'compound', 'area', 'phase', 'property_type', 'developer']
        column_indices = {}
        
        for col in complex_columns:
            try:
                column_indices[col] = header.index(col)
            except ValueError:
                print(f"Column '{col}' not found in header")
        
        print(f"Found columns: {list(column_indices.keys())}")
        
        for i, row in enumerate(reader):
            if i >= num_rows:
                break
                
            print(f"\n--- Row {i+1} ---")
            for col_name, col_index in column_indices.items():
                if col_index < len(row):
                    value = row[col_index]
                    print(f"{col_name}: {value[:200]}{'...' if len(value) > 200 else ''}")

if __name__ == "__main__":
    input_file = "/Users/martin2/Desktop/Sale Mate Final/brdata_properties_rows.csv"
    output_dir = "/Users/martin2/Desktop/Sale Mate Final/brdata_split_files"
    
    print("=== BR Data Properties CSV Splitter ===")
    print(f"Input file: {input_file}")
    print(f"Output directory: {output_dir}")
    print(f"Target number of files: 20")
    
    # Check if input file exists
    if not os.path.exists(input_file):
        print(f"Error: Input file '{input_file}' not found!")
        exit(1)
    
    # Preview complex columns first
    preview_complex_columns(input_file)
    
    # Split the file
    split_csv_file(input_file, output_dir, num_files=20)
    
    print("\n=== Split Complete ===")
    print(f"Files are ready in: {output_dir}")
    print("You can now upload these files manually to your system.")

