-- Fix email confirmation redirect URLs
-- Run this in your Supabase SQL Editor

-- Update the auth configuration to use your production URL
-- Replace 'your-production-url.com' with your actual website URL

-- First, let's check current auth settings
SELECT 
  'Current auth settings:' as info,
  'site_url' as setting,
  'localhost:3000' as current_value,
  'This needs to be updated to your production URL' as action;

-- You need to update this in your Supabase Dashboard:
-- 1. Go to Authentication > Settings
-- 2. Update "Site URL" to your production URL (e.g., https://salemate-eg.com)
-- 3. Add your production URL to "Redirect URLs"

SELECT 'Please update your Supabase Auth settings manually:' as instruction;
SELECT '1. Go to Supabase Dashboard > Authentication > Settings' as step1;
SELECT '2. Change Site URL from localhost:3000 to your production URL' as step2;
SELECT '3. Add your production URL to Redirect URLs list' as step3;
SELECT '4. Save the changes' as step4;
