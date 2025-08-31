-- Improved Lead Purchase Workflow
-- This migration enhances the purchase system with better concurrency handling,
-- atomic transactions, and comprehensive error handling

-- Drop existing functions to recreate them with improvements
DROP FUNCTION IF EXISTS rpc_start_order(UUID, UUID, INTEGER, TEXT);
DROP FUNCTION IF EXISTS rpc_confirm_order(UUID, TEXT);
DROP FUNCTION IF EXISTS rpc_fail_order(UUID, TEXT);

-- Enhanced start order function with better validation
CREATE OR REPLACE FUNCTION rpc_start_order(
    user_id UUID,
    project_id UUID,
    quantity INTEGER,
    payment_method TEXT
)
RETURNS JSONB AS $$
DECLARE
    order_id UUID;
    project_record RECORD;
    total_amount NUMERIC(10,2);
    user_record RECORD;
BEGIN
    -- Validate user exists and is not banned
    SELECT * INTO user_record FROM profiles WHERE id = user_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    IF user_record.is_banned THEN
        RAISE EXCEPTION 'User account is banned and cannot make purchases';
    END IF;

    -- Validate minimum quantity
    IF quantity < 50 THEN
        RAISE EXCEPTION 'Minimum order quantity is 50 leads';
    END IF;

    -- Validate payment method
    IF payment_method NOT IN ('Instapay', 'VodafoneCash', 'BankTransfer') THEN
        RAISE EXCEPTION 'Invalid payment method: %', payment_method;
    END IF;

    -- Get project with FOR UPDATE lock to prevent race conditions
    SELECT * INTO project_record 
    FROM projects 
    WHERE id = project_id 
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Project not found';
    END IF;
    
    -- Check real-time lead availability with lock
    DECLARE
        actual_available_leads INTEGER;
    BEGIN
        SELECT COUNT(*) INTO actual_available_leads
        FROM leads 
        WHERE project_id = project_id 
        AND buyer_user_id IS NULL
        FOR UPDATE SKIP LOCKED;
        
        -- Update project's available_leads to match reality
        UPDATE projects 
        SET available_leads = actual_available_leads,
            updated_at = NOW()
        WHERE id = project_id;
        
        -- Check if enough leads are available
        IF actual_available_leads < quantity THEN
            RAISE EXCEPTION 'Not enough leads available. Available: %, Requested: %', 
                           actual_available_leads, quantity;
        END IF;
    END;

    -- Calculate total amount
    total_amount := quantity * project_record.price_per_lead;
    
    -- Create order with pending status
    INSERT INTO orders (user_id, project_id, quantity, payment_method, total_amount, status)
    VALUES (user_id, project_id, quantity, payment_method::payment_method_type, total_amount, 'pending')
    RETURNING id INTO order_id;

    -- Log activity
    INSERT INTO recent_activity (user_id, action, details)
    VALUES (user_id, 'order_started', jsonb_build_object(
        'order_id', order_id,
        'project_id', project_id,
        'project_name', project_record.name,
        'quantity', quantity,
        'total_amount', total_amount,
        'payment_method', payment_method
    ));

    RETURN jsonb_build_object(
        'success', true,
        'order_id', order_id,
        'total_amount', total_amount,
        'status', 'pending',
        'project_name', project_record.name,
        'available_leads_after_reserve', actual_available_leads - quantity
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced confirm order function with atomic transactions
CREATE OR REPLACE FUNCTION rpc_confirm_order(
    order_id UUID,
    payment_reference TEXT
)
RETURNS JSONB AS $$
DECLARE
    order_record RECORD;
    project_record RECORD;
    assigned_leads INTEGER;
    actual_available_leads INTEGER;
BEGIN
    -- Get order details with exclusive lock
    SELECT * INTO order_record 
    FROM orders 
    WHERE id = order_id 
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found: %', order_id;
    END IF;

    IF order_record.status != 'pending' THEN
        RAISE EXCEPTION 'Order is not in pending status. Current status: %', order_record.status;
    END IF;

    -- Get project details with lock
    SELECT * INTO project_record 
    FROM projects 
    WHERE id = order_record.project_id 
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Project not found: %', order_record.project_id;
    END IF;

    -- Start atomic transaction for lead assignment
    BEGIN
        -- Check actual available leads with lock
        SELECT COUNT(*) INTO actual_available_leads
        FROM leads 
        WHERE project_id = order_record.project_id 
        AND buyer_user_id IS NULL
        FOR UPDATE SKIP LOCKED;

        -- Validate sufficient leads are still available
        IF actual_available_leads < order_record.quantity THEN
            RAISE EXCEPTION 'Insufficient leads available. Available: %, Requested: %', 
                           actual_available_leads, order_record.quantity;
        END IF;

        -- Update order status and payment reference
        UPDATE orders 
        SET status = 'confirmed', 
            payment_reference = rpc_confirm_order.payment_reference,
            updated_at = NOW()
        WHERE id = order_id;

        -- Assign leads atomically (FIFO by created_at)
        WITH leads_to_assign AS (
            SELECT id 
            FROM leads 
            WHERE project_id = order_record.project_id 
            AND buyer_user_id IS NULL
            ORDER BY created_at ASC
            LIMIT order_record.quantity
            FOR UPDATE SKIP LOCKED
        )
        UPDATE leads 
        SET buyer_user_id = order_record.user_id, 
            updated_at = NOW()
        WHERE id IN (SELECT id FROM leads_to_assign);

        -- Get count of actually assigned leads
        GET DIAGNOSTICS assigned_leads = ROW_COUNT;

        -- Update project's available_leads count
        UPDATE projects 
        SET available_leads = available_leads - assigned_leads,
            updated_at = NOW()
        WHERE id = order_record.project_id;

        -- Verify correct number of leads assigned
        IF assigned_leads != order_record.quantity THEN
            RAISE EXCEPTION 'Lead assignment mismatch. Assigned: %, Expected: %', 
                           assigned_leads, order_record.quantity;
        END IF;

        -- Log successful activity
        INSERT INTO recent_activity (user_id, action, details)
        VALUES (order_record.user_id, 'order_confirmed', jsonb_build_object(
            'order_id', order_id,
            'project_id', order_record.project_id,
            'project_name', project_record.name,
            'quantity', order_record.quantity,
            'leads_assigned', assigned_leads,
            'payment_reference', payment_reference,
            'total_amount', order_record.total_amount,
            'remaining_available_leads', project_record.available_leads - assigned_leads
        ));

    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback order to failed status
            UPDATE orders 
            SET status = 'failed', 
                updated_at = NOW()
            WHERE id = order_id;
            
            -- Log the failure
            INSERT INTO recent_activity (user_id, action, details)
            VALUES (order_record.user_id, 'order_failed', jsonb_build_object(
                'order_id', order_id,
                'error', SQLERRM,
                'project_id', order_record.project_id
            ));
            
            RAISE EXCEPTION 'Purchase failed: %', SQLERRM;
    END;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', order_id,
        'status', 'confirmed',
        'leads_assigned', assigned_leads,
        'payment_reference', payment_reference,
        'total_amount', order_record.total_amount,
        'project_name', project_record.name,
        'remaining_available_leads', project_record.available_leads - assigned_leads
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced fail order function
CREATE OR REPLACE FUNCTION rpc_fail_order(
    order_id UUID,
    reason TEXT
)
RETURNS JSONB AS $$
DECLARE
    order_record RECORD;
BEGIN
    -- Get order details with lock
    SELECT * INTO order_record 
    FROM orders 
    WHERE id = order_id 
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found: %', order_id;
    END IF;

    -- Update order status to failed
    UPDATE orders 
    SET status = 'failed',
        updated_at = NOW()
    WHERE id = order_id;

    -- Log failure activity
    INSERT INTO recent_activity (user_id, action, details)
    VALUES (order_record.user_id, 'order_failed', jsonb_build_object(
        'order_id', order_id,
        'reason', reason,
        'project_id', order_record.project_id,
        'quantity', order_record.quantity
    ));

    RETURN jsonb_build_object(
        'success', true,
        'order_id', order_id,
        'status', 'failed',
        'reason', reason
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get real-time project availability
CREATE OR REPLACE FUNCTION rpc_get_project_availability(
    project_id UUID
)
RETURNS JSONB AS $$
DECLARE
    project_record RECORD;
    actual_available_leads INTEGER;
BEGIN
    -- Get project details
    SELECT * INTO project_record FROM projects WHERE id = project_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Project not found: %', project_id;
    END IF;

    -- Count actual unassigned leads
    SELECT COUNT(*) INTO actual_available_leads
    FROM leads 
    WHERE project_id = project_id 
    AND buyer_user_id IS NULL;

    -- Update project if count differs
    IF actual_available_leads != project_record.available_leads THEN
        UPDATE projects 
        SET available_leads = actual_available_leads,
            updated_at = NOW()
        WHERE id = project_id;
    END IF;

    RETURN jsonb_build_object(
        'project_id', project_id,
        'project_name', project_record.name,
        'available_leads', actual_available_leads,
        'price_per_lead', project_record.price_per_lead,
        'last_updated', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION rpc_start_order(UUID, UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_confirm_order(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_fail_order(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_project_availability(UUID) TO authenticated;
