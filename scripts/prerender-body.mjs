/**
 * Prerender the BODY of the public routes at build time.
 *
 * Runs after scripts/prerender-meta.mjs (which writes the per-route HTML
 * shells with route-specific head metadata). For each public route this
 * renders the actual React app on the server (dist-server/entry-server.js,
 * built from src/entry-server.tsx) and injects the resulting markup into
 * the shell's #root, stamping data-ssr-path so main.tsx knows the markup
 * is safe to hydrate for that path.
 *
 * Why: meta-only shells leave the case-study text invisible to crawlers
 * and AI answer engines that do not execute JavaScript. With the body in
 * the initial HTML, the facts (and their numbers) are readable by
 * anything that can fetch a page.
 *
 * Only curated/static-first content is expected in the prerender: effects
 * never run on the server, so Supabase-driven sections render their
 * initial state and fill in on the client exactly as before.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { render } from "../dist-server/entry-server.js";

const distDir = join(process.cwd(), "dist");

const ROUTES = [
  { path: "/", file: "index.html" },
  { path: "/about", file: "about/index.html" },
  { path: "/projects", file: "projects/index.html" },
  { path: "/contact", file: "contact/index.html" },
  { path: "/projects/curated-apexsions", file: "projects/curated-apexsions/index.html" },
  { path: "/projects/curated-portfolio71", file: "projects/curated-portfolio71/index.html" },
  { path: "/projects/curated-xssscope", file: "projects/curated-xssscope/index.html" },
  { path: "/projects/curated-ctf-toolkit", file: "projects/curated-ctf-toolkit/index.html" },
];

const ROOT_MARKER = '<div id="root"></div>';

for (const route of ROUTES) {
  const filePath = join(distDir, route.file);
  const shell = readFileSync(filePath, "utf8");
  if (!shell.includes(ROOT_MARKER)) {
    throw new Error(`prerender-body: ${route.file} has no empty #root marker (already prerendered?)`);
  }
  const body = await render(route.path);
  if (!body || body.length < 200) {
    throw new Error(`prerender-body: suspiciously small render for ${route.path} (${body?.length ?? 0} bytes)`);
  }
  const stamped = `<div id="root" data-ssr-path="${route.path}">${body}</div>`;
  writeFileSync(filePath, shell.replace(ROOT_MARKER, stamped));
  console.log(`prerender-body: ${route.path} -> ${route.file} (+${body.length} bytes of body)`);
}
console.log(`prerender-body: ${ROUTES.length} route bodies prerendered`);
// The rendered tree creates the Supabase client at module scope; in Node
// its auth auto-refresh timer holds the event loop open forever, so this
// build script exits explicitly instead of hanging the build.
process.exit(0);
