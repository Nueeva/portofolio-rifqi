import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, CheckCircle2 } from "lucide-react";

const TURNSTILE_SITE_KEY = "0x4AAAAAACLFADmrVmL9XOiI";
const TURNSTILE_SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileInstance {
  render: (
    container: string | HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
      theme?: "light" | "dark" | "auto";
    }
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}

interface TurnstileCaptchaProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: "light" | "dark" | "auto";
  className?: string;
}

export interface TurnstileCaptchaRef {
  reset: () => void;
}

const getTurnstile = (): TurnstileInstance | undefined => {
  return (window as unknown as { turnstile?: TurnstileInstance }).turnstile;
};

export const TurnstileCaptcha = forwardRef<TurnstileCaptchaRef, TurnstileCaptchaProps>(
  ({ onVerify, onExpire, onError, theme = "dark", className }, ref) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isVerified, setIsVerified] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const isRenderedRef = useRef(false);
    
    // Use refs to store callbacks to prevent re-renders from triggering re-initialization
    const onVerifyRef = useRef(onVerify);
    const onExpireRef = useRef(onExpire);
    const onErrorRef = useRef(onError);
    
    // Update refs when props change
    useEffect(() => {
      onVerifyRef.current = onVerify;
      onExpireRef.current = onExpire;
      onErrorRef.current = onError;
    }, [onVerify, onExpire, onError]);

    // Expose reset method to parent
    useImperativeHandle(ref, () => ({
      reset: () => {
        const turnstile = getTurnstile();
        if (widgetIdRef.current && turnstile) {
          try {
            turnstile.reset(widgetIdRef.current);
            setIsVerified(false);
          } catch (e) {
            // Widget might not exist
          }
        }
      },
    }));

    // Load script and render widget - run only once on mount
    useEffect(() => {
      let cancelled = false;
      let pollInterval: ReturnType<typeof setInterval>;

      const renderWidget = () => {
        const turnstile = getTurnstile();
        
        if (!turnstile || !containerRef.current || isRenderedRef.current) {
          return false;
        }

        // Clear container using safer DOM manipulation (avoid innerHTML)
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }

        try {
          widgetIdRef.current = turnstile.render(containerRef.current, {
            sitekey: TURNSTILE_SITE_KEY,
            callback: (token: string) => {
              setIsVerified(true);
              onVerifyRef.current(token);
            },
            "expired-callback": () => {
              setIsVerified(false);
              onExpireRef.current?.();
            },
            "error-callback": () => {
              setIsVerified(false);
              onErrorRef.current?.();
            },
            theme,
          });
          isRenderedRef.current = true;
          setIsLoading(false);
          return true;
        } catch (error) {
          console.error("Failed to render Turnstile:", error);
          return false;
        }
      };

      const startPolling = () => {
        let attempts = 0;
        pollInterval = setInterval(() => {
          if (cancelled) {
            clearInterval(pollInterval);
            return;
          }
          
          attempts++;
          
          // Try to render if container is ready
          if (containerRef.current && renderWidget()) {
            clearInterval(pollInterval);
            return;
          }
          
          // Give up after 10 seconds
          if (attempts >= 100) {
            clearInterval(pollInterval);
            setIsLoading(false);
          }
        }, 100);
      };

      // Check if script already loaded
      if (getTurnstile()) {
        // Script already loaded, just need to wait for container
        startPolling();
      } else if (document.querySelector('script[src*="turnstile"]')) {
        // Script tag exists but not loaded yet
        startPolling();
      } else {
        // Need to load script
        const script = document.createElement("script");
        script.src = TURNSTILE_SCRIPT_URL;
        script.async = true;
        script.onload = () => {
          if (!cancelled) startPolling();
        };
        script.onerror = () => {
          console.error("Failed to load Turnstile script");
          if (!cancelled) setIsLoading(false);
        };
        document.head.appendChild(script);
      }

      // Cleanup on unmount
      return () => {
        cancelled = true;
        if (pollInterval) clearInterval(pollInterval);
        
        const turnstile = getTurnstile();
        if (widgetIdRef.current && turnstile) {
          try {
            turnstile.remove(widgetIdRef.current);
            widgetIdRef.current = null;
            isRenderedRef.current = false;
          } catch (e) {
            // Widget might already be removed
          }
        }
      };
    }, [theme]); // Only re-run if theme changes

    return (
      <div className={className}>
        {isLoading && (
          <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
            <ShieldCheck className="h-5 w-5 text-muted-foreground animate-pulse" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        )}
        
        {/* Success overlay */}
        {isVerified && !isLoading && (
          <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30 animate-fade-in">
            <div className="relative">
              <CheckCircle2 className="h-6 w-6 text-green-500 animate-scale-in" />
              <div className="absolute inset-0 h-6 w-6 rounded-full bg-green-500/20 animate-ping" />
            </div>
            <span className="text-sm font-medium text-green-500">
              Verifikasi berhasil
            </span>
          </div>
        )}
        
        <div 
          ref={containerRef} 
          className={isLoading || isVerified ? "hidden" : "flex justify-center"}
        />
      </div>
    );
  }
);

TurnstileCaptcha.displayName = "TurnstileCaptcha";
