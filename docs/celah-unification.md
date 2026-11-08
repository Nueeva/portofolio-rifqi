# Celah public portfolio

Historical receipt for the first public-site unification. Its Supabase and unchanged-backend boundaries describe that earlier pass. For the current same-origin API, content-growth workflow and pending release gates, use [the editorial release handoff](celah-editorial-release.md) and [the self-hosted migration receipt](celah-selfhosted-postgres.md).

## Accepted direction

Rifqi Ariansyah is presented as a **Cybersecurity Engineer**, for recruiters and security teams. Celah extends across every public route: petrol–champagne in dark mode and ivory–petrol with bronze accents in light mode. Public interface copy is Indonesian; project names, technical terms, source IDs, links, categories, technologies and quantities remain intact.

Home follows xssscope reasoning, Apexsions audit and remediation, other work, a short personal story, then contact. The full family story and gateway stack are on Tentang. Public projects use alternating editorial compositions and diagonal apertures over diagrams of documented processes. No fabricated screenshots, scan output, diffs, logs, credentials or certifications.

## Implementation boundaries

- `PublicDesignBoundary` is keyed with the route inside the router's animated subtree, so outgoing routes keep their own public/legacy tokens during navigation. It owns the public portal host and notification roots.
- `/admin` and `/auth` use the existing navbar, footer, RIVA, root theme tokens and theme customizer. Their page/component files are unchanged. Unknown nested paths still use the public error design.
- Shared Dialog, AlertDialog and Select content accept the scoped portal destination via context. Their legacy destination stays the default. Public overlays and notifications inherit the same tokens as pages.
- Canonical facts remain in `src/data/projects.ts`, unchanged. `projectCopy.id.ts` supplies Indonesian presentation text. Known CMS strings are matched exactly; future edits pass through. Managed projects remain appended after curated projects with title deduplication.
- Public RIVA derives project descriptions from that same presentation layer. Its previous Go/94-payload and 40+-tool-installer descriptions are not used on public routes.
- Contact retains the existing endpoint and exact name/email/message/Turnstile payload, validation limits, URL topic slugs, honeypot and minimum completion time. Fields and long text remain still. Verification loading, expiry, error, retry, submitting, failure and success have Indonesian feedback.
- Sertifikasi reads the existing public certifications table. Project accomplishments are presented separately; no default project milestone is claimed as a certification.
- No dependency, Supabase schema, deployment configuration, auth flow or server endpoint is changed. All 13 route patterns remain registered.

## Motion

The hero retains its two-phase scroll timeline: opening planes, followed by the light sweep. Its duplicate signature is removed; TembusMark and the full name live in the public shell. Scroll motion runs only at widths of at least 768 px, heights of at least 780 px, and with no reduced-motion preference. Short/mobile viewports and reduced motion have complete static compositions. Decorative project apertures continue the diagonal direction; articles and fields are not animated into visibility.

Controls use 180 ms feedback and the existing page transition lasts 450 ms. There is no content opacity gate. Motion and Lenis remain the installed libraries.

## Checks completed

- `npm run build`: client, SSR and all postbuild steps passed; eight body routes prerendered.
- `npx tsc --noEmit -p tsconfig.app.json`: passed.
- ESLint on changed/new TypeScript files: passed without errors or warnings.
- `node --test --test-force-exit tests/public-design.test.mjs`: 26 checks passed. Covers canonical preservation, CMS pass-through, fallback/deduplication and filtering, form validation/prefill, mock submission success/failure without sending an email, RIVA source agreement, deterministic production SSR, public/legacy shells and 13 registered route patterns. Node's force-exit option ends after the results, because the app's existing query cache retains timers.
- Full-repository lint still reports six existing errors in unchanged files: `textarea.tsx`, `tailwind.config.ts`, and protected Supabase functions. They are not introduced by this change.
- Text contrast calculated for the palette: light muted text ≥4.64:1 and bronze ≥5.07:1 on the two main light surfaces; dark muted text ≥7.67:1 and champagne ≥6.57:1 on petrol surface.
- Guarded deployment/configuration, admin/auth, canonical data and integration paths have no diff.

Restored original assets match the currently deployed VPS bytes by SHA256:

| Asset | SHA256 |
| --- | --- |
| `cv-rifqi-ariansyah.pdf` | `65d3f5947b8f2b5a6fe82d2ddfa856ee56c00adbd0c0882d4ede4589adffaedf` |
| `og-image.png` | `03ed59a45945f2244fd07bbb49a611137d40238476917e08f08bb02c2610db99` |
| `apple-touch-icon.png` | `5056fd8a9611e22bcfe4e8798a914fddfb901d184ccbaf9ba82a5571171d9683` |
| `pwa-maskable-512.png` | `84bd4d9c7909cbf364cbbc62cc62104ae341155d49a8aba3031b01c9cd553de6` |

## Required before release

Browser access to `http://127.0.0.1:8767/` was rejected by the browser origin permission gate. No alternate browser, CDP or screenshot workaround was used. There are **no valid screenshots or visual approval for this revision**. Build, source tests and HTTP checks do not satisfy this gate.

Still required: desktop, tablet and mobile inspection in both themes; keyboard/focus and mobile menu; RIVA/notifications; reduced motion and short-screen hero; long text and missing images; filter empty state and Supabase failure; unknown case-study navigation; Turnstile loading/expiry/failure; mocked form success/failure. Do not submit a real contact message during QA.

The new full-site revision must not be deployed until visual verification and the finish review are complete. After that, deploy the complete build in one staged directory swap, back up the existing VPS directory, and verify all public pages/assets. The existing partial hero deployment remains live meanwhile.

The protected prerender metadata scripts and PWA manifest configuration retain their existing generated labels. The root title/description use the approved Indonesian Engineer positioning; public browser titles are localized on navigation.
