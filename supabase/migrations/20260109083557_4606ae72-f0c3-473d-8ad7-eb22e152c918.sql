-- Prevent anyone from updating activity logs (immutable audit trail)
CREATE POLICY "Activity logs are immutable"
ON public.activity_logs
FOR UPDATE
USING (false);

-- Prevent anyone from deleting activity logs (immutable audit trail)
CREATE POLICY "Activity logs cannot be deleted"
ON public.activity_logs
FOR DELETE
USING (false);