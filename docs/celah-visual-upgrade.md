# Celah visual upgrade — implementation receipt

Status: implemented in source; browser QA and deployment pending. The public VPS remains on release 015e427.

## Implemented

- Persistent public shell, shared settings query (60-second stale time), async legacy layout, deferred RIVA and optical renderer.
- Content-only page transitions, visible loading/error recovery, focus handling and history-position restoration after destination content mounts.
- Cyan/periwinkle/copper tokens for both themes; semantic project figures with native controls and finite replay, editorial project index with desktop preview and per-entry mobile figures.
- Hero keeps HTML text/CTA and an SVG poster. Optional Three.js optical layer uses a half-resolution target plus an optical pass, bounded DPR, visibility pause, reduced-motion eligibility, resource cleanup and context-loss fallback.
- Client/SSR/OG/prerender complete before service-worker generation; final HTML revisions and critical-graph cache coverage are checked by release tests. Optional engines and legacy chunks are runtime-cached.
- Canonical project data, CMS pass-through, form endpoint/payload, admin/auth source, Supabase integrations, environment and VPS configuration remain unchanged.

## Verification

- Production build, TypeScript, production SSR and contract/release tests are run locally.
- Initial JS baseline: 247.9 kB gzip. Current entry graph approximately 168 kB gzip; exact budgets are enforced by release tests (initial 200 kB; Home with optical/interaction features 450 kB).
- Frontend lint errors repaired. Full-repo baseline remains four Supabase explicit-any errors and legacy warnings.
- Static reviewer found a hidden-canvas CSS override; fallback now sets inline display:none.

## Required browser evidence before deployment

Preview http://127.0.0.1:8767 was denied by the saved Browser Use permission on this run. No alternate browser surface, headless capture, CDP or other bypass was used. No visual, FPS, Core Web Vitals or WCAG certification is claimed.

Pending: desktop/mobile screenshots in both themes; responsive fit at 360/390/768/1024/1440, short screens, 200% zoom and long CMS text; focus/menu/RIVA/form/Turnstile states using mocked delivery; query dedup and failures; Back/Forward; reduced-motion changes, Save-Data and context loss; two-release service-worker update/offline behavior; performance traces and real contrast checks. Deploy only after those checks, with a VPS backup and one complete package.
