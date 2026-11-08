---
name: "Celah — Rifqi Ariansyah"
description: "An Indonesian cybersecurity portfolio with diagonal material apertures and editorial project narratives."
colors:
  petrol: "#0b181c"
  petrol-surface: "#18343b"
  petrol-low: "#102124"
  ivory: "#f1ece1"
  champagne: "#c7b594"
  cool-reflection: "#83b3ad"
  dark-muted: "#c1c7c2"
  dark-line: "#385257"
  dark-input: "#607779"
  dark-cavity: "#071013"
  light-surface: "#e4e0d4"
  light-low: "#e6e8df"
  petrol-ink: "#10272e"
  bronze: "#725739"
  light-muted: "#536568"
  light-line: "#c9c3b4"
  light-input: "#8a8274"
  light-cool: "#6a857f"
  light-reflection: "#d1c3a8"
  light-danger: "hsl(4 66% 39%)"
  dark-danger: "hsl(4 75% 73%)"
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
---

# Design System: Celah — Rifqi Ariansyah

## Overview

**Creative North Star: "Celah"**

Two diagonal material planes open a narrow seam of light. This motif connects the cybersecurity hero to project artwork, while generous editorial spacing and restrained type keep the work readable. Rifqi is presented as a Cybersecurity Engineer; the official TembusMark and full name anchor the shared shell.

This system covers all public pages, case studies and errors. A route-scoped boundary contains its CSS variables, notification roots and portal host. Dialog, AlertDialog and Select portals inherit that scope. Exact `/admin` and `/auth` routes retain their legacy shell and root theme tokens; unknown nested paths use the public error design.

**Key Characteristics:**

- Petrol and warm ivory, with champagne or bronze interaction accents.
- Alternating editorial compositions and diagrams of documented work.
- Selectable, visible reading content with decorative motion around it.

Source-derived snapshot (2026-11-08): no valid screenshots or visual approval are available because local browser origin access was denied. Build, type, lint and source/production-SSR checks are recorded in [the integration contract](docs/celah-unification.md); they do not replace visual verification. The full revision remains subject to that contract's release gate.

## Colors

### Primary

Champagne is the dark-theme action, emphasis, selection and focus color; bronze fills that role in light mode. Use the frontmatter values as extracted primitives, rather than deriving a new accent palette.

### Secondary

Cool reflection and light cool support thin seam highlights and process arrows. They remain supporting colors. Danger uses the source HSL tokens for validation and failure feedback.

### Neutral

| Role | Dark | Light |
| --- | --- | --- |
| Page / primary text | petrol / ivory | ivory / petrol-ink |
| Raised tonal surface | petrol-surface | light-surface |
| Quiet section / footer | petrol-low | light-low |
| Supporting text | dark-muted | light-muted |
| Divider / input stroke | dark-line / dark-input | light-line / light-input |
| Decorative cavity / reflection | dark-cavity / champagne | petrol-ink / light-reflection |

The public stylesheet also maps semantic HSL variables for shared UI components. Its `--site-*` variables drive custom public elements. Frontmatter component examples show the default light theme; runtime components switch through the scoped variables. Sidecar tonal ramps are generated preview metadata, not additional implemented theme tokens.

**The Scope Rule.** Apply Celah through the public boundary and its portal host; preserve the legacy root palette for admin and authentication.

## Typography

Space Grotesk carries headings; Inter carries body text, controls and labels. Instrument Serif italic marks selected words, including “Engineer.” JetBrains Mono is reserved for code or data, rather than ordinary public labels. All four font families are self-hosted; the italic serif is declared in the hero stylesheet.

The frontmatter records the hero, page and home-section scales. Project titles use a smaller display range (`clamp(2rem, 3.8vw, 3.5rem)`); study headings tighten further. Headings use balanced wrapping and light CSS weight (400). Inter supporting text is usually (12–15px), while form text remains (16px). Ledes and home paragraphs stop at (65ch); study articles stop at (72ch), with generous line height (1.95). Italic accents inherit contextual size outside the hero and artwork.

## Layout

A centered container stops at (1280px), with fluid gutters from (20px) to (64px). The fixed navbar occupies (64px), matched by the main-content offset. Public pages use vertical padding (76px / 120px); home sections use (110px).

Home moves from the hero through xssscope reasoning, Apexsions remediation, other work, the personal story and the shared contact invitation. Projects alternate unequal two-column image/copy rows; filters are a wrapping text rail, rather than a card grid. Case studies separate metadata from a narrow reading column. About uses ruled skill and experience rows. Contact uses a smaller details column beside a larger form. Errors keep a simple code, explanation and recovery actions.

