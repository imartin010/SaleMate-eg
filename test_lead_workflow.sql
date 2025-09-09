-- TEST LEAD WORKFLOW - VERIFY EVERYTHING WORKS
-- Run this after the main setup to test the complete workflow

-- 1) Add some sample leads to test the workflow
-- First, get a project ID to use
DO $$
DECLARE
    test_project_id uuid;
    admin_user_id uuid;
BEGIN
    -- Get first project ID
    SELECT id INTO test_project_id FROM public.projects LIMIT 1;
    
    -- Get admin user ID (you)
    SELECT id INTO admin_user_id FROM public.profiles WHERE email = 'themartining@gmail.com' LIMIT 1;
    
    IF test_project_id IS NOT NULL THEN
        -- Insert 10 sample leads for testing
        INSERT INTO public.leads (
            project_id, 
            client_name, 
            client_phone, 
            client_email, 
            platform, 
            stage, 
            cpl_price, 
            upload_user_id,
            is_sold,
            buyer_user_id -- NULL means available for purchase
        ) VALUES
        (test_project_id, 'Ahmed Mohamed', '+201234567890', 'ahmed@example.com', 'Facebook', 'New Lead', 25.00, admin_user_id, false, NULL),
        (test_project_id, 'Sara Hassan', '+201234567891', 'sara@example.com', 'Google', 'New Lead', 25.00, admin_user_id, false, NULL),
        (test_project_id, 'Mohamed Ali', '+201234567892', 'mohamed@example.com', 'TikTok', 'New Lead', 25.00, admin_user_id, false, NULL),
        (test_project_id, 'Fatima Omar', '+201234567893', 'fatima@example.com', 'Facebook', 'New Lead', 25.00, admin_user_id, false, NULL),
        (test_project_id, 'Khaled Ahmed', '+201234567894', 'khaled@example.com', 'Google', 'New Lead', 25.00, admin_user_id, false, NULL),
        (test_project_id, 'Nour Ibrahim', '+201234567895', 'nour@example.com', 'Other', 'New Lead', 25.00, admin_user_id, false, NULL),
        (test_project_id, 'Omar Mahmoud', '+201234567896', 'omar@example.com', 'Facebook', 'New Lead', 25.00, admin_user_id, false, NULL),
        (test_project_id, 'Mona Saeed', '+201234567897', 'mona@example.com', 'TikTok', 'New Lead', 25.00, admin_user_id, false, NULL),
        (test_project_id, 'Youssef Nabil', '+201234567898', 'youssef@example.com', 'Google', 'New Lead', 25.00, admin_user_id, false, NULL),
        (test_project_id, 'Rania Farouk', '+201234567899', 'rania@example.com', 'Facebook', 'New Lead', 25.00, admin_user_id, false, NULL);
        
        -- Update project available leads count
        UPDATE public.projects 
        SET available_leads = (
            SELECT COUNT(*) 
            FROM public.leads 
            WHERE project_id = test_project_id 
              AND buyer_user_id IS NULL
        )
        WHERE id = test_project_id;
        
        RAISE NOTICE 'Added 10 sample leads to project: %', test_project_id;
    END IF;
END $$;

-- 2) Verify the workflow setup
SELECT 'Workflow verification:' as info;

-- Check projects
SELECT 
    'Projects:' as table_name,
    COUNT(*) as total_count,
    SUM(available_leads) as total_available_leads
FROM public.projects;

-- Check leads
SELECT 
    'Leads:' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN buyer_user_id IS NULL THEN 1 END) as available_leads,
    COUNT(CASE WHEN buyer_user_id IS NOT NULL THEN 1 END) as purchased_leads
FROM public.leads;

-- Show sample project with leads
SELECT 
    p.name as project_name,
    p.developer,
    p.region,
    p.available_leads as project_available_leads,
    p.price_per_lead,
    COUNT(l.id) as actual_lead_count
FROM public.projects p
LEFT JOIN public.leads l ON p.id = l.project_id AND l.buyer_user_id IS NULL
GROUP BY p.id, p.name, p.developer, p.region, p.available_leads, p.price_per_lead
ORDER BY actual_lead_count DESC
LIMIT 5;

-- 3) Test the assign_leads_to_user function
-- (This simulates what happens when someone purchases leads)
-- SELECT public.assign_leads_to_user(
--     (SELECT id FROM public.profiles WHERE email = 'themartining@gmail.com'),
--     (SELECT id FROM public.projects LIMIT 1),
--     2
-- );
