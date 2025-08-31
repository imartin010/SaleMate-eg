-- Fix CPL and purchase issues
-- This migration addresses decimal handling and purchase flow problems

-- Update the rpc_update_project_cpl function to handle decimals properly
CREATE OR REPLACE FUNCTION rpc_update_project_cpl(
    project_id UUID,
    new_price_per_lead NUMERIC(10,2)
)
RETURNS JSON AS $$
DECLARE
    project_record RECORD;
    old_price NUMERIC(10,2);
BEGIN
    -- Validate price (allow any positive number)
    IF new_price_per_lead < 0 THEN
        RAISE EXCEPTION 'Price per lead cannot be negative';
    END IF;

    -- Get current project data
    SELECT * INTO project_record FROM projects WHERE id = project_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Project not found';
    END IF;

    old_price := project_record.price_per_lead;

    -- Update price per lead
    UPDATE projects 
    SET price_per_lead = new_price_per_lead, updated_at = NOW()
    WHERE id = project_id;

    -- Log activity if user exists
    IF auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()) THEN
        BEGIN
            INSERT INTO recent_activity (user_id, action, details)
            VALUES (auth.uid(), 'project_cpl_updated', jsonb_build_object(
                'project_id', project_id,
                'project_name', project_record.name,
                'old_price_per_lead', old_price,
                'new_price_per_lead', new_price_per_lead,
                'difference', new_price_per_lead - old_price
            ));
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Failed to log CPL update activity: %', SQLERRM;
        END;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'project_id', project_id,
        'project_name', project_record.name,
        'old_price_per_lead', old_price,
        'new_price_per_lead', new_price_per_lead,
        'difference', new_price_per_lead - old_price
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix the start order function to handle available leads properly
CREATE OR REPLACE FUNCTION rpc_start_order(
    user_id UUID,
    project_id UUID,
    quantity INTEGER,
    payment_method TEXT
)
RETURNS JSON AS $$
DECLARE
    order_id UUID;
    total_amount NUMERIC(10,2);
    available_leads_count INTEGER;
    current_price_per_lead NUMERIC(10,2);
    project_name TEXT;
BEGIN
    -- Validate minimum quantity
    IF quantity < 50 THEN
        RAISE EXCEPTION 'Minimum order quantity is 50 leads';
    END IF;

    -- Check if project exists and get current data with row lock
    SELECT available_leads, price_per_lead, name 
    INTO available_leads_count, current_price_per_lead, project_name
    FROM projects WHERE id = project_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Project not found';
    END IF;
    
    -- Debug logging
    RAISE NOTICE 'Project: %, Available: %, Requested: %', project_name, available_leads_count, quantity;
    
    IF available_leads_count < quantity THEN
        RAISE EXCEPTION 'Not enough leads available. Available: %, Requested: %', available_leads_count, quantity;
    END IF;

    -- Calculate total amount using current CPL
    total_amount := quantity * current_price_per_lead;
    
    -- Create order
    INSERT INTO orders (user_id, project_id, quantity, payment_method, total_amount)
    VALUES (user_id, project_id, quantity, payment_method, total_amount)
    RETURNING id INTO order_id;

    -- Log activity if user exists
    IF EXISTS (SELECT 1 FROM profiles WHERE id = user_id) THEN
        BEGIN
            INSERT INTO recent_activity (user_id, action, details)
            VALUES (user_id, 'order_started', jsonb_build_object(
                'order_id', order_id,
                'project_id', project_id,
                'project_name', project_name,
                'quantity', quantity,
                'price_per_lead', current_price_per_lead,
                'total_amount', total_amount,
                'available_leads_before', available_leads_count
            ));
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Failed to log order activity: %', SQLERRM;
        END;
    END IF;

    RETURN jsonb_build_object(
        'order_id', order_id,
        'total_amount', total_amount,
        'price_per_lead', current_price_per_lead,
        'quantity', quantity,
        'available_leads', available_leads_count,
        'status', 'pending'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the confirm order function to be more robust
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
        SET status = 'confirmed', payment_reference = payment_reference
        WHERE id = order_id;

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

        -- Log activity if user exists
        IF EXISTS (SELECT 1 FROM profiles WHERE id = order_record.user_id) THEN
            BEGIN
                INSERT INTO recent_activity (user_id, action, details)
                VALUES (order_record.user_id, 'order_confirmed', jsonb_build_object(
                    'order_id', order_id,
                    'project_id', order_record.project_id,
                    'project_name', project_record.name,
                    'quantity', order_record.quantity,
                    'assigned_leads', assigned_leads,
                    'payment_reference', payment_reference,
                    'remaining_available_leads', project_record.available_leads - assigned_leads
                ));
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE 'Failed to log confirmation activity: %', SQLERRM;
            END;
        END IF;

    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION 'Failed to confirm order: %', SQLERRM;
    END;

    RETURN jsonb_build_object(
        'order_id', order_id,
        'status', 'confirmed',
        'leads_assigned', assigned_leads,
        'payment_reference', payment_reference,
        'remaining_available_leads', project_record.available_leads - assigned_leads
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
