import { ReactNode, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
  type Variants,
} from "motion/react";
import { ArrowRight, Shield, Lock, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { ScrollReveal } from "@/components/ScrollReveal";
import { usePageAnalytics } from "@/hooks/usePageAnalytics";
import { useTypingPlaceholder } from "@/hooks/useTypingPlaceholder";
import { useSiteSettings } from "@/hooks/useSiteSettings";

// One continuous hero entrance: staggered Bézier reveal, no bounce
const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const heroContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

const heroItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

/** Subtle 3D tilt that follows the cursor — spring-damped, max ~5deg */
function Tilt({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(my, [0, 1], [5, -5]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(mx, [0, 1], [-5, 5]), { stiffness: 150, damping: 20 });

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };
  const onLeave = () => {
    mx.set(0.5);
    my.set(0.5);
  };

  return (
    <div style={{ perspective: 900 }}>
      <motion.div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/** Animated counter that counts up once when it scrolls into view */
function Stat({ value, suffix = "", label }: { value: number; suffix?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.6,
      ease: [0.25, 0.1, 0.25, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <div ref={ref} className="text-center">
      <div className="font-mono text-3xl sm:text-4xl font-bold text-primary">
        {display.toLocaleString()}
        {suffix}
      </div>
      <div className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

const stats = [
  { value: 9, suffix: "", label: "Plugins Built & Shipped" },
  { value: 32, suffix: "", label: "Audit Findings Fixed" },
  { value: 900, suffix: "+", label: "AI Models Routed" },
  { value: 3, suffix: "", label: "Production Systems Live" },
];

const marqueeItems = [
  "Penetration Testing", "Burp Suite", "Nmap", "Python", "TypeScript", "React",
  "Java", "OWASP Top 10", "Laravel", "Wireshark", "Metasploit", "Linux",
  "Supabase", "Git", "Nuclei", "sqlmap",
];

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
        
        <motion.div
          className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
          variants={heroContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div variants={heroItem} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border mb-8">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              {heroTitle}
            </span>
          </motion.div>

          {/* Name */}
          <motion.h1 variants={heroItem} className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            Hi, I'm <span className="text-primary">{heroName}</span>
          </motion.h1>

          {/* Headline */}
          <motion.p variants={heroItem} className="text-2xl sm:text-3xl font-semibold text-muted-foreground mb-6">
            {heroHeadline.includes("Secure") ? (
              <>Building <span className="text-primary">Secure</span> Digital Solutions</>
            ) : heroHeadline}
          </motion.p>

          {/* Terminal-style typing animation */}
          <motion.div variants={heroItem} className="max-w-2xl mx-auto mb-4">
            <Tilt>
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
            </Tilt>
          </motion.div>
          <motion.p variants={heroItem} className="text-base text-muted-foreground max-w-2xl mx-auto mb-10">
            {heroDescription}
          </motion.p>

          {/* CTAs — spring micro-interactions */}
          <motion.div variants={heroItem} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.div
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button asChild size="lg" className="glow-primary">
                <Link to="/projects">
                  View Projects
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button asChild variant="outline" size="lg">
                <Link to="/contact">Get in Touch</Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats — animated counters */}
          <motion.div variants={heroItem} className="mt-16 pt-10 border-t border-border/60">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((s) => (
                <Stat key={s.label} value={s.value} suffix={s.suffix} label={s.label} />
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Skills marquee */}
      <section className="border-b border-border bg-card/30 py-4 overflow-hidden marquee-mask">
        <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
              {marqueeItems.map((item) => (
                <span key={`${copy}-${item}`} className="flex items-center font-mono text-sm text-muted-foreground">
                  <span className="mx-6">{item}</span>
                  <span className="text-primary">{"//"}</span>
                </span>
              ))}
            </div>
          ))}
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
