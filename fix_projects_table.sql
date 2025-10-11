-- Fix projects table for admin lead upload
-- Run this in your Supabase SQL Editor

-- 1. Check if projects table exists
SELECT 
  'Projects table exists' as status,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'projects' AND table_schema = 'public';

-- 2. Create projects table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  region text NOT NULL,
  available_leads integer DEFAULT 0,
  price_per_lead numeric(10,2) DEFAULT 0.00,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 3. Create developers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.developers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Add developer_id column to projects if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'projects' 
                 AND column_name = 'developer_id' 
                 AND table_schema = 'public') THEN
    ALTER TABLE public.projects ADD COLUMN developer_id uuid REFERENCES public.developers(id);
  END IF;
END $$;

-- 5. Enable RLS on projects table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for projects
DROP POLICY IF EXISTS "Anyone can view projects" ON public.projects;
CREATE POLICY "Anyone can view projects" ON public.projects
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage projects" ON public.projects;
CREATE POLICY "Service role can manage projects" ON public.projects
  FOR ALL USING (true);

-- 7. Insert sample projects if table is empty
INSERT INTO public.projects (name, region, available_leads, price_per_lead, description)
SELECT * FROM (VALUES
  ('New Capital Towers', 'New Capital', 150, 125.00, 'Premium residential towers in New Capital'),
  ('Palm Hills West', '6th October', 200, 110.00, 'Luxury villas in Palm Hills West'),
  ('Madinaty Heights', 'Madinaty', 120, 130.00, 'Modern apartments in Madinaty'),
  ('Cairo Festival City', 'New Cairo', 180, 115.00, 'Mixed-use development in New Cairo'),
  ('Rehab City', 'Rehab', 90, 140.00, 'Family-friendly community in Rehab'),
  ('Sheikh Zayed Gardens', 'Sheikh Zayed', 110, 120.00, 'Garden-style apartments in Sheikh Zayed')
) AS sample_projects(name, region, available_leads, price_per_lead, description)
WHERE NOT EXISTS (SELECT 1 FROM public.projects LIMIT 1);

-- 8. Insert sample developer if developers table is empty
INSERT INTO public.developers (name)
SELECT 'SaleMate Development'
WHERE NOT EXISTS (SELECT 1 FROM public.developers LIMIT 1);

-- 9. Update projects with developer_id if not set
UPDATE public.projects 
SET developer_id = (SELECT id FROM public.developers LIMIT 1)
WHERE developer_id IS NULL;

-- 10. Grant permissions
GRANT ALL ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
GRANT ALL ON public.developers TO authenticated;
GRANT ALL ON public.developers TO service_role;

-- 11. Test query
SELECT 
  'Test query successful' as status,
  COUNT(*) as project_count
FROM public.projects;

SELECT 'Projects table setup complete!' as final_status;
