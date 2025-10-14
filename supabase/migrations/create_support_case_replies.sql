-- =====================================================
-- Support Case Replies Table
-- =====================================================
-- This table stores all replies/messages in support tickets
-- =====================================================

-- Create support_case_replies table
CREATE TABLE IF NOT EXISTS public.support_case_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.support_cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_internal_note BOOLEAN DEFAULT FALSE, -- Internal notes only visible to support/admin
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_support_case_replies_case_id 
ON public.support_case_replies(case_id);

CREATE INDEX IF NOT EXISTS idx_support_case_replies_user_id 
ON public.support_case_replies(user_id);

CREATE INDEX IF NOT EXISTS idx_support_case_replies_created_at 
ON public.support_case_replies(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.support_case_replies ENABLE ROW LEVEL SECURITY;

-- Policy: Admin and support can see all replies
DROP POLICY IF EXISTS "Admins and support can view all replies" ON public.support_case_replies;
CREATE POLICY "Admins and support can view all replies"
ON public.support_case_replies
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'admin' OR role = 'support')
  )
);

-- Policy: Users can see replies on their own cases (excluding internal notes)
DROP POLICY IF EXISTS "Users can view replies on their cases" ON public.support_case_replies;
CREATE POLICY "Users can view replies on their cases"
ON public.support_case_replies
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.support_cases 
    WHERE support_cases.id = support_case_replies.case_id 
    AND (support_cases.created_by = auth.uid() OR support_cases.assigned_to = auth.uid())
  )
  AND (
    is_internal_note = FALSE 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (role = 'admin' OR role = 'support')
    )
  )
);

-- Policy: Admin and support can create any reply
DROP POLICY IF EXISTS "Admins and support can create replies" ON public.support_case_replies;
CREATE POLICY "Admins and support can create replies"
ON public.support_case_replies
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'admin' OR role = 'support')
  )
);

-- Policy: Users can create replies on their own cases
DROP POLICY IF EXISTS "Users can create replies on their cases" ON public.support_case_replies;
CREATE POLICY "Users can create replies on their cases"
ON public.support_case_replies
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.support_cases 
    WHERE support_cases.id = support_case_replies.case_id 
    AND support_cases.created_by = auth.uid()
  )
  AND user_id = auth.uid()
  AND is_internal_note = FALSE
);

-- Policy: Only support/admin can update replies
DROP POLICY IF EXISTS "Admins and support can update replies" ON public.support_case_replies;
CREATE POLICY "Admins and support can update replies"
ON public.support_case_replies
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'admin' OR role = 'support')
  )
);

-- Policy: Only support/admin can delete replies
DROP POLICY IF EXISTS "Admins and support can delete replies" ON public.support_case_replies;
CREATE POLICY "Admins and support can delete replies"
ON public.support_case_replies
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'admin' OR role = 'support')
  )
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_support_case_replies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_support_case_replies_updated_at ON public.support_case_replies;
CREATE TRIGGER update_support_case_replies_updated_at
  BEFORE UPDATE ON public.support_case_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_support_case_replies_updated_at();

-- Add comments
COMMENT ON TABLE public.support_case_replies IS 'Stores all replies and messages in support tickets';
COMMENT ON COLUMN public.support_case_replies.case_id IS 'Reference to the support case';
COMMENT ON COLUMN public.support_case_replies.user_id IS 'User who created the reply';
COMMENT ON COLUMN public.support_case_replies.message IS 'Reply message content';
COMMENT ON COLUMN public.support_case_replies.is_internal_note IS 'Whether this is an internal note (only visible to support/admin)';

-- Create a function to automatically update case updated_at when a reply is added
CREATE OR REPLACE FUNCTION update_case_on_reply()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.support_cases
  SET updated_at = NOW()
  WHERE id = NEW.case_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_case_on_reply ON public.support_case_replies;
CREATE TRIGGER update_case_on_reply
  AFTER INSERT ON public.support_case_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_case_on_reply();

-- =====================================================
-- Verification Query
-- =====================================================
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'support_case_replies'
ORDER BY ordinal_position;

-- =====================================================
-- Complete! ✅
-- =====================================================

