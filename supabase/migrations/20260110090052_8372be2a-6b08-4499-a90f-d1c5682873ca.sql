-- Create table for blocked IPs
CREATE TABLE public.blocked_ips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT 'brute_force',
  blocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  created_by TEXT DEFAULT 'system'
);

-- Create index on ip_address
CREATE INDEX idx_blocked_ips_ip_address ON public.blocked_ips (ip_address);
CREATE INDEX idx_blocked_ips_expires_at ON public.blocked_ips (expires_at);

-- Create table for IP logs
CREATE TABLE public.ip_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  identifier TEXT,
  action TEXT NOT NULL,
  success BOOLEAN DEFAULT false,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for IP lookup
CREATE INDEX idx_ip_logs_ip_address ON public.ip_logs (ip_address);
CREATE INDEX idx_ip_logs_created_at ON public.ip_logs (created_at DESC);

-- Enable RLS on both tables
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for blocked_ips
CREATE POLICY "Admins can view blocked IPs" 
ON public.blocked_ips 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service can manage blocked IPs" 
ON public.blocked_ips 
FOR ALL 
USING (false)
WITH CHECK (false);

-- RLS policies for ip_logs
CREATE POLICY "Admins can view IP logs" 
ON public.ip_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert IP logs" 
ON public.ip_logs 
FOR INSERT 
WITH CHECK (true);

-- Function to check if IP is blocked
CREATE OR REPLACE FUNCTION public.is_ip_blocked(p_ip_address TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.blocked_ips
    WHERE ip_address = p_ip_address
      AND expires_at > now()
  );
END;
$$;

-- Function to block an IP
CREATE OR REPLACE FUNCTION public.block_ip(p_ip_address TEXT, p_reason TEXT DEFAULT 'brute_force', p_hours INTEGER DEFAULT 24)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete old blocks for this IP first
  DELETE FROM public.blocked_ips WHERE ip_address = p_ip_address;
  
  -- Insert new block
  INSERT INTO public.blocked_ips (ip_address, reason, expires_at)
  VALUES (p_ip_address, p_reason, now() + (p_hours || ' hours')::interval);
END;
$$;

-- Function to log IP activity
CREATE OR REPLACE FUNCTION public.log_ip_activity(p_ip_address TEXT, p_identifier TEXT, p_action TEXT, p_success BOOLEAN DEFAULT false, p_user_agent TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.ip_logs (ip_address, identifier, action, success, user_agent)
  VALUES (p_ip_address, p_identifier, p_action, p_success, p_user_agent);
END;
$$;

-- Function to count failed attempts by IP
CREATE OR REPLACE FUNCTION public.count_ip_failed_attempts(p_ip_address TEXT, p_window_minutes INTEGER DEFAULT 15)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  attempt_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO attempt_count
  FROM public.ip_logs
  WHERE ip_address = p_ip_address
    AND success = false
    AND action = 'login'
    AND created_at > (now() - (p_window_minutes || ' minutes')::interval);
  
  RETURN attempt_count;
END;
$$;