-- Lead Management System Migration
-- This migration sets up the proper lead management workflow:
-- 1. Set all projects available_leads to 0
-- 2. Create functions for lead upload and purchase management
-- 3. Update existing RPC functions to handle the workflow

-- First, set all projects available_leads to 0
UPDATE projects SET available_leads = 0;

-- Create function to upload leads and update available_leads
CREATE OR REPLACE FUNCTION rpc_upload_leads(
    project_id UUID,
    leads_data JSONB[]
)
RETURNS JSON AS $$
DECLARE
    uploaded_count INTEGER := 0;
    lead_record JSONB;
    new_lead_id UUID;
BEGIN
    -- Check if user has permission (admin or support only)
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'support')
    ) THEN
        RAISE EXCEPTION 'Only admin and support users can upload leads';
    END IF;

    -- Check if project exists
    IF NOT EXISTS (SELECT 1 FROM projects WHERE id = project_id) THEN
        RAISE EXCEPTION 'Project not found';
    END IF;

    -- Insert each lead and count successful insertions
    FOR i IN 1..array_length(leads_data, 1) LOOP
        lead_record := leads_data[i];
        
        BEGIN
            INSERT INTO leads (
                project_id,
                client_name,
                client_phone,
                client_email,
                platform,
                stage
            ) VALUES (
                project_id,
                lead_record->>'client_name',
                lead_record->>'client_phone',
                lead_record->>'client_email',
                (lead_record->>'platform')::platform_type,
                COALESCE((lead_record->>'stage')::lead_stage, 'New Lead')
            ) RETURNING id INTO new_lead_id;
            
            uploaded_count := uploaded_count + 1;
            
        EXCEPTION
            WHEN unique_violation THEN
                -- Skip duplicate phone numbers for the same project
                CONTINUE;
            WHEN OTHERS THEN
                -- Log error but continue with other leads
                RAISE WARNING 'Failed to insert lead: %', SQLERRM;
                CONTINUE;
        END;
    END LOOP;

    -- Update available_leads count for the project
    UPDATE projects 
    SET available_leads = available_leads + uploaded_count
    WHERE id = project_id;

    -- Log activity
    INSERT INTO recent_activity (user_id, action, details)
    VALUES (auth.uid(), 'leads_uploaded', jsonb_build_object(
        'project_id', project_id,
        'uploaded_count', uploaded_count,
        'total_leads_attempted', array_length(leads_data, 1)
    ));

    RETURN jsonb_build_object(
        'success', true,
        'project_id', project_id,
        'uploaded_count', uploaded_count,
        'total_attempted', array_length(leads_data, 1),
        'skipped', array_length(leads_data, 1) - uploaded_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the existing rpc_confirm_order function to properly handle lead assignment
CREATE OR REPLACE FUNCTION rpc_confirm_order(
    order_id UUID,
    payment_reference TEXT
)
RETURNS JSON AS $$
DECLARE
    order_record RECORD;
    project_record RECORD;
    leads_to_assign INTEGER;
    assigned_leads INTEGER;
BEGIN
    -- Get order details
    SELECT * INTO order_record FROM orders WHERE id = order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    IF order_record.status != 'pending' THEN
        RAISE EXCEPTION 'Order is not in pending status';
    END IF;

    -- Get project details with FOR UPDATE to prevent race conditions
    SELECT * INTO project_record FROM projects WHERE id = order_record.project_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Project not found';
    END IF;

    -- Check if enough leads are available
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

        -- Log activity
        INSERT INTO recent_activity (user_id, action, details)
        VALUES (order_record.user_id, 'order_confirmed', jsonb_build_object(
            'order_id', order_id,
            'project_id', order_record.project_id,
            'quantity', order_record.quantity,
            'assigned_leads', assigned_leads,
            'payment_reference', payment_reference,
            'remaining_available_leads', project_record.available_leads - assigned_leads
        ));

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

-- Create function to get projects available for purchase (available_leads > 0)
CREATE OR REPLACE FUNCTION rpc_get_shop_projects()
RETURNS JSON AS $$
DECLARE
    projects_data JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', id,
            'name', name,
            'developer', developer,
            'region', region,
            'available_leads', available_leads,
            'price_per_lead', price_per_lead,
            'description', description,
            'created_at', created_at
        )
    ) INTO projects_data
    FROM projects 
    WHERE available_leads > 0
    ORDER BY available_leads DESC, name ASC;

    RETURN COALESCE(projects_data, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to bulk update available leads (for admin/support)
CREATE OR REPLACE FUNCTION rpc_update_project_leads(
    project_id UUID,
    new_available_leads INTEGER
)
RETURNS JSON AS $$
DECLARE
    project_record RECORD;
    old_count INTEGER;
BEGIN
    -- Check if user has permission (admin or support only)
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'support')
    ) THEN
        RAISE EXCEPTION 'Only admin and support users can update project leads';
    END IF;

    -- Get current project data
    SELECT * INTO project_record FROM projects WHERE id = project_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Project not found';
    END IF;

    old_count := project_record.available_leads;

    -- Update available leads
    UPDATE projects 
    SET available_leads = new_available_leads, updated_at = NOW()
    WHERE id = project_id;

    -- Log activity
    INSERT INTO recent_activity (user_id, action, details)
    VALUES (auth.uid(), 'project_leads_updated', jsonb_build_object(
        'project_id', project_id,
        'project_name', project_record.name,
        'old_available_leads', old_count,
        'new_available_leads', new_available_leads,
        'difference', new_available_leads - old_count
    ));

    RETURN jsonb_build_object(
        'success', true,
        'project_id', project_id,
        'project_name', project_record.name,
        'old_available_leads', old_count,
        'new_available_leads', new_available_leads,
        'difference', new_available_leads - old_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get project statistics
CREATE OR REPLACE FUNCTION rpc_project_stats()
RETURNS JSON AS $$
DECLARE
    stats RECORD;
BEGIN
    SELECT 
        COUNT(*) as total_projects,
        COUNT(CASE WHEN available_leads > 0 THEN 1 END) as projects_with_leads,
        COUNT(CASE WHEN available_leads = 0 THEN 1 END) as projects_without_leads,
        SUM(available_leads) as total_available_leads,
        COUNT(DISTINCT developer) as total_developers,
        AVG(available_leads) as avg_leads_per_project,
        MAX(available_leads) as max_leads_in_project,
        MIN(price_per_lead) as min_price_per_lead,
        MAX(price_per_lead) as max_price_per_lead,
        AVG(price_per_lead) as avg_price_per_lead
    INTO stats
    FROM projects;

    RETURN jsonb_build_object(
        'total_projects', stats.total_projects,
        'projects_with_leads', stats.projects_with_leads,
        'projects_without_leads', stats.projects_without_leads,
        'total_available_leads', stats.total_available_leads,
        'total_developers', stats.total_developers,
        'avg_leads_per_project', ROUND(stats.avg_leads_per_project, 2),
        'max_leads_in_project', stats.max_leads_in_project,
        'min_price_per_lead', stats.min_price_per_lead,
        'max_price_per_lead', stats.max_price_per_lead,
        'avg_price_per_lead', ROUND(stats.avg_price_per_lead, 2)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update available_leads when leads are inserted/deleted
CREATE OR REPLACE FUNCTION update_project_available_leads()
RETURNS TRIGGER AS $$
BEGIN
    -- Update available_leads count based on unassigned leads
    IF TG_OP = 'INSERT' THEN
        -- If new lead is unassigned, increment available_leads
        IF NEW.buyer_user_id IS NULL THEN
            UPDATE projects 
            SET available_leads = available_leads + 1
            WHERE id = NEW.project_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle assignment/unassignment of leads
        IF OLD.buyer_user_id IS NULL AND NEW.buyer_user_id IS NOT NULL THEN
            -- Lead was assigned, decrease available_leads
            UPDATE projects 
            SET available_leads = available_leads - 1
            WHERE id = NEW.project_id;
        ELSIF OLD.buyer_user_id IS NOT NULL AND NEW.buyer_user_id IS NULL THEN
            -- Lead was unassigned, increase available_leads
            UPDATE projects 
            SET available_leads = available_leads + 1
            WHERE id = NEW.project_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- If deleted lead was unassigned, decrement available_leads
        IF OLD.buyer_user_id IS NULL THEN
            UPDATE projects 
            SET available_leads = available_leads - 1
            WHERE id = OLD.project_id;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic available_leads management
DROP TRIGGER IF EXISTS trigger_update_project_available_leads ON leads;
CREATE TRIGGER trigger_update_project_available_leads
    AFTER INSERT OR UPDATE OR DELETE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_project_available_leads();

-- Update RLS policies for the new workflow
-- Allow authenticated users to view projects with available leads
DROP POLICY IF EXISTS "All authenticated users can view projects" ON projects;
CREATE POLICY "All authenticated users can view projects" ON projects
    FOR SELECT USING (auth.role() = 'authenticated');

-- Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION rpc_upload_leads TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_shop_projects TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_update_project_leads TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_project_stats TO authenticated;

-- Update materialized view
REFRESH MATERIALIZED VIEW lead_analytics_mv;
