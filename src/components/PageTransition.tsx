import { motion, useReducedMotion } from "motion/react";
import { ReactNode, useContext } from "react";
import { PageTransitionReadyContext } from "./PageTransitionReadyContext";

export function PageTransition({ children }: { children: ReactNode }) {
  const ready = useContext(PageTransitionReadyContext);
  const reduced = useReducedMotion();
  return <motion.div
    initial={ready && !reduced ? { y: 32, filter: "blur(3px)" } : false}
    animate={{ y: 0, filter: "blur(0px)", transitionEnd: { filter: "none", transform: "none" } }}
    exit={reduced ? undefined : { y: -24, filter: "blur(3px)" }}
    transition={{ duration: reduced ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
  >{children}</motion.div>;
}
