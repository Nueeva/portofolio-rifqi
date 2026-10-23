import { useEffect, useState } from "react";

/**
 * Hyper-effect: RGB-split glitch. Fires on hover and in short automatic
 * bursts every few seconds. The split layers come from .glitch CSS in
 * index.css using the data-text attribute.
 */
export function GlitchText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const id = setInterval(() => {
      setBurst(true);
      timeout = setTimeout(() => setBurst(false), 320);
    }, 4200);
    return () => {
      clearInterval(id);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <span
      className={`glitch ${burst ? "glitching" : ""} ${className ?? ""}`}
      data-text={text}
    >
      {text}
    </span>
  );
}
