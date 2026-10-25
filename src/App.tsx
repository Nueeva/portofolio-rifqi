import { useState, useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, StaticRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AnimatePresence } from "motion/react";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { PageTransition } from "@/components/PageTransition";
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

// Cache query results briefly: back-and-forth navigation re-renders from
// cache instantly instead of refetching (and flashing) on every visit.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      {/* No loading fallback on purpose: route chunks are prefetched
          (idle + link intent), so Suspense resolving is instant in
          practice. If a chunk ever is still in flight, rendering nothing
          for a beat beats flashing a full-screen spinner — the curtain
          exit finishes and the new page wipes in the moment it is ready. */}
      <Suspense fallback={null} key={location.pathname}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Index /></PageTransition>} />
          <Route path="/about" element={<PageTransition><About /></PageTransition>} />
          <Route path="/projects" element={<PageTransition><Projects /></PageTransition>} />
          <Route path="/projects/:id" element={<PageTransition><ProjectCaseStudy /></PageTransition>} />
          <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
          <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
          <Route path="/admin" element={<PageTransition><Admin /></PageTransition>} />
          <Route path="/403" element={<PageTransition><Forbidden /></PageTransition>} />
          <Route path="/500" element={<PageTransition><ServerError /></PageTransition>} />
          <Route path="/502" element={<PageTransition><BadGateway /></PageTransition>} />
          <Route path="/503" element={<PageTransition><ServiceUnavailable /></PageTransition>} />
          <Route path="/429" element={<PageTransition><TooManyRequests /></PageTransition>} />
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

const App = ({ ssrPath }: { ssrPath?: string } = {}) => {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = sessionStorage.getItem("hasSeenWelcome");
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, []);

  // Warm the public route chunks while the browser idles after first
  // paint, and warm a specific chunk the moment a same-origin link is
  // hovered, touched, or focused — navigation then never waits on the
  // network. (Admin/Auth/error chunks are intent-only by design.)
  useEffect(() => {
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    let idleId: number | undefined;
    if (win.requestIdleCallback) {
      idleId = win.requestIdleCallback(() => prefetchPublicRoutes(), { timeout: 2500 });
    }
    const fallbackTimer = window.setTimeout(prefetchPublicRoutes, 2500);

    const onIntent = (e: Event) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin === window.location.origin) {
        prefetchRoute(url.pathname);
      }
    };
    document.addEventListener("mouseover", onIntent, { passive: true });
    document.addEventListener("touchstart", onIntent, { passive: true });
    document.addEventListener("focusin", onIntent);

    return () => {
      if (idleId !== undefined) win.cancelIdleCallback?.(idleId);
      window.clearTimeout(fallbackTimer);
      document.removeEventListener("mouseover", onIntent);
      document.removeEventListener("touchstart", onIntent);
      document.removeEventListener("focusin", onIntent);
    };
  }, []);

  const handleWelcomeComplete = () => {
    sessionStorage.setItem("hasSeenWelcome", "true");
    setShowWelcome(false);
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {showWelcome && <WelcomeScreen onComplete={handleWelcomeComplete} />}
          {ssrPath !== undefined ? (
            // Build-time prerender (entry-server.tsx): same tree, static router.
            <StaticRouter location={ssrPath}>
              <AnimatedRoutes />
            </StaticRouter>
          ) : (
            <BrowserRouter>
              <AnimatedRoutes />
            </BrowserRouter>
          )}
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
