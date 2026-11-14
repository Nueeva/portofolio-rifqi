# Animation performance pass — 2026-11-08

Implemented background render-target caching, one-frame invalidation, hidden/offscreen cancellation, theme-only completion events, pointer read batching, and Lenis scheduler suspension while hidden. DPR ceiling, shaders, visual composition, mobile eligibility and Lenis tuning remain unchanged.

## Validation

- Production build and TypeScript check passed.
- `node --test tests/*.test.mjs`: 48 passed, including renderer lifecycle tests using mocked browser/Three resources.
- Full lint: four existing no-explicit-any errors in Supabase email functions; 12 warnings elsewhere. No findings in the changed animation components.
- Chrome headless, production preview, desktop 1440×900 and mobile emulation 390×844, DPR 1, service workers blocked. Three fresh contexts per viewport; 2-second settle, then 4-second scripted down/up scroll. This measures browser frame cadence, not GPU execution or touch/Lenis input latency.

| Viewport | Before p95, ms (three runs) | After p95, ms (three runs) | After frames ≤20 ms |
| --- | --- | --- | --- |
| Desktop | 17.0 / 16.9 / 17.0 | 17.1 / 16.9 / 16.9 | 98.3–100% |
| Mobile emulation | 16.8 / 17.0 / 17.0 | 16.9 / 16.8 / 16.8 | 99.6–100% |

Frame cadence was already near 60 Hz; these measurements do not establish a perceptible speedup. One baseline mobile run recorded an 84 ms long task; one after desktop run recorded 67 ms. Neither has been attributed to animation by a trace, so the no-animation-long-task criterion remains unverified. Browser runs overlapped other local checks; small timing differences are noise.

The deterministic renderer tests establish the work reduction: initial render uses two passes; subsequent progress changes use one optical pass, no background pass, and no trailing idle frames. Multiple changes before a frame coalesce. Theme/resize refresh the background, hidden/offscreen work cancels and resumes, and context loss prevents further frames.

Desktop/mobile screenshots inspected. Additional smoke checks exercised mouse motion, both theme states, wheel scrolling at 4× CPU throttling, public routes and reduced motion (no optical canvas). Public route smoke checks also emitted three recoverable React #421 hydration errors. They are unresolved; their origin was not isolated to baseline versus changed code. No real-device performance claim or deployment is made. Layout/paint/GPU trace attribution, physical-device checks, and hydration diagnosis remain follow-up verification.

## Deployment receipt

Published at 23:37 WIB on 8 November 2026. Active root: `/var/www/rifqi-releases/motion-20261108T163710Z`. Backup: `/var/backups/rifqi-portfolio/motion-20261108T163710Z` (nginx configuration, previous frontend, database dump with readable archive listing, uploads). Previous immutable assets retained in the new release for existing tabs.

Archive SHA256: `01c959e908852e25286a0702877b1b6a51c36b4e179eff811c8202c3f752100d`. nginx configuration test/reload passed; eight prerendered routes and critical assets matched origin file hashes, service worker/no-cache and public API/private denial checks passed. Public HTTPS release.json identified the new release, homepage referenced its new entry bundle, service worker bytes matched after edge revalidation, and API health returned 200. Backend containers/configuration were not changed.

Rollback: restore the backup nginx.conf to `/etc/nginx/sites-enabled/rifqi-portfolio`, run `nginx -t`, then `systemctl reload nginx`.

## Authored motion revision — 11 November 2026

Hero entrance now advances 42% of the opening, leaving 58% for scrolling; opposing title registration and separating polished edges reinforce the seam concept. Process diagrams demonstrate context inspection, host-to-host flow, five-stage workflow and selected toolkit category. Demonstrations run once on visibility, selection or replay, with no perpetual loops; reduced motion omits them. Existing render cache and Lenis tuning retained.

Production build, TypeScript, changed-component lint and all 48 tests passed. Chrome desktop/mobile screenshots inspected; replay progression checked through computed styles, reduced motion removed demonstrations, and neither viewport overflowed. Three local cadence runs per viewport recorded p95 16.8–17.0 ms desktop and 16.8–16.9 ms mobile emulation, with no long tasks in the measured four-second scripted scroll windows. These results are not a physical-device guarantee or a measurement of the initial opening.

Published release `/var/www/rifqi-releases/motion-20261111T024940Z`; rollback backup `/var/backups/rifqi-portfolio/motion-20261111T024940Z`. Archive SHA256 `27f3b2b579e263d8867f99906ebeed6eca41af0dfed15ff6979733d0bb1e6530`. nginx validation, eight route/asset hashes, current service worker, public API health and private-read denial passed at origin.

## Landing mechanisms — 11 November 2026

Hero preserved. Landing-only HomeMotion replaces the repeated process panels with four kinetic studies: context lens/calipers for xssscope, a nine-module host assembly with bidirectional bridge/fallback paths for Apexsions, layered role sheets and a five-stop workflow for Portfolio 71, and an indexed instrument dial for CTF-Toolkit. The personal section morphs a circuit line into a house. Scroll controls assembly/rotation; native selection and replay controls drive bounded 1.8-second demonstrations. Existing CMS images and unknown project artwork retain the previous fallback path. Reading copy remains present and visible in SSR. Project listings and case studies retain their previous diagrams.

Validation: production build, TypeScript and changed-file ESLint passed; all 48 tests passed, including the 200 kB initial-gzip and 450 kB enhanced-home budgets. A first SSR transparency failure from a decorative particle was corrected by mounting the particle only while visible and motion-enabled. Desktop 1440×900 and mobile 390×844 screenshots were inspected in both themes, including selection/replay and the completed reduced-motion house. A browser assertion checked keyboard Space selection, lens target position and changes to role-sheet geometry after scrolling. No horizontal overflow. Existing recoverable React #421 hydration errors were still observed on cold loads and remain unresolved.

Three fresh browser contexts per viewport measured six-second scripted scroll sweeps across all four work sections. Desktop p95 was 16.9 / 16.8 / 16.9 ms, mobile emulation 16.9 / 16.8 / 16.8 ms. Frames <=20 ms: 99.7–100% desktop, 100% mobile emulation. One desktop run reported 60 and 147 ms long tasks without trace attribution; other runs reported none. These measurements do not prove real-device performance or touch input latency.

Published at 10:05 WIB on 11 November 2026. Active root `/var/www/rifqi-releases/motion-20261111T030539Z`; rollback backup `/var/backups/rifqi-portfolio/motion-20261111T030539Z`. Archive SHA256 `b55c9322928e6ff4557b589f4845779e0f2f51467f62ad6d6e0b9bea443f7552`. nginx validation/reload and origin-side verification of eight pages, critical asset hashes, service worker, public API and private-read denial passed. Old immutable assets remain available for existing tabs. Backend containers and configuration unchanged.
