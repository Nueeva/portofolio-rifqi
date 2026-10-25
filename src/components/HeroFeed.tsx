import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

/**
 * Live ops feed for the hero's bottom-left corner: a one-line terminal
 * ticker cycling plausible network events under a real clock, so the
 * hero carries living content, not just texture. Pure DOM, one small
 * interval — negligible cost. Decorative (aria-hidden).
 */

const CITIES = ["SIN", "FRA", "NRT", "JKT", "AMS", "IAD", "SYD", "GRU"];
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const rnd = (min: number, max: number) =>
  Math.floor(min + Math.random() * (max - min));

function makeLine(): string {
  const kind = rnd(0, 5);
  switch (kind) {
    case 0:
      return `handshake TLS 1.3 ok — ${rnd(38, 210)}ms — edge ${pick(CITIES)}`;
    case 1:
      return `${rnd(800, 42000).toLocaleString("en-US")} packets routed — 0 dropped`;
    case 2:
      return `threat scan: ${rnd(9000, 64000).toLocaleString("en-US")} signatures — 0 hits`;
    case 3:
      return `session verified — ${pick(CITIES)} → JKT — integrity ok`;
    default:
      return `rule set v${rnd(2, 9)}.${rnd(0, 9)} synced — all nodes nominal`;
  }
}

export function HeroFeed() {
  // Deterministic first line: the prerendered server HTML and the
  // client's first render must agree, or hydration fails with a text
  // mismatch and React throws the server markup away. The interval
  // below takes over with random lines right after mount.
  const [line, setLine] = useState("handshake TLS 1.3 ok — 51ms — edge SIN");
  const [clock, setClock] = useState("");

  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString("en-GB", { hour12: false });
    setClock(fmt());
    const clockId = setInterval(() => setClock(fmt()), 1000);
    const lineId = setInterval(() => setLine(makeLine()), 2600);
    return () => {
      clearInterval(clockId);
      clearInterval(lineId);
    };
  }, []);

  return (
    <div
      className="absolute bottom-5 left-5 z-10 hidden items-center gap-2.5 font-mono text-[11px] text-muted-foreground/90 sm:flex"
      aria-hidden="true"
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        <span className="absolute h-full w-full animate-ping rounded-full bg-primary opacity-60" />
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      </span>
      <span className="tabular-nums text-primary/80">[{clock}]</span>
      <AnimatePresence mode="wait">
        <motion.span
          key={line}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          className="whitespace-nowrap"
        >
          ▸ {line}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
