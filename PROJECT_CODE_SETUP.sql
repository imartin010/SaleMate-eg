-- ============================================
-- PROJECT CODE SETUP FOR FACEBOOK INTEGRATION
-- ============================================
-- Run this after you've verified your projects exist

-- STEP 1: Check existing projects
-- ============================================
SELECT id, name, region, project_code, price_per_lead, available_leads 
FROM projects 
ORDER BY name;

-- STEP 2: Update project codes and developer names
-- ============================================
-- Replace the WHERE conditions with your actual project names

-- Aliva Project (Code: 001)
UPDATE projects 
SET project_code = '001', 
    region = 'Mountain View',  -- Developer display name
    price_per_lead = CASE WHEN price_per_lead = 0 THEN 300 ELSE price_per_lead END
WHERE LOWER(name) LIKE '%aliva%';

-- iCity Project (Code: 002)
UPDATE projects 
SET project_code = '002', 
    region = 'Mountain View',  -- Developer display name
    price_per_lead = CASE WHEN price_per_lead = 0 THEN 300 ELSE price_per_lead END
WHERE LOWER(name) LIKE '%icity%' OR LOWER(name) LIKE '%i-city%' OR LOWER(name) LIKE '%i city%';

-- Hyde Park Project (Code: 003)
UPDATE projects 
SET project_code = '003', 
    region = 'Hyde Park Developments',  -- Developer display name
    price_per_lead = CASE WHEN price_per_lead = 0 THEN 300 ELSE price_per_lead END
WHERE LOWER(name) LIKE '%hyde%park%' OR LOWER(name) LIKE '%hydepark%';

-- Badya Project (Code: 004)
UPDATE projects 
SET project_code = '004', 
    region = 'Palm Hills',  -- Developer display name
    price_per_lead = CASE WHEN price_per_lead = 0 THEN 300 ELSE price_per_lead END
WHERE LOWER(name) LIKE '%badya%';

-- STEP 3: Verify the updates
-- ============================================
SELECT 
  id,
  name,
  project_code,
  region as developer_display,
  price_per_lead,
  available_leads,
  CASE 
    WHEN project_code IS NULL THEN '❌ No code'
    WHEN price_per_lead = 0 THEN '⚠️  No price'
    ELSE '✅ Ready'
  END as status
FROM projects
ORDER BY project_code NULLS LAST;

-- STEP 4: Create test project if needed
-- ============================================
-- Uncomment and modify if you need a test project

/*
INSERT INTO developers (name) VALUES ('Test Developer') 
ON CONFLICT (name) DO UPDATE SET name = 'Test Developer'
RETURNING id;

-- Use the ID from above
INSERT INTO projects (
  developer_id, 
  name, 
  region, 
  project_code, 
  price_per_lead, 
  available_leads,
  description
)
VALUES (
  '[paste-developer-id-here]',
  'Test Project',
  'Test Developer',
  '999',
  300,
  0,
  'Test project for development'
);
*/

-- ============================================
-- NOTES
-- ============================================
-- 
-- Project Codes for Facebook Campaigns:
-- - 001: Aliva
-- - 002: iCity
-- - 003: Hyde Park
-- - 004: Badya
--
-- Campaign Naming Format:
-- "001-aliva Spring Campaign 2024"
-- "002-icity Luxury Apartments Q1"
-- 
-- The webhook extracts the code and maps to the project automatically.
--

