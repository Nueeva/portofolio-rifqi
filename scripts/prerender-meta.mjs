/**
 * Prerender-lite for SEO/GEO: after `vite build`, emit one static HTML
 * shell per public route (dist/<route>/index.html) that carries that
 * route's own <title>, description, Open Graph/Twitter tags and canonical
 * URL. The body is still the same client-rendered app — the shell exists
 * so crawlers and AI answer engines that do not execute JavaScript still
 * get correct per-page metadata, and link shares preview the right page.
 *
 * nginx serves these via `try_files $uri $uri/ /index.html`: a request to
 * /about finds dist/about/index.html before the SPA fallback.
 *
 * Facts below mirror src/data/projects.ts — keep them in sync when the
 * curated projects change.
 *
 * Per-project og:image: text cards (project name + the caseStudy role
 * from src/data/projects.ts, nothing else). A live-site screenshot was
 * the first choice, but the build VM cannot fetch external sites
 * headless (ERR_TUNNEL_CONNECTION_FAILED, same egress limit as earlier
 * cycles), so the text-card fallback from the backlog is what ships.
 * Sources are SVG in scripts/og-cards/; scripts/generate-og-cards.mjs
 * (first postbuild step, via sharp) renders them to dist/og/*.png —
 * the PNGs themselves are build artifacts, not committed files, because
 * the GitHub snapshot connector accepts UTF-8 text only. The curated
 * `image_url` fields stay null on purpose: filling them would swap the
 * Projects grid covers (h-48 object-cover crop) to these 1200x630
 * cards, which is a different UI change.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const SITE = "https://rifqi.apexsions.com";
const distDir = join(process.cwd(), "dist");
const baseHtml = readFileSync(join(distDir, "index.html"), "utf8");

const ROUTES = [
  {
    path: "about",
    title: "About — Rifqi Ariansyah",
    description:
      "About Rifqi Ariansyah — cybersecurity developer, founder and lead developer of Apexsions, builder of Portfolio 71 for SMKN 71 Jakarta, and author of the xssscope scanner and CTF-Toolkit. Background, skills, and experience.",
  },
  {
    path: "projects",
    title: "Projects — Rifqi Ariansyah",
    description:
      "Selected projects by Rifqi Ariansyah: the Apexsions Minecraft server system, Portfolio 71 for SMKN 71 Jakarta, the xssscope reflected-XSS scanner, and CTF-Toolkit — each with a full case study.",
  },
  {
    path: "contact",
    title: "Contact — Rifqi Ariansyah",
    description:
      "Contact Rifqi Ariansyah, cybersecurity developer — about security work, collaborations, or his projects: Apexsions, Portfolio 71, xssscope, and CTF-Toolkit.",
  },
  {
    path: "projects/curated-apexsions",
    image: "og/og-apexsions.png",
    title: "Apexsions — A Full Minecraft Server System — Rifqi Ariansyah",
    description:
      "Case study: Apexsions, a full Minecraft server system by Rifqi Ariansyah — nine in-house Java plugins, an Azuriom community website joined by a custom two-way bridge, a security audit fixing 13 critical and 19 major findings, and a production deployment across two hosts.",
  },
  {
    path: "projects/curated-portfolio71",
    image: "og/og-portfolio71.png",
    title: "Portfolio 71 — Student Portfolio Platform — Rifqi Ariansyah",
    description:
      "Case study: Portfolio 71, the SMKN 71 Jakarta student portfolio platform built by Rifqi Ariansyah — Laravel API + Nuxt frontend, AI-assisted teacher verification, public profiles with QR codes and share links, one-click CV PDF export, and production hardening.",
  },
  {
    path: "projects/curated-xssscope",
    image: "og/og-xssscope.png",
    title: "xssscope — Reflected XSS Scanner — Rifqi Ariansyah",
    description:
      "Case study: xssscope, a zero-dependency JavaScript reflected-XSS scanner by Rifqi Ariansyah that probes parameters, classifies reflection contexts, and verifies findings automatically.",
  },
  {
    path: "projects/curated-ctf-toolkit",
    image: "og/og-ctf-toolkit.png",
    title: "CTF-Toolkit — Rifqi Ariansyah",
    description:
      "Case study: CTF-Toolkit, a personal Python toolkit by Rifqi Ariansyah bundling the recurring helpers for common CTF categories — web, crypto, forensics, reversing — so the workflow is ready before a competition starts.",
  },
];

function swap(html, pattern, replacement, label) {
  if (!pattern.test(html)) {
    throw new Error(`prerender-meta: pattern for ${label} not found in dist/index.html`);
  }
  return html.replace(pattern, replacement);
}

for (const route of ROUTES) {
  const url = `${SITE}/${route.path}`;
  let html = baseHtml;
  html = swap(html, /<title>[\s\S]*?<\/title>/, `<title>${route.title}</title>`, "title");
  html = swap(html, /(<meta name="description" content=")[^"]*(")/, `$1${route.description}$2`, "description");
  html = swap(html, /(<meta property="og:title" content=")[^"]*(")/, `$1${route.title}$2`, "og:title");
  html = swap(html, /(<meta property="og:description" content=")[^"]*(")/, `$1${route.description}$2`, "og:description");
  html = swap(html, /(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`, "og:url");
  html = swap(html, /(<meta name="twitter:title" content=")[^"]*(")/, `$1${route.title}$2`, "twitter:title");
  html = swap(html, /(<meta name="twitter:description" content=")[^"]*(")/, `$1${route.description}$2`, "twitter:description");
  if (route.image) {
    const imageUrl = `${SITE}/${route.image}`;
    html = swap(html, /(<meta property="og:image" content=")[^"]*(")/, `$1${imageUrl}$2`, "og:image");
    html = swap(html, /(<meta name="twitter:image" content=")[^"]*(")/, `$1${imageUrl}$2`, "twitter:image");
  }
  html = swap(html, /(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`, "canonical");

  const outFile = join(distDir, route.path, "index.html");
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, html);
  console.log(`prerender-meta: wrote ${route.path}/index.html`);
}
console.log(`prerender-meta: ${ROUTES.length} route shells written`);
