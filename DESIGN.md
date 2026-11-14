---
name: "Celah — Rifqi Ariansyah"
description: "An Indonesian cybersecurity portfolio with optical seams, interactive process diagrams and editorial project narratives."
colors:
  petrol: "#0b181c"
  petrol-surface: "#18343b"
  petrol-low: "#102124"
  ivory: "#f8f6f1"
  champagne: "#c7b594"
  cool-reflection: "#83b3ad"
  dark-muted: "#c1c7c2"
  dark-line: "#385257"
  dark-input: "#607779"
  dark-cavity: "#071013"
  light-surface: "#ffffff"
  light-low: "#f1ede4"
  petrol-ink: "#14171a"
  bronze: "#92400e"
  light-muted: "#69707a"
  light-line: "#e3ded4"
  light-input: "#d4cdc0"
  light-cool: "#0f766e"
  light-reflection: "#92400e"
  light-danger: "hsl(4 66% 39%)"
  dark-danger: "hsl(4 75% 73%)"
  light-cyan: "#0f766e"
  dark-cyan: "#8eddd5"
  light-periwinkle: "#6366f1"
  dark-periwinkle: "#a9b7f6"
  light-copper: "#b45309"
  dark-copper: "#d39576"
typography:
  display:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "clamp(2rem, 8.5cqw, 6rem)"
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "clamp(3rem, 7vw, 5.5rem)"
    fontWeight: 400
    lineHeight: 1.03
    letterSpacing: "-0.035em"
  section:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "clamp(2.5rem, 5.5vw, 4.5rem)"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "-0.035em"
  accent:
    fontFamily: "Instrument Serif, serif"
    fontWeight: 400
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "16px"
    lineHeight: 1.65
  lede:
    fontFamily: "Inter, sans-serif"
    fontSize: "clamp(1rem, 1.8vw, 1.125rem)"
    lineHeight: 1.85
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "12px"
  code:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace"
rounded:
  field: "3px"
  message: "4px"
  dialog: "6px"
  riva: "8px"
  circle: "50%"
spacing:
  gutter: "clamp(20px, 4vw, 64px)"
  control-gap: "22px"
  form-gap: "24px"
  section: "110px"
  section-mobile: "75px"
components:
  button-primary:
    backgroundColor: "{colors.bronze}"
    textColor: "{colors.ivory}"
    rounded: "{rounded.field}"
    padding: "10px 22px"
  text-link:
    padding: "9px 0"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.petrol-ink}"
    rounded: "{rounded.field}"
    padding: "13px 15px"
  navigation:
    backgroundColor: "{colors.ivory}"
    textColor: "{colors.light-muted}"
    height: "64px"
  filter:
    textColor: "{colors.light-muted}"
  filter-selected:
    textColor: "{colors.bronze}"
  artwork:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.petrol-ink}"
    padding: "clamp(25px, 5vw, 56px)"
  riva-dialog:
    backgroundColor: "{colors.ivory}"
    textColor: "{colors.petrol-ink}"
    rounded: "{rounded.riva}"
    padding: "24px"
    width: "min(410px, calc(100vw - 32px))"
  process-diagram:
    backgroundColor: "{colors.light-low}"
    textColor: "{colors.petrol-ink}"
    padding: "28px"
  diagram-control:
    textColor: "{colors.light-muted}"
    padding: "10px 14px"
  diagram-control-selected:
    textColor: "{colors.light-cyan}"
  gallery-entry:
    padding: "28px 0"
  optical-poster:
    width: "100%"
    height: "100%"
---

# Design System: Celah — Rifqi Ariansyah

## Overview

**Creative North Star: "Celah"**

Two diagonal material planes open a narrow seam of light. This motif connects the cybersecurity hero to technical process diagrams, while generous editorial spacing and restrained type keep the work readable. Rifqi is presented as a Cybersecurity Engineer; the official TembusMark and full name anchor the shared shell. Cyan, periwinkle and copper extend the established petrol, ivory and metal palette.

