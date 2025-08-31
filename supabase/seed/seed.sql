-- SaleMate Database Seed Data
-- This file populates the database with initial data for development and testing

-- Clear existing data (if any)
TRUNCATE TABLE recent_activity CASCADE;
TRUNCATE TABLE comments CASCADE;
TRUNCATE TABLE posts CASCADE;
TRUNCATE TABLE leads CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE support_cases CASCADE;
TRUNCATE TABLE partners CASCADE;
TRUNCATE TABLE projects CASCADE;
TRUNCATE TABLE profiles CASCADE;

-- Reset sequences
ALTER SEQUENCE IF EXISTS profiles_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS projects_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS leads_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS orders_id_seq RESTART WITH 1;

-- Create admin user (password: admin123)
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'admin@salemate.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"name": "Admin User"}'
);

-- Create support user (password: support123)
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    'support@salemate.com',
    crypt('support123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"name": "Support Team"}'
);

-- Create manager user (password: manager123)
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
) VALUES (
    '33333333-3333-3333-3333-333333333333',
    'manager@salemate.com',
    crypt('manager123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"name": "Team Manager"}'
);

-- Create regular user 1 (password: user123)
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
) VALUES (
    '44444444-4444-4444-4444-444444444444',
    'user1@salemate.com',
    crypt('user123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"name": "John Doe"}'
);

-- Create regular user 2 (password: user123)
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
) VALUES (
    '55555555-5555-5555-5555-555555555555',
    'user2@salemate.com',
    crypt('user123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"name": "Jane Smith"}'
);

-- Insert profiles (these will be created automatically by the trigger, but we'll override for testing)
INSERT INTO profiles (id, name, email, role, manager_id, is_banned) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Admin User', 'admin@salemate.com', 'admin', NULL, false),
    ('22222222-2222-2222-2222-222222222222', 'Support Team', 'support@salemate.com', 'support', NULL, false),
    ('33333333-3333-3333-3333-333333333333', 'Team Manager', 'manager@salemate.com', 'manager', NULL, false),
    ('44444444-4444-4444-4444-444444444444', 'John Doe', 'user1@salemate.com', 'user', '33333333-3333-3333-3333-333333333333', false),
    ('55555555-5555-5555-5555-555555555555', 'Jane Smith', 'user2@salemate.com', 'user', '33333333-3333-3333-3333-333333333333', false);

-- Insert projects
INSERT INTO projects (id, name, developer, region, available_leads, price_per_lead, description) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'New Capital Towers', 'Emaar Properties', 'New Capital', 150, 25.00, 'Luxury residential towers in the heart of New Capital with premium amenities and stunning views.'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Palm Hills West', 'Palm Hills Development', '6th of October', 200, 22.50, 'Modern residential community with green spaces, schools, and shopping centers.'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Madinaty Heights', 'Talaat Moustafa Group', 'Madinaty', 120, 28.00, 'Exclusive residential project featuring luxury villas and apartments with premium finishes.'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Cairo Festival City', 'Al-Futtaim Group', 'New Cairo', 180, 30.00, 'Mixed-use development with residential, commercial, and entertainment facilities.'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Rehab City', 'Rehab Development', 'Rehab', 90, 20.00, 'Family-oriented community with parks, schools, and convenient access to major roads.'),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Sheikh Zayed Gardens', 'SODIC', 'Sheikh Zayed', 110, 26.50, 'Premium residential project with landscaped gardens and modern architecture.');

-- Insert partners
INSERT INTO partners (id, name, description, commission_rate, logo_path, website, status) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'The Address Investments', 'Leading real estate investment firm specializing in premium properties across Egypt.', 15.00, 'partners-logos/the-address-investments-logo.png', 'https://address-investments.com', 'active'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Bold Routes', 'Innovative real estate solutions with focus on emerging markets and high-growth areas.', 12.50, 'partners-logos/bold-routes-logo.png', 'https://boldroutes.com', 'active'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Nawy', 'Digital real estate platform connecting buyers with verified properties and trusted agents.', 18.00, 'partners-logos/nawy-partners.png', 'https://nawy.com', 'active'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'CB Link by Coldwell Banker', 'CB Link by Coldwell Banker - Global real estate franchise with local expertise in Egyptian market.', 20.00, 'partners-logos/coldwell-banker-logo.png', 'https://cblink.com', 'active'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'SaleMate', 'Leading real estate platform connecting buyers with verified properties and trusted agents across Egypt.', 5.00, 'partners-logos/sale_mate_logo.png', 'https://salemate.com', 'active');

-- Insert leads (400 leads spread across projects)
-- Project 1: New Capital Towers (150 leads)
INSERT INTO leads (project_id, client_name, client_phone, client_email, platform, stage) 
SELECT 
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Client ' || generate_series(1, 150),
    '+20' || (1000000000 + generate_series(1, 150)),
    'client' || generate_series(1, 150) || '@example.com',
    (ARRAY['Facebook', 'Google', 'TikTok', 'Other'])[floor(random() * 4 + 1)],
    (ARRAY['New Lead', 'Potential', 'Hot Case', 'Meeting Done', 'No Answer', 'Call Back', 'Whatsapp', 'Wrong Number', 'Non Potential'])[floor(random() * 9 + 1)]
FROM generate_series(1, 150);

-- Project 2: Palm Hills West (200 leads)
INSERT INTO leads (project_id, client_name, client_phone, client_email, platform, stage) 
SELECT 
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Client ' || generate_series(151, 350),
    '+20' || (1000000000 + generate_series(151, 350)),
    'client' || generate_series(151, 350) || '@example.com',
    (ARRAY['Facebook', 'Google', 'TikTok', 'Other'])[floor(random() * 4 + 1)],
    (ARRAY['New Lead', 'Potential', 'Hot Case', 'Meeting Done', 'No Answer', 'Call Back', 'Whatsapp', 'Wrong Number', 'Non Potential'])[floor(random() * 9 + 1)]
FROM generate_series(151, 350);

-- Project 3: Madinaty Heights (120 leads)
INSERT INTO leads (project_id, client_name, client_phone, client_email, platform, stage) 
SELECT 
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Client ' || generate_series(351, 470),
    '+20' || (1000000000 + generate_series(351, 470)),
    'client' || generate_series(351, 470) || '@example.com',
    (ARRAY['Facebook', 'Google', 'TikTok', 'Other'])[floor(random() * 4 + 1)],
    (ARRAY['New Lead', 'Potential', 'Hot Case', 'Meeting Done', 'No Answer', 'Call Back', 'Whatsapp', 'Wrong Number', 'Non Potential'])[floor(random() * 9 + 1)]
FROM generate_series(351, 470);

-- Project 4: Cairo Festival City (180 leads)
INSERT INTO leads (project_id, client_name, client_phone, client_email, platform, stage) 
SELECT 
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'Client ' || generate_series(471, 650),
    '+20' || (1000000000 + generate_series(471, 650)),
    'client' || generate_series(471, 650) || '@example.com',
    (ARRAY['Facebook', 'Google', 'TikTok', 'Other'])[floor(random() * 4 + 1)],
    (ARRAY['New Lead', 'Potential', 'Hot Case', 'Meeting Done', 'No Answer', 'Call Back', 'Whatsapp', 'Wrong Number', 'Non Potential'])[floor(random() * 9 + 1)]
FROM generate_series(471, 650);

-- Project 5: Rehab City (90 leads)
INSERT INTO leads (project_id, client_name, client_phone, client_email, platform, stage) 
SELECT 
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'Client ' || generate_series(651, 740),
    '+20' || (1000000000 + generate_series(651, 740)),
    'client' || generate_series(651, 740) || '@example.com',
    (ARRAY['Facebook', 'Google', 'TikTok', 'Other'])[floor(random() * 4 + 1)],
    (ARRAY['New Lead', 'Potential', 'Hot Case', 'Meeting Done', 'No Answer', 'Call Back', 'Whatsapp', 'Wrong Number', 'Non Potential'])[floor(random() * 9 + 1)]
FROM generate_series(651, 740);

-- Project 6: Sheikh Zayed Gardens (110 leads)
INSERT INTO leads (project_id, client_name, client_phone, client_email, platform, stage) 
SELECT 
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'Client ' || generate_series(741, 850),
    '+20' || (1000000000 + generate_series(741, 850)),
    'client' || generate_series(741, 850) || '@example.com',
    (ARRAY['Facebook', 'Google', 'TikTok', 'Other'])[floor(random() * 4 + 1)],
    (ARRAY['New Lead', 'Potential', 'Hot Case', 'Meeting Done', 'No Answer', 'Call Back', 'Whatsapp', 'Wrong Number', 'Non Potential'])[floor(random() * 9 + 1)]
FROM generate_series(741, 850);

-- Insert some sample orders
INSERT INTO orders (id, user_id, project_id, quantity, payment_method, status, total_amount, payment_reference) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 50, 'Instapay', 'confirmed', 1250.00, 'PAY-001'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '55555555-5555-5555-5555-555555555555', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 75, 'VodafoneCash', 'confirmed', 1687.50, 'PAY-002'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '44444444-4444-4444-4444-444444444444', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 60, 'BankTransfer', 'pending', 1680.00, NULL);

