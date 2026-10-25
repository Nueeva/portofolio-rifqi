import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";

const GLYPHS = "!<>-_\\/[]{}=+*^?#01";

export interface ScramblePart {
  text: string;
  className?: string;
}

/**
 * Terminal decode effect: glyphs scramble, then resolve left-to-right
 * into the final text the first time the heading scrolls into view.
 */
export function ScrambleText({
  parts,
  className,
}: {
  parts: ScramblePart[];
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const full = parts.map((p) => p.text).join("");
  const totalFrames = full.length * 2 + 4;
  const [frame, setFrame] = useState(0);
  // Before mount, render the plain final text. The glyph pass uses
  // Math.random(), which can never match between a server prerender and
  // the client's first render — and crawlers should read the real words,
  // not glyphs. The decode animation starts right after mount as before.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <span ref={ref} className={className} role="text" aria-label={full}>
        {parts.map((part, pi) => (
          <span key={pi} className={part.className}>
            {part.text}
          </span>
        ))}
      </span>
    );
  }

  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => {
      setFrame((f) => {
        if (f >= totalFrames) {
          clearInterval(id);
          return f;
        }
        return f + 1;
      });
    }, 26);
    return () => clearInterval(id);
  }, [inView, totalFrames]);

  const revealed = Math.floor(frame / 2);
  let idx = 0;

  return (
    <span ref={ref} className={className} role="text" aria-label={full}>
      {parts.map((part, pi) => (
        <span key={pi} className={part.className} aria-hidden="true">
          {part.text.split("").map((ch, ci) => {
            const gi = idx++;
            if (ch === " ") return " ";
            if (gi < revealed) return ch;
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          })}
        </span>
      ))}
    </span>
  );
}
