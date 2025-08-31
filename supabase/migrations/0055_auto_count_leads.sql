-- Auto-update available leads count when leads are inserted/deleted
-- This ensures projects always show the correct number of available (unsold) leads

-- Function to update project available leads count
CREATE OR REPLACE FUNCTION update_project_available_leads()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the project's available_leads count based on unsold leads
    UPDATE projects 
    SET 
        available_leads = (
            SELECT COUNT(*) 
            FROM leads 
            WHERE project_id = COALESCE(NEW.project_id, OLD.project_id) 
            AND (is_sold IS FALSE OR is_sold IS NULL)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.project_id, OLD.project_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update available_leads count
DROP TRIGGER IF EXISTS trigger_update_available_leads_on_insert ON leads;
CREATE TRIGGER trigger_update_available_leads_on_insert
    AFTER INSERT ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_project_available_leads();

DROP TRIGGER IF EXISTS trigger_update_available_leads_on_update ON leads;
CREATE TRIGGER trigger_update_available_leads_on_update
    AFTER UPDATE ON leads
    FOR EACH ROW
    WHEN (OLD.is_sold IS DISTINCT FROM NEW.is_sold OR OLD.project_id IS DISTINCT FROM NEW.project_id)
    EXECUTE FUNCTION update_project_available_leads();

DROP TRIGGER IF EXISTS trigger_update_available_leads_on_delete ON leads;
CREATE TRIGGER trigger_update_available_leads_on_delete
    AFTER DELETE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_project_available_leads();

-- Function to update project price_per_lead when uploading leads with CPL price
CREATE OR REPLACE FUNCTION update_project_cpl_price(
    project_id_param UUID,
    new_cpl_price DECIMAL(10,2)
)
RETURNS VOID AS $$
BEGIN
    UPDATE projects 
    SET 
        price_per_lead = new_cpl_price,
        updated_at = NOW()
    WHERE id = project_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to bulk upload leads and set CPL price
CREATE OR REPLACE FUNCTION bulk_upload_leads_with_cpl(
    project_id_param UUID,
    leads_data JSONB,
    cpl_price DECIMAL(10,2),
    upload_user_id UUID,
    batch_name TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    lead_record JSONB;
    batch_id UUID;
    inserted_count INTEGER := 0;
    failed_count INTEGER := 0;
    error_details JSONB := '[]'::JSONB;
BEGIN
    -- Generate batch ID
    batch_id := gen_random_uuid();
    
    -- Update project CPL price
    PERFORM update_project_cpl_price(project_id_param, cpl_price);
    
    -- Insert leads from JSONB array
    FOR lead_record IN SELECT * FROM jsonb_array_elements(leads_data)
    LOOP
        BEGIN
            INSERT INTO leads (
                project_id,
                client_name,
                client_phone,
                client_email,
                client_phone2,
                client_phone3,
                client_job_title,
                platform,
                stage,
                source,
                batch_id,
                upload_user_id,
                cpl_price,
                feedback
            ) VALUES (
                project_id_param,
                lead_record->>'client_name',
                lead_record->>'client_phone',
                lead_record->>'client_email',
                lead_record->>'client_phone2',
                lead_record->>'client_phone3',
                lead_record->>'client_job_title',
                COALESCE((lead_record->>'platform')::platform_type, 'Other'),
                COALESCE((lead_record->>'stage')::lead_stage, 'New Lead'),
                COALESCE(lead_record->>'source', 'Bulk Upload'),
                batch_id,
                upload_user_id,
                cpl_price,
                lead_record->>'feedback'
            );
            
            inserted_count := inserted_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            failed_count := failed_count + 1;
            error_details := error_details || jsonb_build_object(
                'lead', lead_record,
                'error', SQLERRM
            );
        END;
    END LOOP;
    
    -- Create batch record if batch_name is provided
    IF batch_name IS NOT NULL THEN
        INSERT INTO lead_batches (
            id,
            project_id,
            upload_user_id,
            batch_name,
            total_leads,
            successful_leads,
            failed_leads,
            cpl_price,
            status,
            error_details
        ) VALUES (
            batch_id,
            project_id_param,
            upload_user_id,
            batch_name,
            inserted_count + failed_count,
            inserted_count,
            failed_count,
            cpl_price,
            CASE WHEN failed_count = 0 THEN 'completed' ELSE 'failed' END,
            CASE WHEN failed_count > 0 THEN error_details ELSE NULL END
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'batch_id', batch_id,
        'inserted_count', inserted_count,
        'failed_count', failed_count,
        'error_details', error_details
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
