import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ScrollReveal";
import { usePageAnalytics } from "@/hooks/usePageAnalytics";
import { Download, Award, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const securitySkills = [
  "Penetration Testing",
  "Vulnerability Assessment",
  "Web Application Security",
  "Network Security",
  "Secure Code Review",
  "Threat Modeling",
];

const devSkills = [
  "TypeScript",
  "React",
  "Python",
  "Node.js",
  "Go",
  "Bash",
];

const tools = [
  "Burp Suite",
  "Wireshark",
  "Nmap",
  "OWASP ZAP",
  "Metasploit",
  "Ghidra",
  "sqlmap",
  "Hashcat",
];

const defaultCertifications = [
  { name: "CompTIA Security+", issuer: "CompTIA", year: "2024", status: "active" },
  { name: "CEH (Certified Ethical Hacker)", issuer: "EC-Council", year: "2024", status: "active" },
  { name: "OSCP", issuer: "Offensive Security", year: "2025", status: "in-progress" },
];

const CERTS_KEY = "portfolio_certifications";
const RESUME_URL_KEY = "portfolio_resume_url";

const About = () => {
  // Track page visit for analytics
  usePageAnalytics("/about");

  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [certifications, setCertifications] = useState(defaultCertifications);

  useEffect(() => {
    // Load certifications from localStorage
    try {
      const stored = localStorage.getItem(CERTS_KEY);
      if (stored) setCertifications(JSON.parse(stored));
    } catch { /* use defaults */ }

    // Load resume URL - try localStorage first, then check storage
    const storedUrl = localStorage.getItem(RESUME_URL_KEY);
    if (storedUrl) {
      setResumeUrl(storedUrl);
    } else {
      // Fallback: build URL from storage
      const { data: { publicUrl } } = supabase.storage
        .from("resume")
        .getPublicUrl("resume-rifqi-ariansyah.pdf");
      setResumeUrl(publicUrl);
    }
  }, []);

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <ScrollReveal>
            <div className="mb-16">
              <h1 className="text-3xl sm:text-4xl font-bold mb-4">
                About <span className="text-primary">Me</span>
              </h1>
              <div className="w-20 h-1 bg-primary rounded-full" />
            </div>
          </ScrollReveal>

          {/* Introduction */}
          <ScrollReveal delay={100}>
            <section className="mb-16">
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                I'm a cybersecurity-focused developer with a passion for finding and fixing 
                security vulnerabilities before they can be exploited. My work spans penetration 
                testing, security tool development, and building secure web applications.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                I approach security as both an attacker and defender—understanding offensive 
                techniques to build better defensive solutions. Every vulnerability I find is 
                an opportunity to make systems more resilient.
              </p>
            </section>
          </ScrollReveal>

          {/* Skills Section */}
          <section className="mb-16">
            <ScrollReveal>
              <h2 className="text-2xl font-semibold mb-8">Skills & Expertise</h2>
            </ScrollReveal>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Security Skills */}
              <ScrollReveal delay={100}>
                <div className="p-6 rounded-lg bg-card border border-border h-full">
                  <h3 className="text-lg font-medium text-primary mb-4">Security</h3>
                  <div className="flex flex-wrap gap-2">
                    {securitySkills.map((skill) => (
                      <Badge 
                        key={skill} 
                        variant="secondary"
                        className="font-normal"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </ScrollReveal>

              {/* Development Skills */}
              <ScrollReveal delay={200}>
                <div className="p-6 rounded-lg bg-card border border-border h-full">
                  <h3 className="text-lg font-medium text-primary mb-4">Development</h3>
                  <div className="flex flex-wrap gap-2">
                    {devSkills.map((skill) => (
                      <Badge 
                        key={skill} 
                        variant="secondary"
                        className="font-normal"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </section>

          {/* Tools Section */}
          <section className="mb-16">
            <ScrollReveal>
              <h2 className="text-2xl font-semibold mb-8">Tools & Technologies</h2>
            </ScrollReveal>
            
            <ScrollReveal delay={100}>
              <div className="p-6 rounded-lg bg-card border border-border">
                <div className="flex flex-wrap gap-3">
                  {tools.map((tool, index) => (
                    <div 
                      key={tool}
                      className="px-4 py-2 rounded-md bg-secondary/50 border border-border font-mono text-sm"
                    >
                      {tool}
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </section>

          {/* Certifications Section */}
          <section className="mb-16">
            <ScrollReveal>
              <h2 className="text-2xl font-semibold mb-8 flex items-center gap-2">
                <Award className="h-6 w-6 text-primary" />
                Certifications
              </h2>
            </ScrollReveal>

            <div className="grid gap-4">
              {certifications.map((cert, index) => (
                <ScrollReveal key={cert.name} delay={index * 100}>
                  <div className="relative p-5 rounded-lg bg-card border border-border flex items-center justify-between gap-4 hover:border-primary/50 transition-colors">
                    <div className="line-accent" />
                    <div className="flex-1 ml-2">
                      <h3 className="font-medium">{cert.name}</h3>
                      <p className="text-sm text-muted-foreground">{cert.issuer} · {cert.year}</p>
                    </div>
                    {cert.status === "active" ? (
                      <Badge className="bg-primary/10 text-primary border-primary/30">
                        <CheckCircle className="h-3 w-3 mr-1" /> Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">In Progress</Badge>
                    )}
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </section>

          {/* Approach Section */}
          <section>
            <ScrollReveal>
              <h2 className="text-2xl font-semibold mb-8">My Approach</h2>
            </ScrollReveal>
            
            <div className="grid gap-6">
              <ScrollReveal delay={0}>
                <div className="relative p-6 rounded-lg bg-card border border-border">
                  <div className="line-accent" />
                  <h3 className="text-lg font-medium mb-2">1. Reconnaissance</h3>
                  <p className="text-muted-foreground">
                    Thoroughly understand the target system, its architecture, and potential 
                    attack surfaces before testing begins.
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={100}>
                <div className="relative p-6 rounded-lg bg-card border border-border">
                  <div className="line-accent" />
                  <h3 className="text-lg font-medium mb-2">2. Analysis</h3>
                  <p className="text-muted-foreground">
                    Identify vulnerabilities through a combination of automated scanning 
                    and manual testing, focusing on high-impact issues.
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={200}>
                <div className="relative p-6 rounded-lg bg-card border border-border">
                  <div className="line-accent" />
                  <h3 className="text-lg font-medium mb-2">3. Documentation</h3>
                  <p className="text-muted-foreground">
                    Provide clear, actionable reports with severity ratings, proof-of-concept 
                    demonstrations, and practical remediation guidance.
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </section>

          {/* Download CV CTA */}
          <ScrollReveal delay={100}>
            <section className="mt-16 p-8 rounded-lg bg-card border border-border text-center">
              <h2 className="text-2xl font-semibold mb-3">Interested in working together?</h2>
              <p className="text-muted-foreground mb-6">Download my CV for more details about my experience and qualifications.</p>
              <Button asChild size="lg" className="glow-primary">
                <a href={resumeUrl || "#"} download="resume-rifqi-ariansyah.pdf">
                  <Download className="mr-2 h-5 w-5" />
                  Download CV / Resume
                </a>
              </Button>
            </section>
          </ScrollReveal>
        </div>
      </div>
    </Layout>
  );
};

export default About;
