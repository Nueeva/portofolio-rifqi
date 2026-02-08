import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Shield, Terminal, ArrowLeft, Home, LucideIcon, ShieldOff, ServerCrash, AlertTriangle, Clock, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorConfig {
  code: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  httpStatus: string;
  logLines: (pathname: string, hostname: string) => string[];
}

const errorConfigs: Record<string, ErrorConfig> = {
  "403": {
    code: "403",
    title: "Forbidden",
    subtitle: "You don't have permission to access this resource",
    icon: ShieldOff,
    httpStatus: "HTTP/1.1 403 Forbidden",
    logLines: (pathname, hostname) => [
      `$ curl -I ${pathname}`,
      "HTTP/1.1 403 Forbidden",
      "Connection: keep-alive",
      `Host: ${hostname}`,
      "",
      ">> ERROR: Insufficient permissions",
      `>> PATH: ${pathname}`,
      ">> STATUS: FORBIDDEN",
      "",
      ">> Checking authorization headers...",
      ">> Token validation: FAILED",
      ">> Required clearance level: ADMIN",
      ">> Your clearance level: NONE",
      ">> Recommendation: Authenticate or contact admin.",
    ],
  },
  "404": {
    code: "404",
    title: "Access Denied",
    subtitle: "Page not found in the system",
    icon: Shield,
    httpStatus: "HTTP/1.1 404 Not Found",
    logLines: (pathname, hostname) => [
      `$ curl -I ${pathname}`,
      "HTTP/1.1 404 Not Found",
      "Connection: keep-alive",
      `Host: ${hostname}`,
      "",
      ">> ERROR: Route not found in routing table",
      `>> PATH: ${pathname}`,
      ">> STATUS: ACCESS_DENIED",
      "",
      ">> Scanning alternative routes...",
      ">> No matching endpoint detected.",
      ">> Recommendation: Return to safe zone.",
    ],
  },
  "500": {
    code: "500",
    title: "Internal Server Error",
    subtitle: "Something went wrong on our end",
    icon: ServerCrash,
    httpStatus: "HTTP/1.1 500 Internal Server Error",
    logLines: (pathname, hostname) => [
      `$ curl -I ${pathname}`,
      "HTTP/1.1 500 Internal Server Error",
      "Connection: close",
      `Host: ${hostname}`,
      "",
      ">> CRITICAL: Unhandled exception in server process",
      `>> PATH: ${pathname}`,
      ">> STATUS: INTERNAL_FAILURE",
      "",
      ">> Stack trace: [REDACTED]",
      ">> Process PID 31337 terminated unexpectedly",
      ">> Core dump saved to /var/log/crash/",
      ">> Auto-restart initiated...",
      ">> Recommendation: Try again later.",
    ],
  },
  "502": {
    code: "502",
    title: "Bad Gateway",
    subtitle: "The server received an invalid response",
    icon: AlertTriangle,
    httpStatus: "HTTP/1.1 502 Bad Gateway",
    logLines: (pathname, hostname) => [
      `$ curl -I ${pathname}`,
      "HTTP/1.1 502 Bad Gateway",
      "Connection: close",
      `Host: ${hostname}`,
      "",
      ">> ERROR: Upstream server returned invalid response",
      `>> PATH: ${pathname}`,
      ">> STATUS: BAD_GATEWAY",
      "",
      ">> Proxy: nginx/1.24.0",
      ">> Upstream: connection refused (111)",
      ">> Retry-After: 30s",
      ">> Recommendation: Upstream is down. Try again shortly.",
    ],
  },
  "503": {
    code: "503",
    title: "Service Unavailable",
    subtitle: "The server is temporarily unable to handle requests",
    icon: Clock,
    httpStatus: "HTTP/1.1 503 Service Unavailable",
    logLines: (pathname, hostname) => [
      `$ curl -I ${pathname}`,
      "HTTP/1.1 503 Service Unavailable",
      "Connection: keep-alive",
      `Host: ${hostname}`,
      "Retry-After: 60",
      "",
      ">> WARNING: Service temporarily offline",
      `>> PATH: ${pathname}`,
      ">> STATUS: MAINTENANCE_MODE",
      "",
      ">> Active maintenance window detected",
      ">> Estimated downtime: ~15 minutes",
      ">> All services will resume automatically.",
      ">> Recommendation: Please wait and try again.",
    ],
  },
  "429": {
    code: "429",
    title: "Too Many Requests",
    subtitle: "Rate limit exceeded — slow down",
    icon: Ban,
    httpStatus: "HTTP/1.1 429 Too Many Requests",
    logLines: (pathname, hostname) => [
      `$ curl -I ${pathname}`,
      "HTTP/1.1 429 Too Many Requests",
      "Connection: keep-alive",
      `Host: ${hostname}`,
      "Retry-After: 120",
      "",
      ">> WARNING: Rate limit threshold exceeded",
      `>> PATH: ${pathname}`,
      ">> STATUS: RATE_LIMITED",
      "",
      ">> Requests this window: 1000/100",
      ">> IP flagged for suspicious activity",
      ">> Cooldown period: 120 seconds",
      ">> Recommendation: Wait before retrying.",
    ],
  },
};

