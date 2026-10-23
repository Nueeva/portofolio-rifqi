import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";

/**
 * Global custom cursor (fine pointers only): a small emerald dot that
 * follows instantly, trailed by a spring ring. The ring grows over
 * interactive elements and becomes a labelled badge over anything with
 * data-cursor="VIEW" (project cards). Native cursor is hidden via the
 * .has-custom-cursor CSS rules except on form fields, where the custom
 * cursor hides itself instead.
 */
export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const [hovering, setHovering] = useState(false);
  const [onField, setOnField] = useState(false);
  const [pressed, setPressed] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 320, damping: 30, mass: 0.7 });
  const ringY = useSpring(y, { stiffness: 320, damping: 30, mass: 0.7 });

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setEnabled(true);
    document.documentElement.classList.add("has-custom-cursor");

    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const t = e.target as HTMLElement | null;
      if (!t || typeof t.closest !== "function") return;
      setOnField(!!t.closest("input, textarea, select"));
      const labelled = t.closest<HTMLElement>("[data-cursor]");
      setLabel(labelled?.dataset.cursor ?? null);
      setHovering(!!t.closest("a, button, [data-cursor], [role='button']"));
    };
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
    };
  }, [x, y]);

  if (!enabled) return null;

  const size = label ? 68 : hovering ? 46 : 30;

  return (
    <>
      {/* Trailing ring / label badge */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[90]"
        style={{ x: ringX, y: ringY, opacity: onField ? 0 : 1 }}
        aria-hidden="true"
      >
        <motion.div
          className="flex items-center justify-center rounded-full border border-primary/70 bg-primary/10"
          style={{ translate: "-50% -50%" }}
          animate={{
            width: size,
            height: size,
            scale: pressed ? 0.85 : 1,
          }}
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
        >
          <AnimatePresence>
            {label && (
              <motion.span
                key={label}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                className="font-mono text-[10px] font-bold tracking-[0.2em] text-primary"
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
      {/* Instant dot */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[90] h-1.5 w-1.5 rounded-full bg-primary"
        style={{ x, y, translate: "-50% -50%", opacity: onField || label ? 0 : 1 }}
        aria-hidden="true"
      />
    </>
  );
}
