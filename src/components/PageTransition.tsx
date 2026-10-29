import { motion } from "motion/react";
import { ReactNode, useContext } from "react";
import { PageTransitionReadyContext } from "./PageTransitionReadyContext";

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

// First-page visibility flag lives in PageTransitionReadyContext.ts
// (own module, so this file only exports a component). While the flag
// is false — server render and the client's first render — the page
// mounts straight in the enter state: the old behaviour rendered
// opacity:0 + a fully-clipped clip-path into the prerendered HTML, so
// Chrome could not count ANY content for FCP/LCP until hydration +
// the 0,45 dtk curtain finished (probe throttled: first paint 1,1
// dtk, FCP 3,9 dtk). Once the app has mounted, client-side
// navigations keep the curtain (initial="initial"). Motion only
// reads `initial` at mount, so flipping the flag never re-runs an
// entrance on the page already shown.

export function PageTransition({ children }: PageTransitionProps) {
  const ready = useContext(PageTransitionReadyContext);
  return (
    <motion.div
      variants={pageVariants}
      initial={ready ? "initial" : false}
      animate="enter"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}
