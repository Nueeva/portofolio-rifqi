import { useEffect, useRef } from "react";

interface Dot {
  x: number;
  y: number;
  born: number;
}

const LIFE_MS = 650;
const MAX_DOTS = 70;
const MIN_DIST = 7;

/**
 * After-effect: emerald afterimage dots trail the cursor inside the hero,
 * swelling slightly then fading — like a long-exposure light trail.
 * Canvas is scoped to its (relative) parent; pointer-events stay off.
 */
export function CursorTrail({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      w = parent.clientWidth;
      h = parent.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const dots: Dot[] = [];
    let lastX = -999;
    let lastY = -999;
    let raf = 0;
    let loopRunning = false;

    // The render loop only runs while a trail is alive — an idle hero
    // costs zero frames.
    const frame = (now: number) => {
      ctx.clearRect(0, 0, w, h);
      for (let i = dots.length - 1; i >= 0; i--) {
        const d = dots[i];
        const age = (now - d.born) / LIFE_MS;
        if (age >= 1) {
          dots.splice(i, 1);
          continue;
        }
        const radius = 1 + Math.sin(age * Math.PI) * 3.2;
        ctx.beginPath();
        ctx.arc(d.x, d.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(160, 84%, 45%, ${(1 - age) * 0.5})`;
        ctx.fill();
      }
      if (dots.length > 0) {
        raf = requestAnimationFrame(frame);
      } else {
        loopRunning = false;
        ctx.clearRect(0, 0, w, h);
      }
    };

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (Math.hypot(x - lastX, y - lastY) < MIN_DIST) return;
      lastX = x;
      lastY = y;
      dots.push({ x, y, born: performance.now() });
      if (dots.length > MAX_DOTS) dots.splice(0, dots.length - MAX_DOTS);
      if (!loopRunning) {
        loopRunning = true;
        raf = requestAnimationFrame(frame);
      }
    };
    parent.addEventListener("mousemove", onMove);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      parent.removeEventListener("mousemove", onMove);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
