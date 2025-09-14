-- READ DATABASE SCHEMA
-- This will show all tables and their columns to understand the correct structure

-- 1) Show all tables in the public schema
SELECT 
    'TABLES' as info_type,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2) Show detailed column information for all tables
SELECT 
    'COLUMNS' as info_type,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 3) Show foreign key constraints
SELECT 
    'FOREIGN_KEYS' as info_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 4) Show primary key constraints
SELECT 
    'PRIMARY_KEYS' as info_type,
    tc.table_name,
    kcu.column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 5) Show check constraints
SELECT 
    'CHECK_CONSTRAINTS' as info_type,
    tc.table_name,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints AS tc 
JOIN information_schema.check_constraints AS cc
    ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 6) Show unique constraints
SELECT 
    'UNIQUE_CONSTRAINTS' as info_type,
    tc.table_name,
    kcu.column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 7) Show indexes
SELECT 
    'INDEXES' as info_type,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 8) Show specific table details for key tables
SELECT 
    'PROJECTS_TABLE_DETAILS' as info_type,
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

SELECT 
    'LEADS_TABLE_DETAILS' as info_type,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'leads'
ORDER BY ordinal_position;

SELECT 
    'PROFILES_TABLE_DETAILS' as info_type,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'profiles'
ORDER BY ordinal_position;

SELECT 
    'SALEMATE_INVENTORY_TABLE_DETAILS' as info_type,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'salemate-inventory'
ORDER BY ordinal_position;
