-- Allow agents to update their own case feedback entries (for AI coach data)
ALTER TABLE public.case_feedback
  ENABLE ROW LEVEL SECURITY;

-- Grant update access to users who can access the lead and created the feedback
CREATE POLICY "update case_feedback"
  ON public.case_feedback
  FOR UPDATE
  USING (public.can_access_lead(lead_id))
  WITH CHECK (created_by = auth.uid());


