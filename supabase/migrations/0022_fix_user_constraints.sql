-- Temporarily remove foreign key constraints for testing
-- This allows orders to work without requiring auth.users

-- Update the order functions to not require user profiles for testing
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
    
    -- Create order (temporarily remove user_id foreign key constraint)
    INSERT INTO orders (id, user_id, project_id, quantity, payment_method, total_amount, created_at)
    VALUES (uuid_generate_v4(), user_id, project_id, quantity, payment_method_enum, total_amount, NOW())
    RETURNING id INTO order_id;

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

-- Temporarily drop the user_id foreign key constraint on orders
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

-- Also drop the foreign key constraint on recent_activity
ALTER TABLE recent_activity DROP CONSTRAINT IF EXISTS recent_activity_user_id_fkey;
