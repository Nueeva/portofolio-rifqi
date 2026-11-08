# Self-hosted PostgreSQL migration receipt

## Current state

The frontend is publicly deployed at https://rifqi.apexsions.com and calls only the same-origin /api backend. The Supabase runtime SDK was removed. On 8 November 2026 the owner explicitly chose “Deploy sekarang; QA visual menyusul”. The former deployment and provider data are retained for rollback; no Supabase project or old account/history was deleted.

A dedicated PostgreSQL 17 container and Node 22 API are running on the portfolio VPS behind nginx. Other applications' MariaDB/PostgreSQL services were not modified. API is bound to host127.0.0.1:8788; database to127.0.0.1:5434. The API runs as a non-root container user with a separate non-superuser database role.

Public migration imported 4 curated project records plus 3 existing managed project records, 11 settings, 4 editorial studies, 3 skills groups and one public media object. Stable curated-* IDs and existing UUIDs are retained. Import scripts do not overwrite existing records on rerun. Old public data was backed up before conversion; storage links use same-origin API paths.

Private Supabase accounts, old login history and analytics were not copied because a privileged export was unavailable. They remain in the original Supabase project. This is not a claim of a complete historical/private-data transfer.

## Backend contract

- Cookie sessions are opaque, HttpOnly, SameSite=Lax, eight hours, with server-side expiry/revocation. Production cookies are Secure. Passwords use salted scrypt. Password changes revoke existing sessions and every outstanding password-reset link in the same transaction.
- Mutation requests require the configured Origin. Private reads/writes verify the admin role on the server. Public content resources are allowlisted. Query values/JSON field names are parameterized; writes are validated.
- Signup/email verification, reset tokens and password notifications use the owner's future SMTP configuration. Retrying signup can resend verification for an unverified account. Tokens are single-use and expire.
- SMTP is intentionally unconfigured per the owner's instruction. Mail-dependent requests return503 rather than reporting a fake delivery.
- CAPTCHA is optional until a new Turnstile site key and secret are supplied. The public widget accurately reports that CAPTCHA is disabled; server-side login/contact throttling remains active. Configuring both keys enables real verification.
- Uploads are limited to public project/certification images or resume PDFs. Paths, size, MIME and magic bytes are checked. Records map logical paths to random disk filenames; API responses use nosniff.
- Security notifications use authenticated SSE, including actual deleted rows for unblock/delete events. Streams recheck the session while connected.

## Operator access

Backend directory: /opt/rifqi-portfolio-backend on the VPS.

Compose project: rifqi_portfolio. The .env and .bootstrap-admin.env files there are root-only and excluded from source/build contexts. Initial admin login is admin@rifqi.apexsions.com. Its generated password is stored only in .bootstrap-admin.env; it is never printed in this chat or committed. Bootstrap refuses to create another admin once one exists.

Local server/.env is ignored and contains only local-development runtime configuration. Existing frontend .env was not changed. A private SSH forward connects local port15434 to the isolated PostgreSQL port5434. Local API runs on8788 and the Vite preview on8767 proxies /api to it.

## Backups and migration scripts

- server/schema.sql: standalone PostgreSQL schema, independent of Supabase functions/auth.
- server/import-data.mjs: imports public source records transactionally without overwriting current data.
- server/import-assets.mjs: copies public bucket references into owned upload storage.
- Original public export: /var/tmp/portfolio-migration-records/public-source-backup.json on the VPS, inside a root-only directory.
- Keep a fresh pg_dump and uploads backup before every production migration/cutover. Never delete the old provider until retained/private data requirements are resolved.
- Staging backup verified on 8 November 2026: /var/backups/rifqi-portfolio/20261108T150724Z. Includes a custom-format database dump, uploads archive, private configuration and SHA256 checksums. pg_restore listed the archive successfully; this is not a full restore drill.

## Configuration and release gates

SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM and CONTACT_TO can be configured later in the private server environment. Turnstile uses TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY. Recreate the API container after configuration changes. Do not put these values in frontend VITE variables.

