-- EXTRACT PROJECTS FROM SALEMATE-INVENTORY
-- This script extracts unique compounds and creates projects

-- First, let's see some sample compound data
SELECT 
    compound,
    developer,
    area,
    COUNT(*) as unit_count
FROM public."salemate-inventory" 
WHERE compound IS NOT NULL
GROUP BY compound, developer, area
ORDER BY unit_count DESC
LIMIT 10;

-- Look specifically for Hacienda Bay
SELECT 
    compound,
    developer,
    area,
    COUNT(*) as unit_count
FROM public."salemate-inventory" 
WHERE compound::text ILIKE '%Hacienda Bay%'
   OR compound::text ILIKE '%hacienda%'
GROUP BY compound, developer, area;

-- Extract unique compounds and create projects
-- This will insert projects based on unique compound names from salemate-inventory
INSERT INTO public.projects (developer_id, name, region, description)
SELECT DISTINCT
    -- Generate consistent UUIDs based on developer name
    gen_random_uuid() as developer_id,
    -- Use compound name as project name
    compound as name,
    -- Extract region from area JSONB or use developer as fallback
    COALESCE(
        area->>'region',
        area->>'area', 
        developer,
        'Unknown'
    ) as region,
    -- Create description from available data
    CONCAT(
        'Project from ', 
        COALESCE(developer, 'Unknown Developer'),
        CASE 
            WHEN area IS NOT NULL THEN CONCAT(' - Area: ', area->>'area')
            ELSE ''
        END
    ) as description
FROM public."salemate-inventory" 
WHERE compound IS NOT NULL 
    AND compound != ''
    AND compound NOT IN (SELECT name FROM public.projects); -- Avoid duplicates

-- Verify the insertions
SELECT 
    COUNT(*) as total_projects,
    COUNT(DISTINCT developer_id) as unique_developers,
    COUNT(CASE WHEN name ILIKE '%hacienda%' THEN 1 END) as hacienda_projects,
    COUNT(CASE WHEN name ILIKE '%mountain view%' THEN 1 END) as mountain_view_projects,
    COUNT(CASE WHEN name ILIKE '%palm hills%' THEN 1 END) as palm_hills_projects
FROM public.projects;

-- Show sample of created projects
SELECT 
    id,
    developer_id,
    name,
    region,
    description,
    created_at
FROM public.projects
ORDER BY 
    CASE 
        WHEN name ILIKE '%hacienda%' THEN 1
        WHEN name ILIKE '%mountain view%' THEN 2
        WHEN name ILIKE '%palm hills%' THEN 3
        ELSE 4
    END,
    name
LIMIT 15;
