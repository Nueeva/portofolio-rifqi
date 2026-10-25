import { ReactNode } from "react";
import { motion, type Variants } from "motion/react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** delay in milliseconds, kept for compatibility with existing call sites */
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
}

const OFFSET = 30;

// easeOutQuint — the 60fps house curve: fast attack, long soft landing.
// A whisper of blur clears as the element settles (award-site reveal).
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const offsets: Record<NonNullable<ScrollRevealProps["direction"]>, { x: number; y: number }> = {
  up: { x: 0, y: OFFSET },
  down: { x: 0, y: -OFFSET },
  left: { x: OFFSET, y: 0 },
  right: { x: -OFFSET, y: 0 },
};

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: ScrollRevealProps) {
  const { x, y } = offsets[direction];

  const variants: Variants = {
    hidden: { opacity: 0, x, y, filter: "blur(5px)" },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.75, delay: delay / 1000, ease: EASE },
    },
  };

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
    >
      {children}
    </motion.div>
  );
}
