-- Add explicit SELECT restriction for ip_logs to deny public reads
-- This ensures only admins (via has_role) can access sensitive IP tracking data
CREATE POLICY "Deny public reads on ip_logs"
ON public.ip_logs
FOR SELECT
USING (false);