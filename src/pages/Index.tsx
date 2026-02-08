import { Link } from "react-router-dom";
import { ArrowRight, Shield, Lock, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { ScrollReveal } from "@/components/ScrollReveal";
import { usePageAnalytics } from "@/hooks/usePageAnalytics";
import { useTypingPlaceholder } from "@/hooks/useTypingPlaceholder";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const typingTexts = [
  "Penetration Testing",
  "Security Tools Development",
  "Web Application Security",
  "Vulnerability Assessment",
  "Secure Code Review",
];

const Index = () => {
  usePageAnalytics("/");
  const { get } = useSiteSettings();
  const typedText = useTypingPlaceholder({ texts: typingTexts, typingSpeed: 80, deletingSpeed: 40, pauseDuration: 2500 });

  const heroName = get("hero_name", "Rifqi Ariansyah");
  const heroTitle = get("hero_title", "Cybersecurity Developer");
  const heroHeadline = get("hero_headline", "Building Secure Digital Solutions");
  const heroDescription = get("hero_description", "Identifying vulnerabilities before they become threats.");

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center bg-grid">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge - visible immediately for LCP */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border mb-8 animate-fade-in">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              {heroTitle}
            </span>
          </div>

          {/* Name - visible immediately for LCP */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
            Hi, I'm <span className="text-primary">{heroName}</span>
          </h1>
          
          {/* Headline */}
          <p className="text-2xl sm:text-3xl font-semibold text-muted-foreground mb-6 animate-fade-in" style={{ animationDelay: "200ms" }}>
            {heroHeadline.includes("Secure") ? (
              <>Building <span className="text-primary">Secure</span> Digital Solutions</>
            ) : heroHeadline}
          </p>

          {/* Terminal-style typing animation */}
          <div className="max-w-2xl mx-auto mb-4 animate-fade-in" style={{ animationDelay: "300ms" }}>
            <div className="relative rounded-lg border border-border bg-card/80 backdrop-blur-sm overflow-hidden">
              {/* Terminal header */}
              <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/60 border-b border-border">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                <span className="ml-2 text-[10px] text-muted-foreground font-mono tracking-wider uppercase">terminal</span>
              </div>
              {/* Terminal body */}
              <div className="px-4 py-3 font-mono text-sm sm:text-base">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-primary">➜</span>
                  <span className="text-primary/70">~</span>
                  <span className="text-muted-foreground">specializing_in</span>
                </div>
                <div className="flex items-center mt-1">
                  <span className="text-primary font-semibold">{typedText}</span>
                  <span className="inline-block w-2 h-5 bg-primary ml-0.5 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: "350ms" }}>
            {heroDescription}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "400ms" }}>
            <Button asChild size="lg" className="glow-primary">
              <Link to="/projects">
                View Projects
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/contact">Get in Touch</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Overview Section */}
      <section className="py-20 bg-card/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <ScrollReveal delay={0}>
              <div className="relative p-6 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors group h-full">
                <div className="line-accent" />
                <Lock className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Penetration Testing</h3>
                <p className="text-sm text-muted-foreground">
                  Identifying security weaknesses through authorized simulated attacks 
                  and comprehensive vulnerability assessments.
                </p>
              </div>
            </ScrollReveal>

            {/* Card 2 */}
            <ScrollReveal delay={100}>
              <div className="relative p-6 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors group h-full">
                <div className="line-accent" />
                <Code className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Security Tools</h3>
                <p className="text-sm text-muted-foreground">
                  Developing custom security utilities and automation scripts 
                  to streamline testing workflows and enhance detection capabilities.
                </p>
              </div>
            </ScrollReveal>

            {/* Card 3 */}
            <ScrollReveal delay={200}>
              <div className="relative p-6 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors group h-full">
                <div className="line-accent" />
                <Shield className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Web Security</h3>
                <p className="text-sm text-muted-foreground">
                  Securing web applications against OWASP Top 10 vulnerabilities 
                  with secure coding practices and thorough code review.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
