-- Add new columns to leads table
-- This migration adds client_phone2, client_phone3, and client_job_title

-- Add new columns to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS client_phone2 TEXT,
ADD COLUMN IF NOT EXISTS client_phone3 TEXT,
ADD COLUMN IF NOT EXISTS client_job_title TEXT;

-- Add indexes for the new phone columns (for searching)
CREATE INDEX IF NOT EXISTS idx_leads_client_phone2 ON leads(client_phone2) WHERE client_phone2 IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_client_phone3 ON leads(client_phone3) WHERE client_phone3 IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_client_job_title ON leads(client_job_title) WHERE client_job_title IS NOT NULL;

-- Update the rpc_upload_leads function to handle new columns
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
                lead_record->>'client_phone2',
                lead_record->>'client_phone3',
                lead_record->>'client_email',
                lead_record->>'client_job_title',
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