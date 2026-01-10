import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Shield, LogIn, UserPlus, Loader2, Clock, AlertTriangle } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { TurnstileCaptcha, TurnstileCaptchaRef } from "@/components/TurnstileCaptcha";
import { Progress } from "@/components/ui/progress";

const authSchema = z.object({
  email: z.string().trim().email({ message: "Email tidak valid" }),
  password: z.string().min(6, { message: "Password minimal 6 karakter" }),
});

interface RateLimitState {
  blocked: boolean;
  blockedType: "ip" | "email" | null;
  remainingSeconds: number;
  message: string | null;
  initialSeconds: number;
}

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    blocked: false,
    blockedType: null,
    remainingSeconds: 0,
    message: null,
    initialSeconds: 0,
  });
  const turnstileRef = useRef<TurnstileCaptchaRef>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  // Start countdown when blocked
  const startCountdown = useCallback((seconds: number) => {
    // Clear existing countdown
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    setRateLimitState(prev => ({
      ...prev,
      remainingSeconds: seconds,
      initialSeconds: seconds,
    }));

    countdownRef.current = setInterval(() => {
      setRateLimitState(prev => {
        const newRemaining = prev.remainingSeconds - 1;
        if (newRemaining <= 0) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
          }
          return {
            blocked: false,
            blockedType: null,
            remainingSeconds: 0,
            message: null,
            initialSeconds: 0,
          };
        }
        return { ...prev, remainingSeconds: newRemaining };
      });
    }, 1000);
  }, []);

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

  const checkRateLimit = async (identifier: string): Promise<{ 
    blocked: boolean; 
    blockedType?: "ip" | "email";
    message?: string;
    remainingSeconds?: number;
  }> => {
    try {
      const { data, error } = await supabase.functions.invoke('check-rate-limit', {
        body: { identifier, action: 'check' },
      });
      
      if (error) {
        console.error("Rate limit check error:", error);
        return { blocked: false };
      }
      
      return data || { blocked: false };
    } catch (err) {
      console.error("Failed to check rate limit:", err);
      return { blocked: false };
    }
  };

  const recordLoginAttempt = async (identifier: string, success: boolean) => {
    try {
      await supabase.functions.invoke('check-rate-limit', {
        body: { 
          identifier, 
          action: 'record', 
          success,
          userAgent: navigator.userAgent,
        },
      });
    } catch (err) {
      console.error("Failed to record login attempt:", err);
    }
  };

  const resetTurnstile = () => {
    setTurnstileToken(null);
    turnstileRef.current?.reset();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Don't allow submission if rate limited
    if (rateLimitState.blocked) {
      return;
    }
    
    if (!validateForm()) return;

    // Check Turnstile verification
    if (!turnstileToken) {
      toast({
        title: "Verifikasi Diperlukan",
        description: "Silakan selesaikan verifikasi keamanan",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Check rate limit before attempting login
      if (isLogin) {
        const rateLimitResult = await checkRateLimit(email.toLowerCase());
        if (rateLimitResult.blocked) {
          setRateLimitState({
            blocked: true,
            blockedType: rateLimitResult.blockedType || "email",
            remainingSeconds: rateLimitResult.remainingSeconds || 900,
            message: rateLimitResult.message || "Terlalu banyak percobaan login.",
            initialSeconds: rateLimitResult.remainingSeconds || 900,
          });
          
          if (rateLimitResult.remainingSeconds) {
            startCountdown(rateLimitResult.remainingSeconds);
          }
          
          setIsSubmitting(false);
          return;
        }
      }

      // Verify Turnstile token on server
      const isValid = await verifyTurnstile(turnstileToken);
      if (!isValid) {
        toast({
          title: "Verifikasi Gagal",
          description: "Verifikasi keamanan gagal, silakan coba lagi",
          variant: "destructive",
        });
        resetTurnstile();
        setIsSubmitting(false);
        return;
      }

      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          // Record failed login attempt
          await recordLoginAttempt(email.toLowerCase(), false);
          
          // Re-check rate limit to update UI
          const updatedRateLimit = await checkRateLimit(email.toLowerCase());
          if (updatedRateLimit.blocked) {
            setRateLimitState({
              blocked: true,
              blockedType: updatedRateLimit.blockedType || "email",
              remainingSeconds: updatedRateLimit.remainingSeconds || 900,
              message: updatedRateLimit.message || "Terlalu banyak percobaan login.",
              initialSeconds: updatedRateLimit.remainingSeconds || 900,
            });
            
            if (updatedRateLimit.remainingSeconds) {
              startCountdown(updatedRateLimit.remainingSeconds);
            }
          }
          
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
          // Record successful login attempt
          await recordLoginAttempt(email.toLowerCase(), true);
          
          // Clear rate limit state
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
          }
          setRateLimitState({
            blocked: false,
            blockedType: null,
            remainingSeconds: 0,
            message: null,
            initialSeconds: 0,
          });
          
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
      resetTurnstile();
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

  const progressValue = rateLimitState.initialSeconds > 0
    ? ((rateLimitState.initialSeconds - rateLimitState.remainingSeconds) / rateLimitState.initialSeconds) * 100
    : 0;

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

          {/* Rate Limit Warning Banner */}
          {rateLimitState.blocked && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-destructive text-sm">
                    {rateLimitState.blockedType === "ip" 
                      ? "IP Address Diblokir" 
                      : "Akses Dibatasi"}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {rateLimitState.message}
                  </p>
                  
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Waktu tunggu
                      </span>
                      <span className="font-mono font-semibold text-destructive">
                        {formatTime(rateLimitState.remainingSeconds)}
                      </span>
                    </div>
                    <Progress 
                      value={progressValue} 
                      className="h-2 bg-destructive/20"
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      {rateLimitState.blockedType === "ip"
                        ? "IP Anda telah diblokir sementara karena terlalu banyak percobaan gagal"
                        : "Silakan tunggu sebelum mencoba login kembali"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className={`p-6 rounded-lg bg-card border border-border transition-opacity duration-300 ${rateLimitState.blocked ? 'opacity-60' : ''}`}>
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
                  disabled={rateLimitState.blocked}
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
                  disabled={rateLimitState.blocked}
                />
                <div className={`overflow-hidden transition-all duration-300 ease-out ${errors.password ? 'max-h-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="text-sm text-destructive">{errors.password}</p>
                </div>
              </div>

              {/* Turnstile CAPTCHA */}
              {!rateLimitState.blocked && (
                <TurnstileCaptcha
                  ref={turnstileRef}
                  onVerify={setTurnstileToken}
                  onExpire={() => setTurnstileToken(null)}
                  onError={() => setTurnstileToken(null)}
                  theme="auto"
                />
              )}

              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting || !turnstileToken || rateLimitState.blocked}
              >
                {rateLimitState.blocked ? (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Tunggu {formatTime(rateLimitState.remainingSeconds)}
                  </>
                ) : isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : isLogin ? (
                  <LogIn className="h-4 w-4 mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                {!rateLimitState.blocked && (isLogin ? "Login" : "Registrasi")}
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
                disabled={rateLimitState.blocked}
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