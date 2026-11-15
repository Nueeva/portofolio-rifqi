import { lazy, Suspense, useEffect, useRef, useState, type PointerEvent } from "react";
import { Link } from "react-router-dom";
import * as m from "motion/react-m";
import { animate, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from "motion/react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { usePublicSettings } from "@/hooks/usePublicSettings";
import { presentText } from "@/data/projectCopy.id";
import "./cybersecurity-hero.css";
import { OptionalFeatureBoundary } from "./public/OptionalFeatureBoundary";
import { useMotionPolicy } from "./public/motionPolicyContext";
const OpticalField = lazy(() => import("./public/OpticalField"));
/** Celah: one scroll timeline, separate phases for material and light.
 * All content is server-rendered and opaque. The cavity is decorative;
 * its reflected title is not a second accessibility/SEO heading.
 */
export function CybersecurityHero() {
    const { reduced, allowWebGL } = useMotionPolicy();
    const [sticky, setSticky] = useState(false);
    const ref = useRef<HTMLElement>(null);
    const { get } = usePublicSettings();
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: sticky ? ["start start", "end end"] : ["start start", "end start"],
    });
    const progress = useMotionValue(0);
    const entrance = useMotionValue(0);
    const camera = useTransform([progress, entrance], (values: number[]) => Math.min(1,values[1]*.42+values[0]*.58));
    useMotionValueEvent(scrollYProgress, "change", value => { if (!reduced)
        progress.set(value); });
    useEffect(() => {
        if (reduced) {
            entrance.set(1);
            progress.set(0);
            return;
        }
        const animation = animate(entrance, [0, 1], { duration: 1.65, ease: [.22, 1, .36, 1] });
        return () => animation.stop();
    }, [reduced, entrance, progress]);
    useEffect(() => {
        const media = matchMedia("(min-width:1024px) and (min-height:780px)");
        const sync = () => setSticky(!reduced && media.matches && window.innerHeight >= 780);
        media.addEventListener("change", sync);
        window.addEventListener("resize", sync);
        sync();
        return () => { media.removeEventListener("change", sync); window.removeEventListener("resize", sync); };
    }, [reduced]);
    // Lenis already smooths document scroll. Non-linear viscoelastic fracture curves.
    const titleY = useTransform(camera, [0, 0.22, 0.72, 1], [0, -3, -34, -42]);
    const engineerX = useTransform(camera, [0, 0.22, 0.72, 1], [0, 0, 28, 34]);
    const lowerY = useTransform(camera, [0, 0.22, 0.72, 1], [0, 2, 44, 50]);
    const upperLip = useTransform(camera, [0, 0.22, 0.72, 1], [-10, -14, -52, -56]);
    const lowerLip = useTransform(camera, [0, 0.22, 0.72, 1], [10, 14, 52, 56]);
    const aperture = useTransform(camera, [0, 0.22, 0.72, 1], [
        "inset(42% 0% 42% 0%)", "inset(38% 0% 38% 0%)",
        "inset(7% 0% 7% 0%)", "inset(4% 0% 4% 0%)",
    ]);
    // The highlight starts after the opening: position and light aren't one tween.
    const sweepX = useTransform(camera, [0, 0.22, 0.72, 1], ["-125%", "-105%", "135%", "175%"]);
    const railSpread = useTransform(camera, [0, .35, 1], [3, 24, 66]);
    const railUpper = useTransform(railSpread, value => -value);
    const railSweep = useTransform(camera, [0, .2, .65, 1], ["-110%", "-100%", "45%", "135%"]);
    const reflectionY = useTransform(camera, [0, 1], [-4, 14]);
    const pointerX = useSpring(0, { stiffness: 110, damping: 26 });
    const pointerY = useSpring(0, { stiffness: 110, damping: 26 });
    const pointerFrame = useRef(0);
    const pendingPointer = useRef<{ x: number; y: number; target: HTMLElement } | null>(null);
    useEffect(() => () => cancelAnimationFrame(pointerFrame.current), []);
    function resetPointer() {
        cancelAnimationFrame(pointerFrame.current);
        pointerFrame.current = 0;
        pendingPointer.current = null;
        pointerX.set(0);
        pointerY.set(0);
    }
    function onPointerMove(event: PointerEvent<HTMLElement>) {
        if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
            return;
        pendingPointer.current = { x: event.clientX, y: event.clientY, target: event.currentTarget };
        if (!pointerFrame.current) pointerFrame.current = requestAnimationFrame(() => {
            pointerFrame.current = 0;
            const point = pendingPointer.current;
            if (!point) return;
            const bounds = point.target.getBoundingClientRect();
            pointerX.set(((point.x - bounds.left) / Math.max(1, bounds.width) - .5) * 12);
            pointerY.set(((point.y - bounds.top) / Math.max(1, bounds.height) - .5) * 6);
        });
    }
    return (<section ref={ref} className={`cyber-hero ${sticky ? "can-stick" : ""}`} aria-labelledby="cyber-title">
      <div className="cyber-stage" onPointerMove={onPointerMove} onPointerLeave={resetPointer}>
        {allowWebGL && <OptionalFeatureBoundary><Suspense fallback={null}><OpticalField progress={camera}/></Suspense></OptionalFeatureBoundary>}
        <m.div className="hero-intro-light" aria-hidden="true" initial={false} animate={reduced ? { x: "150%" } : { x: ["-150%", "150%"] }} transition={{ duration: 1.65, ease: [.22, 1, .36, 1] }}/>
        <m.svg className="optical-poster" viewBox="0 0 1280 760" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <linearGradient id="optical-spectrum" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--site-cyan)" stopOpacity="0.95"/>
              <stop offset="48%" stopColor="var(--site-cyan)" stopOpacity="0.8"/>
              <stop offset="62%" stopColor="var(--site-violet)" stopOpacity="0.85"/>
              <stop offset="85%" stopColor="var(--site-copper)" stopOpacity="0.9"/>
              <stop offset="100%" stopColor="var(--site-copper)" stopOpacity="0.95"/>
            </linearGradient>
            <filter id="seam-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
          </defs>
          <path d="M-60 407L1340 210L1340 307L-60 504Z" fill="var(--site-cavity)"/>
          <path d="M-60 405L1340 208" stroke="url(#optical-spectrum)" strokeWidth="2.5" filter="url(#seam-glow)"/>
          <path d="M-60 504L1340 307" stroke="var(--site-metal)" strokeWidth="1" strokeOpacity="0.6"/>
        </m.svg>
        <div className="celah-rails" aria-hidden="true">
          <m.div className="celah-rail celah-rail-upper" style={{ y: reduced ? -22 : railUpper }} />
          <m.div className="celah-rail celah-rail-lower" style={{ y: reduced ? 22 : railSpread }} />
          <m.div className="celah-tracer" style={{ x: railSweep }} />
        </div>
        <div className="cyber-upper" aria-hidden="true"/>
        <m.div className="cyber-lower" aria-hidden="true" style={{ y: lowerY }}/>
        <m.div className="cyber-heading" style={{ y: reduced ? 0 : titleY }}>
          <h1 id="cyber-title"><span>Cybersecurity</span><m.em style={{ x: engineerX }}>Engineer.</m.em></h1>
        </m.div>

        <div className="cyber-seam-frame" aria-hidden="true">
          <m.div className="cyber-cavity" style={{ clipPath: aperture }}>
            <m.div className="cyber-reflection" style={{ y: reflectionY }}><span>Cybersecurity</span><em>Engineer.</em></m.div>
            <div className="cyber-seam-copy"><span>xssscope</span><span>Konteks refleksi <ArrowRight /> verifikasi</span></div>
          </m.div>
          <m.div className="cyber-lip cyber-lip-top" style={{ y: upperLip }}>
            <m.div className="cyber-sweep" style={{ x: sweepX }}/>
          </m.div>
          <m.div className="cyber-lip cyber-lip-bottom" style={{ y: lowerLip }}/>
          <m.div className="cyber-pointer-glint" style={{ x: pointerX, y: pointerY }}/>
        </div>

        <div className="cyber-body">
          <div className="cyber-description">
            <p>{presentText(get("hero_headline", "Menguji keamanan aplikasi."))}</p>
            <p>{presentText(get("hero_description", "Membangun tooling dan memperbaiki celah pada sistem produksi."))}</p>
          </div>
          <div className="cyber-project">
            <Link to="/projects" data-cursor="JELAJAHI"><span>Jelajahi karya</span><span className="cyber-project-arrow"><ArrowUpRight /></span></Link>
            <a href={get("portfolio_cv_url", "/cv-rifqi-ariansyah.pdf")} download data-cursor="UNDUH CV"><span>Unduh CV</span><span className="cyber-project-arrow"><ArrowUpRight /></span></a>
          </div>
        </div>
        <div className="cyber-bottom">
          <Link to="/contact" data-cursor="KONTAK">Diskusikan keamanan sistemmu <ArrowUpRight /></Link>
          <Link to="/projects/curated-apexsions" data-cursor="AUDIT">Apexsions — 32 temuan diperbaiki <ArrowUpRight /></Link>
        </div>
      </div>
    </section>);
}
