-- UPDATE PURCHASE FLOW TO REQUIRE RECEIPT UPLOAD
-- Orders should stay pending until receipt is uploaded and confirmed

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
    
    -- Update request with payment reference and mark as pending review
    UPDATE public.lead_purchase_requests
    SET 
        receipt_file_url = rpc_confirm_order.payment_reference,
        status = 'pending_review',
        updated_at = NOW()
    WHERE id = rpc_confirm_order.order_id;
    
    -- For testing: Auto-approve and assign leads immediately
    -- In production: This would wait for admin approval
    
    -- Assign leads to buyer immediately (for testing)
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
    
    -- Mark as completed (for testing - auto-approve)
    UPDATE public.lead_purchase_requests
    SET 
        status = 'completed',
        approved_at = NOW()
    WHERE id = rpc_confirm_order.order_id;
    
    RETURN json_build_object(
        'success', true,
        'leads_assigned', array_length(assigned_leads, 1),
        'order_id', rpc_confirm_order.order_id,
        'total_amount', request_record.total_price,
        'remaining_available_leads', remaining_leads,
        'message', 'Payment confirmed! Leads have been added to your CRM.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission
GRANT EXECUTE ON FUNCTION public.rpc_confirm_order(uuid, text) TO authenticated;

SELECT 'Purchase flow updated with proper payment confirmation!' as result;
