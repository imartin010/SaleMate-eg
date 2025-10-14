-- =====================================================
-- Support Cases RLS (Row Level Security) Policies
-- =====================================================
-- This file sets up secure access control for support tickets
-- Users/Managers: Can only see their own tickets
-- Support/Admin: Can see and manage all tickets
-- =====================================================

-- Enable RLS on support_cases table
ALTER TABLE public.support_cases ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (for clean re-run)
DROP POLICY IF EXISTS "Users can view their own support cases" ON public.support_cases;
DROP POLICY IF EXISTS "Support staff can view all support cases" ON public.support_cases;
DROP POLICY IF EXISTS "Users can create their own support cases" ON public.support_cases;
DROP POLICY IF EXISTS "Support staff can update support cases" ON public.support_cases;
DROP POLICY IF EXISTS "Users can update their own open cases" ON public.support_cases;
DROP POLICY IF EXISTS "Admins have full access to support cases" ON public.support_cases;

-- =====================================================
-- SELECT (Read) Policies
-- =====================================================

-- Policy 1: Users and Managers can view their own support cases
CREATE POLICY "Users can view their own support cases"
ON public.support_cases
FOR SELECT
TO authenticated
USING (
  auth.uid() = created_by
  OR 
  auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'support')
  )
);

-- =====================================================
-- INSERT (Create) Policies
-- =====================================================

-- Policy 2: Any authenticated user can create support cases
CREATE POLICY "Users can create their own support cases"
ON public.support_cases
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by
);

-- =====================================================
-- UPDATE (Modify) Policies
-- =====================================================

-- Policy 3: Users can update their own open cases (limited updates)
CREATE POLICY "Users can update their own open cases"
ON public.support_cases
FOR UPDATE
TO authenticated
USING (
  auth.uid() = created_by
  AND status IN ('open', 'in_progress')
)
WITH CHECK (
  auth.uid() = created_by
);

-- Policy 4: Support staff and admins can update any support case
CREATE POLICY "Support staff can update support cases"
ON public.support_cases
FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'support')
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'support')
  )
);

-- =====================================================
-- DELETE Policies (Optional - usually not needed)
-- =====================================================

-- Policy 5: Only admins can delete support cases (if needed)
CREATE POLICY "Admins can delete support cases"
ON public.support_cases
FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- =====================================================
-- Grant necessary permissions
-- =====================================================

-- Grant authenticated users access to the table
GRANT SELECT, INSERT, UPDATE ON public.support_cases TO authenticated;
GRANT DELETE ON public.support_cases TO authenticated; -- Only admins will be able to delete due to RLS

-- =====================================================
-- Verification Queries (comment out in production)
-- =====================================================

-- Test these queries to verify RLS is working:
-- 
-- 1. As a regular user, you should only see your own cases:
--    SELECT * FROM public.support_cases;
--
-- 2. As support/admin, you should see all cases:
--    SELECT * FROM public.support_cases;
--
-- 3. Try creating a case:
--    INSERT INTO public.support_cases (created_by, subject, description)
--    VALUES (auth.uid(), 'Test', 'Test Description');
--
-- 4. Try updating someone else's case (should fail for non-support users):
--    UPDATE public.support_cases SET status = 'resolved' WHERE created_by != auth.uid();

-- =====================================================
-- Additional Security: Function for safe case assignment
-- =====================================================

CREATE OR REPLACE FUNCTION public.assign_support_case_to_agent(
  case_id UUID,
  agent_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the user calling this is support or admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'support')
  ) THEN
    RAISE EXCEPTION 'Only support staff can assign cases';
  END IF;

  -- Verify the agent is support or admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = agent_id 
    AND role IN ('admin', 'support')
  ) THEN
    RAISE EXCEPTION 'Can only assign to support staff';
  END IF;

  -- Assign the case
  UPDATE public.support_cases
  SET 
    assigned_to = agent_id,
    status = 'in_progress',
    updated_at = NOW()
  WHERE id = case_id;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.assign_support_case_to_agent TO authenticated;

COMMENT ON FUNCTION public.assign_support_case_to_agent IS 
'Safely assigns a support case to a support agent. Only support staff can execute this.';

-- =====================================================
-- Indexes for better performance
-- =====================================================

-- Index on created_by for faster user queries
CREATE INDEX IF NOT EXISTS idx_support_cases_created_by 
ON public.support_cases(created_by);

-- Index on assigned_to for faster agent queries
CREATE INDEX IF NOT EXISTS idx_support_cases_assigned_to 
ON public.support_cases(assigned_to);

-- Index on status for filtering
CREATE INDEX IF NOT EXISTS idx_support_cases_status 
ON public.support_cases(status);

-- Index on priority for filtering
CREATE INDEX IF NOT EXISTS idx_support_cases_priority 
ON public.support_cases(priority);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_support_cases_status_priority 
ON public.support_cases(status, priority);

-- Index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_support_cases_created_at 
ON public.support_cases(created_at DESC);

-- =====================================================
-- Complete! RLS is now configured for support_cases
-- =====================================================

COMMENT ON TABLE public.support_cases IS 
'Support ticket system with RLS. Users see only their own tickets, support staff see all tickets.';

