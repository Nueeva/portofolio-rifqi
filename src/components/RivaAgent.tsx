import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bot, Send, X } from "lucide-react";

/**
 * R.I.V.A. — Rifqi's Intelligent Virtual Assistant.
 * A scripted on-site agent: keyword-matched answers about Rifqi, his
 * projects and skills, with a typewriter delivery. No backend needed.
 */

interface Msg {
  from: "bot" | "user";
  text: string;
}

const GREETING =
  "Hi, I'm R.I.V.A. — Rifqi's Intelligent Virtual Assistant. Ask me about his projects, skills, or how to reach him. Try one of the shortcuts below.";

interface Intent {
  keys: string[];
  reply: string;
}

const INTENTS: Intent[] = [
  {
    keys: ["xssscope", "xss"],
    reply:
      "xssscope is Rifqi's reflected-XSS scanner written in Go — 94 payloads, WAF-bypass variants, and blind-XSS callback support. It's open source on his GitHub (Nueeva/xssscope).",
  },
  {
    keys: ["apexsions", "minecraft", "plugin"],
    reply:
      "Apexsions is Rifqi's Minecraft server project: 9 Paper plugins (Core, Economy, FFA, Lobby, Minigames and more) built as a Maven monorepo. He ran a full security audit on it — 13 Critical and 19 Major findings, all fixed — and deployed it to production himself.",
  },
  {
    keys: ["portfolio 71", "portfolio71", "smkn", "school project", "sekolah"],
    reply:
      "Portfolio 71 is the student-portfolio platform Rifqi leads at SMKN 71 Jakarta (Laravel + Nuxt, live at portofolio.apexsions.com). It runs real catalog, review and showcase workflows for students and teachers — and yes, it has a butterfly intro he is very proud of.",
  },
  {
    keys: ["ctf", "toolkit", "capture the flag"],
    reply:
      "CTF-Toolkit is Rifqi's one-command installer that sets up 40+ security tools — web, forensics, crypto, OSINT and more — in about five minutes. Built from his own CTF workflow.",
  },
  {
    keys: ["project", "proyek", "portfolio", "works", "built", "karya"],
    reply:
      "Rifqi's featured work: (1) xssscope — a Go-based reflected-XSS scanner with 94 payloads; (2) Apexsions — 9 production Minecraft plugins, fully audited; (3) Portfolio 71 — his school's student-portfolio platform; (4) CTF-Toolkit — a 40+ tool security setup installer. Full details live on the Projects page.",
  },
  {
    keys: ["skill", "stack", "tech", "bahasa", "language", "tools", "bisa apa", "keahlian"],
    reply:
      "Core stack: TypeScript + React and Vue/Nuxt on the front, PHP/Laravel and Go on the back, Python for tooling. On the security side: web vulnerability assessment, CTF (web & forensics), Linux server hardening, and CI/CD with GitHub Actions.",
  },
  {
    keys: ["who", "about", "siapa", "rifqi itu", "profil"],
    reply:
      "Rifqi Ariansyah is a cybersecurity-focused developer and student at SMKN 71 Jakarta. He founded the Apexsions Minecraft server, leads development of his school's Portfolio 71 platform, and publishes open-source security tools as Nueeva on GitHub.",
  },
  {
    keys: ["contact", "email", "hubungi", "reach", "kontak"],
    reply:
      "You can reach Rifqi through the Contact page on this site (the form is Turnstile-protected), or via the email and social links in the footer. For project work, the contact form is the fastest route.",
  },
  {
    keys: ["hire", "freelance", "job", "kerja", "magang", "intern"],
    reply:
      "Rifqi is open to freelance security and web projects, and to internship opportunities in security engineering. The fastest way in is the Contact page — tell him what you're building and he'll reply personally (I just do the intros).",
  },
  {
    keys: ["cv", "resume", "unduh", "download"],
    reply:
      "His CV lives on the About page — there's a Download CV button in the profile card. It points at the latest PDF he uploaded, so it's always current.",
  },
  {
    keys: ["hack", "bobol", "retas", "exploit"],
    reply:
      "Only with permission. Rifqi's security work is CTF competitions, his own systems, and authorized testing — that's exactly why his tools ship with detection and hardening notes, not just payloads.",
  },
  {
    keys: ["harga", "price", "bayar", "cost", "berapa"],
    reply:
      "Pricing depends on scope — audits, plugins, and web builds are all different animals. Drop the details through the Contact page and Rifqi will quote you directly.",
  },
  {
    keys: ["terima kasih", "thanks", "thank", "makasih"],
    reply: "Anytime. That's what I'm here for — anything else about Rifqi's work?",
  },
  {
    keys: ["halo", "hello", "hi", "hey", "hai", "pagi", "siang", "malam"],
    reply:
      "Hello! Good to see you. Want the quick tour? Ask me about Rifqi's projects, his skill set, or how to get in touch with him.",
  },
];

