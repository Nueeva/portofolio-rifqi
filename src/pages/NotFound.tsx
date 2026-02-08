import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Shield, Terminal, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [glitchText, setGlitchText] = useState("404");
  const [logLines, setLogLines] = useState<string[]>([]);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  // Glitch effect
  useEffect(() => {
    const chars = "!@#$%^&*()_+-=[]{}|;':\",./<>?0123456789";
    const interval = setInterval(() => {
      const shouldGlitch = Math.random() > 0.7;
      if (shouldGlitch) {
        const glitched = "404"
          .split("")
          .map((c) => (Math.random() > 0.5 ? chars[Math.floor(Math.random() * chars.length)] : c))
          .join("");
        setGlitchText(glitched);
        setTimeout(() => setGlitchText("404"), 150);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Terminal log animation
  useEffect(() => {
    const lines = [
      `$ curl -I ${location.pathname}`,
      "HTTP/1.1 404 Not Found",
      "Connection: keep-alive",
      `Host: ${window.location.hostname}`,
      "",
      ">> ERROR: Route not found in routing table",
      `>> PATH: ${location.pathname}`,
      ">> STATUS: ACCESS_DENIED",
      "",
      ">> Scanning alternative routes...",
      ">> No matching endpoint detected.",
      ">> Recommendation: Return to safe zone.",
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < lines.length) {
        setLogLines((prev) => [...prev, lines[i]]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 120);
    return () => clearInterval(interval);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
      }} />

      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{
        background: "repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--primary)) 2px, hsl(var(--primary)) 4px)",
      }} />

      <div className="relative z-10 max-w-2xl w-full space-y-8">
        {/* Glitch 404 */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 text-destructive/80">
            <Shield className="h-6 w-6" />
            <span className="text-sm font-mono uppercase tracking-[0.3em]">Access Denied</span>
          </div>
          <h1
            className="text-8xl sm:text-9xl font-black font-mono text-primary tracking-tighter select-none"
            style={{ textShadow: "0 0 40px hsl(var(--primary) / 0.3), 0 0 80px hsl(var(--primary) / 0.1)" }}
          >
            {glitchText}
          </h1>
          <p className="text-lg text-muted-foreground font-mono">
            Page not found in the system
          </p>
        </div>

        {/* Terminal */}
        <div className="rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50 bg-muted/30">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono ml-2">
              <Terminal className="h-3 w-3" />
              <span>error_log — bash</span>
            </div>
          </div>
          <div className="p-4 font-mono text-xs sm:text-sm space-y-0.5 max-h-64 overflow-y-auto">
            {logLines.map((line, i) => (
              <div
                key={i}
                className={`${
                  line.startsWith(">>") ? "text-destructive/80" :
                  line.startsWith("$") ? "text-primary" :
                  line.startsWith("HTTP") ? "text-accent-foreground" :
                  "text-muted-foreground"
                }`}
              >
                {line || "\u00A0"}
              </div>
            ))}
            <span className="inline-block w-2 h-4 bg-primary/70 animate-pulse" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="gap-2 font-mono"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Button
            onClick={() => navigate("/")}
            className="gap-2 font-mono"
          >
            <Home className="h-4 w-4" />
            Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
