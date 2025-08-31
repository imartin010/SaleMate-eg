-- Fix double upload issue in lead upload function
-- This prevents leads from being counted twice during upload

-- Temporarily disable the trigger during upload operations
CREATE OR REPLACE FUNCTION rpc_upload_leads(
    project_id UUID,
    leads_data JSONB[]
)
RETURNS JSON AS $$
DECLARE
    uploaded_count INTEGER := 0;
    lead_record JSONB;
    new_lead_id UUID;
    initial_available_leads INTEGER;
BEGIN
    -- Check if project exists and get initial count
    SELECT available_leads INTO initial_available_leads
    FROM projects WHERE id = project_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Project not found';
    END IF;

    -- Disable trigger temporarily
    ALTER TABLE leads DISABLE TRIGGER trigger_update_project_available_leads_simple;

    -- Insert each lead and count successful insertions
    FOR i IN 1..array_length(leads_data, 1) LOOP
        lead_record := leads_data[i];
        
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
                stage
            ) VALUES (
                project_id,
                lead_record->>'client_name',
                lead_record->>'client_phone',
                NULLIF(lead_record->>'client_phone2', ''),
                NULLIF(lead_record->>'client_phone3', ''),
                NULLIF(lead_record->>'client_email', ''),
                NULLIF(lead_record->>'client_job_title', ''),
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

    -- Re-enable trigger
    ALTER TABLE leads ENABLE TRIGGER trigger_update_project_available_leads_simple;

    -- Manually update available_leads count (only add the actual uploaded count)
    UPDATE projects 
    SET available_leads = initial_available_leads + uploaded_count
    WHERE id = project_id;

    -- Log activity only if we have a valid user
    IF auth.uid() IS NOT NULL THEN
        BEGIN
            INSERT INTO recent_activity (user_id, action, details)
            VALUES (
                auth.uid(), 
                'leads_uploaded', 
                jsonb_build_object(
                    'project_id', project_id,
                    'uploaded_count', uploaded_count,
                    'total_leads_attempted', array_length(leads_data, 1),
                    'initial_available_leads', initial_available_leads,
                    'final_available_leads', initial_available_leads + uploaded_count
                )
            );
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Failed to log activity: %', SQLERRM;
        END;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'project_id', project_id,
        'uploaded_count', uploaded_count,
        'total_attempted', array_length(leads_data, 1),
        'skipped', array_length(leads_data, 1) - uploaded_count,
        'initial_available_leads', initial_available_leads,
        'final_available_leads', initial_available_leads + uploaded_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
