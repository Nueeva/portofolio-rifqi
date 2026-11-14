# Ink motion refinement — 14 November 2026

## Status against current source — 15 November 2026

Current constants are 780 ms duration, 390 ms midpoint and 64 frames. The native callback is synchronous; a decoded cache and worker preparation are present. Reduced motion is a short crossfade, and scroll does not cancel the transition. Warm-cache reuse can reduce preparation cost but does not guarantee 0 ms latency or lock to every display refresh. Deployment and browser claims below are historical receipts, not repeated verification. See [the current codebase guide](current-codebase.md) and [the repository README](../README.md) for maintained commands and limitations.

## Historical record / original research

The remainder preserves the earlier revision, including its dates, observations and release receipts. Statements about “current”, “pending” or “deployed” below apply to that historical revision, not the present checkout.

The theme reveal retains its 900 ms timing and existing native/layered rendering paths. This revision refines the pigment's shape, temporal sampling and preparation responsiveness.

## Changes

- **64 frames instead of 48.** More temporal samples while keeping the established duration, origin measurement, queued intent and reduced-motion behavior.
- **Curved, uneven capillaries.** Different branch spacing, curvature, fork timing and widths replace the regular radial pattern. Continuous tapered capsules and rounded growth profiles avoid repeated point-deposit teeth.
- **Liquid joins.** Smooth-minimum arrival fields let drops form rounded necks as they merge. Domain-warped multi-scale noise gives the broad front less regular contours.
- **Adaptive edge antialiasing.** Feather width follows the local arrival-field gradient, including thin branches. The body remains opaque behind the advancing front.
- **Worker preparation.** Geometry, rasterization and PNG encoding run in a short-lived module worker with OffscreenCanvas. The worker terminates after delivery, on failure or cancellation. Unsupported/blocked workers use the same rasterizer with cooperative yielding on the page. Each worker request has a bounded timeout.
- **Texture budgets.** The long edge remains capped at 480 mask pixels. The whole atlas is limited to 10.5 million pixels on larger viewports and 6 million on small viewports, at most about 42/24 MB of raw RGBA atlas data. Tests include 8K and square viewports and texture dimensions <=4096. These are atlas bounds, not total browser memory measurements.

