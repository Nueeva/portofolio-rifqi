import { useRef } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";

/**
 * Kinetic typography backdrop: a giant outlined mono word that slides as
 * its section scrolls through the viewport and skews with scroll velocity
 * — the harder you scroll, the more it leans. Transform-only, so it stays
 * on the compositor.
 */
export function KineticBackdrop({ word }: { word: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const x = useTransform(scrollYProgress, [0, 1], ["3%", "-16%"]);

  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(velocity, { stiffness: 120, damping: 42 });
  const skewX = useTransform(smoothVelocity, [-1600, 1600], [-5, 5]);

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <motion.div style={{ skewX }} className="absolute inset-x-0 top-2">
        <motion.span
          style={{ x }}
          className="kinetic-word block whitespace-nowrap font-mono text-[11rem] font-black leading-none tracking-tight sm:text-[15rem]"
        >
          {word} — {word}
        </motion.span>
      </motion.div>
    </div>
  );
}
