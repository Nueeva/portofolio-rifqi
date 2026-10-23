import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useSpring, type Variants } from "motion/react";
import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ScrollReveal";
import { ScrambleText } from "@/components/ScrambleText";
import { usePageAnalytics } from "@/hooks/usePageAnalytics";
import { Download, Award, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const defaultCertifications = [
  { name: "Founder & Lead Developer — Apexsions Plugin Ecosystem (9 plugins, full security audit)", issuer: "Personal Project", year: "2025", status: "active" },
  { name: "Lead Developer — Portfolio 71, Student Portfolio Platform of SMKN 71 Jakarta", issuer: "School Project", year: "2026", status: "active" },
  { name: "Open-Source Security Tooling — xssscope & CTF-Toolkit", issuer: "GitHub", year: "2026", status: "active" },
];

const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const badgeContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const badgeItem: Variants = {
  hidden: { opacity: 0, scale: 0.85, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
};

const CERTS_KEY = "portfolio_certifications";
const RESUME_URL_KEY = "portfolio_resume_url";

const defaultSecuritySkills = ["Penetration Testing", "Vulnerability Assessment", "Web Application Security", "Network Security", "Secure Code Review", "Threat Modeling"];
const defaultDevSkills = ["TypeScript", "React", "Python", "Node.js", "Go", "Bash"];
const defaultTools = ["Burp Suite", "Wireshark", "Nmap", "OWASP ZAP", "Metasploit", "Ghidra", "sqlmap", "Hashcat"];

const About = () => {
  usePageAnalytics("/about");
  const { getList } = useSiteSettings();

  // Approach timeline rail fills as the section scrolls through view
  const approachRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: approachProgress } = useScroll({
    target: approachRef,
    offset: ["start 0.85", "end 0.55"],
  });
  const approachScaleY = useSpring(approachProgress, { stiffness: 90, damping: 25 });

  const securitySkills = getList("skills_security", defaultSecuritySkills);
  const devSkills = getList("skills_dev", defaultDevSkills);
  const tools = getList("skills_tools", defaultTools);

  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [certifications, setCertifications] = useState(defaultCertifications);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CERTS_KEY);
      if (stored) setCertifications(JSON.parse(stored));
    } catch { /* use defaults */ }

    const storedUrl = localStorage.getItem(RESUME_URL_KEY);
    if (storedUrl) {
      setResumeUrl(storedUrl);
    } else {
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
                <ScrambleText parts={[{ text: "About " }, { text: "Me", className: "text-primary" }]} />
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
                  <motion.div
                    className="flex flex-wrap gap-2"
                    variants={badgeContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-60px" }}
                  >
                    {securitySkills.map((skill) => (
                      <motion.span key={skill} variants={badgeItem} className="inline-flex">
                        <Badge variant="secondary" className="font-normal">
                          {skill}
                        </Badge>
                      </motion.span>
                    ))}
                  </motion.div>
                </div>
              </ScrollReveal>

              {/* Development Skills */}
              <ScrollReveal delay={200}>
                <div className="p-6 rounded-lg bg-card border border-border h-full">
                  <h3 className="text-lg font-medium text-primary mb-4">Development</h3>
                  <motion.div
                    className="flex flex-wrap gap-2"
                    variants={badgeContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-60px" }}
                  >
                    {devSkills.map((skill) => (
                      <motion.span key={skill} variants={badgeItem} className="inline-flex">
                        <Badge variant="secondary" className="font-normal">
                          {skill}
                        </Badge>
                      </motion.span>
                    ))}
                  </motion.div>
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
                <motion.div
                  className="flex flex-wrap gap-3"
                  variants={badgeContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-60px" }}
                >
                  {tools.map((tool) => (
                    <motion.div
                      key={tool}
                      variants={badgeItem}
                      className="px-4 py-2 rounded-md bg-secondary/50 border border-border font-mono text-sm"
                    >
                      {tool}
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </ScrollReveal>
          </section>

          {/* Certifications Section */}
          <section className="mb-16">
            <ScrollReveal>
              <h2 className="text-2xl font-semibold mb-8 flex items-center gap-2">
                <Award className="h-6 w-6 text-primary" />
                Certifications & Milestones
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
            
            <div ref={approachRef} className="relative grid gap-6 pl-10">
              {/* Timeline rail — fills with scroll progress */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
              <motion.div
                className="absolute left-[7px] top-2 bottom-2 w-px bg-primary origin-top"
                style={{ scaleY: approachScaleY }}
              />
              <ScrollReveal delay={0} direction="right">
                <div className="relative p-6 rounded-lg bg-card border border-border">
                  <span className="absolute -left-10 top-7 h-[15px] w-[15px] rounded-full border-2 border-primary bg-background" />
                  <div className="line-accent" />
                  <h3 className="text-lg font-medium mb-2">1. Reconnaissance</h3>
                  <p className="text-muted-foreground">
                    Thoroughly understand the target system, its architecture, and potential 
                    attack surfaces before testing begins.
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={100} direction="right">
                <div className="relative p-6 rounded-lg bg-card border border-border">
                  <span className="absolute -left-10 top-7 h-[15px] w-[15px] rounded-full border-2 border-primary bg-background" />
                  <div className="line-accent" />
                  <h3 className="text-lg font-medium mb-2">2. Analysis</h3>
                  <p className="text-muted-foreground">
                    Identify vulnerabilities through a combination of automated scanning 
                    and manual testing, focusing on high-impact issues.
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={200} direction="right">
                <div className="relative p-6 rounded-lg bg-card border border-border">
                  <span className="absolute -left-10 top-7 h-[15px] w-[15px] rounded-full border-2 border-primary bg-background" />
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
