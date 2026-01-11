-- Create email_settings table for configurable email preview texts
CREATE TABLE public.email_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read email settings (needed by edge functions)
CREATE POLICY "Anyone can view email settings"
  ON public.email_settings
  FOR SELECT
  USING (true);

-- Only admins can update email settings
CREATE POLICY "Admins can update email settings"
  ON public.email_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can insert email settings
CREATE POLICY "Admins can insert email settings"
  ON public.email_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create updated_at trigger
CREATE TRIGGER update_email_settings_updated_at
  BEFORE UPDATE ON public.email_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default preview text settings
INSERT INTO public.email_settings (setting_key, setting_value, description) VALUES
  ('preview_contact_email', 'Pesan baru dari {name} - {message_preview}', 'Preview text untuk email kontak. Variabel: {name}, {email}, {message_preview}'),
  ('preview_password_reset', 'Klik untuk reset password akun Anda - Link berlaku 24 jam', 'Preview text untuk email reset password'),
  ('preview_magic_link', 'Klik untuk login ke akun Anda - Link berlaku 1 jam', 'Preview text untuk email magic link'),
  ('preview_signup_confirmation', 'Selamat datang! Konfirmasi email Anda untuk mengaktifkan akun', 'Preview text untuk email konfirmasi signup'),
  ('preview_password_changed', 'Password Anda berhasil diubah - Jika bukan Anda, segera hubungi kami', 'Preview text untuk email password changed');