const FALLBACK =
  "I can answer questions about Rifqi's projects (xssscope, Apexsions, Portfolio 71, CTF-Toolkit), his skills, or how to contact him. Try one of those — or use the shortcuts below.";

const CHIPS = ["Show projects", "Skills & stack", "Who is Rifqi?", "How to contact"];

function answerFor(input: string): string {
  const q = input.toLowerCase();
  for (const intent of INTENTS) {
    if (intent.keys.some((k) => q.includes(k))) return intent.reply;
  }
  if (q.includes("show projects")) return INTENTS[4].reply;
  if (q.includes("skills")) return INTENTS[5].reply;
  if (q.includes("who is rifqi")) return INTENTS[6].reply;
  if (q.includes("how to contact")) return INTENTS[7].reply;
  return FALLBACK;
}

export function RivaAgent() {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [typing, setTyping] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const scrollDown = () => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  };

  useEffect(scrollDown, [messages, thinking, typing, open]);

  useEffect(() => {
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const botSay = (text: string) => {
    setThinking(true);
    timers.current.push(
      setTimeout(() => {
        setThinking(false);
        setTyping("");
        let i = 0;
        const id = setInterval(() => {
          i += 3;
          setTyping(text.slice(0, i));
          if (i >= text.length) {
            clearInterval(id);
            setTyping(null);
            setMessages((m) => [...m, { from: "bot", text }]);
          }
        }, 12);
        timers.current.push(id as unknown as ReturnType<typeof setTimeout>);
      }, 450)
    );
  };

  const openChat = () => {
    setOpen(true);
    setSeen(true);
    if (messages.length === 0 && !typing) {
      timers.current.push(setTimeout(() => botSay(GREETING), 250));
    }
  };

  const send = (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || thinking || typing !== null) return;
    setInput("");
    setMessages((m) => [...m, { from: "user", text }]);
    botSay(answerFor(text));
  };

  return (
    <>
      {/* Launcher */}
      <motion.button
        type="button"
        onClick={() => (open ? setOpen(false) : openChat())}
        className="fixed bottom-6 right-6 z-[70] flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        aria-label={open ? "Close R.I.V.A. assistant" : "Chat with R.I.V.A., Rifqi's virtual assistant"}
      >
        {open ? <X className="h-5 w-5" /> : <Bot className="h-6 w-6" />}
        {!seen && !open && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-background bg-primary" />
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed bottom-24 right-6 z-[70] flex h-[520px] max-h-[70vh] w-[min(92vw,24rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            role="dialog"
            aria-label="Chat with R.I.V.A."
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Bot className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-sm font-bold tracking-wide">
                  R.I.V.A.
                </p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Rifqi's Intelligent Virtual Assistant
                </p>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.from === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {m.text}
                </div>
              ))}
              {thinking && (
                <div className="max-w-[85%] rounded-2xl bg-secondary px-3.5 py-3">
                  <span className="flex gap-1">
                    {[0, 1, 2].map((d) => (
                      <motion.span
                        key={d}
                        className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
                        animate={{ opacity: [0.25, 1, 0.25] }}
                        transition={{ duration: 0.9, repeat: Infinity, delay: d * 0.18 }}
                      />
                    ))}
                  </span>
                </div>
              )}
              {typing !== null && (
                <div className="max-w-[85%] rounded-2xl bg-secondary px-3.5 py-2.5 text-sm leading-relaxed text-secondary-foreground">
                  {typing}
                  <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-primary align-middle" />
                </div>
              )}
            </div>

            {/* Quick replies */}
            <div className="flex flex-wrap gap-1.5 px-4 pb-2">
              {CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => send(chip)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/50 hover:text-primary"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input */}
            <form
              className="flex items-center gap-2 border-t border-border px-3 py-3"
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about projects, skills…"
                className="min-w-0 flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary/60"
                aria-label="Type a message for R.I.V.A."
              />
              <motion.button
                type="submit"
                whileTap={{ scale: 0.9 }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
