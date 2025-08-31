-- Fix available_leads calculation 
-- The trigger was double-counting, so let's fix the project's available_leads

-- First, disable the trigger that automatically updates available_leads
DROP TRIGGER IF EXISTS trigger_update_project_available_leads ON leads;

-- Fix the available_leads count for all projects based on actual unassigned leads
UPDATE projects 
SET available_leads = (
    SELECT COUNT(*) 
    FROM leads 
    WHERE project_id = projects.id 
    AND buyer_user_id IS NULL
);

-- Create a simpler trigger that only updates when leads are inserted (not when assigned)
CREATE OR REPLACE FUNCTION update_project_available_leads_simple()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update available_leads when leads are inserted (not when assigned/unassigned)
    IF TG_OP = 'INSERT' THEN
        -- If new lead is unassigned, increment available_leads
        IF NEW.buyer_user_id IS NULL THEN
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

-- Create the new simplified trigger (only for INSERT and DELETE, not UPDATE)
CREATE TRIGGER trigger_update_project_available_leads_simple
    AFTER INSERT OR DELETE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_project_available_leads_simple();
