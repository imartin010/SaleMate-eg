-- FINAL PURCHASE FUNCTIONS - CLEAN VERSION
-- Copy and paste this entire script into Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.rpc_get_project_availability(
    p_project_id uuid
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
    WHERE p.id = p_project_id
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

CREATE OR REPLACE FUNCTION public.rpc_start_order(
    p_payment_method text,
    p_project_id uuid,
    p_quantity integer,
    p_user_id uuid
) RETURNS json AS $$
DECLARE
    project_record record;
    available_count integer;
    total_price numeric;
    cpl_price numeric;
    order_id uuid;
BEGIN
    IF p_quantity < 1 THEN
        RETURN json_build_object('success', false, 'error', 'Quantity must be at least 1');
    END IF;
    
    SELECT 
        p.id,
        p.name,
        p.price_per_lead,
        COUNT(l.id) FILTER (WHERE l.buyer_user_id IS NULL) as current_available_leads
    INTO project_record
    FROM public.projects p
    LEFT JOIN public.leads l ON l.project_id = p.id
    WHERE p.id = p_project_id
    GROUP BY p.id, p.name, p.price_per_lead;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Project not found');
    END IF;
    
    available_count := COALESCE(project_record.current_available_leads, 0);
    
    IF available_count < p_quantity THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Not enough leads available',
            'available', available_count,
            'requested', p_quantity
        );
    END IF;
    
    cpl_price := COALESCE(project_record.price_per_lead, 25.00);
    total_price := p_quantity * cpl_price;
    
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
        p_user_id,
        p_project_id,
        p_quantity,
        cpl_price,
        total_price,
        p_payment_method,
        'pending_receipt',
        'pending'
    ) RETURNING id INTO order_id;
    
    RETURN json_build_object(
        'success', true,
        'order_id', order_id,
        'total_amount', total_price,
        'cpl_price', cpl_price,
        'quantity', p_quantity,
        'project_name', project_record.name
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.rpc_confirm_order(
    p_order_id uuid,
    p_receipt_url text,
    p_payment_reference text
) RETURNS json AS $$
DECLARE
    request_record record;
    assigned_leads uuid[];
    remaining_leads integer;
BEGIN
    SELECT * INTO request_record
    FROM public.lead_purchase_requests
    WHERE id = p_order_id AND buyer_user_id = auth.uid();
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Order not found');
    END IF;
    
    UPDATE public.lead_purchase_requests
    SET 
        receipt_file_url = p_receipt_url,
        status = 'approved',
        approved_at = NOW()
    WHERE id = p_order_id;
    
    SELECT ARRAY(
        SELECT l.id
        FROM public.leads l
        WHERE l.project_id = request_record.project_id
        AND l.buyer_user_id IS NULL
        ORDER BY l.created_at ASC
        LIMIT request_record.number_of_leads
        FOR UPDATE SKIP LOCKED
    ) INTO assigned_leads;
    
    IF array_length(assigned_leads, 1) < request_record.number_of_leads THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Not enough available leads'
        );
    END IF;
    
    UPDATE public.leads
    SET 
        buyer_user_id = request_record.buyer_user_id,
        is_sold = true,
        sold_at = NOW(),
        cpl_price = request_record.cpl_price
    WHERE id = ANY(assigned_leads);
    
    SELECT COUNT(*) INTO remaining_leads
    FROM public.leads l
    WHERE l.project_id = request_record.project_id
    AND l.buyer_user_id IS NULL;
    
    UPDATE public.lead_purchase_requests
    SET status = 'completed'
    WHERE id = p_order_id;
    
    RETURN json_build_object(
        'success', true,
        'leads_assigned', array_length(assigned_leads, 1),
        'order_id', p_order_id,
        'total_amount', request_record.total_price,
        'remaining_available_leads', remaining_leads
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.rpc_start_order(text, uuid, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_confirm_order(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_project_availability(uuid) TO authenticated;

SELECT 'All purchase functions created successfully!' as result;
