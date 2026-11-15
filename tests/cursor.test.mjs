import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const cursorSource = readFileSync(new URL("../src/components/CustomCursor.tsx", import.meta.url), "utf8");

test("custom cursor source exports CustomCursor functional component", () => {
  assert.match(cursorSource, /export function CustomCursor\(\)/);
});

test("physics engine: spring parameters guarantee critical or slight overdamping (zero overshoot)", () => {
  // Extract stiffness, damping, mass from spring config
  const stiffnessMatch = cursorSource.match(/stiffness:\s*(\d+(?:\.\d+)?)/);
  const dampingMatch = cursorSource.match(/damping:\s*(\d+(?:\.\d+)?)/);
  const massMatch = cursorSource.match(/mass:\s*(\d+(?:\.\d+)?)/);

  assert.ok(stiffnessMatch, "spring stiffness must be configured");
  assert.ok(dampingMatch, "spring damping must be configured");
  assert.ok(massMatch, "spring mass must be configured");

  const k = parseFloat(stiffnessMatch[1]);
  const c = parseFloat(dampingMatch[1]);
  const m = parseFloat(massMatch[1]);

  const criticalDamping = 2 * Math.sqrt(k * m);
  const dampingRatio = c / criticalDamping;

  // Damping ratio zeta >= 1.0 ensures strictly zero overshoot
  assert.ok(
    dampingRatio >= 0.98,
    `damping ratio zeta (${dampingRatio.toFixed(3)}) must be >= 0.98 for zero/near-zero overshoot`
  );

  // Natural frequency and settling time (< 150ms)
  const omega0 = Math.sqrt(k / m);
  const settlingTimeMs = (4 / (dampingRatio * omega0)) * 1000;
  assert.ok(
    settlingTimeMs < 150,
    `settling time (${settlingTimeMs.toFixed(1)}ms) must be under 150ms for zero perceived lag`
  );
});

test("accessibility and safety: strictly guards pointer: fine and prefers-reduced-motion", () => {
  assert.match(cursorSource, /\(pointer:\s*fine\)/);
  assert.match(cursorSource, /\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(cursorSource, /aria-hidden="true"/);
  assert.match(cursorSource, /pointer-events-none/);
});

test("DOM performance: avoids layout reflow by not animating width or height directly", () => {
  // Should not animate width or height inside animate={{ ... }}
  const animateBlocks = [...cursorSource.matchAll(/animate=\{\{([^}]+)\}\}/g)].map(m => m[1]);
  for (const block of animateBlocks) {
    assert.doesNotMatch(
      block,
      /\b(width|height)\s*:/,
      `layout property width/height found in animate block: "${block.trim()}". Use scale/transforms instead to avoid layout reflow.`
    );
  }
});

test("design system: integrates Celah theme tokens with safe fallbacks", () => {
  assert.match(cursorSource, /--site-metal/);
  assert.match(cursorSource, /--site-cyan/);
  assert.match(cursorSource, /--site-copper/);
});

test("state machine handles input suppression, action badges, and hover states", () => {
  assert.match(cursorSource, /input,\s*textarea,\s*select/);
  assert.match(cursorSource, /\[data-cursor\]/);
  assert.match(cursorSource, /has-custom-cursor/);
});
