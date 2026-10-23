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

// Precise Bézier curve — no bounce, no glow, one continuous reveal
const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

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
    hidden: { opacity: 0, x, y },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: 0.6, delay: delay / 1000, ease: EASE },
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
