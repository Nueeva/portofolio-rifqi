import { useEffect, useRef } from "react";

/**
 * Subtle matrix rain backdrop (404 page only).
 * Emerald glyphs at low opacity, ~20fps, respects prefers-reduced-motion.
 * Trails are drawn per-column with fading alpha — no background-color
 * assumptions, so it works on both light and dark themes.
 */
export function MatrixRain({ opacity = 0.13 }: { opacity?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const CHARS = "アィウェオカキクケコサシスセソタチツテトナニヌネノ0123456789<>/{}#$%&*+=";
    const FONT = 14;
    const TRAIL = 12;

    let columns = 0;
    let drops: number[] = [];
    let speeds: number[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${FONT}px "JetBrains Mono", monospace`;
      columns = Math.ceil(w / FONT);
      drops = Array.from({ length: columns }, () => Math.random() * -50);
      speeds = Array.from({ length: columns }, () => 0.3 + Math.random() * 0.5);
    };
    resize();
    window.addEventListener("resize", resize);

    const id = setInterval(() => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < columns; i++) {
        const x = i * FONT;
        const headY = drops[i] * FONT;
        for (let k = 0; k < TRAIL; k++) {
          const y = headY - k * FONT;
          if (y < -FONT || y > h + FONT) continue;
          const alpha = (1 - k / TRAIL) * (k === 0 ? 0.95 : 0.55);
          ctx.fillStyle = `rgba(0, 200, 150, ${alpha})`;
          ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], x, y);
        }
        drops[i] += speeds[i];
        if (headY - TRAIL * FONT > h && Math.random() > 0.97) {
          drops[i] = Math.random() * -20;
          speeds[i] = 0.3 + Math.random() * 0.5;
        }
      }
    }, 50);

    return () => {
      clearInterval(id);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full pointer-events-none"
      style={{ opacity }}
      aria-hidden="true"
    />
  );
}