This system covers all public pages, case studies and errors. A persistent public shell holds navigation, footer, settings and on-demand RIVA while route content changes. Its design boundary contains public CSS variables, notification roots and the portal host; Dialog, AlertDialog and Select portals inherit that scope. Exact `/admin` and `/auth` routes retain their legacy shell and root theme tokens; unknown nested paths use the public error design.

**Key Characteristics:**

- Petrol and warm ivory, with metal accents and a restrained technical spectrum.
- Editorial sections, a selectable project gallery and accessible process diagrams.
- Complete HTML/SVG content with optional optical depth and user-driven motion.

Source-derived snapshot (2026-11-08): saved browser permissions deny preview access, so no screenshots or browser visual approval exist for this update. This document records source behavior, not visual validation. Public deployment was subsequently authorized with visual QA deferred; see the release receipt. The browser and finish-review gate in [the current release handoff](docs/celah-editorial-release.md) remains pending; earlier verification records do not validate these new enhancements.

Public content now uses the same-origin API. Runtime migration and cutover status belong to [the self-hosted migration receipt](docs/celah-selfhosted-postgres.md); this visual specification does not assert a completed public deployment.

## Colors

### Primary

Champagne is the dark-theme action, emphasis, selection and focus color; bronze fills that role in light mode. Use the frontmatter values as extracted primitives, rather than deriving a new accent palette.

### Secondary

Cool reflection and light cool retain the original seam highlights. The added cyan pair carries diagram focus regions, selected diagram controls, gallery selection rules and field focus. Periwinkle (the source `--site-violet` variable) marks reflection context, code and workflow details. Copper marks the plugin/result layer and the warm end of the optical seam. These supporting colors inherit their dark/light variants from the public boundary. Hover feedback belongs to each component; there is no blanket cyan override on public buttons. Danger retains the source HSL tokens for validation and failure feedback.

### Neutral

| Role | Dark | Light |
| --- | --- | --- |
| Page / primary text | petrol / ivory | ivory / petrol-ink |
| Raised tonal surface | petrol-surface | light-surface |
| Quiet section / footer | petrol-low | light-low |
| Supporting text | dark-muted | light-muted |
| Divider / input stroke | dark-line / dark-input | light-line / light-input |
| Decorative cavity / reflection | dark-cavity / champagne | light-cavity / light-reflection |

