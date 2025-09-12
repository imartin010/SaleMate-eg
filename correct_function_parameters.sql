-- CREATE FUNCTIONS WITH CORRECT PARAMETER NAMES
-- This matches exactly what the frontend is calling

-- 1) Drop existing functions
DROP FUNCTION IF EXISTS public.rpc_start_order;
DROP FUNCTION IF EXISTS public.rpc_confirm_order;
DROP FUNCTION IF EXISTS public.rpc_get_project_availability;

-- 2) Create rpc_start_order with exact parameter names frontend uses
CREATE OR REPLACE FUNCTION public.rpc_start_order(
    payment_method text,
    project_id uuid,
    quantity integer,
    user_id uuid
) RETURNS json AS $$
DECLARE
    project_record record;
    available_count integer;
    total_price numeric;
    cpl_price numeric;
    order_id uuid;
BEGIN
    -- Get project info and check availability
    SELECT 
        p.id,
        p.name,
        p.price_per_lead,
        COUNT(l.id) FILTER (WHERE l.buyer_user_id IS NULL) as current_available_leads
    INTO project_record
    FROM public.projects p
    LEFT JOIN public.leads l ON l.project_id = p.id
    WHERE p.id = rpc_start_order.project_id
    GROUP BY p.id, p.name, p.price_per_lead;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Project not found');
    END IF;
    
    available_count := COALESCE(project_record.current_available_leads, 0);
    
    IF available_count < rpc_start_order.quantity THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Not enough leads available',
            'available', available_count,
            'requested', rpc_start_order.quantity
        );
    END IF;
    
    -- Calculate pricing
    cpl_price := COALESCE(project_record.price_per_lead, 25.00);
    total_price := rpc_start_order.quantity * cpl_price;
    
    -- Create purchase request
    INSERT INTO public.lead_purchase_requests (
        buyer_user_id,
        project_id,
        number_of_leads,
        cpl_price,
        total_price,
        payment_method,
        receipt_file_url,
        status
    ) VALUES (
        rpc_start_order.user_id,
        rpc_start_order.project_id,
        rpc_start_order.quantity,
        cpl_price,
        total_price,
        rpc_start_order.payment_method,
        'pending_receipt',
        'pending'
    ) RETURNING id INTO order_id;
    
    RETURN json_build_object(
        'success', true,
        'order_id', order_id,
        'total_amount', total_price,
        'cpl_price', cpl_price,
        'quantity', rpc_start_order.quantity,
        'project_name', project_record.name
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3) Create rpc_confirm_order with exact parameter names frontend uses
CREATE OR REPLACE FUNCTION public.rpc_confirm_order(
    order_id uuid,
    payment_reference text
) RETURNS json AS $$
DECLARE
    request_record record;
    assigned_leads uuid[];
    remaining_leads integer;
BEGIN
    -- Get the purchase request
    SELECT * INTO request_record
    FROM public.lead_purchase_requests
    WHERE id = rpc_confirm_order.order_id AND buyer_user_id = auth.uid();
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Order not found');
    END IF;
    
    -- Update request with payment reference
    UPDATE public.lead_purchase_requests
    SET 
        receipt_file_url = rpc_confirm_order.payment_reference,
        status = 'approved',
        approved_at = NOW()
    WHERE id = rpc_confirm_order.order_id;
    
    -- Assign leads to buyer
    SELECT ARRAY(
        SELECT l.id
        FROM public.leads l
        WHERE l.project_id = request_record.project_id
        AND l.buyer_user_id IS NULL
        ORDER BY l.created_at ASC
        LIMIT request_record.number_of_leads
        FOR UPDATE SKIP LOCKED
    ) INTO assigned_leads;
    
    -- Check if we have enough leads
    IF array_length(assigned_leads, 1) < request_record.number_of_leads THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Not enough available leads'
        );
    END IF;
    
    -- Assign leads to buyer
    UPDATE public.leads
    SET 
        buyer_user_id = request_record.buyer_user_id,
        is_sold = true,
        sold_at = NOW(),
        cpl_price = request_record.cpl_price
    WHERE id = ANY(assigned_leads);
    
    -- Get remaining available leads count
    SELECT COUNT(*) INTO remaining_leads
    FROM public.leads l
    WHERE l.project_id = request_record.project_id
    AND l.buyer_user_id IS NULL;
    
    -- Update purchase request to completed
    UPDATE public.lead_purchase_requests
    SET status = 'completed'
    WHERE id = rpc_confirm_order.order_id;
    
    RETURN json_build_object(
        'success', true,
        'leads_assigned', array_length(assigned_leads, 1),
        'order_id', rpc_confirm_order.order_id,
        'total_amount', request_record.total_price,
        'remaining_available_leads', remaining_leads
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4) Create rpc_get_project_availability function
CREATE OR REPLACE FUNCTION public.rpc_get_project_availability(
    project_id uuid
) RETURNS json AS $$
DECLARE
    available_count integer;
    project_name text;
BEGIN
    SELECT 
        COUNT(l.id) FILTER (WHERE l.buyer_user_id IS NULL),
        p.name
    INTO available_count, project_name
    FROM public.projects p
    LEFT JOIN public.leads l ON l.project_id = p.id
    WHERE p.id = rpc_get_project_availability.project_id
    GROUP BY p.id, p.name;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Project not found');
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'available_leads', COALESCE(available_count, 0),
        'project_name', project_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5) Grant permissions
GRANT EXECUTE ON FUNCTION public.rpc_start_order(text, uuid, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_confirm_order(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_project_availability(uuid) TO authenticated;

-- 6) Success message
SELECT 'Functions created with correct parameter names!' as result;
