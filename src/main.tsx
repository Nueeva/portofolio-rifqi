import type { PublicContent } from "./integrations/api/types";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
const container = document.getElementById("root")!;
// Public routes ship a build-time prerendered body (see
// scripts/prerender-body.mjs). The shell stamps data-ssr-path on #root;
// hydrate only when the prerendered markup is for THIS path, otherwise
// start clean — a direct load of a non-prerendered route (e.g. /admin)
// is served the home shell by the SPA fallback and must not hydrate
// against another page's markup.
const snapshot = document.getElementById("public-content");
const publicContent: PublicContent | undefined = snapshot?.textContent ? JSON.parse(snapshot.textContent) : undefined;
const ssrPath = container.getAttribute("data-ssr-path");
if (ssrPath && ssrPath.replace(/\/$/, "") === window.location.pathname.replace(/\/$/, "") && container.hasChildNodes()) {
    hydrateRoot(container, <App publicContent={publicContent} />);
}
else {
    if (container.hasChildNodes())
        container.innerHTML = "";
    createRoot(container).render(<App publicContent={publicContent} />);
}
