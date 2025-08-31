-- Fix payment method type casting in order functions

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
    payment_method_enum payment_method_type;
BEGIN
    -- Validate and cast payment method
    BEGIN
        payment_method_enum := payment_method::payment_method_type;
    EXCEPTION
        WHEN invalid_text_representation THEN
            RAISE EXCEPTION 'Invalid payment method: %. Valid options: Instapay, VodafoneCash, BankTransfer', payment_method;
    END;

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
    
    -- Create order with proper enum type
    INSERT INTO orders (user_id, project_id, quantity, payment_method, total_amount)
    VALUES (user_id, project_id, quantity, payment_method_enum, total_amount)
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
        'payment_method', payment_method,
        'status', 'pending'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
