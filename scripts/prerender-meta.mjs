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
    title: "Apexsions — A Full Minecraft Server System — Rifqi Ariansyah",
    description:
      "Case study: Apexsions, a full Minecraft server system by Rifqi Ariansyah — nine in-house Java plugins, an Azuriom community website joined by a custom two-way bridge, a security audit fixing 13 critical and 19 major findings, and a production deployment across two hosts.",
  },
  {
    path: "projects/curated-portfolio71",
    title: "Portfolio 71 — Student Portfolio Platform — Rifqi Ariansyah",
    description:
      "Case study: Portfolio 71, the SMKN 71 Jakarta student portfolio platform built by Rifqi Ariansyah — Laravel API + Nuxt frontend, AI-assisted teacher verification, public profiles with QR codes and share links, one-click CV PDF export, and production hardening.",
  },
  {
    path: "projects/curated-xssscope",
    title: "xssscope — Reflected XSS Scanner — Rifqi Ariansyah",
    description:
      "Case study: xssscope, a zero-dependency JavaScript reflected-XSS scanner by Rifqi Ariansyah that probes parameters, classifies reflection contexts, and verifies findings automatically.",
  },
  {
    path: "projects/curated-ctf-toolkit",
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
  html = swap(html, /(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`, "canonical");

  const outFile = join(distDir, route.path, "index.html");
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, html);
  console.log(`prerender-meta: wrote ${route.path}/index.html`);
}
console.log(`prerender-meta: ${ROUTES.length} route shells written`);
