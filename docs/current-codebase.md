# Current codebase — 15 November 2026

This guide describes the checked-in implementation. Earlier research and release receipts are historical evidence, not proof of the currently running production version. This revision changes source and documentation only; it does not publish the cloud environment, access the VPS, send email or deploy the site.

## Runtime and data contracts

React/Vite calls the same-origin Fastify API, which uses PostgreSQL. Supabase-named frontend exports are compatibility bridges; the runtime does not require a hosted Supabase project. API table contracts are owned in `src/integrations/api/types.ts`. Historical generated Supabase types remain available for archive consumers and are not the active client contract.

Projects, certifications, site settings, editorial studies and skill groups are public content. Activity logs, analytics records, IP logs and blocked IP management require admin authorization. Content uses `content_records(resource,id,data jsonb)`; users, sessions, auth tokens, challenges and uploads have dedicated tables. There is no database-enforced JSON schema: `server/records.mjs` validates API writes. Direct SQL/import operations must preserve the same contracts.

Required strings/lists cannot be replaced with null. Editorial writes require all study fields, even when their values are empty. Updates validate the merged record inside a transaction with row locks, so malformed final records roll back. Existing incomplete editorial rows normalize missing strings/lists for presentation. Stable identity fields cannot be changed through update.

New login logs store `action`, `identifier` and boolean `success`, matching the dashboard. Legacy `event_type`/`email` rows normalize on reads. Unknown results remain null and are not counted as failed attempts. A correct password on an unverified account does not count as a successful login.

## Authentication, email and uploads

Sessions are opaque random tokens; only hashes are persisted. Cookies are HttpOnly, SameSite=Lax, scoped to `/api`, and Secure for HTTPS origins. Passwords use salted scrypt. Mutations require the exact configured Origin; admin checks run on the server. Password changes transactionally revoke all sessions and outstanding reset links. Verification and reset mail depend on real SMTP configuration.

`DATABASE_URL`, `COOKIE_SECRET`, `PUBLIC_ORIGIN` and `UPLOAD_DIR` are required. `HOST`, `PORT`, `NODE_ENV`, `TRUSTED_PROXY`, SMTP settings and both Turnstile keys configure optional/runtime behavior. Never expose secrets in `VITE_*` variables, Markdown or Git. SMTP remains optional; missing delivery capability returns 503. CAPTCHA is enabled only with both keys. Actual production capability must be checked at runtime, not inferred from old receipts.

Uploads allow PNG/JPEG/WebP images and PDF resumes, with size, path, MIME and signature checks. Files use random disk names and logical database paths. Back up both the database and uploads; a database-only backup is insufficient.

## Analytics

The admin dashboard uses `POST /api/analytics/summary`, protected by server-side admin authorization. PostgreSQL aggregates all matching visits instead of downloading 1,000 records and treating that sample as a total. Valid periods are 7/30/90 days or all, with an optional exact page filter. Day grouping uses Asia/Jakarta; the chart shows the most recent 14 populated days in chronological order. All-time daily average uses the observed calendar span; fixed-period averages include days without visits. Anonymous/missing visitor IDs are excluded from unique counts. Collection can be blocked by browsers or forged by clients, so these statistics are not an independent traffic audit.

## Static rendering and CMS publication

`npm run build` produces client assets and the build-only SSR module, then captures optional CMS content, generates OG cards, writes metadata, prerenders bodies and finalizes the service worker. The SSR module is not a production request server.

Set `PUBLIC_CONTENT_API_URL` to an already running API origin to enable a CMS-aware build. `GET /api/public-content` returns one snapshot containing only public resources. Project route IDs must be safe path segments. Metadata and embedded JSON are escaped. The same snapshot seeds SSR and browser query caches to avoid a content mismatch during hydration. Browser snapshot entries are marked stale so the API revalidates them after mount. No configured snapshot failure is silently ignored.

Without that variable, the build intentionally uses the curated static fallback. A successful empty API catalog remains empty. New/renamed/deleted CMS projects are reflected in a new CMS build; publishing content does not itself rebuild static HTML. Rebuild and deploy after content changes to refresh crawlers, link previews and offline HTML. After initial snapshot revalidation, browser queries use a 60-second freshness interval and refetch on remount or explicit invalidation; project content is not polled. Site settings and certifications are part of the snapshot too.

