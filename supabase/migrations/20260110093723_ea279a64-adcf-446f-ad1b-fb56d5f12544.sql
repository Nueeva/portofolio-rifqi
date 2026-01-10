-- Drop existing overly permissive INSERT policies
DROP POLICY IF EXISTS "Anyone can insert page analytics" ON public.page_analytics;
DROP POLICY IF EXISTS "Anyone can insert IP logs" ON public.ip_logs;

-- Create new policies that only allow service role to insert
-- This ensures all inserts must go through edge functions with service role
CREATE POLICY "Service role can insert page analytics" 
ON public.page_analytics 
FOR INSERT 
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can insert IP logs" 
ON public.ip_logs 
FOR INSERT 
TO service_role
WITH CHECK (true);