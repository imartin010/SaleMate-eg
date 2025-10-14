-- =====================================================
-- Add Topic and Issue columns to support_cases
-- =====================================================
-- This migration adds topic and issue fields to replace
-- the priority field for better categorization
-- =====================================================

-- Add topic column
ALTER TABLE public.support_cases 
ADD COLUMN IF NOT EXISTS topic TEXT;

-- Add issue column
ALTER TABLE public.support_cases 
ADD COLUMN IF NOT EXISTS issue TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_support_cases_topic 
ON public.support_cases(topic);

CREATE INDEX IF NOT EXISTS idx_support_cases_issue 
ON public.support_cases(issue);

-- Add composite index for topic + issue queries
CREATE INDEX IF NOT EXISTS idx_support_cases_topic_issue 
ON public.support_cases(topic, issue);

-- Add check constraint for valid topics (optional, for data validation)
ALTER TABLE public.support_cases
ADD CONSTRAINT check_valid_topic 
CHECK (
  topic IS NULL OR topic IN (
    'Account & Login Issues',
    'Payment & Billing',
    'Leads Issues',
    'Shop (Buying Leads)',
    'CRM Dashboard Issues',
    'System & Technical Issues',
    'Other / General Requests'
  )
);

-- Update the table comment
COMMENT ON COLUMN public.support_cases.topic IS 
'Category/topic of the support case (e.g., Account & Login Issues, Payment & Billing, etc.)';

COMMENT ON COLUMN public.support_cases.issue IS 
'Specific issue within the topic category';

-- Note: We keep the priority column for backward compatibility
-- It can be removed in a future migration if needed
COMMENT ON COLUMN public.support_cases.priority IS 
'DEPRECATED: Use topic and issue instead. Kept for backward compatibility.';

-- =====================================================
-- Complete! Topic and Issue fields added
-- =====================================================

-- To verify:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'support_cases' 
-- AND column_name IN ('topic', 'issue');

