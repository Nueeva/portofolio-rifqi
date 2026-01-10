-- Enable realtime for blocked_ips table
ALTER TABLE public.blocked_ips REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blocked_ips;