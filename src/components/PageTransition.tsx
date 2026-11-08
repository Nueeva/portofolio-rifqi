import { lazy, Suspense } from "react";
import { usePublicDesign } from "./public/PublicDesignContext";
import { useLocation } from "react-router-dom";
import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { ReactNode, useContext, useEffect, useRef } from "react";
import { PageTransitionReadyContext } from "./PageTransitionReadyContext";
const LegacyTransition = lazy(() => import("./LegacyPageTransition"));
export function PageTransition({ children }: {
    children: ReactNode;
}) {
    const { isPublic } = usePublicDesign();
    const { pathname } = useLocation();
    const ready = useContext(PageTransitionReadyContext);
    const reduced = useReducedMotion();
    const ref = useRef<HTMLDivElement>(null);
    const focusOnMount = useRef(ready && isPublic);
    useEffect(() => { if (!focusOnMount.current)
        return; const heading = ref.current?.querySelector("h1"); if (heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
    } }, []);
    if (!isPublic) return <Suspense fallback={null}><LegacyTransition>{children}</LegacyTransition></Suspense>;
    return <m.div ref={ref} data-page-path={pathname} initial={ready && !reduced ? { y: 32 } : false} animate={{ y: 0, transitionEnd: { filter: "none", transform: "none" } }} exit={reduced ? undefined : { y: -24 }} transition={{ duration: reduced ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}>{children}</m.div>;
}
