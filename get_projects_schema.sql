-- GET PROJECTS TABLE SCHEMA
-- This will show the exact structure of the projects table

-- 1) Show all columns in the projects table
SELECT 
    'PROJECTS_COLUMNS' as info_type,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'projects'
ORDER BY ordinal_position;

-- 2) Show constraints on projects table
SELECT 
    'PROJECTS_CONSTRAINTS' as info_type,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
LEFT JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public' 
    AND tc.table_name = 'projects'
ORDER BY tc.constraint_type, tc.constraint_name;

-- 3) Show any existing data in projects table
SELECT 
    'PROJECTS_DATA' as info_type,
    COUNT(*) as row_count
FROM public.projects;

-- 4) Show sample of existing projects data (if any)
SELECT 
    'PROJECTS_SAMPLE' as info_type,
    *
FROM public.projects 
LIMIT 5;

