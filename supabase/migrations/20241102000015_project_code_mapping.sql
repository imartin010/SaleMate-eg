-- ============================================
-- PROJECT CODE MAPPING FOR FACEBOOK INTEGRATION
-- ============================================

-- Create helper function to get project by code
CREATE OR REPLACE FUNCTION get_project_by_code(p_code TEXT) 
RETURNS UUID AS $$
DECLARE
  v_project_id UUID;
BEGIN
  SELECT id INTO v_project_id
  FROM public.projects
  WHERE project_code = p_code;
  
  RETURN v_project_id;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION get_project_by_code(TEXT) TO authenticated, anon;

-- ============================================
-- INITIAL PROJECT CODE SETUP
-- ============================================
-- Note: You'll need to update these with actual project UUIDs after creating projects

DO $$
DECLARE
  v_aliva_id UUID;
  v_icity_id UUID;
  v_hydepark_id UUID;
  v_badya_id UUID;
BEGIN
  -- Try to find existing projects by name (case insensitive)
  SELECT id INTO v_aliva_id FROM public.projects WHERE LOWER(name) LIKE '%aliva%' LIMIT 1;
  SELECT id INTO v_icity_id FROM public.projects WHERE LOWER(name) LIKE '%icity%' OR LOWER(name) LIKE '%i-city%' LIMIT 1;
  SELECT id INTO v_hydepark_id FROM public.projects WHERE LOWER(name) LIKE '%hyde%park%' OR LOWER(name) LIKE '%hydepark%' LIMIT 1;
  SELECT id INTO v_badya_id FROM public.projects WHERE LOWER(name) LIKE '%badya%' LIMIT 1;

  -- Update project codes if projects exist
  IF v_aliva_id IS NOT NULL THEN
    UPDATE public.projects SET project_code = '001' WHERE id = v_aliva_id;
    RAISE NOTICE '✅ Set code 001 for Aliva project';
  ELSE
    RAISE NOTICE '⚠️  Aliva project not found - create project and run: UPDATE projects SET project_code = ''001'' WHERE name = ''Aliva'';';
  END IF;

  IF v_icity_id IS NOT NULL THEN
    UPDATE public.projects SET project_code = '002' WHERE id = v_icity_id;
    RAISE NOTICE '✅ Set code 002 for iCity project';
  ELSE
    RAISE NOTICE '⚠️  iCity project not found - create project and run: UPDATE projects SET project_code = ''002'' WHERE name = ''iCity'';';
  END IF;

  IF v_hydepark_id IS NOT NULL THEN
    UPDATE public.projects SET project_code = '003' WHERE id = v_hydepark_id;
    RAISE NOTICE '✅ Set code 003 for Hyde Park project';
  ELSE
    RAISE NOTICE '⚠️  Hyde Park project not found - create project and run: UPDATE projects SET project_code = ''003'' WHERE name = ''Hyde Park'';';
  END IF;

  IF v_badya_id IS NOT NULL THEN
    UPDATE public.projects SET project_code = '004' WHERE id = v_badya_id;
    RAISE NOTICE '✅ Set code 004 for Badya project';
  ELSE
    RAISE NOTICE '⚠️  Badya project not found - create project and run: UPDATE projects SET project_code = ''004'' WHERE name = ''Badya'';';
  END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.projects WHERE project_code IS NOT NULL;
  RAISE NOTICE 'Projects with codes configured: %', v_count;
END $$;

