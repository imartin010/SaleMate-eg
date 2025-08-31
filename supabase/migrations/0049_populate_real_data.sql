-- Populate real data for SaleMate platform
-- This creates actual projects and leads for the production system

-- First, let's create some real projects
INSERT INTO projects (id, name, developer, region, available_leads, price_per_lead, description, created_at, updated_at) VALUES
-- New Cairo Projects
('01234567-1234-1234-1234-123456789001', 'New Capital Towers', 'Capital Group', 'New Cairo', 150, 120.00, 'Premium residential towers in New Cairo with modern amenities, shopping mall, and green spaces', NOW(), NOW()),
('01234567-1234-1234-1234-123456789002', 'Cairo Festival City', 'Al-Futtaim Group', 'New Cairo', 200, 110.00, 'Integrated city with residential, commercial, and entertainment facilities', NOW(), NOW()),
('01234567-1234-1234-1234-123456789003', 'Mountain View Hyde Park', 'Mountain View', 'New Cairo', 180, 130.00, 'Luxury residential compound with golf course and premium amenities', NOW(), NOW()),

-- North Coast Projects  
('01234567-1234-1234-1234-123456789004', 'Marina Heights', 'Marina Developments', 'North Coast', 120, 150.00, 'Luxury beachfront apartments with stunning sea views and private beaches', NOW(), NOW()),
('01234567-1234-1234-1234-123456789005', 'Hacienda Bay', 'Palm Hills', 'North Coast', 90, 140.00, 'Premium beachfront resort with world-class amenities and services', NOW(), NOW()),

-- Sheikh Zayed Projects
('01234567-1234-1234-1234-123456789006', 'Garden City Residences', 'Green Developments', 'Sheikh Zayed', 100, 100.00, 'Family-friendly compound with beautiful gardens and recreational facilities', NOW(), NOW()),
('01234567-1234-1234-1234-123456789007', 'Beverly Hills', 'Saudi Egyptian Company', 'Sheikh Zayed', 80, 125.00, 'Luxury villas and townhouses in a gated community', NOW(), NOW()),

-- Downtown Cairo Projects
('01234567-1234-1234-1234-123456789008', 'Downtown Plaza', 'Urban Developers', 'Downtown Cairo', 75, 180.00, 'Modern commercial and residential complex in the heart of Cairo', NOW(), NOW()),
('01234567-1234-1234-1234-123456789009', 'Nile Towers', 'Nile Developments', 'Downtown Cairo', 60, 200.00, 'Luxury towers overlooking the Nile with premium finishes', NOW(), NOW()),

-- 6th of October Projects
('01234567-1234-1234-1234-123456789010', 'Zayed Dunes', 'Tatweer Misr', '6th of October', 110, 95.00, 'Modern residential community with comprehensive amenities', NOW(), NOW());

-- Now let's create sample leads for these projects
-- New Capital Towers leads
INSERT INTO leads (id, project_id, client_name, client_phone, client_phone2, client_phone3, client_email, client_job_title, platform, stage, feedback, created_at, updated_at) VALUES
-- Unassigned leads (available for purchase)
('11111111-1111-1111-1111-111111111001', '01234567-1234-1234-1234-123456789001', 'Ahmed Mohamed Ali', '+201012345678', '+201012345679', NULL, 'ahmed.mohamed@email.com', 'Software Engineer', 'Facebook', 'New Lead', NULL, NOW() - INTERVAL '1 day', NOW()),
('11111111-1111-1111-1111-111111111002', '01234567-1234-1234-1234-123456789001', 'Fatma Hassan Ibrahim', '+201087654321', NULL, NULL, 'fatma.hassan@email.com', 'Medical Doctor', 'Google', 'New Lead', NULL, NOW() - INTERVAL '2 days', NOW()),
('11111111-1111-1111-1111-111111111003', '01234567-1234-1234-1234-123456789001', 'Omar Khaled Mahmoud', '+201123456789', '+201123456790', NULL, 'omar.khaled@business.com', 'Business Owner', 'TikTok', 'New Lead', NULL, NOW() - INTERVAL '3 days', NOW()),
('11111111-1111-1111-1111-111111111004', '01234567-1234-1234-1234-123456789001', 'Mona Samir Ahmed', '+201234567890', NULL, NULL, 'mona.samir@email.com', 'Teacher', 'Facebook', 'New Lead', NULL, NOW() - INTERVAL '4 days', NOW()),
('11111111-1111-1111-1111-111111111005', '01234567-1234-1234-1234-123456789001', 'Hassan Ali Mohamed', '+201345678901', '+201345678902', NULL, 'hassan.ali@company.com', 'Marketing Manager', 'Google', 'New Lead', NULL, NOW() - INTERVAL '5 days', NOW()),

-- Marina Heights leads
('11111111-1111-1111-1111-111111111006', '01234567-1234-1234-1234-123456789004', 'Nour Abdel Rahman', '+201456789012', NULL, NULL, 'nour.abdel@email.com', 'Architect', 'Facebook', 'New Lead', NULL, NOW() - INTERVAL '1 day', NOW()),
('11111111-1111-1111-1111-111111111007', '01234567-1234-1234-1234-123456789004', 'Karim Mostafa', '+201567890123', '+201567890124', NULL, 'karim.mostafa@email.com', 'Financial Advisor', 'Google', 'New Lead', NULL, NOW() - INTERVAL '2 days', NOW()),
('11111111-1111-1111-1111-111111111008', '01234567-1234-1234-1234-123456789004', 'Yasmin Farouk', '+201678901234', NULL, NULL, 'yasmin.farouk@email.com', 'Lawyer', 'TikTok', 'New Lead', NULL, NOW() - INTERVAL '3 days', NOW()),

