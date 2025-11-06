-- ============================================
-- SETUP REMINDER SCHEDULER CRON JOB
-- This migration sets up the cron job for the reminder scheduler
-- Runs every 5 minutes to process due actions
-- ============================================

-- Note: Replace YOUR-PROJECT-REF and YOUR-SERVICE-ROLE-KEY before running
-- Or set them via environment variables in the migration runner

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove existing job if it exists
SELECT cron.unschedule('case-manager-reminders');

-- Create the cron job
-- NOTE: Update the URL and Authorization header with your actual values
SELECT cron.schedule(
  'case-manager-reminders',               -- Job name
  '*/5 * * * *',                          -- Every 5 minutes
  $$
    SELECT net.http_post(
      url := current_setting('app.supabase_url', true) || '/functions/v1/reminder-scheduler',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Log the job creation
DO $$
BEGIN
  RAISE NOTICE '✅ Reminder scheduler cron job created';
  RAISE NOTICE '   Job runs every 5 minutes to process due actions';
  RAISE NOTICE '   Make sure to configure app.supabase_url and app.service_role_key settings';
END $$;

-- Instructions for manual configuration
COMMENT ON EXTENSION pg_cron IS 'MANUAL SETUP REQUIRED: Run this SQL with your actual values:

SELECT cron.schedule(
  ''case-manager-reminders'',
  ''*/5 * * * *'',
  $$SELECT net.http_post(
    url:=''https://YOUR-PROJECT-REF.supabase.co/functions/v1/reminder-scheduler'',
    headers:=''{"Content-Type": "application/json", "Authorization": "Bearer YOUR-SERVICE-ROLE-KEY"}''::jsonb
  )$$
);

Replace:
- YOUR-PROJECT-REF with your Supabase project reference
- YOUR-SERVICE-ROLE-KEY with your service role key from dashboard
';

