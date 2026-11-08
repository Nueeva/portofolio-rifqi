import { lazy, Suspense, useEffect, useRef, useState, type PointerEvent } from "react";
import { Link } from "react-router-dom";
import * as m from "motion/react-m";
import { useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from "motion/react";
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
        offset: ["start start", "end end"],
    });
    const progress = useMotionValue(0);
    const scrollEnabled = useRef(false);
    useMotionValueEvent(scrollYProgress, "change", (value) => {
        if (scrollEnabled.current)
            progress.set(value);
    });
    useEffect(() => {
        const media = window.matchMedia("(min-width: 1024px) and (min-height: 780px) and (prefers-reduced-motion: no-preference)");
        const sync = () => {
            const stage = ref.current?.querySelector<HTMLElement>(".cyber-stage");
            const fits = !!stage && stage.scrollHeight <= window.innerHeight - 64;
            scrollEnabled.current = media.matches && fits;
            setSticky(media.matches && fits);
            progress.set(scrollEnabled.current ? scrollYProgress.get() : 0);
        };
        const observer = new ResizeObserver(sync);
        if (ref.current)
            observer.observe(ref.current);
        sync();
        media.addEventListener("change", sync);
        return () => { observer.disconnect(); media.removeEventListener("change", sync); };
    }, [progress, scrollYProgress]);
    // Lenis already smooths document scroll. No second spring on the camera.
    const titleY = useTransform(progress, [0, 0.2, 0.85, 1], [0, -2, -24, -30]);
    const engineerX = useTransform(progress, [0, 0.2, 0.85, 1], [0, 0, 14, 16]);
    const lowerY = useTransform(progress, [0, 0.35, 0.75, 1], [0, 2, 43, 48]);
    const upperLip = useTransform(progress, [0, 0.35, 0.75, 1], [-10, -12, -51, -54]);
    const lowerLip = useTransform(progress, [0, 0.35, 0.75, 1], [10, 12, 51, 54]);
    const aperture = useTransform(progress, [0, 0.35, 0.75, 1], [
        "inset(42% 0% 42% 0%)", "inset(40% 0% 40% 0%)",
        "inset(8% 0% 8% 0%)", "inset(5% 0% 5% 0%)",
    ]);
    // The highlight starts after the opening: position and light aren't one tween.
    const sweepX = useTransform(progress, [0, 0.35, 0.75, 1], ["-125%", "-110%", "125%", "170%"]);
    const reflectionY = useTransform(progress, [0, 1], [-4, 12]);
    const pointerX = useSpring(0, { stiffness: 90, damping: 28 });
    const pointerY = useSpring(0, { stiffness: 90, damping: 28 });
    function onPointerMove(event: PointerEvent<HTMLElement>) {
        if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
            return;
        const bounds = event.currentTarget.getBoundingClientRect();
        pointerX.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 12);
        pointerY.set(((event.clientY - bounds.top) / bounds.height - 0.5) * 6);
    }
    return (<section ref={ref} className={`cyber-hero ${sticky ? "can-stick" : ""}`} aria-labelledby="cyber-title">
      <div className="cyber-stage" onPointerMove={onPointerMove} onPointerLeave={() => { pointerX.set(0); pointerY.set(0); }}>
        {allowWebGL && <OptionalFeatureBoundary><Suspense fallback={null}><OpticalField progress={progress}/></Suspense></OptionalFeatureBoundary>}
        <svg className="optical-poster" viewBox="0 0 1280 760" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="optical-spectrum"><stop stopColor="var(--site-cyan)"/><stop offset=".6" stopColor="var(--site-violet)"/><stop offset="1" stopColor="var(--site-copper)"/></linearGradient></defs><path d="M-60 570L1340 325L1340 470L-60 715Z" fill="var(--site-cavity)"/><path d="M-60 568L1340 323" stroke="url(#optical-spectrum)" strokeWidth="3"/><path d="M-60 717L1340 472" stroke="var(--site-metal)" strokeWidth="1"/></svg>
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
            <Link to="/projects"><span>Jelajahi karya</span><span className="cyber-project-arrow"><ArrowUpRight /></span></Link>
            <a href="/cv-rifqi-ariansyah.pdf" download>Unduh CV <ArrowUpRight /></a>
          </div>
        </div>
        <div className="cyber-bottom">
          <Link to="/contact">Diskusikan keamanan sistemmu <ArrowUpRight /></Link>
          <Link to="/projects/curated-apexsions">Apexsions — 32 temuan diperbaiki <ArrowUpRight /></Link>
        </div>
      </div>
    </section>);
}
