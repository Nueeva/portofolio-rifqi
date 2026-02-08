
-- Create site_settings table for dynamic site content
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  label text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Site settings are publicly readable"
ON public.site_settings FOR SELECT
USING (true);

-- Admin can insert
CREATE POLICY "Admins can insert site settings"
ON public.site_settings FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admin can update
CREATE POLICY "Admins can update site settings"
ON public.site_settings FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin can delete
CREATE POLICY "Admins can delete site settings"
ON public.site_settings FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Auto-update timestamp
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default values
INSERT INTO public.site_settings (setting_key, setting_value, category, label) VALUES
-- Social Links
('social_github', 'https://github.com/rifqiariansyah', 'social', 'GitHub URL'),
('social_linkedin', 'https://linkedin.com/in/rifqiariansyah', 'social', 'LinkedIn URL'),
('social_twitter', 'https://twitter.com/rifqiariansyah', 'social', 'Twitter/X URL'),
-- Contact
('contact_email', 'rifqi@example.com', 'contact', 'Email Kontak'),
-- Hero Section
('hero_name', 'Rifqi Ariansyah', 'hero', 'Nama'),
('hero_title', 'Cybersecurity Developer', 'hero', 'Title/Badge'),
('hero_headline', 'Building Secure Digital Solutions', 'hero', 'Headline'),
('hero_description', 'Identifying vulnerabilities before they become threats.', 'hero', 'Deskripsi'),
-- Skills
('skills_security', 'Penetration Testing,Vulnerability Assessment,Web Application Security,Network Security,Secure Code Review,Threat Modeling', 'skills', 'Security Skills'),
('skills_dev', 'TypeScript,React,Python,Node.js,Go,Bash', 'skills', 'Development Skills'),
('skills_tools', 'Burp Suite,Wireshark,Nmap,OWASP ZAP,Metasploit,Ghidra,sqlmap,Hashcat', 'skills', 'Tools & Technologies');
