import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];
const DARK_BG = "hsl(220 20% 6%)";
const LIGHT_BG = "hsl(0 0% 100%)";

interface Reveal {
  x: number;
  y: number;
  r: number;
  toDark: boolean;
  phase: "expand" | "fade";
}

/**
 * Theme switch, Motion edition:
 * - knob slides on a spring, the sun/moon icon spins through the swap
 * - a circular sweep in the *new* theme color expands from the toggle,
 *   the theme flips underneath it, then the sweep fades away
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const busyRef = useRef(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  const handleThemeChange = () => {
    if (busyRef.current) return;
    const toDark = !isDark;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTheme(toDark ? "dark" : "light");
      return;
    }

    const rect = btnRef.current?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth - 40;
    const y = rect ? rect.top + rect.height / 2 : 24;
    const r =
      Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 60;

    busyRef.current = true;
    document.documentElement.classList.add("theme-transitioning");
    setReveal({ x, y, r, toDark, phase: "expand" });
  };

  if (!mounted) {
    return <div className="relative w-14 h-7 rounded-full bg-muted" />;
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleThemeChange}
        className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
          isDark
            ? "bg-primary/20 border border-primary/40"
            : "bg-secondary border border-border"
        }`}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        <motion.span
          className={`absolute top-0.5 left-0 flex items-center justify-center w-6 h-6 rounded-full shadow-md ${
            isDark ? "bg-primary text-primary-foreground" : "bg-background text-foreground"
          }`}
          initial={{ x: isDark ? 28 : 2 }}
          animate={{ x: isDark ? 28 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={isDark ? "moon" : "sun"}
              className="flex"
              initial={{ rotate: -120, opacity: 0, scale: 0.4 }}
              animate={{
                rotate: 0,
                opacity: 1,
                scale: 1,
                transition: { type: "spring", stiffness: 300, damping: 20 },
              }}
              exit={{ rotate: 120, opacity: 0, scale: 0.4, transition: { duration: 0.12 } }}
            >
              {isDark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
            </motion.span>
          </AnimatePresence>
        </motion.span>
      </button>

      {reveal &&
        createPortal(
          <motion.div
            className="fixed inset-0 z-[200] pointer-events-none"
            style={{ backgroundColor: reveal.toDark ? DARK_BG : LIGHT_BG }}
            initial={{
              clipPath: `circle(0px at ${reveal.x}px ${reveal.y}px)`,
              opacity: 1,
            }}
            animate={
              reveal.phase === "expand"
                ? { clipPath: `circle(${reveal.r}px at ${reveal.x}px ${reveal.y}px)`, opacity: 1 }
                : { clipPath: `circle(${reveal.r}px at ${reveal.x}px ${reveal.y}px)`, opacity: 0 }
            }
            transition={
              reveal.phase === "expand"
                ? { duration: 0.55, ease: EASE }
                : { duration: 0.35, ease: "easeOut" }
            }
            onAnimationComplete={() => {
              if (reveal.phase === "expand") {
                setTheme(reveal.toDark ? "dark" : "light");
                setReveal({ ...reveal, phase: "fade" });
              } else {
                document.documentElement.classList.remove("theme-transitioning");
                busyRef.current = false;
                setReveal(null);
              }
            }}
          />,
          document.body
        )}
    </>
  );
}
