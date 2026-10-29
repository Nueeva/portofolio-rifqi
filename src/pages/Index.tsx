import { ReactNode, Suspense, lazy, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "motion/react";
import { ArrowRight, Shield, Lock, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { ScrollReveal } from "@/components/ScrollReveal";
// Hero3D (three.js, ±747 KB raw / ±192 KB gzip) is lazy AND deferred:
// it mounts only after the page has loaded and the browser idles, so its
// download + parse can no longer sit inside the LCP/TBT window (PSI
// mobile 29 Okt: LCP 4,1 dtk, TBT 1.180 ms) while the hero copy is still
// animating in. The CSS spotlight/aurora layers underneath carry the
// first paint, so the canvas arriving a beat later loses nothing — it is
// aria-hidden decoration, never content.
const Hero3D = lazy(() =>
  import("@/components/Hero3D").then((m) => ({ default: m.Hero3D }))
);
import { CursorTrail } from "@/components/CursorTrail";
import { GlitchText } from "@/components/GlitchText";
import { KineticBackdrop } from "@/components/KineticBackdrop";
import { HeroFeed } from "@/components/HeroFeed";
import { usePageAnalytics } from "@/hooks/usePageAnalytics";
import { useTypingPlaceholder } from "@/hooks/useTypingPlaceholder";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { caseStudyIds, curatedProjects } from "@/data/projects";

// One continuous hero entrance: staggered easeOutQuint reveal, blur
// clearing as each element lands — no bounce (60fps house curve)
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const heroContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

const heroItem: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.65, ease: EASE } },
};

