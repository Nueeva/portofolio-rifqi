import { useEffect, useState } from "react";

interface WelcomeScreenProps {
  onComplete: () => void;
}

const BOOT_LINES = [
  "$ riva-os --boot portfolio",
  "mounting /dev/rifqi .............. OK",
  "loading security modules ......... OK",
  "establishing secure channel ...... OK",
  "access granted — welcome, guest",
];

/**
 * Boot-sequence welcome (once per session, gated in App): terminal log
 * lines reveal as the progress counter climbs to 100, then it fades out
 * on the same timing contract as the original welcome screen.
 */
export function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const [isAnimating, setIsAnimating] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const started = performance.now();
    const id = setInterval(() => {
      const elapsed = performance.now() - started;
      const p = Math.min(100, Math.floor((elapsed / 1050) * 100));
      setProgress(p);
      if (p >= 100) clearInterval(id);
    }, 24);

    const fadeTimer = setTimeout(() => setIsAnimating(false), 1200);
    const completeTimer = setTimeout(() => onComplete(), 1700);
    return () => {
      clearInterval(id);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const visibleLines = Math.min(
    BOOT_LINES.length,
    Math.floor((progress / 100) * (BOOT_LINES.length + 0.99))
  );

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-500 ${
        isAnimating ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden="true"
    >
      <div className="w-[min(88vw,30rem)] px-2 font-mono">
        <div className="mb-5 flex items-center gap-2 text-primary">
          <span className="text-2xl font-black tracking-tight">
            Rifqi<span className="text-foreground">A</span>
          </span>
          <span className="mt-1 animate-pulse text-lg">▊</span>
        </div>

        <div className="min-h-[7.5rem] space-y-1.5 text-[13px] leading-relaxed sm:text-sm">
          {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
            <p
              key={line}
              className={
                i === 0
                  ? "text-foreground"
                  : i === BOOT_LINES.length - 1
                    ? "text-primary"
                    : "text-muted-foreground"
              }
            >
              {line}
            </p>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="w-12 text-right text-sm tabular-nums text-primary">
            {progress}%
          </span>
        </div>
      </div>
    </div>
  );
}
