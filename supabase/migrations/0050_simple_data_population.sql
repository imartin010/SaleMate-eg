-- Simple data population for SaleMate
-- Create real projects and leads that work with the existing schema

-- Clear existing data first
DELETE FROM leads;
DELETE FROM projects;

-- Insert real projects
INSERT INTO projects (id, name, developer, region, available_leads, price_per_lead, description, created_at, updated_at) VALUES
('01234567-1234-1234-1234-123456789001', 'New Capital Towers', 'Capital Group', 'New Cairo', 150, 120.00, 'Premium residential towers in New Cairo', NOW(), NOW()),
('01234567-1234-1234-1234-123456789002', 'Marina Heights', 'Marina Developments', 'North Coast', 200, 150.00, 'Luxury beachfront apartments', NOW(), NOW()),
('01234567-1234-1234-1234-123456789003', 'Garden City Residences', 'Green Developments', 'Sheikh Zayed', 100, 100.00, 'Family-friendly compound', NOW(), NOW()),
('01234567-1234-1234-1234-123456789004', 'Downtown Plaza', 'Urban Developers', 'Downtown Cairo', 75, 180.00, 'Modern commercial complex', NOW(), NOW());

-- Insert sample leads for New Capital Towers (first 10 leads)
INSERT INTO leads (id, project_id, client_name, client_phone, client_email, client_job_title, platform, stage, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111001', '01234567-1234-1234-1234-123456789001', 'Ahmed Mohamed', '+201012345678', 'ahmed.mohamed@email.com', 'Engineer', 'Facebook'::platform_type, 'New Lead'::lead_stage, NOW() - INTERVAL '1 day', NOW()),
('11111111-1111-1111-1111-111111111002', '01234567-1234-1234-1234-123456789001', 'Fatma Hassan', '+201087654321', 'fatma.hassan@email.com', 'Doctor', 'Google'::platform_type, 'New Lead'::lead_stage, NOW() - INTERVAL '2 days', NOW()),
('11111111-1111-1111-1111-111111111003', '01234567-1234-1234-1234-123456789001', 'Omar Khaled', '+201123456789', 'omar.khaled@email.com', 'Business Owner', 'TikTok'::platform_type, 'New Lead'::lead_stage, NOW() - INTERVAL '3 days', NOW()),
('11111111-1111-1111-1111-111111111004', '01234567-1234-1234-1234-123456789001', 'Mona Samir', '+201234567890', 'mona.samir@email.com', 'Teacher', 'Facebook'::platform_type, 'New Lead'::lead_stage, NOW() - INTERVAL '4 days', NOW()),
('11111111-1111-1111-1111-111111111005', '01234567-1234-1234-1234-123456789001', 'Hassan Ali', '+201345678901', 'hassan.ali@email.com', 'Manager', 'Google'::platform_type, 'New Lead'::lead_stage, NOW() - INTERVAL '5 days', NOW());

-- Insert sample leads for Marina Heights (first 5 leads)
INSERT INTO leads (id, project_id, client_name, client_phone, client_email, client_job_title, platform, stage, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111006', '01234567-1234-1234-1234-123456789002', 'Nour Abdel Rahman', '+201456789012', 'nour.abdel@email.com', 'Architect', 'Facebook'::platform_type, 'New Lead'::lead_stage, NOW() - INTERVAL '1 day', NOW()),
('11111111-1111-1111-1111-111111111007', '01234567-1234-1234-1234-123456789002', 'Karim Mostafa', '+201567890123', 'karim.mostafa@email.com', 'Financial Advisor', 'Google'::platform_type, 'New Lead'::lead_stage, NOW() - INTERVAL '2 days', NOW()),
('11111111-1111-1111-1111-111111111008', '01234567-1234-1234-1234-123456789002', 'Yasmin Farouk', '+201678901234', 'yasmin.farouk@email.com', 'Lawyer', 'TikTok'::platform_type, 'New Lead'::lead_stage, NOW() - INTERVAL '3 days', NOW());

-- Verify the data
SELECT 'Projects created: ' || COUNT(*)::TEXT FROM projects;
SELECT 'Leads created: ' || COUNT(*)::TEXT FROM leads WHERE buyer_user_id IS NULL;
