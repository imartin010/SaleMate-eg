-- Update the CPL (Cost Per Lead) system
-- This migration ensures proper pricing calculation using project's price_per_lead

-- Update the rpc_start_order function to use the project's current price_per_lead
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

    -- Check if project exists and get current pricing
    SELECT available_leads, price_per_lead, name 
    INTO available_leads_count, current_price_per_lead, project_name
    FROM projects WHERE id = project_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Project not found';
    END IF;
    
    IF available_leads_count < quantity THEN
        RAISE EXCEPTION 'Not enough leads available. Available: %, Requested: %', available_leads_count, quantity;
    END IF;

    -- Calculate total amount using current CPL
    total_amount := quantity * current_price_per_lead;
    
    -- Create order
    INSERT INTO orders (user_id, project_id, quantity, payment_method, total_amount)
    VALUES (user_id, project_id, quantity, payment_method, total_amount)
    RETURNING id INTO order_id;

    -- Log activity
    INSERT INTO recent_activity (user_id, action, details)
    VALUES (user_id, 'order_started', jsonb_build_object(
        'order_id', order_id,
        'project_id', project_id,
        'project_name', project_name,
        'quantity', quantity,
        'price_per_lead', current_price_per_lead,
        'total_amount', total_amount
    ));

    RETURN jsonb_build_object(
        'order_id', order_id,
        'total_amount', total_amount,
        'price_per_lead', current_price_per_lead,
        'quantity', quantity,
        'status', 'pending'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update project CPL (admin/support only)
CREATE OR REPLACE FUNCTION rpc_update_project_cpl(
    project_id UUID,
    new_price_per_lead NUMERIC(10,2)
)
RETURNS JSON AS $$
DECLARE
    project_record RECORD;
    old_price NUMERIC(10,2);
BEGIN
    -- Check if user has permission (admin or support only)
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'support')
    ) THEN
        RAISE EXCEPTION 'Only admin and support users can update project pricing';
    END IF;

    -- Validate price
    IF new_price_per_lead <= 0 THEN
        RAISE EXCEPTION 'Price per lead must be greater than 0';
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

    -- Log activity
    INSERT INTO recent_activity (user_id, action, details)
    VALUES (auth.uid(), 'project_cpl_updated', jsonb_build_object(
        'project_id', project_id,
        'project_name', project_record.name,
        'old_price_per_lead', old_price,
        'new_price_per_lead', new_price_per_lead,
        'difference', new_price_per_lead - old_price
    ));

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

-- Create function to calculate order total based on current CPL
CREATE OR REPLACE FUNCTION rpc_calculate_order_total(
    project_id UUID,
    quantity INTEGER
)
RETURNS JSON AS $$
DECLARE
    current_price_per_lead NUMERIC(10,2);
    total_amount NUMERIC(10,2);
    project_name TEXT;
    available_leads_count INTEGER;
BEGIN
    -- Get project pricing and availability
    SELECT price_per_lead, name, available_leads 
    INTO current_price_per_lead, project_name, available_leads_count
    FROM projects WHERE id = project_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Project not found';
    END IF;
    
    -- Calculate total
    total_amount := quantity * current_price_per_lead;

    RETURN jsonb_build_object(
        'project_id', project_id,
        'project_name', project_name,
        'quantity', quantity,
        'price_per_lead', current_price_per_lead,
        'total_amount', total_amount,
        'available_leads', available_leads_count,
        'can_fulfill', available_leads_count >= quantity
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION rpc_update_project_cpl TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_calculate_order_total TO authenticated;