// The hero heading is the LCP element (PSI mobile 29 Okt: LCP 4,1 dtk).
// It must NOT start invisible: the prerendered HTML carried
// opacity:0 + blur(6px) on the h1, so Chrome could not count it for
// FCP/LCP until hydration + the entrance animation finished — one of
// the two measured LCP gates (the other is the PageTransition
// curtain, which hid the whole page the same way). The title
// therefore renders fully opaque from the first paint and only rises
// 18px into place — a transform, not a visibility gate — while every
// other hero element keeps its fade-in. SSR and client first render
// agree (static variant), so hydration cannot mismatch.
const heroTitle: Variants = {
  hidden: { opacity: 1, y: 18, filter: "blur(0px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.65, ease: EASE } },
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

/** Magnetic pull — the element leans toward the cursor and springs back on leave */
function Magnetic({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(useMotionValue(0), { stiffness: 180, damping: 14, mass: 0.2 });
  const y = useSpring(useMotionValue(0), { stiffness: 180, damping: 14, mass: 0.2 });

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    x.set((e.clientX - (r.left + r.width / 2)) * 0.3);
    y.set((e.clientY - (r.top + r.height / 2)) * 0.3);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={{ x, y }}>
      {children}
    </motion.div>
  );
}

/**
 * Stat counter. The real value is what renders — including in the
 * prerendered HTML, so crawlers, link previews and no-JS visitors see
 * the true number, never "0". The count-up is a post-hydration
 * enhancement only: it mutates the number node's text directly (no
 * state, no re-render), and reduced-motion visitors keep the static
 * value.
 */
function Stat({ value, suffix = "", label }: { value: number; suffix?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!inView || reduceMotion || !numRef.current) return;
    const controls = animate(0, value, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        if (numRef.current) {
          numRef.current.textContent = Math.round(v).toLocaleString();
        }
      },
    });
    return () => controls.stop();
  }, [inView, value, reduceMotion]);

  return (
    <div ref={ref} className="text-center">
      <div className="font-display text-3xl sm:text-[2.6rem] sm:leading-none font-bold tracking-[-0.02em] text-primary">
        <span ref={numRef}>{value.toLocaleString()}</span>
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

  // Scroll parallax: grid drifts down slowly, content rises and fades away
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroGridY = useTransform(heroProgress, [0, 1], [0, 70]);
  const heroContentY = useTransform(heroProgress, [0, 1], [0, -60]);
  const heroContentOpacity = useTransform(heroProgress, [0, 0.85], [1, 0]);

  // Deferred hero backdrop (see comment on the Hero3D lazy import):
  // initial render (prerender + client first render) agrees on `false`,
  // so hydration never mismatches; the effect only ever runs client-side.
  // The generous idle timeout is deliberate: on a slow device the main
  // thread stays busy through the hero entrance, and firing three.js
  // then would land it back inside the LCP window it must stay out of.
  // On a fast device the idle callback fires promptly after load.
  const [heroBackdropReady, setHeroBackdropReady] = useState(false);
  useEffect(() => {
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    let idleId: number | undefined;
    let fallbackTimer: number | undefined;
    const schedule = () => {
      if (win.requestIdleCallback) {
        idleId = win.requestIdleCallback(() => setHeroBackdropReady(true), { timeout: 5000 });
      } else {
        fallbackTimer = window.setTimeout(() => setHeroBackdropReady(true), 2000);
      }
    };
    if (document.readyState === "complete") {
      schedule();
    } else {
      window.addEventListener("load", schedule, { once: true });
    }
    return () => {
      if (idleId !== undefined) win.cancelIdleCallback?.(idleId);
      if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer);
      window.removeEventListener("load", schedule);
    };
  }, []);

  const heroName = get("hero_name", "Rifqi Ariansyah");
  const heroHeadline = get("hero_headline", "Building Secure Digital Solutions");
  const heroDescription = get("hero_description", "Identifying vulnerabilities before they become threats.");

  return (
    <Layout>
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden">
        {/* Parallax grid layer — drifts slower than the content scrolls */}
        <motion.div className="absolute inset-x-0 -inset-y-24 bg-grid" style={{ y: heroGridY }} />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        {/* Cinematic lighting: emerald spotlight pooled behind the centered
            copy + a slow-drifting aurora wash up top */}
        <div aria-hidden className="hero-spotlight absolute inset-0 z-[1] pointer-events-none" />
        <div aria-hidden className="hero-aurora animate-aurora absolute inset-0 z-[1] pointer-events-none" />
        {/* Living network + aurora shader (three.js), kept faint and masked
            out of the central copy zone so the headline always wins on
            contrast — decoration serves readability, never the reverse */}
        {heroBackdropReady && (
          <Suspense fallback={null}>
            <Hero3D className="absolute inset-0 z-[1] pointer-events-none opacity-50 [mask-image:radial-gradient(ellipse_75%_70%_at_50%_45%,transparent_52%,black_96%)]" />
          </Suspense>
        )}
        {/* After-effect: cursor light-trail */}
        <CursorTrail className="absolute inset-0 z-[2] h-full w-full pointer-events-none" />
        {/* Live ops ticker — the hero's living content line */}
        <HeroFeed />

        <motion.div
          className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
          variants={heroContainer}
          initial="hidden"
          animate="visible"
          style={{ y: heroContentY, opacity: heroContentOpacity }}
        >
          {/* Name */}
          <motion.h1 variants={heroTitle} className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-[-0.03em] leading-[1.04] mb-5">
            Hi, I'm <span className="text-primary"><GlitchText text={heroName} /></span>
          </motion.h1>

          {/* Headline */}
          <motion.p variants={heroItem} className="font-display text-[1.65rem] leading-snug sm:text-4xl font-semibold tracking-[-0.02em] text-muted-foreground mb-6">
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
            <Magnetic>
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
            </Magnetic>
            <Magnetic>
              <motion.div
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button asChild variant="outline" size="lg">
                  <Link to="/contact">Get in Touch</Link>
                </Button>
              </motion.div>
            </Magnetic>
          </motion.div>

          {/* Stats — animated counters */}
          <motion.div variants={heroItem} className="mt-16 pt-10 border-t border-border/60">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
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
      <section className="relative overflow-hidden py-24 sm:py-28 bg-card/30">
        <KineticBackdrop word="SECURITY" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Semantic heading for the h3 cards below (screen-reader only;
              the visual design intentionally has no heading here) */}
          <h2 className="sr-only">Security services overview</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <ScrollReveal delay={0}>
              <div className="card-lift relative p-7 rounded-lg bg-card border border-border group h-full">
                <div className="line-accent" />
                <Lock className="h-8 w-8 text-primary mb-4 transition-transform duration-500 ease-out-expo group-hover:-translate-y-1" />
                <h3 className="text-lg font-semibold mb-2">Penetration Testing</h3>
                <p className="text-sm text-muted-foreground">
                  Identifying security weaknesses through authorized simulated attacks
                  and comprehensive vulnerability assessments.
                </p>
                <Link
                  to="/contact?topic=penetration-testing"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
                >
                  Discuss this service
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </ScrollReveal>

            {/* Card 2 */}
            <ScrollReveal delay={100}>
              <div className="card-lift relative p-7 rounded-lg bg-card border border-border group h-full">
                <div className="line-accent" />
                <Code className="h-8 w-8 text-primary mb-4 transition-transform duration-500 ease-out-expo group-hover:-translate-y-1" />
                <h3 className="text-lg font-semibold mb-2">Security Tools</h3>
                <p className="text-sm text-muted-foreground">
                  Developing custom security utilities and automation scripts
                  to streamline testing workflows and enhance detection capabilities.
                </p>
                <Link
                  to="/contact?topic=security-tools"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
                >
                  Discuss this service
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </ScrollReveal>

            {/* Card 3 */}
            <ScrollReveal delay={200}>
              <div className="card-lift relative p-7 rounded-lg bg-card border border-border group h-full">
                <div className="line-accent" />
                <Shield className="h-8 w-8 text-primary mb-4 transition-transform duration-500 ease-out-expo group-hover:-translate-y-1" />
                <h3 className="text-lg font-semibold mb-2">Web Security</h3>
                <p className="text-sm text-muted-foreground">
                  Securing web applications against OWASP Top 10 vulnerabilities
                  with secure coding practices and thorough code review.
                </p>
                <Link
                  to="/contact?topic=web-security"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
                >
                  Discuss this service
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Selected Projects — horizontal snap rail. There was no project
          row/rail on `/` before (projects lived only on the `/projects`
          grid), so this rail is the closure affordance itself: cards are
          sized so the next card always peeks in from the rail's edge
          (mobile: ~78vw card in a full-width rail; desktop: 400px cards
          in a 1152px rail leave the third card partly visible), telling
          visitors there is more to scroll to. Static markup on purpose
          (no motion wrapper): identical in prerendered HTML and the
          client tree, and no animation to clash with reduced motion.
          The rail itself is a scroll container, so it never widens the
          page: only the rail scrolls, the page does not overflow. */}
      <section className="relative py-24 sm:py-28">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Selected Projects</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Scroll sideways to browse the rest — the next project is already peeking in.
              </p>
            </div>
            <Link
              to="/projects"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
            >
              View all projects
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div
            tabIndex={0}
            aria-label="Selected projects — scroll horizontally to see more"
            className="flex gap-6 overflow-x-auto pb-4 snap-x snap-proximity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
          >
            {curatedProjects.map((project) => (
              <article
                key={project.id}
                className="relative w-[78vw] max-w-[400px] sm:w-[400px] shrink-0 snap-start rounded-lg bg-card border border-border hover:border-primary/50 transition-[border-color] p-6"
              >
                <div className="line-accent" />
                <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                  {project.category}
                </span>
                <h3 className="mt-3 text-lg font-semibold">{project.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                  {project.solution}
                </p>
                {caseStudyIds.has(project.id) ? (
                  <Link
                    to={`/projects/${project.id}`}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
                  >
                    Read case study
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <Link
                    to="/projects"
                    className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
                  >
                    View project
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
