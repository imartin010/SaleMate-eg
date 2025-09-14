-- FIX PROJECTS TABLE WITH PROPER DEVELOPER_IDS
-- This script creates projects with valid developer_id values to satisfy NOT NULL constraints

-- First, let's create some developer records if they don't exist
-- (We'll use placeholder UUIDs for now)

-- Insert projects with proper developer_id values
INSERT INTO public.projects (developer_id, name, region, description) VALUES
-- Mountain View Projects
('550e8400-e29b-41d4-a716-446655440001', 'Mountain View Compound', 'New Cairo', 'Premium residential compound with mountain views'),
('550e8400-e29b-41d4-a716-446655440001', 'Mountain View Phase 2', 'New Cairo', 'Second phase of Mountain View development'),
('550e8400-e29b-41d4-a716-446655440001', 'Mountain View Gardens', 'New Cairo', 'Garden villas in Mountain View compound'),

-- Palm Hills Projects  
('550e8400-e29b-41d4-a716-446655440002', 'Palm Hills New Cairo', 'New Cairo', 'Luxury residential development in New Cairo'),
('550e8400-e29b-41d4-a716-446655440002', 'Palm Hills Sheikh Zayed', 'Sheikh Zayed', 'Premium compound in Sheikh Zayed area'),
('550e8400-e29b-41d4-a716-446655440002', 'Palm Hills 6th October', '6th October', 'Modern residential project in 6th October'),

-- Other Developer Projects
('550e8400-e29b-41d4-a716-446655440003', 'Madinaty Compound', 'New Cairo', 'Integrated residential community'),
('550e8400-e29b-41d4-a716-446655440003', 'Madinaty Business Park', 'New Cairo', 'Commercial and business district'),
('550e8400-e29b-41d4-a716-446655440004', 'New Capital City', 'New Administrative Capital', 'Flagship development in the new capital'),
('550e8400-e29b-41d4-a716-446655440004', 'New Capital Business District', 'New Administrative Capital', 'Modern business and residential area'),
('550e8400-e29b-41d4-a716-446655440005', 'Al Rehab City', 'New Cairo', 'Established residential community'),
('550e8400-e29b-41d4-a716-446655440005', 'Al Rehab Extension', 'New Cairo', 'Expansion of Al Rehab development'),
('550e8400-e29b-41d4-a716-446655440006', 'Katameya Heights', 'New Cairo', 'Premium residential compound'),
('550e8400-e29b-41d4-a716-446655440006', 'Katameya Plaza', 'New Cairo', 'Mixed-use development with retail'),
('550e8400-e29b-41d4-a716-446655440007', 'Cairo Festival City', 'New Cairo', 'Large-scale integrated development');

-- Verify the insertions
SELECT 
    COUNT(*) as total_projects,
    COUNT(DISTINCT developer_id) as unique_developers,
    COUNT(CASE WHEN name ILIKE '%mountain view%' THEN 1 END) as mountain_view_projects,
    COUNT(CASE WHEN name ILIKE '%palm hills%' THEN 1 END) as palm_hills_projects
FROM public.projects;

-- Show sample data
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
        WHEN name ILIKE '%mountain view%' THEN 1
        WHEN name ILIKE '%palm hills%' THEN 2
        ELSE 3
    END,
    name
LIMIT 10;

