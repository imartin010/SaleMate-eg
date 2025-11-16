-- Add 'chat' to activity_type CHECK constraint
-- This allows storing chat messages in the activities table

ALTER TABLE public.activities
DROP CONSTRAINT IF EXISTS activities_activity_type_check;

ALTER TABLE public.activities
ADD CONSTRAINT activities_activity_type_check 
CHECK (activity_type IN ('event', 'task', 'feedback', 'transfer', 'label', 'recommendation', 'chat'));

COMMENT ON COLUMN public.activities.activity_type IS 'Type of activity: event, task, feedback, transfer, label, recommendation, or chat';

