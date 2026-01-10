-- Update log_ip_activity function to include geo-location
CREATE OR REPLACE FUNCTION public.log_ip_activity(
  p_ip_address TEXT, 
  p_identifier TEXT, 
  p_action TEXT, 
  p_success BOOLEAN DEFAULT false, 
  p_user_agent TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_region TEXT DEFAULT NULL,
  p_isp TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.ip_logs (ip_address, identifier, action, success, user_agent, country, city, region, isp)
  VALUES (p_ip_address, p_identifier, p_action, p_success, p_user_agent, p_country, p_city, p_region, p_isp);
END;
$$;