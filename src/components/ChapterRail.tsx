import { useEffect, useState } from "react";
import { ArrowDown } from "lucide-react";

export interface Chapter {
  id: string;
  label: string;
}

// The home page is a guided story in chapters (hook → services → work →
// contact). The rail makes the visitor's position in that story visible
// and every chapter reachable in one click; the cue at the end of each
// chapter pulls the reader into the next one, so the page reads as a
// sequence instead of a pile of sections.
//
// SSR contract: the first render (prerender + client) always marks the
// first chapter active — deterministic markup, no hydration mismatch.
// The IntersectionObserver only takes over after mount, client-side.
export function ChapterRail({ chapters }: { chapters: Chapter[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = chapters.findIndex((c) => c.id === entry.target.id);
            if (idx >= 0) setActive(idx);
          }
        }
      },
      // A chapter counts as "current" when it crosses the viewport's
      // middle band.
      { rootMargin: "-40% 0px -55% 0px" }
    );
    for (const c of chapters) {
      const el = document.getElementById(c.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [chapters]);

  const goTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      aria-label="Bab halaman"
      className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-4 lg:flex"
    >
      {chapters.map((c, i) => (
        <button
          key={c.id}
          type="button"
          onClick={() => goTo(c.id)}
          aria-current={i === active ? "true" : undefined}
          className="group flex items-center justify-end gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
        >
          <span
            className={`font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
              i === active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
            }`}
          >
            {String(i + 1).padStart(2, "0")} {c.label}
          </span>
          <span
            className={`block rounded-full transition-all duration-300 ${
              i === active
                ? "h-2.5 w-2.5 bg-primary"
                : "h-1.5 w-1.5 bg-muted-foreground/50 group-hover:bg-foreground"
            }`}
          />
        </button>
      ))}
    </nav>
  );
}

// End-of-chapter pull: one clear next step, labelled with the chapter it
// leads to. The story never just stops.
export function NextChapter({
  targetId,
  index,
  label,
  className = "",
}: {
  targetId: string;
  index: number;
  label: string;
  className?: string;
}) {
  const goTo = () => {
    document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <div className={`flex justify-center ${className}`}>
      <button
        type="button"
        onClick={goTo}
        className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
      >
        Lanjut — Bab {String(index).padStart(2, "0")} · {label}
        <ArrowDown className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-y-0.5" />
      </button>
    </div>
  );
}
