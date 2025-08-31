-- Prevent duplicate uploads by adding safeguards
-- This ensures leads are only uploaded once

-- First, let's clean up any duplicate triggers
DROP TRIGGER IF EXISTS trigger_update_project_available_leads ON leads;
DROP TRIGGER IF EXISTS trigger_update_project_available_leads_simple ON leads;

-- Create a more robust upload function that prevents duplicates
CREATE OR REPLACE FUNCTION rpc_upload_leads(
    project_id UUID,
    leads_data JSONB[]
)
RETURNS JSON AS $$
DECLARE
    uploaded_count INTEGER := 0;
    skipped_count INTEGER := 0;
    lead_record JSONB;
    new_lead_id UUID;
    initial_available_leads INTEGER;
    phone_exists BOOLEAN;
BEGIN
    -- Check if project exists and get initial count
    SELECT available_leads INTO initial_available_leads
    FROM projects WHERE id = project_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Project not found';
    END IF;

    RAISE NOTICE 'Starting upload: Project %, Initial available leads: %, Leads to upload: %', 
                 project_id, initial_available_leads, array_length(leads_data, 1);

    -- Insert each lead with duplicate checking
    FOR i IN 1..array_length(leads_data, 1) LOOP
        lead_record := leads_data[i];
        
        -- Skip if missing required fields
        IF (lead_record->>'client_name') IS NULL OR (lead_record->>'client_phone') IS NULL THEN
            skipped_count := skipped_count + 1;
            CONTINUE;
        END IF;
        
        -- Check if phone already exists for this project
        SELECT EXISTS (
            SELECT 1 FROM leads 
            WHERE project_id = rpc_upload_leads.project_id 
            AND client_phone = (lead_record->>'client_phone')
        ) INTO phone_exists;
        
        IF phone_exists THEN
            skipped_count := skipped_count + 1;
            CONTINUE;
        END IF;
        
        BEGIN
            INSERT INTO leads (
                project_id,
                client_name,
                client_phone,
                client_phone2,
                client_phone3,
                client_email,
                client_job_title,
                platform,
                stage,
                buyer_user_id,
                created_at,
                updated_at
            ) VALUES (
                rpc_upload_leads.project_id,
                lead_record->>'client_name',
                lead_record->>'client_phone',
                NULLIF(lead_record->>'client_phone2', ''),
                NULLIF(lead_record->>'client_phone3', ''),
                NULLIF(lead_record->>'client_email', ''),
                NULLIF(lead_record->>'client_job_title', ''),
                (lead_record->>'platform')::platform_type,
                COALESCE((lead_record->>'stage')::lead_stage, 'New Lead'),
                NULL, -- Always start unassigned
                NOW(),
                NOW()
            ) RETURNING id INTO new_lead_id;
            
            uploaded_count := uploaded_count + 1;
            
        EXCEPTION
            WHEN unique_violation THEN
                -- Skip duplicate phone numbers
                skipped_count := skipped_count + 1;
                CONTINUE;
            WHEN OTHERS THEN
                -- Log error but continue with other leads
                RAISE WARNING 'Failed to insert lead %: %', i, SQLERRM;
                skipped_count := skipped_count + 1;
                CONTINUE;
        END;
    END LOOP;

    -- Update available_leads count (only add the actual uploaded count)
    UPDATE projects 
    SET available_leads = initial_available_leads + uploaded_count,
        updated_at = NOW()
    WHERE id = rpc_upload_leads.project_id;

    RAISE NOTICE 'Upload complete: Uploaded %, Skipped %, Final available leads: %', 
                 uploaded_count, skipped_count, initial_available_leads + uploaded_count;

    RETURN jsonb_build_object(
        'success', true,
        'project_id', rpc_upload_leads.project_id,
        'uploaded_count', uploaded_count,
        'total_attempted', array_length(leads_data, 1),
        'skipped', skipped_count,
        'initial_available_leads', initial_available_leads,
        'final_available_leads', initial_available_leads + uploaded_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