The reusable pure rasterizer and tuning constants live in `src/lib/inkRaster.ts`; cache/worker ownership stays in `src/lib/inkMask.ts`, and the worker entry point is `src/lib/inkMask.worker.ts`. Existing theme snapshot/canvas capture behavior is retained. The worker uses [OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas) and [Vite's worker URL entry syntax](https://vite.dev/guide/features#web-workers).

## Validation

- Production client, SSR, prerender and PWA build passed. TypeScript and changed-file ESLint passed.
- **53 Node tests passed**, including alpha endpoints/opaque hold, origin, feathering, coherent body and detached droplets, raster bounds, cancellation and failed-encode disposal. Existing bundle budgets still pass.
- Chrome browser checks passed for both directions and both native/forced-layer paths, focus/form/scroll retention, repeated intent, resize, reduced motion, thrown capture/encoding errors, owner removal and interruption cleanup.
- Browser instrumentation confirmed a real worker returned the atlas, cached reuse across directions, zero active workers after cleanup, both rendering paths working with worker construction forcibly rejected, and termination when preparation was cancelled.
- Cold reduced motion, rejected native `ready` promises, and an Edge native transition/cleanup check passed. Physical devices, Safari and Firefox were not tested.
- Intermediate frames were inspected on both paths; one bounded visual correction rounded the branches. The previous recoverable React #421 hydration issue remains outside this change.

## Local before/after measurements

Three fresh Chrome contexts per viewport, production preview, same six-run harness, unthrottled headless browser. Each first click was exercised before the background warm completed. Preparation is measured from click until the mask animation starts; long tasks are browser main-thread entries >=50 ms during that interval, without stack attribution.

| Viewport | Median preparation before | After | Preparation long tasks before / after |
| --- | ---: | ---: | ---: |
| 1280×800 | 1209 ms | 1111 ms | 6 / 0 |
| 390×844 emulation | 857 ms | 795 ms | 3 / 0 |

The worker's principal benefit is keeping preparation work off the interaction thread. These cold totals include module/decode/snapshot costs; they do not promise a sub-900-ms cold click. Warm-up and cached toggles remain in place. Headless desktop reveal frame p95 varied from 17.1 to 33.5 ms after the change, versus 18.7 to 282.5 ms before; mobile emulation after was 17.1–17.3 ms. Some desktop reveal long tasks remain in the raw results. This is not a physical-device FPS guarantee or proof that every stall came from the mask.

Raw evidence: `media/ink-v2/perf-before.json`, `media/ink-v2/perf-after.json`, `media/ink-v2/checks.json`. The full-coverage screenshot test keeps its existing 1.5% pixel tolerance; it does not assert bit-identical rasterization.

## Preview

- [Short recording](media/ink-v2/ink-toggle.webm)
- [Native dark reveal at 320 ms](media/ink-v2/view-dark-320ms.png)
- [Forced fallback light reveal at 320 ms](media/ink-v2/layers-light-320ms.png)

## Deployment

Published release: `/var/www/rifqi-releases/motion-20261114T090744Z`.
Rollback backup: `/var/backups/rifqi-portfolio/motion-20261114T090744Z`.
Archive SHA256: `d7947245f8caf38b467bdc71a2eb1cd0453a252218fb2233ec4968c3fae7b62f`.

nginx validation/reload and origin checks for eight routes, critical assets, current service worker, API health and private-read denial passed. Public HTTPS release identity, entry chunks, service worker bytes and health matched the new release. Existing immutable chunks were retained; backend containers were unchanged. Rollback uses the saved nginx.conf, followed by `nginx -t` and nginx reload.

---

# Zero-Latency & Rendering Stability Update — 15 November 2026

Following live user interaction and browser automation telemetry, an architectural update resolved a rendering deadlock and eliminated perceived click latency.

## 1. Issues Identified
1. **View Transitions Rendering Deadlock (Tab Freeze)**: In Chromium/WebKit, `document.startViewTransition(callback)` suspends rendering while the callback runs. An asynchronous `await paint(signal)` awaiting `requestAnimationFrame` was executing inside this callback. Because rendering was suspended, the animation frame never fired, deadlocking the render thread and freezing the tab.
2. **Click Latency & Premature Pre-Warming Invalidation**: While background pre-warming computed the initial atlas, `warmPublicTheme` immediately invoked `.release()`, destroying the cached texture. Subsequent user clicks had to regenerate the canvas from scratch. Furthermore, dynamically importing `@/lib/themeTransition` inside the click handler added event tick latency.
3. **Rushed Cadence**: A 534ms duration felt unnaturally fast during large viewport expansion.

## 2. Implemented Resolutions
- **Synchronous Transition Callback**: Replaced the async `paint` callback inside `document.startViewTransition` with a synchronous callback:
  ```ts
  transition = doc.startViewTransition(() => {
      apply(request);
      window.dispatchEvent(new Event("celah:theme-rendered"));
  });
  ```
- **Pre-Decoded Atlas Memory Cache**: `atlasCache` retains the decoded `InkAtlas` instance in memory across toggles. `warmPublicTheme` no longer destroys the warmed atlas upon completion, allowing immediate 0ms click execution (<= 16ms).
- **Static Module Preloading**: `PublicChrome.tsx` preloads `themeModuleRef` on mount so clicks trigger `execute(module)` synchronously without import latency.
- **Natural Fluid Cadence (780ms)**: Retuned `INK.duration` to 780ms (`midpoint: 390ms`, `growthPower: 1.25`) for organic capillary bleed expansion.
- **Procedural Web Audio**: Integrated synthesized audio micro-interaction (`src/lib/themeAudio.ts`) with silent exception handling.

## 3. Deployment & Verification
- **Release Directory**: `/var/www/rifqi-releases/architectural-titanium-20261115T001300Z`
- **Unit Tests**: 53/53 tests passing (`node --test tests/*.test.mjs`).
- **Live Verification**:
  - `curl -I https://rifqi.apexsions.com/assets/themeTransition-D1122FZw.js` -> `HTTP/1.1 200 OK`.
  - Headless browser automated verification: 4 consecutive toggles (Dark <-> Light), 0ms click response, 0 tab freeze or hitching, smooth 780ms fluid ink splatter reveal.
