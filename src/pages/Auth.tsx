import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Shield, LogIn, UserPlus, Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "";

const authSchema = z.object({
  email: z.string().trim().email({ message: "Email tidak valid" }),
  password: z.string().min(6, { message: "Password minimal 6 karakter" }),
});

interface TurnstileInstance {
  render: (container: string | HTMLElement, options: {
    sitekey: string;
    callback: (token: string) => void;
    'expired-callback'?: () => void;
    'error-callback'?: () => void;
    theme?: 'light' | 'dark' | 'auto';
  }) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileReady, setTurnstileReady] = useState(false);
  const turnstileWidgetId = useRef<string | null>(null);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const getTurnstile = (): TurnstileInstance | undefined => {
    return (window as unknown as { turnstile?: TurnstileInstance }).turnstile;
  };

  const renderTurnstile = useCallback(() => {
    const turnstile = getTurnstile();
    if (!turnstile || !turnstileContainerRef.current || !TURNSTILE_SITE_KEY) {
      console.log("Cannot render Turnstile:", { 
        hasTurnstile: !!turnstile, 
        hasContainer: !!turnstileContainerRef.current, 
        hasSiteKey: !!TURNSTILE_SITE_KEY 
      });
      return;
    }
    
    // Clear previous widget if exists
    if (turnstileWidgetId.current) {
      try {
        turnstile.remove(turnstileWidgetId.current);
        turnstileWidgetId.current = null;
      } catch (e) {
        console.log("Widget already removed");
      }
    }
    
    // Clear container
    turnstileContainerRef.current.innerHTML = '';
    
    try {
      turnstileWidgetId.current = turnstile.render(turnstileContainerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token: string) => {
          console.log("Turnstile token received");
          setTurnstileToken(token);
        },
        'expired-callback': () => {
          console.log("Turnstile token expired");
          setTurnstileToken(null);
        },
        'error-callback': () => {
          console.error("Turnstile error");
          setTurnstileToken(null);
        },
        theme: 'auto',
      });
      console.log("Turnstile widget rendered");
    } catch (error) {
      console.error("Failed to render Turnstile:", error);
    }
  }, []);

  // Load Turnstile script
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) {
      console.warn("Turnstile site key not configured");
      return;
    }

    // Check if turnstile is already loaded
    const turnstile = getTurnstile();
    if (turnstile) {
      setTurnstileReady(true);
      return;
    }

    // Set up callback before loading script
    (window as unknown as { onTurnstileLoad?: () => void }).onTurnstileLoad = () => {
      console.log("Turnstile loaded successfully");
      setTurnstileReady(true);
    };

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
    if (existingScript) {
      // Script exists, wait for it to load
      const checkReady = setInterval(() => {
        if (getTurnstile()) {
          clearInterval(checkReady);
          setTurnstileReady(true);
        }
      }, 100);
      
      // Cleanup interval after 10 seconds
      setTimeout(() => clearInterval(checkReady), 10000);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit';
    script.async = true;
    document.head.appendChild(script);

    script.onerror = () => {
      console.error("Failed to load Turnstile script");
    };

    return () => {
      delete (window as unknown as { onTurnstileLoad?: () => void }).onTurnstileLoad;
    };
  }, []);

  // Render widget when ready
  useEffect(() => {
    if (turnstileReady) {
      renderTurnstile();
    }
  }, [turnstileReady, renderTurnstile]);

  useEffect(() => {
    if (!loading && user) {
      navigate("/admin");
    }
  }, [user, loading, navigate]);

  const validateForm = () => {
    try {
      authSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: { email?: string; password?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === "email") newErrors.email = err.message;
          if (err.path[0] === "password") newErrors.password = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const verifyTurnstile = async (token: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-turnstile', {
        body: { token },
      });
      
      if (error) {
        console.error("Turnstile verification error:", error);
        return false;
      }
      
      return data?.success === true;
    } catch (err) {
      console.error("Failed to verify Turnstile:", err);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Check Turnstile verification
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      toast({
        title: "Verifikasi Diperlukan",
        description: "Silakan selesaikan verifikasi keamanan",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Verify Turnstile token on server
      if (TURNSTILE_SITE_KEY && turnstileToken) {
        const isValid = await verifyTurnstile(turnstileToken);
        if (!isValid) {
          toast({
            title: "Verifikasi Gagal",
            description: "Verifikasi keamanan gagal, silakan coba lagi",
            variant: "destructive",
          });
          // Reset Turnstile
          setTurnstileToken(null);
          const turnstile = getTurnstile();
          if (turnstileWidgetId.current && turnstile) {
            turnstile.reset(turnstileWidgetId.current);
          }
          setIsSubmitting(false);
          return;
        }
      }

      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Login Gagal",
              description: "Email atau password salah",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Login Gagal",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Login Berhasil",
            description: "Selamat datang kembali!",
          });
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes("User already registered")) {
            toast({
              title: "Registrasi Gagal",
              description: "Email sudah terdaftar",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Registrasi Gagal",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Registrasi Berhasil",
            description: "Akun berhasil dibuat, silakan login",
          });
          setIsLogin(true);
        }
      }
    } finally {
      setIsSubmitting(false);
      // Reset Turnstile after submission
      setTurnstileToken(null);
      const turnstile = getTurnstile();
      if (turnstileWidgetId.current && turnstile) {
        turnstile.reset(turnstileWidgetId.current);
      }
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">
              {isLogin ? "Login Admin" : "Registrasi"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isLogin 
                ? "Masuk untuk mengelola portofolio" 
                : "Buat akun baru"}
            </p>
          </div>

          <div className="p-6 rounded-lg bg-card border border-border">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={errors.email ? "border-destructive" : ""}
                />
                <div className={`overflow-hidden transition-all duration-300 ease-out ${errors.email ? 'max-h-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="text-sm text-destructive">{errors.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={errors.password ? "border-destructive" : ""}
                />
                <div className={`overflow-hidden transition-all duration-300 ease-out ${errors.password ? 'max-h-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="text-sm text-destructive">{errors.password}</p>
                </div>
              </div>

              {/* Turnstile Widget */}
              {TURNSTILE_SITE_KEY && (
                <div className="flex justify-center">
                  <div ref={turnstileContainerRef} />
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting || (TURNSTILE_SITE_KEY && !turnstileToken)}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : isLogin ? (
                  <LogIn className="h-4 w-4 mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                {isLogin ? "Login" : "Registrasi"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isLogin 
                  ? "Belum punya akun? Registrasi" 
                  : "Sudah punya akun? Login"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}