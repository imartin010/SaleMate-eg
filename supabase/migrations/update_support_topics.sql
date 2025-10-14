-- =====================================================
-- Update Support Topics - Rename Topics
-- =====================================================
-- Updates topic names and constraint for new naming
-- =====================================================

-- Drop old constraint
ALTER TABLE public.support_cases
DROP CONSTRAINT IF EXISTS check_valid_topic;

-- Add updated constraint with new topic names
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

-- Update existing records with old topic names to new names
UPDATE public.support_cases
SET topic = 'Leads Issues'
WHERE topic = 'Leads & Data Issues';

UPDATE public.support_cases
SET topic = 'Shop (Buying Leads)'
WHERE topic = 'Shop (Buying Leads/Data)';

-- Verify the changes
SELECT 
  topic,
  COUNT(*) as ticket_count
FROM public.support_cases
WHERE topic IS NOT NULL
GROUP BY topic
ORDER BY ticket_count DESC;

-- =====================================================
-- Complete! ✅
-- Topics renamed:
-- - "Leads & Data Issues" → "Leads Issues"
-- - "Shop (Buying Leads/Data)" → "Shop (Buying Leads)"
-- =====================================================

