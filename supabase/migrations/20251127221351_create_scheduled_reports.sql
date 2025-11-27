-- ============================================
-- CRM SCHEDULED REPORTS TABLE
-- ============================================
-- Stores scheduled report configurations for automated email reports
-- ============================================

CREATE TABLE IF NOT EXISTS public.crm_scheduled_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  report_type text NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly')),
  email_recipients text[] NOT NULL,
  is_active boolean DEFAULT true,
  last_sent_at timestamptz,
  next_send_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_crm_scheduled_reports_user_id ON public.crm_scheduled_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_scheduled_reports_is_active ON public.crm_scheduled_reports(is_active);
CREATE INDEX IF NOT EXISTS idx_crm_scheduled_reports_next_send_at ON public.crm_scheduled_reports(next_send_at) WHERE is_active = true;

-- Add comments
COMMENT ON TABLE public.crm_scheduled_reports IS 'Scheduled CRM analytics reports configuration';
COMMENT ON COLUMN public.crm_scheduled_reports.report_type IS 'Frequency: daily, weekly, or monthly';
COMMENT ON COLUMN public.crm_scheduled_reports.email_recipients IS 'Array of email addresses to receive the report';
COMMENT ON COLUMN public.crm_scheduled_reports.next_send_at IS 'Next scheduled send time, calculated based on report_type';

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE public.crm_scheduled_reports ENABLE ROW LEVEL SECURITY;

-- Users can view their own scheduled reports
CREATE POLICY "Users can view their own scheduled reports"
  ON public.crm_scheduled_reports
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own scheduled reports
CREATE POLICY "Users can create their own scheduled reports"
  ON public.crm_scheduled_reports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own scheduled reports
CREATE POLICY "Users can update their own scheduled reports"
  ON public.crm_scheduled_reports
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own scheduled reports
CREATE POLICY "Users can delete their own scheduled reports"
  ON public.crm_scheduled_reports
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins and managers can view all scheduled reports
CREATE POLICY "Admins can view all scheduled reports"
  ON public.crm_scheduled_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'manager')
    )
  );

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_crm_scheduled_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_crm_scheduled_reports_updated_at ON public.crm_scheduled_reports;
CREATE TRIGGER update_crm_scheduled_reports_updated_at
  BEFORE UPDATE ON public.crm_scheduled_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_scheduled_reports_updated_at();

-- ============================================
-- FUNCTION TO CALCULATE NEXT SEND TIME
-- ============================================

CREATE OR REPLACE FUNCTION calculate_next_send_at(
  report_type text,
  current_time timestamptz DEFAULT now()
)
RETURNS timestamptz
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  CASE report_type
    WHEN 'daily' THEN
      -- Next day at 9 AM
      RETURN date_trunc('day', current_time + interval '1 day') + interval '9 hours';
    WHEN 'weekly' THEN
      -- Next Monday at 9 AM
      RETURN date_trunc('week', current_time + interval '1 week') + interval '9 hours';
    WHEN 'monthly' THEN
      -- First day of next month at 9 AM
      RETURN date_trunc('month', current_time + interval '1 month') + interval '9 hours';
    ELSE
      RETURN current_time + interval '1 day';
  END CASE;
END;
$$;

COMMENT ON FUNCTION calculate_next_send_at IS 'Calculates the next send time based on report type';

