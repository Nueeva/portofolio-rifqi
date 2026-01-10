import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck } from "lucide-react";

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
    const [scriptReady, setScriptReady] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    // Expose reset method to parent
    useImperativeHandle(ref, () => ({
      reset: () => {
        const turnstile = getTurnstile();
        if (widgetIdRef.current && turnstile) {
          try {
            turnstile.reset(widgetIdRef.current);
          } catch (e) {
            // Widget might not exist
          }
        }
      },
    }));

    // Render the widget
    const renderWidget = useCallback(() => {
      const turnstile = getTurnstile();
      
      if (!turnstile || !containerRef.current) {
        return false;
      }

      // Remove existing widget if any
      if (widgetIdRef.current) {
        try {
          turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        } catch (e) {
          // Widget might already be removed
        }
      }

      // Clear container
      containerRef.current.innerHTML = "";

      try {
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token: string) => {
            onVerify(token);
          },
          "expired-callback": () => {
            onExpire?.();
          },
          "error-callback": () => {
            onError?.();
          },
          theme,
        });
        setIsLoading(false);
        return true;
      } catch (error) {
        console.error("Failed to render Turnstile:", error);
        return false;
      }
    }, [onVerify, onExpire, onError, theme]);

    // Load script
    useEffect(() => {
      const checkAndSetReady = () => {
        if (getTurnstile()) {
          setScriptReady(true);
          return;
        }

        // Retry until ready (max 10 seconds)
        let attempts = 0;
        const checkInterval = setInterval(() => {
          attempts++;
          if (getTurnstile()) {
            clearInterval(checkInterval);
            setScriptReady(true);
          } else if (attempts >= 100) {
            clearInterval(checkInterval);
          }
        }, 100);
      };

      // Check if script already exists
      if (document.querySelector('script[src*="turnstile"]')) {
        checkAndSetReady();
        return;
      }

      const script = document.createElement("script");
      script.src = TURNSTILE_SCRIPT_URL;
      script.async = true;
      script.onload = checkAndSetReady;
      script.onerror = () => {
        console.error("Failed to load Turnstile script");
        setIsLoading(false);
      };
      document.head.appendChild(script);
    }, []);

    // Render widget when script is ready and container is mounted
    useEffect(() => {
      if (!scriptReady) return;

      let cancelled = false;

      const tryRender = (attempt = 0) => {
        if (cancelled) return;

        if (containerRef.current && renderWidget()) {
          return;
        }

        // Retry up to 50 times (2.5 seconds)
        if (attempt < 50) {
          setTimeout(() => tryRender(attempt + 1), 50);
        }
      };

      // Start trying on next tick
      setTimeout(() => tryRender(), 0);

      return () => {
        cancelled = true;
      };
    }, [scriptReady, renderWidget]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        const turnstile = getTurnstile();
        if (widgetIdRef.current && turnstile) {
          try {
            turnstile.remove(widgetIdRef.current);
          } catch (e) {
            // Widget might already be removed
          }
        }
      };
    }, []);

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
        <div 
          ref={containerRef} 
          className={isLoading ? "hidden" : "flex justify-center"}
        />
      </div>
    );
  }
);

TurnstileCaptcha.displayName = "TurnstileCaptcha";