interface ErrorPageProps {
  statusCode?: string;
}

export const ErrorPage = ({ statusCode = "404" }: ErrorPageProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const config = errorConfigs[statusCode] || errorConfigs["404"];
  const [glitchText, setGlitchText] = useState(config.code);
  const [logLines, setLogLines] = useState<string[]>([]);
  const IconComponent = config.icon;

  useEffect(() => {
    console.error(`${config.code} Error:`, location.pathname);
  }, [location.pathname, config.code]);

  // Glitch effect
  useEffect(() => {
    const chars = "!@#$%^&*()_+-=[]{}|;':\",./<>?0123456789";
    const interval = setInterval(() => {
      const shouldGlitch = Math.random() > 0.7;
      if (shouldGlitch) {
        const glitched = config.code
          .split("")
          .map((c) => (Math.random() > 0.5 ? chars[Math.floor(Math.random() * chars.length)] : c))
          .join("");
        setGlitchText(glitched);
        setTimeout(() => setGlitchText(config.code), 150);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [config.code]);

  // Terminal log animation
  useEffect(() => {
    setLogLines([]);
    const lines = config.logLines(location.pathname, window.location.hostname);
    let i = 0;
    const interval = setInterval(() => {
      if (i < lines.length) {
        const currentLine = lines[i];
        setLogLines((prev) => [...prev, currentLine]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 120);
    return () => clearInterval(interval);
  }, [location.pathname, statusCode]);

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
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 text-destructive/80">
            <IconComponent className="h-6 w-6" />
            <span className="text-sm font-mono uppercase tracking-[0.3em]">{config.title}</span>
          </div>
          <h1
            className="text-8xl sm:text-9xl font-black font-mono text-primary tracking-tighter select-none"
            style={{ textShadow: "0 0 40px hsl(var(--primary) / 0.3), 0 0 80px hsl(var(--primary) / 0.1)" }}
          >
            {glitchText}
          </h1>
          <p className="text-lg text-muted-foreground font-mono">
            {config.subtitle}
          </p>
        </div>

        {/* Terminal */}
        <div className="rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50 bg-muted/30">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-accent-foreground/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-primary/50" />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono ml-2">
              <Terminal className="h-3 w-3" />
              <span>error_{config.code} — bash</span>
            </div>
          </div>
          <div className="p-4 font-mono text-xs sm:text-sm space-y-0.5 max-h-64 overflow-y-auto">
            {logLines.map((line, i) => (
              <div
                key={i}
                className={`${
                  line.startsWith(">> CRITICAL") || line.startsWith(">> ERROR") ? "text-destructive/80" :
                  line.startsWith(">> WARNING") ? "text-accent-foreground" :
                  line.startsWith(">>") ? "text-destructive/60" :
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

export default ErrorPage;
