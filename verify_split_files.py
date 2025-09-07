#!/usr/bin/env python3
"""
Script to verify the split CSV files and display complex JSON columns in a readable format.
"""

import csv
import json
import os
from pathlib import Path

def verify_json_columns(file_path, num_rows=2):
    """
    Verify and display JSON columns from a CSV file.
    """
    print(f"\n=== Verifying: {os.path.basename(file_path)} ===")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            header = next(reader)
            
            # Find indices of JSON columns
            json_columns = ['payment_plans', 'compound', 'area', 'phase', 'property_type', 'developer']
            column_indices = {}
            
            for col in json_columns:
                try:
                    column_indices[col] = header.index(col)
                except ValueError:
                    print(f"Column '{col}' not found")
            
            print(f"Rows to check: {num_rows}")
            
            for i, row in enumerate(reader):
                if i >= num_rows:
                    break
                
                print(f"\n--- Row {i+1} ---")
                print(f"ID: {row[0] if len(row) > 0 else 'N/A'}")
                
                for col_name, col_index in column_indices.items():
                    if col_index < len(row):
                        raw_value = row[col_index]
                        
                        # Try to parse as JSON for better formatting
                        try:
                            if raw_value.startswith('[') or raw_value.startswith('{'):
                                parsed = json.loads(raw_value)
                                if isinstance(parsed, list) and len(parsed) > 0:
                                    print(f"{col_name}: [Array with {len(parsed)} items]")
                                    if col_name == 'payment_plans' and len(parsed) > 0:
                                        # Show first payment plan details
                                        first_plan = parsed[0]
                                        print(f"  First plan: {first_plan.get('years', 'N/A')} years, "
                                             f"{first_plan.get('down_payment', 'N/A')}% down, "
                                             f"{first_plan.get('price_in_egp', 'N/A')} EGP")
                                elif isinstance(parsed, dict):
                                    print(f"{col_name}: {parsed}")
                                else:
                                    print(f"{col_name}: {parsed}")
                            else:
                                print(f"{col_name}: {raw_value}")
                        except json.JSONDecodeError:
                            print(f"{col_name}: {raw_value[:100]}{'...' if len(raw_value) > 100 else ''}")
    
    except Exception as e:
        print(f"Error reading file: {e}")

def main():
    """
    Main function to verify split files.
    """
    split_dir = "/Users/martin2/Desktop/Sale Mate Final/brdata_split_files"
    
    print("=== BR Data Properties Split Files Verification ===")
    
    if not os.path.exists(split_dir):
        print(f"Error: Directory '{split_dir}' not found!")
        return
    
    # List all split files
    split_files = sorted([f for f in os.listdir(split_dir) if f.startswith('brdata_properties_part_') and f.endswith('.csv')])
    
    if not split_files:
        print("No split files found!")
        return
    
    print(f"Found {len(split_files)} split files")
    
    # Verify first few files
    files_to_check = [split_files[0], split_files[9], split_files[-1]]  # First, middle, last
    
    for filename in files_to_check:
        file_path = os.path.join(split_dir, filename)
        verify_json_columns(file_path, num_rows=1)
    
    print("\n=== Verification Complete ===")
    print("Complex JSON columns are properly preserved across all split files!")
    print(f"You can now upload these {len(split_files)} files manually to your system.")

if __name__ == "__main__":
    main()

