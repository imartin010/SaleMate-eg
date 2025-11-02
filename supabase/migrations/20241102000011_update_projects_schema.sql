-- ============================================
-- UPDATE PROJECTS SCHEMA
-- ============================================

-- Update existing NULL values to 0 FIRST
UPDATE public.projects 
SET price_per_lead = 0 
WHERE price_per_lead IS NULL;

-- THEN ensure price_per_lead is NOT NULL (required for shop)
ALTER TABLE public.projects 
ALTER COLUMN price_per_lead SET NOT NULL,
ALTER COLUMN price_per_lead SET DEFAULT 0;

-- Add indexes for shop queries
CREATE INDEX IF NOT EXISTS idx_projects_available_leads ON public.projects(available_leads) WHERE available_leads > 0;
CREATE INDEX IF NOT EXISTS idx_projects_developer_id ON public.projects(developer_id);
CREATE INDEX IF NOT EXISTS idx_projects_price_per_lead ON public.projects(price_per_lead);

-- Add project_code column for Facebook integration mapping
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS project_code TEXT UNIQUE;

-- Add comment
COMMENT ON COLUMN public.projects.region IS 'Developer name display (e.g., Mountain View, Palm Hills)';
COMMENT ON COLUMN public.projects.project_code IS 'Facebook campaign code (e.g., 001, 002, 003, 004)';

-- Create index on project_code
CREATE INDEX IF NOT EXISTS idx_projects_project_code ON public.projects(project_code);

