-- Fix activity logging foreign key constraint issue
-- This migration updates the upload function to handle activity logging properly

CREATE OR REPLACE FUNCTION rpc_upload_leads(
    project_id UUID,
    leads_data JSONB[]
)
RETURNS JSON AS $$
DECLARE
    uploaded_count INTEGER := 0;
    lead_record JSONB;
    new_lead_id UUID;
    current_user_id UUID;
BEGIN
    -- Get current user ID or use a default admin ID
    current_user_id := auth.uid();
    
    -- If no authenticated user, skip activity logging
    IF current_user_id IS NULL THEN
        RAISE NOTICE 'No authenticated user, skipping activity logging';
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

    -- Update available_leads count for the project
    UPDATE projects 
    SET available_leads = available_leads + uploaded_count
    WHERE id = project_id;

    -- Log activity only if we have a valid user and the user exists in profiles
    IF current_user_id IS NOT NULL AND EXISTS (SELECT 1 FROM profiles WHERE id = current_user_id) THEN
        BEGIN
            INSERT INTO recent_activity (user_id, action, details)
            VALUES (
                current_user_id, 
                'leads_uploaded', 
                jsonb_build_object(
                    'project_id', project_id,
                    'uploaded_count', uploaded_count,
                    'total_leads_attempted', array_length(leads_data, 1)
                )
            );
        EXCEPTION
            WHEN OTHERS THEN
                -- If activity logging fails, continue anyway
                RAISE NOTICE 'Failed to log activity: %', SQLERRM;
        END;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'project_id', project_id,
        'uploaded_count', uploaded_count,
        'total_attempted', array_length(leads_data, 1),
        'skipped', array_length(leads_data, 1) - uploaded_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