-- Insert some sample support cases
INSERT INTO support_cases (id, created_by, assigned_to, subject, description, status, priority) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Payment Issue', 'Unable to complete payment for order #001', 'open', 'high'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'Lead Quality Question', 'Some leads seem to have outdated contact information', 'in_progress', 'medium'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Team Management', 'Need help setting up team structure for new agents', 'resolved', 'low');

-- Insert community posts
INSERT INTO posts (id, author_id, content) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 'Just closed my first deal using SaleMate leads! The quality is amazing and the conversion rate is much higher than expected. Highly recommend to all agents! 🎉'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '55555555-5555-5555-5555-555555555555', 'Looking for tips on handling hot leads. What strategies work best for you when dealing with urgent buyers?'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'Team update: We''ve increased our monthly sales by 40% since implementing SaleMate. Great work everyone! 📈'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'New feature alert: We''ve added bulk lead assignment for team managers. This should make your workflow much more efficient!'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', 'Welcome to all new users! SaleMate is designed to help you succeed in real estate. Don''t hesitate to reach out to support if you need any assistance.');

-- Insert comments on posts
INSERT INTO comments (id, post_id, author_id, content) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 'Congratulations! That''s fantastic news. Which project were the leads from?'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'Well done! Keep up the great work.'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', 'I find that calling within the first 5 minutes of receiving a hot lead works best. Speed is key!'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Great question! We''re working on a best practices guide that should be out next week.'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '44444444-4444-4444-4444-444444444444', 'That''s incredible growth! What''s your secret sauce?'),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '55555555-5555-5555-5555-555555555555', 'Amazing results! Can''t wait to see what we achieve next month.');

