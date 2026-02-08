
-- Create storage bucket for resume/CV files
INSERT INTO storage.buckets (id, name, public) VALUES ('resume', 'resume', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Resume files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'resume');

-- Allow authenticated admin to upload
CREATE POLICY "Admins can upload resume files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'resume' 
  AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Allow authenticated admin to update
CREATE POLICY "Admins can update resume files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'resume'
  AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Allow authenticated admin to delete
CREATE POLICY "Admins can delete resume files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'resume'
  AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
