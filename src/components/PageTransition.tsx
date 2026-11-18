import { usePublicDesign } from "./public/PublicDesignContext";
import { useLocation } from "react-router-dom";
import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { ReactNode, useContext, useEffect, useRef } from "react";
import { PageTransitionReadyContext } from "./PageTransitionReadyContext";

const pageVariants = {
  enter: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.26, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
    transitionEnd: { filter: "none", transform: "none" },
  },
  exit: () => {
    if (typeof document !== "undefined" && document.documentElement.dataset.vtNav) {
      return { opacity: 1, y: 0, transition: { duration: 0 } };
    }
    return {
      opacity: 0,
      y: -8,
      transition: { duration: 0.15, ease: [0.32, 0, 0.67, 0] as [number, number, number, number] },
    };
  },
};

export function PageTransition({ children }: { children: ReactNode }) {
  const { isPublic } = usePublicDesign();
  const { pathname } = useLocation();
  const ready = useContext(PageTransitionReadyContext);
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const focusOnMount = useRef(ready && isPublic);

  useEffect(() => {
    if (!focusOnMount.current) return;
    if (typeof document !== "undefined" && document.documentElement.dataset.vtNav) return;
    const heading = ref.current?.querySelector("h1");
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }, []);

  if (!isPublic) return <>{children}</>;

  const vtActive =
    typeof document !== "undefined" && Boolean(document.documentElement.dataset.vtNav);

  return (
    <m.div
      ref={ref}
      data-page-path={pathname}
      variants={pageVariants}
      initial={ready && !reduced && !vtActive ? { opacity: 0, y: 14 } : false}
      animate={reduced || vtActive ? { opacity: 1, y: 0, transitionEnd: { filter: "none", transform: "none" } } : "enter"}
      exit={reduced ? undefined : "exit"}
      transition={reduced || vtActive ? { duration: 0 } : undefined}
    >
      {children}
    </m.div>
  );
}
