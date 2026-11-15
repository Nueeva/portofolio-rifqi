import { usePortfolioContent } from "@/hooks/usePortfolioContent";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Bot, Send } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { publicRivaReply, rivaGreeting } from "@/lib/publicRiva";

interface Message {
  from: "bot" | "user";
  text: string;
}

const quickTopics = [
  "Audit Apexsions (32 temuan)",
  "Arsitektur xssscope",
  "Keahlian Keamanan",
  "CTF & Tooling",
  "Kontak Langsung",
];

export function PublicRiva({ initiallyOpen = false }: { initiallyOpen?: boolean }) {
  const { projects } = usePortfolioContent();
  const [open, setOpen] = useState(initiallyOpen);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ from: "bot", text: rivaGreeting }]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, open]);

  function send(raw = input) {
    const text = raw.trim();
    if (!text || isTyping) return;
    setInput("");
    setMessages(current => [...current, { from: "user", text }]);
    setIsTyping(true);

    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      let reply = publicRivaReply(text, projects);
      if (reply.includes("halaman Karya") && !reply.includes("/projects")) {
        const lower = text.toLowerCase();
        if (lower.includes("apexsions") || lower.includes("audit")) {
          reply = reply.replace("halaman Karya", "/projects/curated-apexsions");
        } else if (lower.includes("xssscope") || lower.includes("xss")) {
          reply = reply.replace("halaman Karya", "/projects/curated-xssscope");
        } else if (lower.includes("portfolio 71") || lower.includes("smkn")) {
          reply = reply.replace("halaman Karya", "/projects/curated-portfolio71");
        } else if (lower.includes("ctf") || lower.includes("toolkit")) {
          reply = reply.replace("halaman Karya", "/projects/curated-ctf-toolkit");
        } else {
          reply = reply.replace("halaman Karya", "/projects");
        }
      }
      if (reply.includes("halaman Kontak") && !reply.includes("/contact")) {
        reply = reply.replace("halaman Kontak", "/contact");
      }
      if (reply.includes("halaman Tentang") && !reply.includes("/about")) {
        reply = reply.replace("halaman Tentang", "/about");
      }
      setMessages(current => [...current, { from: "bot", text: reply }]);
      setIsTyping(false);
    }, 420);
  }

  function renderMessageText(text: string): ReactNode {
    const pattern = /(\/(?:projects\/curated-[a-z0-9-]+|projects|contact|about))/g;
    const parts = text.split(pattern);
    if (parts.length === 1) return text;
    return parts.map((part, index) => {
      if (part.startsWith("/") && (part.startsWith("/projects") || part === "/contact" || part === "/about")) {
        return (
          <Link
            key={index}
            to={part}
            onClick={() => setOpen(false)}
            className="riva-route-pill"
          >
            {part}
          </Link>
        );
      }
      return part;
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={`public-riva-launcher ${isTyping ? "is-loading" : ""}`}
          aria-label="Buka RIVA, asisten portofolio"
        >
          <Bot aria-hidden="true" />
        </button>
      </DialogTrigger>
      <DialogContent className="public-riva-dialog" data-lenis-prevent>
        <DialogTitle>RIVA</DialogTitle>
        <DialogDescription>Asisten informasi portofolio Rifqi.</DialogDescription>
        <div
          className="riva-messages"
          ref={scrollRef}
          role="log"
          aria-label="Percakapan RIVA"
          aria-live="polite"
          data-lenis-prevent
        >
          {messages.map((message, index) => (
            <p key={index} data-from={message.from}>
              <span className="sr-only">{message.from === "bot" ? "RIVA: " : "Kamu: "}</span>
              {renderMessageText(message.text)}
            </p>
          ))}
          {isTyping && (
            <div className="riva-deliberating" role="status" aria-live="polite">
              <span className="riva-dot-pulse" aria-hidden="true" />
              <span className="text-xs text-[var(--site-muted)] font-mono">RIVA sedang menelaah sistem...</span>
            </div>
          )}
        </div>
        <div className="riva-shortcuts" aria-label="Topik cepat">
          {quickTopics.map(topic => (
            <button type="button" key={topic} onClick={() => send(topic)} disabled={isTyping}>
              {topic}
            </button>
          ))}
        </div>
        <form
          className="riva-form"
          onSubmit={event => {
            event.preventDefault();
            send();
          }}
        >
          <label htmlFor="riva-input" className="sr-only">
            Pertanyaan untuk RIVA
          </label>
          <input
            id="riva-input"
            value={input}
            onChange={event => setInput(event.target.value)}
            placeholder="Tanya tentang karya Rifqi"
            maxLength={500}
            disabled={isTyping}
          />
          <button type="submit" aria-label="Kirim pertanyaan" disabled={!input.trim() || isTyping}>
            <Send aria-hidden="true" />
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
