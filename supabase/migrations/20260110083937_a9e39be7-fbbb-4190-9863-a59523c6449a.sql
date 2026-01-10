-- Create table for tracking login attempts
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  attempt_type TEXT NOT NULL DEFAULT 'login',
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT false
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier_time 
ON public.login_attempts (identifier, attempted_at DESC);

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can insert (via edge function)
CREATE POLICY "Service role can manage login attempts"
ON public.login_attempts
FOR ALL
USING (false)
WITH CHECK (false);

-- Function to check rate limit (returns true if blocked)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_max_attempts INTEGER DEFAULT 5,
  p_window_minutes INTEGER DEFAULT 15
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  attempt_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO attempt_count
  FROM public.login_attempts
  WHERE identifier = p_identifier
    AND success = false
    AND attempted_at > (now() - (p_window_minutes || ' minutes')::interval);
  
  RETURN attempt_count >= p_max_attempts;
END;
$$;

-- Function to record login attempt
CREATE OR REPLACE FUNCTION public.record_login_attempt(
  p_identifier TEXT,
  p_success BOOLEAN DEFAULT false
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.login_attempts (identifier, success)
  VALUES (p_identifier, p_success);
  
  -- Cleanup old attempts (older than 24 hours)
  DELETE FROM public.login_attempts
  WHERE attempted_at < (now() - interval '24 hours');
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_rate_limit TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_login_attempt TO anon, authenticated;