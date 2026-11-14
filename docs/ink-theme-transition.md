# Organic ink theme transition

## Status against current source — 15 November 2026

The original 48-frame/900 ms behavior below has been superseded by the 64-frame/780 ms rasterizer (390 ms midpoint), worker preparation and decoded cache. Reduced motion crossfades for approximately 150 ms; unsupported native transitions retain inert page-copy layers. Native callbacks are synchronous and scroll is not a cancellation trigger. The historical recordings and receipts remain evidence of their original revision only. See [the current codebase guide](current-codebase.md) and [the repository README](../README.md) for maintained commands and limitations.

## Historical record / original research

The remainder preserves the earlier revision, including its dates, observations and release receipts. Statements about “current”, “pending” or “deployed” below apply to that historical revision, not the present checkout.

Implemented and deployed on 11 November 2026 at https://rifqi.apexsions.com/.

The current 14 November refinement uses 64 frames and worker preparation; see [the refinement report](ink-theme-refinement.md). This document retains the original revision's receipt and measurements.

## Mask and rendering

`src/lib/inkMask.ts` generates a color-independent alpha atlas from an arrival-time field: multi-scale value noise, curved bifurcating capillaries, and separate growing satellite deposits. Thresholding this field makes a coherent body advance, branch, absorb droplets, and feather at its boundary. The interior saturates to opaque. This is generated geometry, rather than a scaled blob or a circular clip.

The atlas contains 48 frames in an 8-by-6 grid. Its long-edge tile resolution is capped at 480 pixels, keeping texture size bounded on portrait and ultrawide screens. Rasterization yields between row/frame batches. One compressed atlas and one noise field are cached; object URLs and decoded image handles are released after use. Geometry is warmed 2.5 seconds after mount, after the hero entrance, unless motion is reduced. No noise, geometry, layout reads, cloning, or PNG encoding runs per animation frame.

The origin is measured from the real button's viewport bounding rectangle on every activation. Coverage uses the maximum arrival over the entire viewport, including displacement and feathering; the last frames hold fully opaque coverage before teardown.

- **View Transitions:** apply next-themes state and root classes synchronously inside the update callback, allow the optical layer to repaint, then animate the incoming root's mask position for 900 ms. Outgoing root remains opaque underneath. Default fades, blending, geometry animations and separately named descendants are suppressed. Color transitions are disabled while the snapshots are captured.
- **Layer fallback:** create two viewport-aligned, inert presentation copies of the current app. Scope the existing CSS cascade independently for light and dark; preserve form values, scroll offsets, SVG references, hover/focus presentation and current compositor transforms. No React application is initialized in the copies. The optical canvas supplies theme-specific images through a synchronous render/capture/restore hook. The real theme changes at 450 ms; the old backdrop remains unchanged. Remove both layers after full coverage and the real destination paint.
- **Reduced motion:** an immediate theme swap, without snapshots, atlas creation, animation or delay.

Latest requested intent is queued while a transition runs. Resize, scroll, visibility changes, owner removal, page exit, failed assets and rejected/skipped transitions settle into the destination and clean up. Presentation layers do not intercept pointer events or participate in accessibility/focus navigation.

The native snapshot lifecycle follows [MDN's View Transition guidance](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API/Using); the shared mask uses [CSS alpha masking](https://developer.mozilla.org/en-US/docs/Web/CSS/mask-image).

## Tuning

The `INK` object controls `duration` (900 ms), fallback `midpoint` (450 ms), frame count, atlas columns, resolution, feather width, displacement strength, droplet count and tendril count. The growth exponent (`.87`) and complete-coverage point (`.94`) are next to the atlas threshold in `createInkAtlas`. Keep the midpoint coordinated with the total duration and leave an opaque hold at the end.

900 ms is the visible reveal duration, not a guarantee of total cold-click latency. Atlas preparation and browser snapshot capture precede it. Recorded cold preparation ranged approximately 1.1–2.1 seconds under local test load; subsequent preparation/capture was faster. Background warming and the single-entry compressed cache mitigate this cost. No real-device timing claim is made.

## Verification actually performed

- Production client/SSR/prerender/PWA build, TypeScript, and ESLint on changed files passed.
- All **51 Node tests passed**, including alpha-field assertions for empty start, opaque end/hold, viewport origin, feathering, coherent body plus detached droplets, portrait coverage, cached reuse and cancellation. Existing initial/enhanced bundle budgets passed.
- Chrome: both directions with View Transitions, and both directions with the API explicitly disabled to force fallback. Intermediate screenshots saved at 320 ms.
- Chrome: repeated activation, resize, reduced motion, form-value retention, scroll alignment, focus retention, no overflow, no leftover overlays/styles/object URLs. Viewports: 1280×800, 390×844, 1600×420, 420×1200.
- Chrome: failed mask encoding, thrown transition creation, rejected `ready` promise, owner removal and scroll interruption all settled and cleaned up. A cold reduced-motion click applied immediately without presentation layers.
- Microsoft Edge: native transition, destination theme and cleanup passed.
- Public HTTPS: release identity, current entry chunks, service worker bytes and API health passed; a real Chrome session loaded the live site, ran the ink animation and verified the destination theme and cleanup.

Full-coverage versus post-cleanup hero screenshots had 0.61–0.89% differing pixels above the test threshold. The check permits 1.5%; it is a visual-regression tolerance, not proof of bit-identical rendering. Raw results are in `media/ink/checks.json`. Safari, Firefox and physical phones were not run. The previously recorded recoverable React #421 hydration error can still occur on cold page loads and is not resolved by this change.

Reproduce browser checks with a production preview on port 4190 (or set `INK_BASE_URL`), an installed Playwright package supplied through `PLAYWRIGHT_MODULE`, and `node tests/ink-theme.browser.cjs`. Set `CHROME_PATH` for a different Chrome installation. Tests fill a local form but never submit it.

## Visual evidence

- [Short recording, both directions](media/ink/ink-toggle.webm)
- [Native light reveal, 320 ms](media/ink/view-light-320ms.png)
- [Native dark reveal, 320 ms](media/ink/view-dark-320ms.png)
- [Forced fallback light reveal, 320 ms](media/ink/layers-light-320ms.png)
- [Forced fallback dark reveal, 320 ms](media/ink/layers-dark-320ms.png)

## Deployment receipt

Active release: `/var/www/rifqi-releases/motion-20261111T080757Z`.
Rollback backup: `/var/backups/rifqi-portfolio/motion-20261111T080757Z`.
Archive SHA256: `7e69dbb9dd07fd0c227f75f272a60bc7ea8373581e53ad9dd831efb141eac2a6`.

nginx configuration validation/reload passed. Origin verification matched eight prerendered routes and critical asset hashes, current/no-cache service worker, public API health and private-read denial. Existing immutable chunks remain available. Backend containers and runtime configuration were not changed. To roll back, restore the backup nginx.conf to `/etc/nginx/sites-enabled/rifqi-portfolio`, run `nginx -t`, then reload nginx.
