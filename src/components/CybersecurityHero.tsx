import { useEffect, useRef, type PointerEvent } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from "motion/react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { presentText } from "@/data/projectCopy.id";
import "./cybersecurity-hero.css";

/** Celah: one scroll timeline, separate phases for material and light.
 * All content is server-rendered and opaque. The cavity is decorative;
 * its reflected title is not a second accessibility/SEO heading.
 */
export function CybersecurityHero() {
  const ref = useRef<HTMLElement>(null);
  const { get } = useSiteSettings();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const progress = useMotionValue(0);
  const scrollEnabled = useRef(false);
  useMotionValueEvent(scrollYProgress, "change", (value) => {
    if (scrollEnabled.current) progress.set(value);
  });
  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px) and (min-height: 780px) and (prefers-reduced-motion: no-preference)");
    const sync = () => {
      scrollEnabled.current = media.matches;
      progress.set(media.matches ? scrollYProgress.get() : 0);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [progress, scrollYProgress]);
  // Lenis already smooths document scroll. No second spring on the camera.
  const titleY = useTransform(progress, [0, 0.2, 0.85, 1], [0, -2, -24, -30]);
  const engineerX = useTransform(progress, [0, 0.2, 0.85, 1], [0, 0, 14, 16]);
  const lowerY = useTransform(progress, [0, 0.2, 0.65, 1], [0, 2, 43, 48]);
  const upperLip = useTransform(progress, [0, 0.2, 0.65, 1], [-10, -12, -51, -54]);
  const lowerLip = useTransform(progress, [0, 0.2, 0.65, 1], [10, 12, 51, 54]);
  const aperture = useTransform(progress, [0, 0.2, 0.65, 1], [
    "inset(42% 0% 42% 0%)", "inset(40% 0% 40% 0%)",
    "inset(8% 0% 8% 0%)", "inset(5% 0% 5% 0%)",
  ]);
  // The highlight starts after the opening: position and light aren't one tween.
  const sweepX = useTransform(progress, [0, 0.25, 0.8, 1], ["-125%", "-110%", "125%", "170%"]);
  const reflectionY = useTransform(progress, [0, 1], [-4, 12]);
  const pointerX = useSpring(0, { stiffness: 90, damping: 28 });
  const pointerY = useSpring(0, { stiffness: 90, damping: 28 });

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 12);
    pointerY.set(((event.clientY - bounds.top) / bounds.height - 0.5) * 6);
  }

  return (
    <section ref={ref} className="cyber-hero" aria-labelledby="cyber-title">
      <div className="cyber-stage" onPointerMove={onPointerMove}
        onPointerLeave={() => { pointerX.set(0); pointerY.set(0); }}>
        <div className="cyber-upper" aria-hidden="true" />
        <motion.div className="cyber-lower" aria-hidden="true" style={{ y: lowerY }} />
        <motion.div className="cyber-heading" style={{ y: titleY }}>
          <h1 id="cyber-title"><span>Cybersecurity</span><motion.em style={{ x: engineerX }}>Engineer.</motion.em></h1>
        </motion.div>

        <div className="cyber-seam-frame" aria-hidden="true">
          <motion.div className="cyber-cavity" style={{ clipPath: aperture }}>
            <motion.div className="cyber-reflection" style={{ y: reflectionY }}><span>Cybersecurity</span><em>Engineer.</em></motion.div>
            <div className="cyber-seam-copy"><span>xssscope</span><span>Konteks refleksi <ArrowRight /> verifikasi</span></div>
          </motion.div>
          <motion.div className="cyber-lip cyber-lip-top" style={{ y: upperLip }}>
            <motion.div className="cyber-sweep" style={{ x: sweepX }} />
          </motion.div>
          <motion.div className="cyber-lip cyber-lip-bottom" style={{ y: lowerLip }} />
          <motion.div className="cyber-pointer-glint" style={{ x: pointerX, y: pointerY }} />
        </div>

        <div className="cyber-body">
          <div className="cyber-description">
            <p>{presentText(get("hero_headline", "Menguji keamanan aplikasi."))}</p>
            <p>{presentText(get("hero_description", "Membangun tooling dan memperbaiki celah pada sistem produksi."))}</p>
          </div>
          <div className="cyber-project">
            <Link to="/projects/curated-xssscope"><span>Telusuri xssscope</span><span className="cyber-project-arrow"><ArrowUpRight /></span></Link>
            <span>Reflected XSS scanner</span>
          </div>
        </div>
        <div className="cyber-bottom">
          <Link to="/contact">Diskusikan keamanan sistemmu <ArrowUpRight /></Link>
          <Link to="/projects/curated-apexsions">Apexsions — 32 temuan diperbaiki <ArrowUpRight /></Link>
        </div>
      </div>
    </section>
  );
}
