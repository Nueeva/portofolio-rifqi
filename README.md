# Portofolio — Rifqi Ariansyah

Personal portfolio and content administration application for Rifqi Ariansyah, presented publicly as a Cybersecurity Engineer. Public pages use the Indonesian **Celah** design. `/admin` and `/auth` use a dedicated Celah console with scoped themes and native form interactions.

Production domain: https://rifqi.apexsions.my.id. This repository does not establish which commit is currently deployed; earlier deployment receipts in `docs/` are historical records.

## Current architecture

- React 18, TypeScript, Vite 5, React Router and TanStack Query.
- Tailwind CSS, shadcn/Radix, Motion, Lenis and optional Three.js optical rendering.
- Node.js >=22, Fastify 5 and PostgreSQL 17 for content, authentication, uploads and analytics.
- Same-origin `/api` requests; Vite dev/preview proxy to `127.0.0.1:8788`.
- Build-time React prerender, hydration and a Workbox service worker generated after final HTML.

The `supabase` export in the frontend is a compatibility alias for the owned API. No Supabase SDK, hosted project or `VITE_SUPABASE_*` keys are required. `supabase/` preserves historical migrations/functions; do not deploy those as part of this workflow. Current API types live in `src/integrations/api/types.ts`.

## Development

Prerequisites: Node >=22, npm and an isolated PostgreSQL database. PostgreSQL 17 is the version used by `server/compose.yaml`. Use an application role with table DML permissions, separate from the schema owner. Do not connect development or tests to production data.

```bash
npm ci
npm --prefix server ci
cp server/.env.example server/.env
```

Edit ignored `server/.env` locally:

| Variable | Local development value / requirement |
| --- | --- |
| `DATABASE_URL` | URL for your isolated database and application role |
| `COOKIE_SECRET` | Locally generated cryptographically random secret, at least 32 characters |
| `PUBLIC_ORIGIN` | `http://localhost:8080` (must match the browser origin exactly) |
| `UPLOAD_DIR` | Writable persistent directory; `./uploads` when running from `server/` |
| `HOST`, `PORT` | `127.0.0.1`, `8788` |
| `NODE_ENV` | `development` |

Apply `server/schema.sql` using the schema owner. For a new database named `portfolio`, `server/init-role.sh` creates the `portfolio_app` role and grants DML permissions; it expects `POSTGRES_USER`, `POSTGRES_DB` and `APP_DB_PASSWORD`. Run that initialization once; it is not an idempotent role creation script. `server/compose.yaml` automates this for a fresh PostgreSQL volume after secure values are supplied through its env file. The full Compose API configuration targets production HTTPS; it is not the default local frontend workflow. See [the current codebase guide](docs/current-codebase.md) for cloud-specific startup and database initialization.

Start each service in its documented working directory:

```bash
# Terminal 1
cd server
npm start
```

```bash
# Terminal 2, repository root
npm run dev -- --host 127.0.0.1 --port 8080 --strictPort
```

Check `curl -fsS http://localhost:8080/api/health`. A successful response checks both the API and PostgreSQL. An empty database intentionally shows an empty managed catalog after loading; curated records are an offline fallback, not an automatic seed. Import approved public records with `node --env-file=.env import-data.mjs /path/to/public-content.json` from `server/`; existing records are preserved.

Create a local admin only when needed using `server/bootstrap-admin.mjs` from `server/`: `node --env-file=.env bootstrap-admin.mjs`. It requires `ADMIN_EMAIL` and `ADMIN_PASSWORD` (16+ characters) in the process environment and refuses to create another admin once one exists. Supply those through secure local configuration. Never commit or print generated credentials. SMTP is optional: without it, contact delivery, signup verification and email reset requests return 503. Existing verified accounts can still log in. Turnstile requires both server keys; otherwise the widget accurately reports CAPTCHA disabled and server throttling remains active.

## Build and content publication

```bash
# Offline build: curated fallback data
npm run build

# CMS-aware build: API must already be running
PUBLIC_CONTENT_API_URL=http://127.0.0.1:8788 npm run build
```

The CMS build reads the public `GET /api/public-content` snapshot once. Route metadata, project route enumeration, HTML bodies and initial React query data use that same snapshot. Added projects get prerendered routes, renamed projects get updated metadata, and deleted projects are omitted. Only public resources are embedded, and embedded JSON and metadata are escaped. A configured snapshot request that fails stops the build; it never silently publishes fallback data. API URL credentials are not supported.

