/**
 * Route chunk prefetching.
 *
 * Every page beyond Index is a React.lazy chunk. Without prefetching, the
 * first visit to each page has to download its chunk on click — and the
 * user stares at a loading state meanwhile. Warming the chunks ahead of
 * time (the public routes while the browser idles, plus the specific one
 * as soon as a link is hovered/touched/focused) makes navigation resolve
 * from the module cache instantly, so no loading UI is ever needed.
 *
 * The importers live here so App.tsx's lazy() definitions and the
 * prefetchers share the exact same import specifiers — that is what makes
 * the warmed module cache hit.
 */
export const routeImporters = {
  about: () => import("../pages/About"),
  projects: () => import("../pages/Projects"),
  projectCaseStudy: () => import("../pages/ProjectCaseStudy"),
  contact: () => import("../pages/Contact"),
  auth: () => import("../pages/Auth"),
  admin: () => import("../pages/Admin"),
  notFound: () => import("../pages/NotFound"),
  forbidden: () => import("../pages/Forbidden"),
  serverError: () => import("../pages/ServerError"),
  badGateway: () => import("../pages/BadGateway"),
  serviceUnavailable: () => import("../pages/ServiceUnavailable"),
  tooManyRequests: () => import("../pages/TooManyRequests"),
} as const;

type RouteKey = keyof typeof routeImporters;

const warmed = new Set<RouteKey>();

const inflight = new Map<RouteKey, Promise<void>>();

function warm(key: RouteKey): Promise<void> {
  if (warmed.has(key)) return Promise.resolve();
  const existing = inflight.get(key);
  if (existing) return existing;
  // Fire and forget / reusable promise: a failed prefetch must never surface.
  // Dropping keys on error lets a later intent try warming again.
  const promise = routeImporters[key]()
    .then(() => {
      warmed.add(key);
    })
    .catch(() => {
      warmed.delete(key);
    })
    .finally(() => {
      inflight.delete(key);
    });
  inflight.set(key, promise);
  return promise;
}

function keyForPath(pathname: string): RouteKey | undefined {
  if (pathname === "/about") return "about";
  if (pathname === "/projects") return "projects";
  if (pathname.startsWith("/projects/")) return "projectCaseStudy";
  if (pathname === "/contact") return "contact";
  if (pathname === "/auth") return "auth";
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname === "/403") return "forbidden";
  if (pathname === "/500") return "serverError";
  if (pathname === "/502") return "badGateway";
  if (pathname === "/503") return "serviceUnavailable";
  if (pathname === "/429") return "tooManyRequests";
  return undefined;
}

/** Warm the chunk for one pathname (intent prefetch on links). */
export function prefetchRoute(pathname: string) {
  const key = keyForPath(pathname);
  if (key) void warm(key);
}

/** Resolve the lazy route chunk before committing a view transition. */
export function warmRoute(pathname: string): Promise<void> {
  const key = keyForPath(pathname);
  return key ? warm(key) : Promise.resolve();
}

/**
 * Idle-time prefetch: warm ONLY the public content routes. Admin, Auth and
 * the error pages are deliberately excluded — warming the ±548 KB Admin
 * chunk for every public visitor (the old behaviour) wasted bandwidth for
 * people who will never open those routes. They still get intent prefetch
 * via prefetchRoute() when a link to them is actually hovered/touched.
 */
export function prefetchPublicRoutes() {
  const PUBLIC_IDLE_ROUTES: RouteKey[] = ["about", "projects", "projectCaseStudy", "contact"];
  PUBLIC_IDLE_ROUTES.forEach(warm);
}
