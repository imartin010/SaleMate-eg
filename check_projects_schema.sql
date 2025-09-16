-- Check the actual schema of the projects table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND table_schema = 'public'
ORDER BY ordinal_position;
