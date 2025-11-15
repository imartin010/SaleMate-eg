-- Quick fix: Make receipt_file_url nullable for card payments
-- Run this in Supabase SQL Editor to fix the issue immediately

ALTER TABLE public.wallet_topup_requests 
ALTER COLUMN receipt_file_url DROP NOT NULL;

