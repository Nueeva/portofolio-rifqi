import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "motion/react";

/** Decorative crop only: reading content never waits for an entrance. */
export function Aperture({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const clipPath = useTransform(scrollYProgress, [0, 1], ["polygon(0 0,100% 0,100% 80%,0 100%)", "polygon(0 0,100% 0,100% 100%,0 100%)"]);
  return <motion.div ref={ref} className={`public-aperture ${className}`} style={{ clipPath }}>{children}</motion.div>;
}
