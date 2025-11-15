#!/usr/bin/env python3
"""
Fix CSV file to convert float values to integers for integer columns
This fixes the "invalid input syntax for type integer: "0.0"" error
"""

import csv
import sys
import os

# Integer columns that need to be fixed
INTEGER_COLUMNS = [
    'id',
    'number_of_bedrooms',
    'number_of_bathrooms',
    'floor_number'
]

def clean_integer_value(value):
    """Convert float strings to integer strings"""
    if not value or value.strip() == '' or value.strip().lower() in ['null', 'none', 'nan', '']:
        return ''
    
    try:
        # Try to parse as float first (handles "0.0")
        float_val = float(value)
        # Convert to int and back to string
        int_val = int(float_val)
        return str(int_val)
    except (ValueError, TypeError):
        # If it's already an integer or not a number, return as is
        return value.strip()

def fix_csv_file(input_file, output_file):
    """Fix integer columns in CSV file"""
    
    if not os.path.exists(input_file):
        print(f"❌ Error: File not found: {input_file}")
        return False
    
    print(f"📄 Processing: {os.path.basename(input_file)}")
    print(f"💾 Output: {os.path.basename(output_file)}")
    print()
    
    fixed_count = 0
    total_rows = 0
    
    try:
        with open(input_file, 'r', encoding='utf-8') as infile, \
             open(output_file, 'w', encoding='utf-8', newline='') as outfile:
            
            reader = csv.DictReader(infile)
            
            # Get fieldnames and ensure we have all columns
            fieldnames = reader.fieldnames
            if not fieldnames:
                print("❌ Error: CSV file has no headers")
                return False
            
            # Write header
            writer = csv.DictWriter(outfile, fieldnames=fieldnames)
            writer.writeheader()
            
            # Process each row
            for row_num, row in enumerate(reader, 1):
                fixed_row = {}
                
                for col_name, value in row.items():
                    if col_name in INTEGER_COLUMNS:
                        # Fix integer columns
                        original = value
                        fixed = clean_integer_value(value)
                        fixed_row[col_name] = fixed
                        
                        if original != fixed and original.strip() != '':
                            fixed_count += 1
                            if row_num <= 5:  # Show first few fixes
                                print(f"   Row {row_num}, Column '{col_name}': '{original}' → '{fixed}'")
                    else:
                        # Keep other columns as is
                        fixed_row[col_name] = value
                
                writer.writerow(fixed_row)
                total_rows += 1
                
                if total_rows % 1000 == 0:
                    print(f"   ✅ Processed {total_rows} rows...")
        
        print()
        print(f"✅ Successfully fixed CSV file!")
        print(f"   📊 Total rows processed: {total_rows}")
        print(f"   🔧 Values fixed: {fixed_count}")
        print(f"   💾 Output file: {output_file}")
        return True
        
    except Exception as e:
        print(f"❌ Error processing file: {e}")
        return False

def main():
    """Main function"""
    if len(sys.argv) < 2:
        print("Usage: python3 fix_csv_integer_columns.py <input_csv_file> [output_csv_file]")
        print()
        print("Example:")
        print("  python3 fix_csv_integer_columns.py brdata_properties_part_01.csv brdata_properties_part_01_fixed.csv")
        sys.exit(1)
    
    input_file = sys.argv[1]
    
    if len(sys.argv) >= 3:
        output_file = sys.argv[2]
    else:
        # Auto-generate output filename
        base, ext = os.path.splitext(input_file)
        output_file = f"{base}_fixed{ext}"
    
    print("🔧 CSV Integer Column Fixer")
    print("=" * 60)
    print()
    
    if fix_csv_file(input_file, output_file):
        print()
        print("🎉 Done! You can now upload the fixed CSV file to Supabase.")
        sys.exit(0)
    else:
        print()
        print("❌ Failed to fix CSV file.")
        sys.exit(1)

if __name__ == "__main__":
    main()

