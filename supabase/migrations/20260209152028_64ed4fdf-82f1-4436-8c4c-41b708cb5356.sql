-- Fix: Restrict email_settings SELECT to admins only
DROP POLICY IF EXISTS "Anyone can view email settings" ON public.email_settings;

CREATE POLICY "Admins can view email settings"
ON public.email_settings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'::app_role
  )
);