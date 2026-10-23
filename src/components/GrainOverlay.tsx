/**
 * Animated film-grain overlay for the whole site. Pure CSS (SVG turbulence
 * texture + stepped position jumps, defined in index.css) — no JS cost,
 * disabled under prefers-reduced-motion.
 */
export function GrainOverlay() {
  return <div className="grain-overlay" aria-hidden="true" />;
}
