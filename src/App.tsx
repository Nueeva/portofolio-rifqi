import { createQueryClient } from "@/lib/publicContentCache";
import type { PublicContent } from "@/integrations/api/types";
import { useState, useEffect, lazy, Suspense } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, StaticRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AnimatePresence, MotionConfig } from "motion/react";
import { PublicShell } from "@/components/public/PublicShell";
import { RouteFailureBoundary } from "@/components/public/RouteFailureBoundary";
import { PublicDesignBoundary } from "@/components/public/PublicDesignBoundary";
import { PageTransition } from "@/components/PageTransition";
import { PageTransitionReadyContext } from "@/components/PageTransitionReadyContext";
import { routeImporters, prefetchRoute, prefetchPublicRoutes } from "@/lib/routePrefetch";
// Eagerly loaded - critical for first paint
import Index from "./pages/Index";
// Lazy loaded pages — importers shared with the prefetcher (routePrefetch.ts)
// so a prefetched chunk is the exact module React.lazy resolves later.
const About = lazy(routeImporters.about);
const Projects = lazy(routeImporters.projects);
const ProjectCaseStudy = lazy(routeImporters.projectCaseStudy);
const Contact = lazy(routeImporters.contact);
const Auth = lazy(routeImporters.auth);
const Admin = lazy(routeImporters.admin);
const NotFound = lazy(routeImporters.notFound);
const Forbidden = lazy(routeImporters.forbidden);
const ServerError = lazy(routeImporters.serverError);
const BadGateway = lazy(routeImporters.badGateway);
const ServiceUnavailable = lazy(routeImporters.serviceUnavailable);
const TooManyRequests = lazy(routeImporters.tooManyRequests);

function AnimatedRoutes() {
    const location = useLocation();
    const legacy = /^\/(admin|auth)\/?$/.test(location.pathname);
    const content = (<AnimatePresence mode="wait">
      {/* Keep the shell visible while a prefetched route chunk resolves. */}
      <Suspense fallback={<div className="public-container public-page" role="status">Memuat halaman…</div>} key={location.pathname}>
        <RouteFailureBoundary key={location.pathname}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Index /></PageTransition>}/>
          <Route path="/about" element={<PageTransition><About /></PageTransition>}/>
          <Route path="/projects" element={<PageTransition><Projects /></PageTransition>}/>
          <Route path="/projects/:id" element={<PageTransition><ProjectCaseStudy /></PageTransition>}/>
          <Route path="/contact" element={<PageTransition><Contact /></PageTransition>}/>
          <Route path="/auth" element={<PageTransition><Auth /></PageTransition>}/>
          <Route path="/admin" element={<PageTransition><Admin /></PageTransition>}/>
          <Route path="/403" element={<PageTransition><Forbidden /></PageTransition>}/>
          <Route path="/500" element={<PageTransition><ServerError /></PageTransition>}/>
          <Route path="/502" element={<PageTransition><BadGateway /></PageTransition>}/>
          <Route path="/503" element={<PageTransition><ServiceUnavailable /></PageTransition>}/>
          <Route path="/429" element={<PageTransition><TooManyRequests /></PageTransition>}/>
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>}/>
        </Routes>
        </RouteFailureBoundary>
      </Suspense>
    </AnimatePresence>);
    return <PublicDesignBoundary pathname={location.pathname}>{legacy ? content : <PublicShell>{content}</PublicShell>}</PublicDesignBoundary>;
}
const App = ({ ssrPath, publicContent }: {
    ssrPath?: string;
    publicContent?: PublicContent;
} = {}) => {
    // Each SSR request owns its cache; browser navigation retains this instance.
    const [queryClient] = useState(() => createQueryClient(publicContent));
    // Flipped in an effect after mount (never on the server, never on
    // the first render): from then on, client-side navigations animate
    // through the PageTransition camera lift, while the first page — server
    // render and hydrated render alike — mounts already visible (see
    // PageTransitionReadyContext). Unconditional hook, no SSR mismatch.
    const [transitionReady, setTransitionReady] = useState(false);
    useEffect(() => {
        setTransitionReady(true);
    }, []);
    // Warm the public route chunks while the browser idles after first
    // paint, and warm a specific chunk the moment a same-origin link is
    // hovered, touched, or focused — navigation then never waits on the
    // network. (Admin/Auth/error chunks are intent-only by design.)
    useEffect(() => {
        const connection = (navigator as Navigator & {
            connection?: {
                saveData?: boolean;
                effectiveType?: string;
            };
        }).connection;
        const canPrefetch = () => !document.hidden && !connection?.saveData && !/^(slow-2g|2g)$/.test(connection?.effectiveType ?? "");
        const win = window as Window & {
            requestIdleCallback?: (cb: () => void, opts?: {
                timeout: number;
            }) => number;
            cancelIdleCallback?: (id: number) => void;
        };
        let idleId: number | undefined;
        if (canPrefetch() && win.requestIdleCallback) {
            idleId = win.requestIdleCallback(() => { if(canPrefetch()) prefetchPublicRoutes(); }, { timeout: 2500 });
        }
        const fallbackTimer = window.setTimeout(() => { if (canPrefetch())
            prefetchPublicRoutes(); }, 2500);
        const onIntent = (e: Event) => {
            if (!canPrefetch())
                return;
            const target = e.target as HTMLElement | null;
            const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
            if (!anchor)
                return;
            const url = new URL(anchor.href, window.location.href);
            if (url.origin === window.location.origin) {
                prefetchRoute(url.pathname);
            }
        };
        document.addEventListener("mouseover", onIntent, { passive: true });
        document.addEventListener("touchstart", onIntent, { passive: true });
        document.addEventListener("focusin", onIntent);
        return () => {
            if (idleId !== undefined)
                win.cancelIdleCallback?.(idleId);
            window.clearTimeout(fallbackTimer);
            document.removeEventListener("mouseover", onIntent);
            document.removeEventListener("touchstart", onIntent);
            document.removeEventListener("focusin", onIntent);
        };
    }, []);
    return (<ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {/* Respect the visitor's OS-level reduced-motion setting for
            every motion animation in the tree (motion/react reads this
            context instead of its own media query). */}
          <MotionConfig reducedMotion="user">

          <PageTransitionReadyContext.Provider value={transitionReady}>
          {ssrPath !== undefined ? (
        // Build-time prerender (entry-server.tsx): same tree, static router.
        <StaticRouter location={ssrPath}>
              <AnimatedRoutes />
            </StaticRouter>) : (<BrowserRouter>
              <AnimatedRoutes />
            </BrowserRouter>)}
          </PageTransitionReadyContext.Provider>
          </MotionConfig>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>);
};
export default App;
