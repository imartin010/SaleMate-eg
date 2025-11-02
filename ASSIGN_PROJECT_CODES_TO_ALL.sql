-- ============================================
-- ASSIGN CODES TO ALL EXISTING PROJECTS
-- ============================================
-- Run this in SQL Editor to assign codes to all projects
-- This is a one-time operation for existing data

-- STEP 1: View current state
-- ============================================
SELECT 
  id,
  name,
  project_code,
  region,
  price_per_lead,
  available_leads,
  created_at
FROM projects 
ORDER BY created_at ASC;

-- STEP 2: Assign sequential codes to projects without codes
-- ============================================
DO $$
DECLARE
  project_record RECORD;
  next_code INT := 1;
  code_str TEXT;
  existing_max INT;
BEGIN
  -- Find the highest existing code
  SELECT COALESCE(MAX(project_code::INT), 0) INTO existing_max
  FROM projects
  WHERE project_code ~ '^[0-9]{1,3}$'; -- Only numeric codes
  
  -- Start from next number
  next_code := existing_max + 1;
  
  -- Loop through projects without codes
  FOR project_record IN 
    SELECT id, name FROM projects 
    WHERE project_code IS NULL OR project_code = '' OR project_code !~ '^[0-9]{1,3}$'
    ORDER BY created_at ASC
  LOOP
    -- Format as 3-digit string (001, 002, 003, etc.)
    code_str := LPAD(next_code::TEXT, 3, '0');
    
    -- Assign code
    UPDATE projects 
    SET project_code = code_str,
        price_per_lead = COALESCE(price_per_lead, 300), -- Default price if null
        available_leads = COALESCE(available_leads, 0)   -- Default leads if null
    WHERE id = project_record.id;
    
    RAISE NOTICE 'Assigned code % to project: %', code_str, project_record.name;
    
    -- Increment for next project
    next_code := next_code + 1;
  END LOOP;
  
  RAISE NOTICE 'Completed assigning codes. Next available code: %', LPAD(next_code::TEXT, 3, '0');
END $$;

-- STEP 3: Verify all projects now have codes
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
    WHEN price_per_lead IS NULL OR price_per_lead = 0 THEN '⚠️  No price'
    ELSE '✅ Ready'
  END as status,
  created_at
FROM projects
ORDER BY project_code NULLS LAST;

-- STEP 4: Summary
-- ============================================
SELECT 
  COUNT(*) as total_projects,
  COUNT(project_code) as projects_with_codes,
  COUNT(*) - COUNT(project_code) as projects_without_codes,
  MAX(project_code::INT) as highest_code
FROM projects;

-- ============================================
-- NOTES
-- ============================================
-- After running this:
-- 1. All existing projects will have codes (001, 002, 003, etc.)
-- 2. The auto-generation trigger will handle new projects
-- 3. Use project codes in Facebook campaigns: "001-projectname Campaign"