**CMS saves update persisted API content; static HTML/SEO changes require rebuilding and deploying a CMS-aware artifact.** The browser hydrates from the embedded snapshot, then revalidates it against the API. Subsequent cached queries use a 60-second freshness interval and refresh on remount or explicit invalidation; there is no project-content polling. There is no automatic deployment webhook or runtime SSR server. An offline build deliberately uses curated fallback content, so use the CMS build for production when the API is authoritative. Generated OG cards remain generic build assets; per-route text metadata comes from the snapshot. Static files remain a point-in-time snapshot after publication.

Build output: `dist/`; SSR build helper: `dist-server/`. `npm run build` includes postbuild automatically. Serve production with SPA fallback and `/api` forwarding; preserve no-cache behavior for HTML/service worker and immutable behavior for hashed assets. `server/nginx-api.conf.example` is an API snippet, not a complete site configuration. `npm run preview` also proxies the API; if testing mutations through a different port, align `PUBLIC_ORIGIN` with that origin.

## Verification

```bash
npm run build
./node_modules/.bin/tsc -p tsconfig.app.json --noEmit
./node_modules/.bin/tsc -p tsconfig.node.json --noEmit
node --test tests/*.test.mjs
npm run lint
npm --prefix server test
# Requires server/.env pointing only to an isolated PostgreSQL database
npm --prefix server run test:integration
# Full fixture CMS build; restores the default offline build afterward
node --test tests/prerender-build.integration.mjs
```

In the managed cloud workspace, API configuration may instead be retained outside Git at `/workspace/.portfolio-cloud/api.env`. In that case run `node --env-file=/workspace/.portfolio-cloud/api.env --test tests/*.integration.mjs` from `server/`. Set `XDG_CACHE_HOME=/workspace/.cache` for build commands if Fontconfig cannot write its default cache.

Browser theme regression checks are separate: `tests/ink-theme.browser.cjs` requires an externally installed Playwright, browser executable and production preview. Configure `PLAYWRIGHT_MODULE`, `CHROME_PATH` and `INK_BASE_URL` as needed. Build/unit tests do not establish browser appearance, accessibility compliance, real-device FPS or live deployment health.

## Source and documentation

- `src/pages`, `src/components/public`: public pages, design, motion and optional enhancements.
- `src/components/admin`, `src/pages/Admin.tsx`: project/content/settings/security administration.
- `src/integrations/api`: owned API client and contracts; legacy imports bridge to this client.
- `server`: Fastify API, schema, local scripts, security and tests.
- `scripts`: public content capture, prerender, OG cards and final PWA generation.
- [Production deployment](docs/DEPLOYMENT.md), [current codebase and operations](docs/current-codebase.md), [design specification](DESIGN.md), [editorial workflow](docs/celah-editorial-release.md).

Older proposals, research, measurements and release receipts are labeled with their scope. They document past observations and do not authorize server access, deployment or rollback.


## Auth and admin workspace

Public, auth and admin headers use the same `hero_name` setting (default: Rifqi Ariansyah). Their theme controls share `InkThemeSwitch` and the ink transition engine; light/dark/system preferences persist across routes. Reduced-motion users receive a direct theme change, and browsers without View Transitions use inert theme layers.

The current console uses grouped, URL-backed navigation at `/admin?section=projects`, with `edit=<id>` or `edit=new` for the project workspace. Auth modes remain compatible with `/auth`, `/auth?mode=forgot`, `/auth?mode=register` and existing reset links. Registrations still require verification and do not grant admin rights.

Projects and studies save through the authorized `POST /api/projects/save` transaction. Deploy frontend and backend together; the new editor requires that endpoint. The change requires no schema migration. Existing CRUD, storage, session, Origin and role checks remain authoritative.

For local UI regression checks, start Vite or a production preview, then run `node tests/console.browser.cjs`. Override `CONSOLE_BASE_URL`, `PLAYWRIGHT_MODULE`, `CHROME_PATH` and `CONSOLE_SCREENSHOTS` when needed. The runner accepts only a local target and mocks API requests; it never uses a production admin account. See [the implementation receipt](docs/AUTH_ADMIN_REDESIGN_IMPLEMENTATION.md) for scope, screenshots, checks and limitations.
