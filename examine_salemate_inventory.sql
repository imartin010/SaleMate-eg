-- EXAMINE SALEMATE-INVENTORY TABLE STRUCTURE
-- This will help us understand the compound column format

-- First, let's see the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'salemate-inventory'
ORDER BY ordinal_position;
