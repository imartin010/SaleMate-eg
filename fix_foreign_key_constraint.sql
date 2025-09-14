-- FIX FOREIGN KEY CONSTRAINT ISSUE
-- This script will handle the developer_id foreign key constraint

-- Option 1: Create a simple developers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.developers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert some basic developers based on what we see in salemate-inventory
INSERT INTO public.developers (id, name) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Mountain View Developer'),
('550e8400-e29b-41d4-a716-446655440002', 'Palm Hills Developer'),
('550e8400-e29b-41d4-a716-446655440003', 'Madinaty Developer'),
('550e8400-e29b-41d4-a716-446655440004', 'New Capital Developer'),
('550e8400-e29b-41d4-a716-446655440005', 'Al Rehab Developer'),
('550e8400-e29b-41d4-a716-446655440006', 'Katameya Developer'),
('550e8400-e29b-41d4-a716-446655440007', 'Cairo Festival Developer'),
('550e8400-e29b-41d4-a716-446655440008', 'General Developer')
ON CONFLICT (id) DO NOTHING;

-- Now extract projects from salemate-inventory with proper developer mapping
INSERT INTO public.projects (developer_id, name, region, description)
SELECT DISTINCT
    -- Map developers to existing UUIDs or use a default
    CASE 
        WHEN developer ILIKE '%mountain%' THEN '550e8400-e29b-41d4-a716-446655440001'
        WHEN developer ILIKE '%palm%' THEN '550e8400-e29b-41d4-a716-446655440002'
        WHEN developer ILIKE '%madinaty%' THEN '550e8400-e29b-41d4-a716-446655440003'
        WHEN developer ILIKE '%capital%' THEN '550e8400-e29b-41d4-a716-446655440004'
        WHEN developer ILIKE '%rehab%' THEN '550e8400-e29b-41d4-a716-446655440005'
        WHEN developer ILIKE '%katameya%' THEN '550e8400-e29b-41d4-a716-446655440006'
        WHEN developer ILIKE '%cairo%' THEN '550e8400-e29b-41d4-a716-446655440007'
        ELSE '550e8400-e29b-41d4-a716-446655440008' -- Default developer
    END as developer_id,
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
    p.id,
    p.developer_id,
    d.name as developer_name,
    p.name as project_name,
    p.region,
    p.description,
    p.created_at
FROM public.projects p
LEFT JOIN public.developers d ON p.developer_id = d.id
ORDER BY 
    CASE 
        WHEN p.name ILIKE '%hacienda%' THEN 1
        WHEN p.name ILIKE '%mountain view%' THEN 2
        WHEN p.name ILIKE '%palm hills%' THEN 3
        ELSE 4
    END,
    p.name
LIMIT 15;

