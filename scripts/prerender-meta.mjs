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
 {path:"about",title:"Tentang — Rifqi Ariansyah",description:"Tentang Rifqi Ariansyah, Cybersecurity Engineer. Keahlian, pengalaman, perjalanan keluarga, dan CV."},
 {path:"projects",title:"Karya — Rifqi Ariansyah",description:"Security tooling, aplikasi web, dan operasi sistem: xssscope, Apexsions, Portfolio 71, dan CTF-Toolkit."},
 {path:"contact",title:"Kontak — Rifqi Ariansyah",description:"Hubungi Rifqi Ariansyah, Cybersecurity Engineer, untuk pekerjaan keamanan aplikasi dan kolaborasi engineering."},
 {path:"projects/curated-apexsions",image:"og/og-apexsions.png",title:"Apexsions — Rifqi Ariansyah",description:"Studi kasus Apexsions: sembilan plugin Paper, bridge Azuriom, dua host, serta perbaikan 13 temuan critical dan 19 major."},
 {path:"projects/curated-portfolio71",image:"og/og-portfolio71.png",title:"Portfolio 71 — Rifqi Ariansyah",description:"Studi kasus Portfolio 71: Laravel, Nuxt, batas akses siswa, guru, dan admin, serta workflow verifikasi karya."},
 {path:"projects/curated-xssscope",image:"og/og-xssscope.png",title:"xssscope — Rifqi Ariansyah",description:"Studi kasus xssscope: scanner reflected XSS JavaScript tanpa dependency, analisis konteks refleksi, dan verifikasi kandidat temuan."},
 {path:"projects/curated-ctf-toolkit",image:"og/og-ctf-toolkit.png",title:"CTF-Toolkit — Rifqi Ariansyah",description:"Studi kasus CTF-Toolkit: helper Python untuk persiapan kategori Web, Crypto, Forensics, dan Reversing."}
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
