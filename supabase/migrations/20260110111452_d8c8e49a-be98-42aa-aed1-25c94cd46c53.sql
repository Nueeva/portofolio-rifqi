-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Service role can insert IP logs" ON public.ip_logs;

-- Create a new restrictive policy that denies all direct user inserts
-- The service role bypasses RLS entirely, so we can set this to false
-- This ensures only service role (edge functions) can insert, not regular users
CREATE POLICY "No direct user inserts to IP logs" 
ON public.ip_logs 
FOR INSERT 
TO authenticated, anon
WITH CHECK (false);

-- Verify no other permissive SELECT policies exist (the admin-only one is correct)
-- The existing "Admins can view IP logs" policy is already restrictive