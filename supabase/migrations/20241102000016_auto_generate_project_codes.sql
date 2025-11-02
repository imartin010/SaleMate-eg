-- ============================================
-- AUTO-GENERATE PROJECT CODES
-- ============================================
-- This migration:
-- 1. Assigns codes to all existing projects (if missing)
-- 2. Creates a function to generate next available code
-- 3. Creates a trigger to auto-generate codes for new projects

-- STEP 1: Assign codes to existing projects without codes
-- ============================================
-- This gives existing projects sequential codes starting after highest existing code

DO $$
DECLARE
  project_record RECORD;
  next_code INT;
  code_str TEXT;
  existing_max INT;
BEGIN
  -- Find the highest existing numeric code
  SELECT COALESCE(MAX(project_code::INT), 0) INTO existing_max
  FROM projects
  WHERE project_code ~ '^[0-9]{1,3}$'; -- Only numeric codes
  
  -- Start from next number after highest
  next_code := existing_max + 1;
  
  -- Loop through projects without codes, assign sequential codes
  FOR project_record IN 
    SELECT id, name FROM projects 
    WHERE project_code IS NULL OR project_code = '' OR project_code !~ '^[0-9]{1,3}$'
    ORDER BY created_at ASC
  LOOP
    -- Format as 3-digit string (001, 002, 003, etc.)
    code_str := LPAD(next_code::TEXT, 3, '0');
    
    -- Assign code (skip if code already exists)
    UPDATE projects 
    SET project_code = code_str
    WHERE id = project_record.id
      AND NOT EXISTS (
        SELECT 1 FROM projects p2 
        WHERE p2.project_code = code_str AND p2.id != project_record.id
      );
    
    RAISE NOTICE 'Assigned code % to project: %', code_str, project_record.name;
    
    -- Increment for next project
    next_code := next_code + 1;
  END LOOP;
  
  RAISE NOTICE 'Completed assigning codes. Next available code: %', LPAD(next_code::TEXT, 3, '0');
END $$;

-- STEP 2: Function to get next available project code
-- ============================================
CREATE OR REPLACE FUNCTION get_next_project_code()
RETURNS TEXT AS $$
DECLARE
  max_code INT;
  next_code TEXT;
BEGIN
  -- Find the highest numeric code
  SELECT COALESCE(MAX(project_code::INT), 0) INTO max_code
  FROM projects
  WHERE project_code ~ '^[0-9]{1,3}$'; -- Only numeric codes
  
  -- Generate next code (3-digit format)
  next_code := LPAD((max_code + 1)::TEXT, 3, '0');
  
  RETURN next_code;
END;
$$ LANGUAGE plpgsql;

-- STEP 3: Trigger function to auto-generate project code
-- ============================================
CREATE OR REPLACE FUNCTION auto_generate_project_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate if code is not provided
  IF NEW.project_code IS NULL OR NEW.project_code = '' THEN
    NEW.project_code := get_next_project_code();
    RAISE NOTICE 'Auto-generated project code: % for project: %', NEW.project_code, NEW.name;
  END IF;
  
  -- Ensure price_per_lead has a default if null
  IF NEW.price_per_lead IS NULL THEN
    NEW.price_per_lead := 300; -- Default price
  END IF;
  
  -- Ensure available_leads defaults to 0 if null
  IF NEW.available_leads IS NULL THEN
    NEW.available_leads := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 4: Create trigger
-- ============================================
DROP TRIGGER IF EXISTS auto_generate_project_code_trigger ON projects;

CREATE TRIGGER auto_generate_project_code_trigger
  BEFORE INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_project_code();

-- STEP 5: Verify existing projects have codes
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
  END as status
FROM projects
ORDER BY project_code NULLS LAST;

-- ============================================
-- NOTES
-- ============================================
-- 
-- How it works:
-- 1. When a new project is INSERTED without a project_code, the trigger runs
-- 2. Trigger calls get_next_project_code() to find the next available number
-- 3. Code is formatted as 3-digit string (001, 002, 003, etc.)
-- 4. You can still manually set a code if needed (it won't override)
--
-- Example:
-- INSERT INTO projects (name, region, price_per_lead) 
-- VALUES ('New Project', 'Developer Name', 300);
-- -- Result: project_code = '005' (or next available number)
--
-- Manual override:
-- INSERT INTO projects (name, project_code, region, price_per_lead) 
-- VALUES ('Custom Project', '999', 'Developer', 300);
-- -- Result: project_code = '999' (uses your custom code)