The first four public routes are always emitted; project routes are derived from the selected catalog. PWA revisions are calculated after final HTML, including the snapshot. Generated OG SVG/PNG cards are generic assets; route titles and descriptions follow actual catalog content. The current build does not automatically produce a fresh social image for each new project.

## Development in the managed cloud

Use the existing isolated `/workspace/portofolio-rifqi` checkout. Do not create a worktree unless requested. Retained local helper scripts/configuration may live in `/workspace/.portfolio-cloud`; these are environment artifacts, not repository prerequisites on other machines.

`bash /workspace/.portfolio-cloud/start-db.sh` starts the dedicated PostgreSQL 17 container and applies the idempotent schema through stdin. This avoids unreadable bind-mounted init files when the checkout has private file permissions. It creates the application role only when absent. Database data is bound under `/workspace/.portfolio-cloud/pgdata`. Do not delete this directory or regenerate credentials to repair connectivity.

The retained `start.sh` starts API port 8788 and Vite port 8080. After changing backend source, restart only the API process you started; a healthy existing process does not automatically load edits. Direct startup from `server/` is `node --env-file=/workspace/.portfolio-cloud/api.env index.mjs`. Repository `npm start` instead reads `server/.env`. Logs and credentials must not be dumped together; inspect errors without exposing secret values.

Verify through local requests to `/api/health`, public content reads and rejected anonymous mutations. A PID or open port is not readiness evidence. New-machine restoration, process restart, production health and publishing are distinct checks.

## Design and motion

Public routes use the Celah shell and scoped portals; exact `/admin` and `/auth` use legacy presentation. MotionPolicy reacts to reduced-motion changes. Optional optical WebGL and cursor enhancements retain readable HTML/SVG fallbacks. HomeMotion provides landing-specific studies; case studies retain their process figures.

Public ink timing comes from `src/lib/inkRaster.ts`: 780 ms, 390 ms midpoint, 64 frames, 480 px maximum mask tile edge. Preparation uses a worker when supported, with bounded atlas dimensions and a decoded cache. Native View Transition update callbacks are synchronous; never await requestAnimationFrame inside them. Unsupported native transitions use inert page-copy layers. Reduced motion uses a short opacity crossfade (approximately 150 ms), without atlas preparation. Scroll does not cancel the ink transition. Legacy ThemeToggle remains separate. No universal zero-latency or 120 Hz guarantee follows from these constants.

## Validation and remaining limits

Use README commands for build, explicit application/config TypeScript projects, frontend tests, backend tests, database integration and full CMS build integration. Run the frontend suite against a default offline build because its release assertions intentionally cover the curated baseline. The fixture CMS build integration restores that baseline afterward.

Browser appearance, keyboard interaction, worker fallbacks, real email delivery, physical-device performance, live nginx/Cloudflare behavior and deployment require their own evidence. Prior browser reports include recoverable hydration warnings; seeding CMS snapshots addresses content consistency, but is not proof that every historical browser warning is fixed. React/ESLint warnings in legacy UI remain separate from lint errors. Research suggestions and old rollback commands are not current operating instructions or authorization.

### Local verification of this working tree

- Client/SSR/postbuild production build passed, including the default curated baseline.
- Explicit `tsconfig.app.json` and `tsconfig.node.json` checks passed.
- Frontend regression suite: 57 passed, including hydration cache revalidation and request-local cache isolation.
- Backend unit/contract suite: 15 passed.
- PostgreSQL integration suite: 3 passed, including 1,205 recent analytics records, period/page filtering, merged-record validation and rollback, authenticated summaries, public snapshot reads, and password-reset/session revocation.
- Full CMS build integration: 1 passed against a local HTTP fixture, covering a new project route, removal of curated routes, escaped metadata, embedded hydration data and final service-worker inclusion; the default build was restored afterward.
- Repository ESLint: no errors; 12 existing warnings remain in legacy hooks/UI exports.
- All 15 pre-existing tracked Markdown files were updated; this maintained guide was added. Local Markdown file links were checked.

These are local results for this source correction, not a production deployment receipt. Browser regression and real SMTP delivery were not run.
