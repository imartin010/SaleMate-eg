-- Fix: Recreate accept_team_invitation function to ensure it works
-- This ensures the function properly sets manager_id when accepting invitations

-- Drop and recreate the function
DROP FUNCTION IF EXISTS accept_team_invitation(TEXT);

CREATE OR REPLACE FUNCTION accept_team_invitation(invitation_token TEXT)
RETURNS JSON AS $$
DECLARE
  invitation_record RECORD;
  current_user_id UUID;
  current_user_email TEXT;
BEGIN
  -- Get current user info
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Get user email
  SELECT email INTO current_user_email 
  FROM profiles 
  WHERE id = current_user_id;
  
  -- Get the invitation
  SELECT * INTO invitation_record
  FROM team_invitations
  WHERE token = invitation_token
    AND status = 'pending'
    AND expires_at > NOW()
    AND invitee_email = current_user_email;

  -- Check if invitation exists and is valid
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  -- Update user's manager_id
  UPDATE profiles
  SET manager_id = invitation_record.manager_id,
      updated_at = NOW()
  WHERE id = current_user_id;
  
  -- Check if update succeeded
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Failed to update user profile');
  END IF;

  -- Update invitation status
  UPDATE team_invitations
  SET status = 'accepted',
      invitee_user_id = current_user_id,
      updated_at = NOW()
  WHERE token = invitation_token;

  RETURN json_build_object(
    'success', true, 
    'manager_id', invitation_record.manager_id,
    'message', 'Successfully joined team'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION accept_team_invitation(TEXT) TO authenticated;