TRUSTED_PROXY must match the controlled Docker gateway used by nginx. nginx must overwrite X-Forwarded-For with the visitor address rather than trust a client-supplied chain. /api should have no-store headers and SSE buffering disabled. Database/API ports remain loopback-only.

The nginx API snippet is applied to the portfolio virtual host. The host-local Cloudflare Tunnel connection is trusted only from loopback for CF-Connecting-IP; nginx overwrites X-Forwarded-For before forwarding to the controlled Docker gateway. API access logging is disabled in nginx to avoid recording reset tokens in query strings; the application logs sanitized paths. See [Cloudflare HTTP header documentation](https://developers.cloudflare.com/fundamentals/reference/http-headers/). Other virtual hosts were not changed.

Reproducible checks: npm run build, npx tsc --noEmit, node --test tests/*.test.mjs at the repository root; npm test and npm run test:integration inside server. The integration test requires server/.env pointing to the isolated PostgreSQL schema and creates/deletes only a unique temporary user; it sends no email. Whole-repository lint still reports four errors in inactive legacy Supabase edge functions and twelve pre-existing warnings.

Candidate verification on 8 November 2026: client/SSR/postbuild and TypeScript passed, 46 frontend checks passed, 10 backend tests passed and one PostgreSQL integration test passed. Real private API checks covered admin login, unauthenticated rejection, project CRUD, logout revocation, public file upload/read/delete, reset replay denial and forwarded visitor IP. Initial/Home bundle budgets passed. SSR caches are request-local with no server garbage-collection timer; prerender exits naturally after removal of the old forced-exit workaround. Browser appearance, motion smoothness and Core Web Vitals remain unverified.

Remaining verification: desktop/mobile themes, motion, keyboard/forms and admin workflows in a real browser. Both preview and live origins were rejected by saved Browser Use permissions; no browser/headless bypass was used. The owner authorized deployment before that visual check. Email delivery tests remain simulated until SMTP is configured and a real delivery check is explicitly requested.

## Production deployment receipt

- Frontend artifact: 1a1c1846f599b0e6bd0fd60d7e1dfba946db0fa1. Root: /var/www/rifqi-releases/1a1c1846f599b0e6bd0fd60d7e1dfba946db0fa1. release.json records the artifact hash and deferred visual QA.
- Full rollback backup: /var/backups/rifqi-portfolio/20261108T153558Z, containing nginx.conf, frontend.tar.gz, portfolio.dump, uploads.tar.gz, private runtime configuration and SHA256SUMS. Archive contents were checked; this is not a full database restore drill.
- nginx -t passed before reload. A failed first verification automatically restored the former configuration; the checker was corrected to send an explicit HTTP virtual-host header, then cutover and all checks passed.
- Eight prerendered pages and critical assets/PDF/icons/OG/manifest/registerSW/service-worker responses matched release-file hashes through the local nginx virtual host. HTML and the service worker return no-cache. Previous immutable chunks remain available to existing tabs.
- Through nginx, PostgreSQL public content, admin login/session/logout, anonymous/private denial and uploaded media passed. A controlled forwarding probe confirmed CF-Connecting-IP reached the API and a supplied X-Forwarded-For was overwritten; probe records were removed.
- SMTP and Turnstile remain unconfigured as requested. Contact delivery, email verification and email password recovery are unavailable until SMTP is added. Existing bootstrap admin password login works.

server/verify-release.mjs reproduces the origin-side HTTP integrity and API checks using RELEASE_ROOT plus the existing private ADMIN_EMAIL/ADMIN_PASSWORD. It prints no credentials or page content. These checks do not establish browser appearance, Cloudflare edge/browser-cache behavior, FPS or field Web Vitals.

Rollback: restore the backup nginx.conf to /etc/nginx/sites-enabled/rifqi-portfolio, run nginx -t, then reload nginx. That configuration points to the untouched former /var/www/rifqi-portfolio directory. Keep the new PostgreSQL/uploads and the old provider intact; do not delete data during rollback.
