-- Create team_invitations table
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  invitee_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(manager_id, invitee_email)
);

-- Create index for faster lookups
CREATE INDEX idx_team_invitations_email ON team_invitations(invitee_email);
CREATE INDEX idx_team_invitations_token ON team_invitations(token);
CREATE INDEX idx_team_invitations_manager ON team_invitations(manager_id);
CREATE INDEX idx_team_invitations_status ON team_invitations(status);

-- Enable RLS
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Managers can see invitations they sent
CREATE POLICY "Managers can view their own invitations" 
  ON team_invitations FOR SELECT 
  USING (auth.uid() = manager_id);

-- Managers can create invitations
CREATE POLICY "Managers can create invitations" 
  ON team_invitations FOR INSERT 
  WITH CHECK (
    auth.uid() = manager_id AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'admin')
    )
  );

-- Users can see invitations sent to their email
CREATE POLICY "Users can view invitations sent to them" 
  ON team_invitations FOR SELECT 
  USING (
    invitee_email = (
      SELECT email FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can update status of invitations sent to them
CREATE POLICY "Users can update their invitation status" 
  ON team_invitations FOR UPDATE 
  USING (
    invitee_email = (
      SELECT email FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    invitee_email = (
      SELECT email FROM profiles WHERE id = auth.uid()
    )
  );

-- Managers can delete their own invitations
CREATE POLICY "Managers can delete their invitations" 
  ON team_invitations FOR DELETE 
  USING (auth.uid() = manager_id);

-- Function to accept team invitation
CREATE OR REPLACE FUNCTION accept_team_invitation(invitation_token TEXT)
RETURNS JSON AS $$
DECLARE
  invitation_record RECORD;
  result JSON;
BEGIN
  -- Get the invitation
  SELECT * INTO invitation_record
  FROM team_invitations
  WHERE token = invitation_token
    AND status = 'pending'
    AND expires_at > NOW()
    AND invitee_email = (SELECT email FROM profiles WHERE id = auth.uid());

  -- Check if invitation exists and is valid
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  -- Update user's manager_id
  UPDATE profiles
  SET manager_id = invitation_record.manager_id,
      updated_at = NOW()
  WHERE id = auth.uid();

  -- Update invitation status
  UPDATE team_invitations
  SET status = 'accepted',
      invitee_user_id = auth.uid(),
      updated_at = NOW()
  WHERE token = invitation_token;

  RETURN json_build_object('success', true, 'manager_id', invitation_record.manager_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject team invitation
CREATE OR REPLACE FUNCTION reject_team_invitation(invitation_token TEXT)
RETURNS JSON AS $$
BEGIN
  -- Update invitation status
  UPDATE team_invitations
  SET status = 'rejected',
      updated_at = NOW()
  WHERE token = invitation_token
    AND status = 'pending'
    AND invitee_email = (SELECT email FROM profiles WHERE id = auth.uid());

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid invitation');
  END IF;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check for pending invitations on signup
CREATE OR REPLACE FUNCTION check_pending_invitations_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  pending_invitation RECORD;
BEGIN
  -- Check if there's a pending invitation for this email
  SELECT * INTO pending_invitation
  FROM team_invitations
  WHERE invitee_email = NEW.email
    AND status = 'pending'
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  -- If invitation exists, automatically assign manager and mark as accepted
  IF FOUND THEN
    NEW.manager_id := pending_invitation.manager_id;
    
    -- Update invitation status
    UPDATE team_invitations
    SET status = 'accepted',
        invitee_user_id = NEW.id,
        updated_at = NOW()
    WHERE id = pending_invitation.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-assigning manager on signup
CREATE TRIGGER auto_assign_manager_on_signup
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_pending_invitations_on_signup();

-- Function to clean up expired invitations (can be called periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  UPDATE team_invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

