-- ============================================
-- FIX PURCHASE REQUEST APPROVAL AND LEAD UPLOAD
-- ============================================
-- This script:
-- 1. Creates RPC function to approve purchase requests and assign leads
-- 2. Verifies leads table structure
-- ============================================

-- ============================================
-- 1. CREATE RPC FUNCTION FOR APPROVING PURCHASE REQUESTS
-- ============================================

CREATE OR REPLACE FUNCTION approve_purchase_request_and_assign_leads(
  p_request_id uuid,
  p_admin_id uuid,
  p_admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request record;
  v_project record;
  v_assigned_count integer;
  v_total_amount numeric;
  v_lead_id uuid;
  v_wallet_id uuid;
BEGIN
  -- Get the purchase request (with FOR UPDATE to lock it)
  SELECT pr.* INTO v_request
  FROM purchase_requests pr
  WHERE pr.id = p_request_id
    AND pr.status = 'pending'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase request not found or already processed';
  END IF;

  -- Get project details
  SELECT p.* INTO v_project
  FROM projects p
  WHERE p.id = v_request.project_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  -- Check available leads
  IF v_project.available_leads < v_request.quantity THEN
    RAISE EXCEPTION 'Not enough leads available. Available: %, Requested: %', 
      v_project.available_leads, v_request.quantity;
  END IF;

  -- Calculate total amount
  v_total_amount := COALESCE(v_project.price_per_lead, 0) * v_request.quantity;

  -- Optimized: Update leads in batches and count directly
  -- Use a subquery to limit and update in one efficient operation
  WITH selected_leads AS (
    SELECT id
    FROM leads
    WHERE project_id = v_request.project_id
      AND is_sold = false
      AND (buyer_user_id IS NULL OR buyer_user_id = '00000000-0000-0000-0000-000000000000'::uuid)
    LIMIT v_request.quantity
    FOR UPDATE SKIP LOCKED  -- Skip locked rows to avoid deadlocks
  )
  UPDATE leads
  SET 
    buyer_user_id = v_request.user_id,
    owner_id = v_request.user_id,
    assigned_to_id = v_request.user_id,
    is_sold = true,
    sold_at = NOW(),
    assigned_at = NOW(),
    updated_at = NOW()
  FROM selected_leads
  WHERE leads.id = selected_leads.id;

  GET DIAGNOSTICS v_assigned_count = ROW_COUNT;

  -- Verify we got enough leads
  IF v_assigned_count < v_request.quantity THEN
    -- Rollback: unassign the leads we just assigned
    UPDATE leads
    SET 
      buyer_user_id = NULL,
      owner_id = NULL,
      assigned_to_id = NULL,
      is_sold = false,
      sold_at = NULL,
      assigned_at = NULL
    WHERE project_id = v_request.project_id
      AND buyer_user_id = v_request.user_id
      AND sold_at >= NOW() - INTERVAL '1 minute';
    
    RAISE EXCEPTION 'Not enough available leads to fulfill request. Found: %, Requested: %', 
      v_assigned_count, v_request.quantity;
  END IF;

  -- Decrement available leads count
  UPDATE projects
  SET available_leads = GREATEST(0, available_leads - v_assigned_count)
  WHERE id = v_request.project_id;

  -- Update purchase request status
  UPDATE purchase_requests
  SET 
    status = 'approved',
    approved_by = p_admin_id,
    approved_at = NOW(),
    admin_notes = p_admin_notes,
    updated_at = NOW()
  WHERE id = p_request_id;

  -- Log wallet transaction if payment was via Instapay or Card (already paid)
  IF v_request.payment_method IN ('Instapay', 'Card') AND v_total_amount > 0 THEN
    -- Get wallet_id for the user (or create if doesn't exist)
    SELECT id INTO v_wallet_id
    FROM user_wallets
    WHERE user_id = v_request.user_id;
    
    -- If wallet doesn't exist, create it
    IF v_wallet_id IS NULL THEN
      INSERT INTO user_wallets (user_id, balance, updated_at)
      VALUES (v_request.user_id, 0, NOW())
      RETURNING id INTO v_wallet_id;
    END IF;
    
    -- Insert transaction
    INSERT INTO wallet_transactions (
      wallet_id,
      user_id,
      type,
      amount,
      description,
      status,
      reference_id,
      created_at,
      updated_at
    ) VALUES (
      v_wallet_id,
      v_request.user_id,
      'payment',
      -v_total_amount,
      'Lead purchase: ' || v_request.quantity || ' leads from ' || COALESCE(v_project.name, 'Unknown Project'),
      'completed',
      p_request_id,
      NOW(),
      NOW()
    );
  END IF;

  -- Return result
  RETURN jsonb_build_object(
    'success', true,
    'request_id', p_request_id,
    'leads_assigned', v_assigned_count,
    'total_amount', v_total_amount,
    'project_name', COALESCE(v_project.name, 'Unknown Project')
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION approve_purchase_request_and_assign_leads TO authenticated;

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Index for finding available leads (most critical for performance)
CREATE INDEX IF NOT EXISTS idx_leads_available_for_purchase 
ON public.leads(project_id, is_sold, buyer_user_id) 
WHERE is_sold = false AND (buyer_user_id IS NULL OR buyer_user_id = '00000000-0000-0000-0000-000000000000'::uuid);

-- Index for project_id lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_leads_project_id ON public.leads(project_id);

-- Index for is_sold filtering
CREATE INDEX IF NOT EXISTS idx_leads_is_sold ON public.leads(is_sold) WHERE is_sold = false;

-- Index for buyer_user_id lookups
CREATE INDEX IF NOT EXISTS idx_leads_buyer_user_id ON public.leads(buyer_user_id) WHERE buyer_user_id IS NOT NULL;

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_leads_project_sold_buyer 
ON public.leads(project_id, is_sold, buyer_user_id);

-- ============================================
-- 2. ADD PROJECT_NAME COLUMN TO PURCHASE_REQUESTS
-- ============================================

DO $$ 
BEGIN
    -- Add project_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_requests' 
        AND column_name = 'project_name'
    ) THEN
        ALTER TABLE public.purchase_requests 
        ADD COLUMN project_name text;
        
        -- Backfill existing data
        UPDATE public.purchase_requests pr
        SET project_name = p.name
        FROM public.projects p
        WHERE pr.project_id = p.id 
        AND pr.project_name IS NULL;
        
        RAISE NOTICE '✅ Added project_name column to purchase_requests';
    ELSE
        RAISE NOTICE '✅ project_name column already exists';
    END IF;
END $$;

-- Create trigger to auto-update project_name on insert/update
CREATE OR REPLACE FUNCTION update_purchase_request_project_name()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.project_id IS NOT NULL AND (NEW.project_name IS NULL OR OLD.project_id != NEW.project_id) THEN
        SELECT name INTO NEW.project_name
        FROM public.projects
        WHERE id = NEW.project_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_purchase_request_project_name ON public.purchase_requests;
CREATE TRIGGER trigger_update_purchase_request_project_name
    BEFORE INSERT OR UPDATE ON public.purchase_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_purchase_request_project_name();

-- ============================================
-- 3. VERIFY LEADS TABLE STRUCTURE
-- ============================================

-- Check if leads table exists and has correct columns
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'leads'
AND column_name IN ('id', 'project_id', 'is_sold', 'buyer_user_id', 'owner_id', 'assigned_to_id')
ORDER BY column_name;

-- ============================================
-- 4. CHECK FOR LEAD_AVAILABILITY VIEW/TABLE
-- ============================================

-- Check if lead_availability is a table or view
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'lead_availability';

-- ============================================
-- 5. VERIFY PURCHASE_REQUESTS COLUMNS
-- ============================================

-- Verify purchase_requests has project_name
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'purchase_requests'
AND column_name = 'project_name';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

SELECT '✅ RPC function created, project_name added, and verification complete!' as status;

