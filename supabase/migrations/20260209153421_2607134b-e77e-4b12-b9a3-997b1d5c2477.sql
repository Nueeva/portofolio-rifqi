
-- Create certifications table
CREATE TABLE public.certifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  year TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'in-progress')),
  image_url TEXT,
  credential_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;

-- Public can read certifications
CREATE POLICY "Certifications are publicly readable"
ON public.certifications FOR SELECT
USING (true);

-- Only admins can manage
CREATE POLICY "Admins can insert certifications"
ON public.certifications FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update certifications"
ON public.certifications FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete certifications"
ON public.certifications FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_certifications_updated_at
BEFORE UPDATE ON public.certifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for certification images
INSERT INTO storage.buckets (id, name, public) VALUES ('cert-images', 'cert-images', true);

-- Storage policies for cert images
CREATE POLICY "Cert images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'cert-images');

CREATE POLICY "Admins can upload cert images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'cert-images' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update cert images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'cert-images' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete cert images"
ON storage.objects FOR DELETE
USING (bucket_id = 'cert-images' AND public.has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for ip_logs (for security notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE public.ip_logs;