At widths below (768px), editorial, about and contact columns stack; alternating image order resets. Page padding becomes (50px / 80px), home sections (75px), artwork minimum height (290px), and navigation becomes a full-width dialog below the navbar. Long titles, technologies and contact details wrap. Filters and action groups wrap naturally.

The hero scroll timeline runs only at widths of at least (768px), heights of at least (780px), and without reduced motion. Its tall desktop section (175svh) holds a sticky stage; mobile and short screens use a complete static stage (710px). Below (481px), the hero heading moves lower. Reduced motion also selects the static stage and removes the glint/sweep and project crop animation.

## Elevation & Depth

Depth comes mainly from tonal planes, thin rules and the diagonal seam. The hero keeps a cavity inset shadow and a soft lower-plane shadow; email suggestions and shared dialogs retain functional overlay shadows. Public glow utilities and the back-to-top shadow are suppressed. The sidecar carries the extracted shadow declarations.

The hero opens its planes before the highlight sweeps through. Pointer response is damped and limited to the glint. Project apertures uncrop decorative artwork during scroll; text and fields never wait for an entrance. Controls mostly use (180ms) feedback. Route changes use the existing camera lift and blur (450ms), then clear filter and transform. Reduced motion removes those transitions and skips Lenis. There is no content opacity gate or fullscreen welcome overlay.

## Shapes

Editorial sections and artwork remain rectangular, separated by fine rules. The recurring diagonal is (−8deg) in the hero and artwork highlight; project apertures begin with a sloped lower edge. Fields and submit buttons use a small radius (3px), RIVA messages (4px), general public dialogs (6px), and RIVA's panel (8px). Theme, menu, RIVA-launcher and back-to-top controls are circular. The mobile navigation panel is square-edged.

## Components

- **Actions:** Underlined text links have a minimum target height (44px) and a widening arrow gap on hover. The filled submit button uses metal on page background, minimum height (48px), a brightness hover and reduced disabled opacity. Focus is an offset metal outline (2px); hero links use a slightly wider offset.
- **Navigation:** TembusMark plus the settings-driven name precede Indonesian route links. Active links use metal color and an underline. Theme and mobile menu buttons use circular (44px) targets. The mobile dialog provides large ruled links with active-state color and scrolls within the viewport below the navbar.
- **Filters and tags:** Category buttons expose selected state through `aria-pressed`, metal text and an underline. Technology labels are a wrapping text list; they are not filled chips.
- **Artwork and editorial rows:** Decorative diagrams present documented project processes or quantities; supplied project images replace the diagram and fall back to it on failure. Artwork is hidden from accessibility APIs, while adjacent titles, problem, approach, technologies and links remain ordinary HTML.
- **Fields:** Transparent stroked inputs have visible labels, character counts, associated validation messages and a metal caret. Email suggestions form a bounded tonal overlay with selected/hover states. Turnstile, sending, error, retry and success feedback use Indonesian copy. Fields and long text stay still.
- **RIVA and notifications:** A circular launcher opens a bottom-right, viewport-bounded dialog with a scrollable message log. At heights of (600px) or less, the dialog uses tighter padding and a small viewport inset. Bot messages use the surface tone; user messages use metal on page background. Notification surfaces inherit the same public scope. RIVA's public project descriptions use the shared presentation data.

## Do's and Don'ts

### Do:

- **Do** keep every public route and overlay in the Celah scope, with both themes and visible keyboard focus.
- **Do** keep Indonesian interface copy, the Cybersecurity Engineer role, and the official TembusMark geometry.
- **Do** preserve canonical project facts, names, IDs, technical terms, quantities and links from `src/data/projects.ts`; use `projectCopy.id.ts` for presentation text and preserve future CMS edits.
- **Do** keep reading content visible on first render and provide complete static compositions for mobile, short screens and reduced motion.

### Don't:

- **Don't** apply the public theme to legacy admin/auth, or change contact payloads, validation, Turnstile, honeypot or timing contracts as a design edit.
- **Don't** invent screenshots, scanner output, logs, diffs, credentials, certifications or performance claims; project accomplishments remain separate from fetched certifications.
- **Don't** add replacement monograms, chapter/progress rails, global glitch effects or decorative mono labels.
- **Don't** treat source checks or generated component previews as visual approval; complete the documented browser review before releasing this revision.
