/**
 * Route chunk prefetching.
 *
 * Every page beyond Index is a React.lazy chunk. Without prefetching, the
 * first visit to each page has to download its chunk on click — and the
 * user stares at a loading state meanwhile. Warming the chunks ahead of
 * time (all of them while the browser idles, plus the specific one as
 * soon as a link is hovered/touched/focused) makes navigation resolve
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

function warm(key: RouteKey) {
  if (warmed.has(key)) return;
  warmed.add(key);
  // Fire and forget: a failed prefetch (e.g. offline) must never surface.
  // Real navigation still goes through React.lazy and retries on its own;
  // dropping the key here lets a later intent try warming again.
  routeImporters[key]().catch(() => {
    warmed.delete(key);
  });
}

/** Warm the chunk for one pathname (intent prefetch on links). */
export function prefetchRoute(pathname: string) {
  if (pathname === "/about") warm("about");
  else if (pathname === "/projects") warm("projects");
  else if (pathname.startsWith("/projects/")) warm("projectCaseStudy");
  else if (pathname === "/contact") warm("contact");
  else if (pathname === "/auth") warm("auth");
  else if (pathname.startsWith("/admin")) warm("admin");
  else if (pathname === "/403") warm("forbidden");
  else if (pathname === "/500") warm("serverError");
  else if (pathname === "/502") warm("badGateway");
  else if (pathname === "/503") warm("serviceUnavailable");
  else if (pathname === "/429") warm("tooManyRequests");
}

/** Warm every route chunk (idle-time prefetch after first paint). */
export function prefetchAllRoutes() {
  (Object.keys(routeImporters) as RouteKey[]).forEach(warm);
}
