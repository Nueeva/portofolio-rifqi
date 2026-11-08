import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { usePublicDesign } from "@/components/public/PublicDesignContext";


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
  siteKey?: string;
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

const TurnstileWidget = forwardRef<TurnstileCaptchaRef, TurnstileCaptchaProps>(
  ({ onVerify, onExpire, onError, theme = "dark", className, siteKey }, ref) => {
    const { isPublic } = usePublicDesign();
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
      const loadTimeout = isPublic ? setTimeout(() => {
        if (!cancelled && !getTurnstile()) {
          setIsLoading(false);
          const script = document.querySelector<HTMLScriptElement>('script[src*="turnstile"]');
          if (script) script.dataset.loadState = "error";
          onErrorRef.current?.();
        }
      }, 10_000) : undefined;
      if (isPublic) {
        setIsLoading(true);
        setIsVerified(false);
        const failedScript = document.querySelector<HTMLScriptElement>('script[src*="turnstile"][data-load-state="error"]');
        failedScript?.remove();
      }

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
            sitekey: siteKey!,
            callback: (token: string) => {
              if (cancelled) return;
              setIsVerified(true);
              onVerifyRef.current(token);
            },
            "expired-callback": () => {
              if (cancelled) return;
              setIsVerified(false);
              onExpireRef.current?.();
            },
            "error-callback": () => {
              if (cancelled) return;
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
            if (isPublic) {
              const script = document.querySelector<HTMLScriptElement>('script[src*="turnstile"]');
              if (script && !getTurnstile()) script.dataset.loadState = "error";
              onErrorRef.current?.();
            }
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
          if (isPublic) script.dataset.loadState = "error";
          if (!cancelled) {
            setIsLoading(false);
            if (isPublic) onErrorRef.current?.();
          }
        };
        document.head.appendChild(script);
      }

      // Cleanup on unmount
      return () => {
        cancelled = true;
        if (loadTimeout) clearTimeout(loadTimeout);
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
    }, [theme, isPublic, siteKey]);

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
          <div data-captcha="verified" className="flex items-center justify-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30 animate-fade-in">
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

TurnstileWidget.displayName = "TurnstileCaptcha";

export const TurnstileCaptcha=forwardRef<TurnstileCaptchaRef,TurnstileCaptchaProps>((props,ref)=>{
 const widget=useRef<TurnstileCaptchaRef>(null);
 const [config,setConfig]=useState<{captchaEnabled:boolean;captchaSiteKey:string|null}|null>(null);const [failed,setFailed]=useState(false);const latest=useRef(props.onVerify);latest.current=props.onVerify;
 useEffect(()=>{const controller=new AbortController();void fetch("/api/config",{signal:controller.signal}).then(response=>{if(!response.ok)throw Error();return response.json();}).then(setConfig).catch(()=>{if(!controller.signal.aborted)setFailed(true);});return()=>controller.abort();},[]);
 useEffect(()=>{if(config&&!config.captchaEnabled)latest.current("rate-limit-only");},[config]);
 useImperativeHandle(ref,()=>({reset:()=>{if(config?.captchaEnabled)widget.current?.reset();else if(config)latest.current("rate-limit-only");}}),[config]);
 if(failed)return <p role="alert">Layanan keamanan belum terhubung. Muat ulang untuk mencoba lagi.</p>;
 if(!config)return <p role="status">Menghubungkan layanan keamanan…</p>;
 if(!config.captchaEnabled)return <p className="text-sm" role="status">Pembatasan percobaan aktif. CAPTCHA belum diaktifkan.</p>;
 return <TurnstileWidget {...props} siteKey={config.captchaSiteKey??undefined} ref={widget}/>;
});