The cavity uses adaptive depth in both themes (dark-cavity #071013 in dark mode; recessed warm titanium #ece7dc in light mode). Seam arrows follow the reflection accent.

The public stylesheet also maps semantic HSL variables for shared UI components. Its `--site-*` variables drive custom public elements. Frontmatter component examples show the default light theme; runtime components switch through the scoped variables. Sidecar tonal ramps are generated preview metadata, not additional implemented theme tokens.

**The Scope Rule.** Apply Celah through the public boundary and its portal host; preserve the legacy root palette for admin and authentication.

## Typography

Space Grotesk carries headings; Inter carries body text, controls and labels. Instrument Serif italic marks selected words, including “Engineer.” JetBrains Mono is reserved for code or data, rather than ordinary public labels. All four font families are self-hosted; the italic serif is declared in the hero stylesheet.

The frontmatter records the hero, page and home-section scales. Gallery selectors use Space Grotesk (26px) and stage titles (28px); study headings keep their narrower hierarchy. Headings use balanced wrapping and light CSS weight (400). Inter supporting text is usually (12–15px), while form text remains (16px). Diagram labels use Inter; actual context snippets use JetBrains Mono (13px). Ledes and home paragraphs stop at (65ch); study articles stop at (72ch), with generous line height (1.95). Italic accents inherit contextual size outside the hero and fallback artwork.

## Layout

A centered container stops at (1280px), with fluid gutters from (20px) to (64px). The fixed navbar occupies (64px), matched by the main-content offset. Public pages use vertical padding (76px / 120px); home sections use (110px).

Home moves from the hero through featured projects, the personal story and the shared contact invitation. Featured order comes from editorial metadata; repeated project sections alternate copy and visual, resetting to ordinary stacking on mobile. Titles use the name before the dash, and summaries shorten after (25 words). Without editorial rows, the first four merged project records remain the fallback. Projects use a selected visual stage beside a ruled project index: unequal columns (1.1fr / 1fr), a gap (64px), and a sticky stage offset (100px). Hover, focus or a selector button changes the selected project. Native details elements disclose the problem and approach. Category filters remain a wrapping text rail. Case studies separate metadata from a narrow reading column. About combines ruled skill/experience rows with a Portfolio 71 process example. Contact keeps its smaller details column beside a larger form. Errors retain explanations and recovery actions; route-load failure adds reload and home actions within the public shell.

Below (1024px), the gallery becomes one column: the sticky stage is hidden and every project gains an inline visual. Diagram padding reduces from (28px) to (20px). Below (768px), home, about and contact columns stack; page padding becomes (50px / 80px), home sections (75px), and navigation becomes a full-width dialog below the navbar. At (480px) or less, diagrams use padding (16px), larger SVG labels and tighter controls. Long titles, technologies and contact details wrap. Filters and action groups wrap naturally.

The hero starts as a complete composition with a minimum height (760px), rising to (780px) below (768px). Its body stays in normal flow to accommodate text. A sticky section (175svh) is enabled only at widths of at least (1024px), heights of at least (780px), without reduced motion, and when the body's measured extent fits below the navbar with its safety spacing. Other layouts keep normal document flow and can still respond to local scroll without pinning. Reduced motion keeps the static composition. Project crop animation remains removed; all diagram controls and captions remain available without motion.

## Elevation & Depth

Depth comes mainly from tonal planes, thin rules and the diagonal seam. The hero keeps a cavity inset shadow and a soft lower-plane shadow; email suggestions and shared dialogs retain functional overlay shadows. Public glow utilities and the back-to-top shadow are suppressed. The sidecar carries the extracted shadow declarations.

The hero has an independent decorative entrance (1100ms) and diagonal light pass, so its introduction does not require a pinned scroll sequence. Entrance progress contributes to the camera alongside local scroll; the seam opening and later light sweep retain separate phases. One optional WebGL layer renders a background pass and an optical pass for refraction, chromatic separation and a copper/cyan bevel; ordinary HTML carries all text. A static SVG poster is always present beneath it. The layer is eligible only on fine-pointer screens at least (1024px) wide, without reduced motion, Save-Data or a reported 2G connection. It renders on demand, pauses when hidden/offscreen, caps pixel ratio (1.5), and drops quality before hiding the canvas after sustained slow frames. Initialization, rendering and context-loss failures leave the poster and HTML intact.

The xssscope inspection focus moves between code contexts (450ms); Portfolio 71 moves a role-lane focus (400ms); CTF-Toolkit changes tile fill/stroke (350ms). Apexsions retains curved wire draws (400ms) and node feedback (350ms). Captions stay visible and are announced. General control feedback remains (180ms). Navigation, filter and diagram indicators use shared layout movement, as does the gallery preview. Route content lifts vertically (400ms), with no blur or opacity gate, while the shell persists. Scroll reset or history restoration waits for the destination to mount, then synchronizes smooth scrolling; the new heading receives focus. A native media-query subscription responds to reduced-motion changes while the page is open and uses a conservative reduced server snapshot. Reduced motion removes the hero enhancement and entrance, positional diagram feedback and route transforms, and skips Lenis. There is no fullscreen welcome overlay.

Theme changes use a diagonal View Transition reveal (500ms), waiting for an optical-canvas render acknowledgement or a short timeout (100ms) before capturing the new theme. Browsers without View Transitions use a brief color transition (200ms); reduced motion applies the theme immediately. The theme icon turns slightly on press. These are source-defined behaviors awaiting browser verification.

**The Readable Base Rule.** Keep HTML content, SVG diagrams and the hero poster complete when animation or WebGL is unavailable.

## Shapes

Editorial sections, diagram figures and the gallery remain rectangular, separated by fine rules. The recurring diagonal stays in the hero seam, poster, theme reveal and fallback artwork. SVG figures have distinct structures: an inspection window with a translucent cyan focus band, curved architecture connections with plugin cells and dashed host frames, five-stage role lanes, and a two-by-two category map. Fields and submit buttons use a small radius (3px), RIVA messages (4px), general public dialogs (6px), and RIVA's panel (8px). Theme, menu, RIVA-launcher and back-to-top controls are circular. The mobile navigation panel is square-edged.

## Components

- **Actions:** Underlined text links have a minimum target height (44px) and a widening arrow gap on hover. The filled submit button uses metal on page background, minimum height (48px), brightness feedback and reduced disabled opacity. Preserve each component's own hover colors. General focus remains an offset metal outline (2px); inputs and textareas use cyan with a closer offset (3px). Hero actions lead to the project gallery and settings-driven CV download.
- **Navigation:** TembusMark plus the settings-driven name precede Indonesian route links. Active desktop links use metal color and a shared moving rule below the label. Theme and mobile menu buttons use circular (44px) targets. The mobile dialog provides large ruled links with active-state color and scrolls within the viewport below the navbar.
- **Filters and gallery:** Category buttons expose selected state through `aria-pressed`, metal text and a cyan indicator. The gallery's selected row gains a cyan top rule; selection works with pointer, focus and click. Technology labels remain text, rather than filled chips. Each row retains links and a native problem/approach disclosure.
- **Process diagrams:** The four curated projects use selectable SVG illustrations with unique title/description IDs, pressed-state context buttons, a replay control and a visible live caption. xssscope inspects three code contexts; Apexsions maps game, bridge and operations; Portfolio 71 lays out access-role workflows; CTF-Toolkit maps four preparation categories. These are labeled process illustrations, not live scans or screenshots. Supplied project images still take precedence and fall back to the diagram on failure; generic fallback artwork remains decorative.
- **Fields:** Transparent stroked inputs have visible labels, character counts, associated validation messages and a metal caret. Email suggestions form a bounded tonal overlay with selected/hover states. Turnstile, sending, error, retry and success feedback use Indonesian copy. Fields and long text stay still.
- **Editorial content:** Public pages and RIVA consume the same project presentation, including persisted summaries, case studies and featured order. About uses persisted skill groups, with existing fallbacks when the content request is unavailable. Project IDs and existing URLs stay intact. Publishing and content-growth checks are recorded in the release handoff; operational database details do not change the visual tokens.
- **RIVA and notifications:** The persistent shell loads RIVA on first activation, with Indonesian loading/failure feedback, then preserves its conversation across public route changes. A circular launcher opens the bottom-right, viewport-bounded dialog with a scrollable message log. At heights of (600px) or less, the dialog uses tighter padding and a small viewport inset. Bot messages use the surface tone; user messages use metal on page background. Notification surfaces inherit the public scope. RIVA's project descriptions use the shared presentation data.

## Do's and Don'ts

### Do:

- **Do** keep every public route and overlay in the Celah scope, with both themes and visible keyboard focus.
- **Do** keep Indonesian interface copy, the Cybersecurity Engineer role, and the official TembusMark geometry.
- **Do** preserve canonical project facts, names, IDs, technical terms, quantities and links from `src/data/projects.ts`; use `projectCopy.id.ts` for presentation text and preserve future CMS edits.
- **Do** keep reading content visible on first render, preserve accessible diagram controls and captions, and provide complete HTML/SVG compositions for mobile, short screens, reduced motion and failed optional enhancements.

### Don't:

- **Don't** apply the public theme to legacy admin/auth, or change contact payloads, validation, Turnstile, honeypot or timing contracts as a design edit.
- **Don't** invent screenshots, scanner output, logs, diffs, credentials, certifications or performance claims; project accomplishments remain separate from fetched certifications.
- **Don't** add replacement monograms, chapter/progress rails, global glitch effects or decorative mono labels.
- **Don't** treat source checks or generated component previews as visual approval; complete the documented browser review before releasing this revision.
