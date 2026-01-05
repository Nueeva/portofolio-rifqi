-- Create projects table for cybersecurity portfolio
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  problem TEXT NOT NULL,
  solution TEXT NOT NULL,
  tech_stack TEXT[] NOT NULL DEFAULT '{}',
  category TEXT NOT NULL CHECK (category IN ('pentesting', 'tools', 'web-security')),
  github_url TEXT,
  demo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (projects are public/read-only for visitors)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read projects (public portfolio)
CREATE POLICY "Projects are publicly readable" 
ON public.projects 
FOR SELECT 
USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample projects
INSERT INTO public.projects (title, problem, solution, tech_stack, category, github_url) VALUES
(
  'Web Vulnerability Scanner',
  'Manual security testing is time-consuming and prone to human error. Organizations need automated ways to identify common web vulnerabilities like XSS, SQL injection, and insecure headers.',
  'Built a Python-based scanner that automates detection of OWASP Top 10 vulnerabilities. Implements custom payloads, response analysis, and generates detailed reports with remediation guidance.',
  ARRAY['Python', 'Requests', 'BeautifulSoup', 'SQLite'],
  'tools',
  'https://github.com'
),
(
  'CTF Platform Writeups',
  'Complex CTF challenges often lack clear documentation, making it difficult for beginners to learn exploitation techniques and understand attack vectors.',
  'Documented solutions for 50+ challenges across categories including web exploitation, reverse engineering, and cryptography. Each writeup explains the vulnerability, exploitation process, and defensive measures.',
  ARRAY['Burp Suite', 'Ghidra', 'Python', 'Wireshark'],
  'pentesting',
  'https://github.com'
),
(
  'Secure Authentication Library',
  'Many web applications implement authentication incorrectly, leading to session hijacking, credential stuffing, and broken access control vulnerabilities.',
  'Developed a TypeScript library implementing secure authentication patterns including proper password hashing, JWT rotation, rate limiting, and CSRF protection following OWASP guidelines.',
  ARRAY['TypeScript', 'Node.js', 'bcrypt', 'JWT'],
  'web-security',
  'https://github.com'
);