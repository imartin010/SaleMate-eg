-- ============================================
-- CREATE PURCHASE_REQUESTS VIEW AND FUNCTIONS
-- ============================================
-- This migration creates the purchase_requests view that maps to lead_commerce
-- This is needed for the checkout functionality to work

-- Drop existing view and triggers if they exist
DROP TRIGGER IF EXISTS trg_purchase_requests_view_upsert ON public.purchase_requests;
DROP TRIGGER IF EXISTS trg_purchase_requests_view_delete ON public.purchase_requests;
DROP VIEW IF EXISTS public.purchase_requests;

-- Create the sync function for purchase_requests
CREATE OR REPLACE FUNCTION public.sync_purchase_requests_to_lead_commerce()
RETURNS trigger AS $$
DECLARE
  v_metadata jsonb;
BEGIN
  v_metadata := jsonb_build_object(
    'source', 'purchase_requests',
    'receipt_url', NEW.receipt_url,
    'payment_method', NEW.payment_method,
    'receipt_file_name', NEW.receipt_file_name,
    'approved_by', NEW.approved_by,
    'approved_at', NEW.approved_at,
    'rejected_reason', NEW.rejected_reason,
    'rejected_at', NEW.rejected_at,
    'project_name', NEW.project_name
  );

  INSERT INTO public.lead_commerce (id, lead_id, profile_id, project_id, commerce_type, status, quantity, amount, currency, payment_operation_id, notes, metadata, created_at, updated_at)
  VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NULL,
    NEW.user_id,
    NEW.project_id,
    'allocation',
    COALESCE(NEW.status, 'pending'),
    NEW.quantity,
    NEW.total_amount,
    NULL,
    NEW.payment_transaction_id,
    NEW.admin_notes,
    v_metadata,
    COALESCE(NEW.created_at, now()),
    COALESCE(NEW.updated_at, now())
  )
  ON CONFLICT (id) DO UPDATE
    SET profile_id = EXCLUDED.profile_id,
        project_id = EXCLUDED.project_id,
        commerce_type = EXCLUDED.commerce_type,
        status = EXCLUDED.status,
        quantity = EXCLUDED.quantity,
        amount = EXCLUDED.amount,
        payment_operation_id = EXCLUDED.payment_operation_id,
        notes = EXCLUDED.notes,
        metadata = EXCLUDED.metadata,
        created_at = EXCLUDED.created_at,
        updated_at = EXCLUDED.updated_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create remove function if it doesn't exist
CREATE OR REPLACE FUNCTION public.remove_lead_commerce()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.lead_commerce
  WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create the purchase_requests view
CREATE VIEW public.purchase_requests AS
SELECT
  lc.id,
  lc.profile_id AS user_id,
  lc.project_id,
  lc.quantity,
  lc.status,
  lc.notes AS admin_notes,
  lc.amount AS total_amount,
  lc.metadata->>'receipt_url' AS receipt_url,
  lc.metadata->>'payment_method' AS payment_method,
  lc.metadata->>'receipt_file_name' AS receipt_file_name,
  lc.metadata->>'project_name' AS project_name,
  (lc.metadata->>'approved_by')::uuid AS approved_by,
  (lc.metadata->>'approved_at')::timestamptz AS approved_at,
  (lc.metadata->>'rejected_reason') AS rejected_reason,
  (lc.metadata->>'rejected_at')::timestamptz AS rejected_at,
  lc.payment_operation_id AS payment_transaction_id,
  lc.created_at,
  lc.updated_at
FROM public.lead_commerce lc
WHERE lc.commerce_type = 'allocation';

-- Create triggers for the view
CREATE TRIGGER trg_purchase_requests_view_upsert
INSTEAD OF INSERT OR UPDATE ON public.purchase_requests
FOR EACH ROW EXECUTE FUNCTION public.sync_purchase_requests_to_lead_commerce();

CREATE TRIGGER trg_purchase_requests_view_delete
INSTEAD OF DELETE ON public.purchase_requests
FOR EACH ROW EXECUTE FUNCTION public.remove_lead_commerce();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_requests TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

COMMENT ON VIEW public.purchase_requests IS 'View for purchase requests that syncs to lead_commerce table';
COMMENT ON FUNCTION public.sync_purchase_requests_to_lead_commerce() IS 'Syncs purchase_requests view inserts/updates to lead_commerce table';

