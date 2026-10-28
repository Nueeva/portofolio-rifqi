import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

/**
 * Activity feed for the hero's bottom-left corner: a one-line ticker
 * cycling the owner's REAL recent GitHub activity (public events API)
 * under a real clock. If the API is unreachable, it falls back to
 * plain true statements about the work — the same figures the stats
 * row above states. Nothing here is simulated: a security portfolio
 * does not get to fake its telemetry. Decorative (aria-hidden).
 */

// True on the day they were written and consistent with the hero stats;
// they are the offline fallback, not the main act.
const FALLBACK_LINES = [
  "9 Paper plugins in production — Apexsions",
  "security audit — 32 findings found & fixed",
  "900+ AI models routed behind one gateway",
  "3 production systems live",
];

type GhEvent = {
  type: string;
  created_at: string;
  repo?: { name?: string };
  payload?: {
    action?: string;
    ref_type?: string;
    ref?: string | null;
    commits?: unknown[];
    pull_request?: { number?: number };
    issue?: { number?: number };
    release?: { tag_name?: string };
  };
};

function timeAgo(iso: string): string {
  const secs = Math.max(1, Math.floor((Date.now() - Date.parse(iso)) / 1000));
  if (secs < 3600) return `${Math.max(1, Math.floor(secs / 60))}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function describe(ev: GhEvent): string | null {
  const repo = ev.repo?.name;
  if (!repo) return null;
  const p = ev.payload ?? {};
  const when = timeAgo(ev.created_at);
  switch (ev.type) {
    case "PushEvent": {
      const n = Array.isArray(p.commits) ? p.commits.length : 0;
      return `push — ${repo}${n ? ` — ${n} commit${n === 1 ? "" : "s"}` : ""} — ${when}`;
    }
    case "CreateEvent":
      if (p.ref_type === "repository") return `new repo — ${repo} — ${when}`;
      return `created ${p.ref_type ?? "ref"}${p.ref ? ` ${p.ref}` : ""} — ${repo} — ${when}`;
    case "PullRequestEvent":
      return `pull request ${p.action ?? "updated"}${p.pull_request?.number ? ` #${p.pull_request.number}` : ""} — ${repo} — ${when}`;
    case "IssuesEvent":
      return `issue ${p.action ?? "updated"}${p.issue?.number ? ` #${p.issue.number}` : ""} — ${repo} — ${when}`;
    case "ReleaseEvent":
      return `release${p.release?.tag_name ? ` ${p.release.tag_name}` : ""} — ${repo} — ${when}`;
    case "WatchEvent":
      return `starred — ${repo} — ${when}`;
    case "ForkEvent":
      return `forked — ${repo} — ${when}`;
    case "PublicEvent":
      return `made public — ${repo} — ${when}`;
    default:
      return null;
  }
}

export function HeroFeed() {
  // Deterministic first line: the prerendered server HTML and the
  // client's first render must agree, or hydration fails with a text
  // mismatch and React throws the server markup away.
  const [lines, setLines] = useState<string[]>(FALLBACK_LINES);
  const [idx, setIdx] = useState(0);
  const [clock, setClock] = useState("");

  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString("en-GB", { hour12: false });
    setClock(fmt());
    const clockId = setInterval(() => setClock(fmt()), 1000);
    const lineId = setInterval(
      () => setIdx((i) => i + 1),
      2600,
    );
    return () => {
      clearInterval(clockId);
      clearInterval(lineId);
    };
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("https://api.github.com/users/Nueeva/events/public?per_page=30", {
      signal: ctrl.signal,
      headers: { Accept: "application/vnd.github+json" },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((events: GhEvent[]) => {
        const real = (Array.isArray(events) ? events : [])
          .map(describe)
          .filter((s): s is string => typeof s === "string")
          .slice(0, 8);
        if (real.length > 0) {
          setLines(real);
          setIdx(0);
        }
      })
      .catch(() => {
        /* offline or rate-limited — the fallback lines stay, by design */
      });
    return () => ctrl.abort();
  }, []);

  const line = lines[idx % lines.length];

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
