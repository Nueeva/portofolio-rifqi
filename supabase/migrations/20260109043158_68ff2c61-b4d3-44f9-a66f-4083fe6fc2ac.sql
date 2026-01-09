-- Create storage bucket for project images
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true);

-- Add image_url column to projects table
ALTER TABLE public.projects
ADD COLUMN image_url text;

-- Allow public read access to project images
CREATE POLICY "Project images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'project-images');

-- Allow admins to upload project images
CREATE POLICY "Admins can upload project images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'project-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to update project images
CREATE POLICY "Admins can update project images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'project-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete project images
CREATE POLICY "Admins can delete project images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'project-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);