# BRData Properties Import Guide

This guide will help you import the `brdata_properties_rows (1).sql` file into your Supabase database.

## 📋 Overview

The SQL file contains property data with the following structure:
- **File Size**: ~246MB
- **Estimated Records**: Thousands of property records
- **Data Type**: Property listings with detailed information including payment plans, pricing, and metadata

## 🛠️ Setup Steps

### Step 1: Create the Table Structure

The table structure has been created in the migration file:
```
supabase/migrations/0070_create_brdata_properties_table.sql
```

### Step 2: Apply the Migration

Run one of these commands to create the table:

**Option A: Using Supabase CLI (Recommended)**
```bash
cd supabase
npx supabase db push
```

**Option B: Direct SQL Execution**
If the migration has conflicts, you can run the SQL directly:
```bash
# Connect to your Supabase database and run the migration SQL
psql "postgresql://postgres:[YOUR_PASSWORD]@db.wkxbhvckmgrmdkdkhnqo.supabase.co:5432/postgres" -f migrations/0070_create_brdata_properties_table.sql
```

### Step 3: Prepare the Data File

The original SQL file needs to be modified to work with our table structure:

1. **Add INSERT Statement**: The file contains VALUES but no INSERT INTO statement
2. **Format the Data**: Ensure the data matches our column order

### Step 4: Import the Data

**Option A: Using Python Script (Recommended for large files)**
```bash
python3 import_brdata_properties.py
```

**Option B: Direct SQL Import**
```bash
# After modifying the SQL file to include proper INSERT statements:
psql "postgresql://postgres:[YOUR_PASSWORD]@db.wkxbhvckmgrmdkdkhnqo.supabase.co:5432/postgres" -f "brdata_properties_rows (1).sql"
```

## 📊 Table Structure

The `brdata_properties` table includes:

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key - Property ID |
| `unit_code` | TEXT | Unit code |
| `unit_reference` | TEXT | Unit reference |
| `property_type` | TEXT | Property type (default: 'primary') |
| `area` | DECIMAL | Property area in sqm |
| `bedrooms` | INTEGER | Number of bedrooms |
| `bathrooms` | INTEGER | Number of bathrooms |
| `delivery_date` | TIMESTAMPTZ | Expected delivery date |
| `status` | TEXT | Property status |
| `price_per_meter` | DECIMAL | Price per square meter |
| `total_price` | DECIMAL | Total property price |
| `payment_plans` | JSONB | Payment plan options |
| `project_info` | JSONB | Project information |
| `location_info` | JSONB | Location information |
| `developer_info` | JSONB | Developer information |

## 🔍 Data Sample

Based on the file analysis, each record contains:
- Property IDs (like '103330', '334271', etc.)
- Unit codes and references
- Area measurements and pricing
- Complex payment plan JSON data
- Project, location, and developer metadata
- Image URLs and additional property details

## ⚠️ Important Notes

1. **Large File**: The 246MB file may require batch processing
2. **JSON Data**: Payment plans and metadata are stored as JSON for flexibility
3. **Indexes**: Performance indexes are created for common query patterns
4. **Currency**: All prices are in EGP (Egyptian Pounds)

## 🚀 Next Steps

1. Apply the migration to create the table structure
2. Modify the SQL file to include proper INSERT statements
3. Import the data using your preferred method
4. Verify the import was successful
5. Configure any additional RLS policies if needed

## 💡 Tips

- For very large imports, consider using `COPY` command instead of INSERT
- Monitor database performance during import
- Consider importing in batches if you encounter timeout issues
- The JSON columns allow for flexible querying of complex property data

## 📞 Support

If you encounter any issues during the import process, check:
1. Database connection and credentials
2. Available disk space in your Supabase project
3. Any timeout settings that might affect large imports

