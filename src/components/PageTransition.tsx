import { motion } from "motion/react";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Terminal curtain: the new page wipes in top-to-bottom (clip-path),
// the old one wipes out upward. One continuous Bézier, no bounce.
const pageVariants = {
  initial: {
    opacity: 0,
    clipPath: "inset(0 0 100% 0)",
  },
  enter: {
    opacity: 1,
    clipPath: "inset(0 0 0% 0)",
    transition: {
      duration: 0.45,
      ease: EASE,
    },
  },
  exit: {
    opacity: 0,
    clipPath: "inset(100% 0 0 0)",
    transition: {
      duration: 0.25,
      ease: EASE,
    },
  },
};

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}