-- Insert recent activity
INSERT INTO recent_activity (user_id, action, details) VALUES
    ('44444444-4444-4444-4444-444444444444', 'user_registered', '{"action": "User joined SaleMate platform"}'),
    ('55555555-5555-5555-5555-555555555555', 'user_registered', '{"action": "User joined SaleMate platform"}'),
    ('33333333-3333-3333-3333-333333333333', 'user_registered', '{"action": "User joined SaleMate platform"}'),
    ('44444444-4444-4444-4444-444444444444', 'order_started', '{"order_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "project": "New Capital Towers", "quantity": 50}'),
    ('55555555-5555-5555-5555-555555555555', 'order_started', '{"order_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "project": "Palm Hills West", "quantity": 75}'),
    ('44444444-4444-4444-4444-444444444444', 'order_started', '{"order_id": "cccccccc-cccc-cccc-cccc-cccccccccccc", "project": "Madinaty Heights", "quantity": 60}'),
    ('44444444-4444-4444-4444-444444444444', 'post_created', '{"post_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "content_preview": "Just closed my first deal..."}'),
    ('55555555-5555-5555-5555-555555555555', 'post_created', '{"post_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "content_preview": "Looking for tips on handling hot leads..."}'),
    ('33333333-3333-3333-3333-333333333333', 'post_created', '{"post_id": "cccccccc-cccc-cccc-cccc-cccccccccccc", "content_preview": "Team update: We''ve increased our monthly sales..."}');

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW lead_analytics_mv;

-- Update some leads to be owned by users (simulating purchased leads)
UPDATE leads 
SET buyer_user_id = '44444444-4444-4444-4444-444444444444'
WHERE id IN (
    SELECT id FROM leads 
    WHERE project_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' 
    AND buyer_user_id IS NULL 
    LIMIT 50
);

UPDATE leads 
SET buyer_user_id = '55555555-5555-5555-5555-555555555555'
WHERE id IN (
    SELECT id FROM leads 
    WHERE project_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' 
    AND buyer_user_id IS NULL 
    LIMIT 75
);

-- Update project available_leads to reflect actual availability
UPDATE projects 
SET available_leads = (
    SELECT COUNT(*) 
    FROM leads 
    WHERE project_id = projects.id 
    AND buyer_user_id IS NULL
);

-- Insert some additional sample data for testing
INSERT INTO recent_activity (user_id, action, details) VALUES
    ('44444444-4444-4444-4444-444444444444', 'lead_stage_updated', '{"lead_id": "sample-lead-1", "old_stage": "New Lead", "new_stage": "Hot Case"}'),
    ('44444444-4444-4444-4444-444444444444', 'lead_stage_updated', '{"lead_id": "sample-lead-2", "old_stage": "Hot Case", "new_stage": "Meeting Done"}'),
    ('55555555-5555-5555-5555-555555555555', 'lead_stage_updated', '{"lead_id": "sample-lead-3", "old_stage": "New Lead", "new_stage": "Potential"}'),
    ('33333333-3333-3333-3333-333333333333', 'team_member_added', '{"new_member_id": "44444444-4444-4444-4444-444444444444", "member_name": "John Doe"}'),
    ('33333333-3333-3333-3333-333333333333', 'team_member_added', '{"new_member_id": "55555555-5555-5555-5555-555555555555", "member_name": "Jane Smith"}');

-- Final refresh of materialized view
REFRESH MATERIALIZED VIEW lead_analytics_mv;

-- Display summary of seeded data
SELECT 'Database seeded successfully!' as status;
SELECT 'Profiles created:' as info, COUNT(*) as count FROM profiles;
SELECT 'Projects created:' as info, COUNT(*) as count FROM projects;
SELECT 'Leads created:' as info, COUNT(*) as count FROM leads;
SELECT 'Partners created:' as info, COUNT(*) as count FROM partners;
SELECT 'Posts created:' as info, COUNT(*) as count FROM posts;
SELECT 'Comments created:' as info, COUNT(*) as count FROM comments;
SELECT 'Orders created:' as info, COUNT(*) as count FROM orders;
SELECT 'Support cases created:' as info, COUNT(*) as count FROM support_cases;
SELECT 'Recent activity entries:' as info, COUNT(*) as count FROM recent_activity;
