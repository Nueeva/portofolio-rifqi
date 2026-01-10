-- Add geo-location columns to ip_logs
ALTER TABLE public.ip_logs 
ADD COLUMN country TEXT,
ADD COLUMN city TEXT,
ADD COLUMN region TEXT,
ADD COLUMN isp TEXT;

-- Create function to unblock IP (for admin use)
CREATE OR REPLACE FUNCTION public.unblock_ip(p_ip_address TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.blocked_ips WHERE ip_address = p_ip_address;
END;
$$;

-- Add policy for admins to delete blocked IPs
CREATE POLICY "Admins can delete blocked IPs" 
ON public.blocked_ips 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));