-- ============================================
-- LEAD MANAGEMENT SYSTEM - SCHEMA UPDATES
-- Run this in Supabase SQL Editor
-- ============================================

-- PART 1: Update leads table
-- ============================================

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS budget NUMERIC(12, 2);

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS client_phone2 TEXT,
ADD COLUMN IF NOT EXISTS client_phone3 TEXT;

-- Update existing source values to lowercase
UPDATE public.leads 
SET source = LOWER(source) 
WHERE source IS NOT NULL;

-- Update common variations
UPDATE public.leads SET source = 'facebook' WHERE LOWER(source) LIKE '%facebook%';
UPDATE public.leads SET source = 'instagram' WHERE LOWER(source) LIKE '%instagram%';
UPDATE public.leads SET source = 'google' WHERE LOWER(source) LIKE '%google%';
UPDATE public.leads SET source = 'tiktok' WHERE LOWER(source) LIKE '%tiktok%';
UPDATE public.leads SET source = 'snapchat' WHERE LOWER(source) LIKE '%snapchat%';
UPDATE public.leads SET source = 'whatsapp' WHERE LOWER(source) LIKE '%whatsapp%';

-- Set any remaining invalid sources to NULL
UPDATE public.leads 
SET source = NULL 
WHERE source IS NOT NULL 
AND source NOT IN ('facebook', 'instagram', 'google', 'tiktok', 'snapchat', 'whatsapp');

-- Update source constraint
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_source_check;
ALTER TABLE public.leads 
ADD CONSTRAINT leads_source_check 
CHECK (source IS NULL OR source IN ('facebook', 'instagram', 'google', 'tiktok', 'snapchat', 'whatsapp'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON public.leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_at ON public.leads(assigned_at);
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_is_sold ON public.leads(is_sold);
CREATE INDEX IF NOT EXISTS idx_leads_buyer_assigned ON public.leads(buyer_user_id, assigned_to_id);

-- Update existing leads to set owner_id = buyer_user_id if not set
UPDATE public.leads 
SET owner_id = buyer_user_id 
WHERE owner_id IS NULL AND buyer_user_id IS NOT NULL;

-- PART 2: Update projects table
-- ============================================

-- Update NULL price_per_lead to 0 FIRST
UPDATE public.projects 
SET price_per_lead = 0 
WHERE price_per_lead IS NULL;

-- Make price_per_lead required
ALTER TABLE public.projects 
ALTER COLUMN price_per_lead SET NOT NULL,
ALTER COLUMN price_per_lead SET DEFAULT 0;

-- Add project_code column
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS project_code TEXT UNIQUE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_available_leads ON public.projects(available_leads) WHERE available_leads > 0;
CREATE INDEX IF NOT EXISTS idx_projects_developer_id ON public.projects(developer_id);
CREATE INDEX IF NOT EXISTS idx_projects_price_per_lead ON public.projects(price_per_lead);
CREATE INDEX IF NOT EXISTS idx_projects_project_code ON public.projects(project_code);

-- PART 3: Create wallet deduct function
-- ============================================

CREATE OR REPLACE FUNCTION deduct_from_wallet(
  p_user_id UUID,
  p_amount NUMERIC,
  p_description TEXT DEFAULT 'Lead purchase'
) 
RETURNS JSONB AS $$
DECLARE
  v_wallet_id UUID;
  v_current_balance NUMERIC;
  v_transaction_id UUID;
BEGIN
  SELECT id, balance INTO v_wallet_id, v_current_balance
  FROM public.user_wallets 
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found for user';
  END IF;

  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds. Balance: % EGP, Required: % EGP', v_current_balance, p_amount;
  END IF;

  UPDATE public.user_wallets 
  SET balance = balance - p_amount,
      updated_at = NOW()
  WHERE id = v_wallet_id;

  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, type, amount, description, status, created_at, updated_at
  )
  VALUES (
    v_wallet_id, p_user_id, 'payment', -p_amount, p_description, 'completed', NOW(), NOW()
  )
  RETURNING id INTO v_transaction_id;

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_current_balance - p_amount,
    'transaction_id', v_transaction_id
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Wallet deduction failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION deduct_from_wallet(UUID, NUMERIC, TEXT) TO authenticated;

-- PART 4: Create assign leads function
-- ============================================

CREATE OR REPLACE FUNCTION assign_leads_to_team_member(
  p_lead_ids UUID[],
  p_manager_id UUID,
  p_assignee_id UUID
) 
RETURNS JSONB AS $$
DECLARE
  v_updated_count INT;
  v_assignee_profile RECORD;
BEGIN
  SELECT id, name, manager_id INTO v_assignee_profile
  FROM public.profiles 
  WHERE id = p_assignee_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignee not found';
  END IF;

  IF v_assignee_profile.manager_id != p_manager_id THEN
    RAISE EXCEPTION 'Assignee must be in manager team';
  END IF;

  UPDATE public.leads 
  SET assigned_to_id = p_assignee_id, assigned_at = NOW(), updated_at = NOW()
  WHERE id = ANY(p_lead_ids)
    AND (buyer_user_id = p_manager_id OR owner_id = p_manager_id);

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'updated_count', v_updated_count,
    'assignee_name', v_assignee_profile.name
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Lead assignment failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION assign_leads_to_team_member(UUID[], UUID, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION unassign_leads(
  p_lead_ids UUID[],
  p_manager_id UUID
) 
RETURNS JSONB AS $$
DECLARE
  v_updated_count INT;
BEGIN
  UPDATE public.leads 
  SET assigned_to_id = NULL, assigned_at = NULL, updated_at = NOW()
  WHERE id = ANY(p_lead_ids)
    AND (buyer_user_id = p_manager_id OR owner_id = p_manager_id);

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RETURN jsonb_build_object('success', true, 'updated_count', v_updated_count);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Lead unassignment failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION unassign_leads(UUID[], UUID) TO authenticated;

-- PART 5: Create project code helper
-- ============================================

CREATE OR REPLACE FUNCTION get_project_by_code(p_code TEXT) 
RETURNS UUID AS $$
DECLARE
  v_project_id UUID;
BEGIN
  SELECT id INTO v_project_id FROM public.projects WHERE project_code = p_code;
  RETURN v_project_id;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION get_project_by_code(TEXT) TO authenticated, anon;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 'Leads table updated' as status,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name='leads' AND column_name='company_name') as has_company_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name='leads' AND column_name='budget') as has_budget,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name='leads' AND column_name='owner_id') as has_owner_id;

SELECT 'Projects table updated' as status,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name='projects' AND column_name='project_code') as has_project_code;

SELECT '✅ Schema updates complete!' as message;

