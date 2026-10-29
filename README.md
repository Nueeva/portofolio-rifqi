# Portofolio — Rifqi Ariansyah

Personal portfolio of **Rifqi Ariansyah**, a cybersecurity-focused developer based in Jakarta, Indonesia. It showcases security research, open-source tooling, and production projects — including the Apexsions plugin ecosystem and Portfolio 71, the student portfolio platform of SMKN 71 Jakarta.

**Live:** https://rifqi.apexsions.com

## Highlights

- **Motion-driven UI** — built with [Motion](https://motion.dev) (`motion/react`): staggered hero entrance with precise Bézier easing, `whileInView` scroll reveals, spring micro-interactions, an animated scroll-progress bar, and layout-animated project filtering with `AnimatePresence`.
- **Real content, database-backed** — projects, site settings, and certifications are served from Supabase and can be managed from the built-in admin panel; a curated list of real projects ships in code as the always-available base layer.
- **Contact form** with validation and Cloudflare Turnstile protection.
- **PWA** — installable, with offline precaching.
- Dark, terminal-inspired design (Space Grotesk display headings, Inter body, JetBrains Mono code — all self-hosted), fully responsive.

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui (Radix)
- Motion (formerly Framer Motion) for animation
- Supabase (database, auth, storage) + TanStack Query
- React Router, next-themes, Recharts (admin analytics)

## Run Locally

```bash
npm install
cp .env.example .env   # fill in your Supabase + Turnstile keys
npm run dev
```

Required environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_TURNSTILE_SITE_KEY`.

## Scripts

| Command         | Description                     |
| --------------- | ------------------------------- |
| `npm run dev`   | Start the dev server            |
| `npm run build` | Production build into `dist/`  |
| `npm run postbuild` | Prerender route shells + bodies into `dist/` (runs automatically after `build`) |
| `npm run preview` | Preview the production build  |
| `npm run lint`  | Run ESLint                      |

## Structure

```
src/
  pages/        Index, About, Projects, Contact, Auth, Admin, error pages
  components/   layout (Navbar/Footer/Layout), ScrollReveal, admin panels, ui (shadcn)
  data/         curated real projects (base layer for the Projects page)
  hooks/        auth, site settings, analytics, scroll reveal
  integrations/ Supabase client + generated types
supabase/       config, migrations, edge functions
```

## Deployment

The production build (`dist/`) is served as a static site behind nginx on a VPS, exposed through a Cloudflare Tunnel at `rifqi.apexsions.com`. The build's `postbuild` step prerenders route shells and bodies into `dist/`, so served HTML already contains page content; SPA fallback (`try_files … /index.html`) is still required for client-side routing.
