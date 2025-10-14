-- =====================================================
-- Fix Topic Check Constraint
-- =====================================================
-- Update the check constraint to use the new topic names
-- =====================================================

-- Drop the old constraint
ALTER TABLE public.support_cases
DROP CONSTRAINT IF EXISTS check_valid_topic;

-- Add the updated constraint with new topic names
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

-- =====================================================
-- Verification
-- =====================================================
SELECT conname, contype, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.support_cases'::regclass
  AND conname = 'check_valid_topic';

-- =====================================================
-- Complete! ✅
-- =====================================================