-- Garden City Residences leads
('11111111-1111-1111-1111-111111111009', '01234567-1234-1234-1234-123456789006', 'Mahmoud Sayed', '+201789012345', '+201789012346', NULL, 'mahmoud.sayed@email.com', 'Engineer', 'Facebook', 'New Lead', NULL, NOW() - INTERVAL '1 day', NOW()),
('11111111-1111-1111-1111-111111111010', '01234567-1234-1234-1234-123456789006', 'Rania Hosni', '+201890123456', NULL, NULL, 'rania.hosni@email.com', 'Pharmacist', 'Google', 'New Lead', NULL, NOW() - INTERVAL '2 days', NOW()),

-- Add more leads for other projects (50+ leads per project to enable purchases)
-- Cairo Festival City leads
('11111111-1111-1111-1111-111111111011', '01234567-1234-1234-1234-123456789002', 'Amr Tarek', '+201901234567', NULL, NULL, 'amr.tarek@email.com', 'Sales Manager', 'Facebook', 'New Lead', NULL, NOW() - INTERVAL '1 day', NOW()),
('11111111-1111-1111-1111-111111111012', '01234567-1234-1234-1234-123456789002', 'Dina Youssef', '+201012345670', '+201012345671', NULL, 'dina.youssef@email.com', 'HR Manager', 'Google', 'New Lead', NULL, NOW() - INTERVAL '2 days', NOW()),
('11111111-1111-1111-1111-111111111013', '01234567-1234-1234-1234-123456789002', 'Tamer Nabil', '+201123456780', NULL, NULL, 'tamer.nabil@email.com', 'IT Specialist', 'TikTok', 'New Lead', NULL, NOW() - INTERVAL '3 days', NOW());

-- Let's add many more leads to reach the available_leads count for each project
-- This will be done with a function to generate bulk leads

-- Function to generate bulk leads for testing
CREATE OR REPLACE FUNCTION generate_sample_leads()
RETURNS VOID AS $$
DECLARE
    project_record RECORD;
    lead_count INTEGER;
    i INTEGER;
    client_names TEXT[] := ARRAY[
        'Mohamed Ahmed', 'Fatma Ali', 'Omar Hassan', 'Mona Samir', 'Ahmed Khaled',
        'Nour Ibrahim', 'Karim Mostafa', 'Yasmin Farouk', 'Mahmoud Sayed', 'Rania Hosni',
        'Amr Tarek', 'Dina Youssef', 'Tamer Nabil', 'Salma Adel', 'Hossam Magdy',
        'Aya Mohamed', 'Sherif Gamal', 'Noha Essam', 'Waleed Ashraf', 'Mariam Tamer'
    ];
    job_titles TEXT[] := ARRAY[
        'Engineer', 'Doctor', 'Teacher', 'Lawyer', 'Accountant',
        'Manager', 'Consultant', 'Architect', 'Pharmacist', 'Dentist',
        'Business Owner', 'Sales Manager', 'Marketing Specialist', 'IT Specialist', 'Designer'
    ];
    platforms TEXT[] := ARRAY['Facebook', 'Google', 'TikTok', 'Other'];
BEGIN
    -- For each project, generate enough leads to match available_leads
    FOR project_record IN 
        SELECT id, name, available_leads 
        FROM projects 
        WHERE available_leads > 0
    LOOP
        -- Count existing leads for this project
        SELECT COUNT(*) INTO lead_count
        FROM leads 
        WHERE project_id = project_record.id;
        
        -- Generate additional leads if needed
        FOR i IN (lead_count + 1)..(project_record.available_leads + lead_count) LOOP
            INSERT INTO leads (
                id,
                project_id,
                client_name,
                client_phone,
                client_phone2,
                client_email,
                client_job_title,
                platform,
                stage,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                project_record.id,
                client_names[((i - 1) % array_length(client_names, 1)) + 1] || ' ' || i::TEXT,
                '+2010' || LPAD((12345678 + i)::TEXT, 8, '0'),
                CASE WHEN i % 3 = 0 THEN '+2011' || LPAD((12345678 + i)::TEXT, 8, '0') ELSE NULL END,
                LOWER(REPLACE(client_names[((i - 1) % array_length(client_names, 1)) + 1], ' ', '.')) || i::TEXT || '@email.com',
                job_titles[((i - 1) % array_length(job_titles, 1)) + 1],
                platforms[((i - 1) % array_length(platforms, 1)) + 1]::platform_type,
                'New Lead'::lead_stage,
                NOW() - (i || ' days')::INTERVAL,
                NOW()
            );
        END LOOP;
        
        RAISE NOTICE 'Generated % leads for project: %', project_record.available_leads, project_record.name;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to generate leads
SELECT generate_sample_leads();

-- Drop the function after use
DROP FUNCTION generate_sample_leads();

-- Update projects table statistics
UPDATE projects SET updated_at = NOW();

-- Verify data
DO $$
DECLARE
    project_count INTEGER;
    lead_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO project_count FROM projects;
    SELECT COUNT(*) INTO lead_count FROM leads WHERE buyer_user_id IS NULL;
    
    RAISE NOTICE 'Data populated successfully:';
    RAISE NOTICE '- Projects: %', project_count;
    RAISE NOTICE '- Available leads: %', lead_count;
END $$;
