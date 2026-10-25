import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
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

interface ViewTransitionHandle {
  ready: Promise<void>;
  finished: Promise<void>;
}

type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => ViewTransitionHandle;
};

/**
 * Theme switch, View Transition edition:
 * - knob slides on a spring, the sun/moon icon spins through the swap
 * - where the View Transitions API is available, the browser snapshots the
 *   page in the old and new theme and the *actual new page* is revealed by
 *   an expanding circle from the toggle — every component changes in the
 *   same frame, because the animation runs on the snapshots, not on the
 *   live elements (the old build flipped the theme under a flat-color
 *   sweep, then let each element catch up on its own 0.4s transition,
 *   which read as a staggered flicker)
 * - fallback (older browsers): the flat sweep covers the screen, the theme
 *   flips instantly and all at once underneath it, then the sweep fades
 * - reduced-motion: direct switch, no animation at all
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

  const applyThemeNow = (toDark: boolean) => {
    setTheme(toDark ? "dark" : "light");
    // Belt and braces for the view-transition snapshot: next-themes applies
    // the class in an effect; sync it by hand inside the update callback so
    // the captured "new" page is guaranteed to already wear the new theme.
    document.documentElement.classList.toggle("dark", toDark);
    document.documentElement.classList.toggle("light", !toDark);
    document.documentElement.style.colorScheme = toDark ? "dark" : "light";
  };

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

    const doc = document as DocumentWithViewTransition;
    if (typeof doc.startViewTransition === "function") {
      busyRef.current = true;
      const transition = doc.startViewTransition(() => {
        flushSync(() => {
          applyThemeNow(toDark);
        });
      });
      transition.ready
        .then(() => {
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${r}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 550,
              easing: "cubic-bezier(0.25, 0.1, 0.25, 1)",
              pseudoElement: "::view-transition-new(root)",
            }
          );
        })
        .catch(() => {
          /* transition skipped by the browser — theme already applied */
        });
      transition.finished.finally(() => {
        busyRef.current = false;
      });
      return;
    }

    // Fallback: flat-color sweep; the theme flips instantly (no per-element
    // transitions exist anymore) while the sweep is fully opaque, so the
    // whole page is already in the new theme when the fade reveals it.
    busyRef.current = true;
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
                applyThemeNow(reveal.toDark);
                setReveal({ ...reveal, phase: "fade" });
              } else {
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
