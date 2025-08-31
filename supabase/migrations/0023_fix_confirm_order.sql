-- Fix the confirm order function column ambiguity

CREATE OR REPLACE FUNCTION rpc_confirm_order(
    order_id UUID,
    payment_reference TEXT
)
RETURNS JSON AS $$
DECLARE
    order_record RECORD;
    project_record RECORD;
    assigned_leads INTEGER;
BEGIN
    -- Get order details with lock
    SELECT * INTO order_record FROM orders WHERE id = order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    IF order_record.status != 'pending' THEN
        RAISE EXCEPTION 'Order is not in pending status. Current status: %', order_record.status;
    END IF;

    -- Get project details with lock
    SELECT * INTO project_record FROM projects WHERE id = order_record.project_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Project not found';
    END IF;

    -- Debug logging
    RAISE NOTICE 'Confirming order: %, Project: %, Available: %, Requested: %', 
                 order_id, project_record.name, project_record.available_leads, order_record.quantity;

    -- Check if enough leads are still available
    IF project_record.available_leads < order_record.quantity THEN
        RAISE EXCEPTION 'Not enough leads available. Available: %, Requested: %', 
                       project_record.available_leads, order_record.quantity;
    END IF;

    -- Start transaction
    BEGIN
        -- Update order status and payment reference
        UPDATE orders 
        SET status = 'confirmed', payment_reference = rpc_confirm_order.payment_reference
        WHERE id = rpc_confirm_order.order_id;

        -- Assign leads to the buyer (FIFO by created_at)
        WITH leads_to_assign AS (
            SELECT id FROM leads 
            WHERE project_id = order_record.project_id 
            AND buyer_user_id IS NULL
            ORDER BY created_at ASC
            LIMIT order_record.quantity
            FOR UPDATE SKIP LOCKED
        )
        UPDATE leads 
        SET buyer_user_id = order_record.user_id, updated_at = NOW()
        WHERE id IN (SELECT id FROM leads_to_assign);

        -- Get count of actually assigned leads
        GET DIAGNOSTICS assigned_leads = ROW_COUNT;

        -- Decrease available_leads by the number of leads actually assigned
        UPDATE projects 
        SET available_leads = available_leads - assigned_leads
        WHERE id = order_record.project_id;

        -- Verify we assigned the correct number of leads
        IF assigned_leads != order_record.quantity THEN
            RAISE EXCEPTION 'Could only assign % leads out of % requested', assigned_leads, order_record.quantity;
        END IF;

    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION 'Failed to confirm order: %', SQLERRM;
    END;

    RETURN jsonb_build_object(
        'order_id', rpc_confirm_order.order_id,
        'status', 'confirmed',
        'leads_assigned', assigned_leads,
        'payment_reference', rpc_confirm_order.payment_reference,
        'remaining_available_leads', project_record.available_leads - assigned_leads
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
