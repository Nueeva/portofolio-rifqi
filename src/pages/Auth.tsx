import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Shield, LogIn, UserPlus, Loader2, Clock, AlertTriangle, CheckCircle2, XCircle, ShieldAlert, UserCheck, ShieldX, Mail, KeyRound, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { TurnstileCaptcha, TurnstileCaptchaRef } from "@/components/TurnstileCaptcha";
import { Progress } from "@/components/ui/progress";

const authSchema = z.object({
  email: z.string().trim().email({ message: "Email tidak valid" }),
  password: z.string().min(6, { message: "Password minimal 6 karakter" }),
});

const emailSchema = z.object({
  email: z.string().trim().email({ message: "Email tidak valid" }),
});

const passwordSchema = z.object({
  password: z.string().min(6, { message: "Password minimal 6 karakter" }),
  confirmPassword: z.string().min(6, { message: "Password minimal 6 karakter" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

type AuthMode = "login" | "register" | "forgot" | "reset";

interface RateLimitState {
  blocked: boolean;
  blockedType: "ip" | "email" | null;
  remainingSeconds: number;
  message: string | null;
  initialSeconds: number;
}

export default function Auth() {
  const [searchParams] = useSearchParams();
  const isResetMode = searchParams.get("reset") === "true";
  
  const [mode, setMode] = useState<AuthMode>(isResetMode ? "reset" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    blocked: false,
    blockedType: null,
    remainingSeconds: 0,
    message: null,
    initialSeconds: 0,
  });
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const turnstileRef = useRef<TurnstileCaptchaRef>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  
  const { user, loading, signIn, signUp, resetPassword, updatePassword } = useAuth();
  const navigate = useNavigate();

  // Check for reset mode from URL
  useEffect(() => {
    if (isResetMode) {
      setMode("reset");
    }
  }, [isResetMode]);

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
    if (!loading && user && mode !== "reset") {
      navigate("/admin");
    }
  }, [user, loading, navigate, mode]);

  const validateForm = () => {
    try {
      if (mode === "forgot") {
        emailSchema.parse({ email });
      } else if (mode === "reset") {
        passwordSchema.parse({ password, confirmPassword });
      } else {
        authSchema.parse({ email, password });
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: { email?: string; password?: string; confirmPassword?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === "email") newErrors.email = err.message;
          if (err.path[0] === "password") newErrors.password = err.message;
          if (err.path[0] === "confirmPassword") newErrors.confirmPassword = err.message;
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

  const handleForgotPassword = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      // Use Supabase's built-in password reset - it will send email with the actual reset link
      const { error } = await resetPassword(email);
      if (error) {
        toast.error("Gagal Mengirim Email", {
          description: error.message,
          icon: <XCircle className="h-5 w-5" />,
        });
      } else {
        setResetEmailSent(true);
        toast.success("Email Terkirim", {
          description: "Silakan cek email Anda untuk link reset password",
          icon: <Mail className="h-5 w-5" />,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await updatePassword(password);
      if (error) {
        toast.error("Gagal Reset Password", {
          description: error.message,
          icon: <XCircle className="h-5 w-5" />,
        });
      } else {
        // Send password changed notification email
        try {
          await supabase.functions.invoke('send-auth-email', {
            body: {
              type: 'password_changed',
              email: user?.email || '',
            },
          });
        } catch (emailErr) {
          console.log("Password change notification email skipped:", emailErr);
        }
        
        toast.success("Password Berhasil Diubah", {
          description: "Silakan login dengan password baru",
          icon: <CheckCircle2 className="h-5 w-5" />,
        });
        setMode("login");
        navigate("/auth");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === "forgot") {
      await handleForgotPassword();
      return;
    }
    
    if (mode === "reset") {
      await handleResetPassword();
      return;
    }
    
    if (rateLimitState.blocked) {
      return;
    }
    
    if (!validateForm()) return;

    if (!turnstileToken) {
      toast.warning("Verifikasi Diperlukan", {
        description: "Silakan selesaikan verifikasi keamanan",
        icon: <ShieldAlert className="h-5 w-5" />,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "login") {
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
          
          toast.error("Akses Diblokir", {
            description: rateLimitResult.blockedType === "ip" 
              ? "IP Anda telah diblokir sementara" 
              : "Terlalu banyak percobaan gagal",
            icon: <ShieldX className="h-5 w-5" />,
            duration: 5000,
          });
          
          setIsSubmitting(false);
          return;
        }
      }

      const isValid = await verifyTurnstile(turnstileToken);
      if (!isValid) {
        toast.error("Verifikasi Gagal", {
          description: "Verifikasi keamanan gagal, silakan coba lagi",
          icon: <ShieldAlert className="h-5 w-5" />,
        });
        resetTurnstile();
        setIsSubmitting(false);
        return;
      }

      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) {
          await recordLoginAttempt(email.toLowerCase(), false);
          
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
            
            toast.error("Akses Diblokir", {
              description: "Terlalu banyak percobaan gagal. Silakan tunggu.",
              icon: <ShieldX className="h-5 w-5" />,
              duration: 5000,
            });
          } else if (error.message.includes("Invalid login credentials")) {
            toast.error("Login Gagal", {
              description: "Email atau password salah",
              icon: <XCircle className="h-5 w-5" />,
            });
          } else {
            toast.error("Login Gagal", {
              description: error.message,
              icon: <XCircle className="h-5 w-5" />,
            });
          }
        } else {
          await recordLoginAttempt(email.toLowerCase(), true);
          
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
          
          toast.success("Login Berhasil", {
            description: "Selamat datang kembali!",
            icon: <CheckCircle2 className="h-5 w-5" />,
          });
        }
      } else if (mode === "register") {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes("User already registered")) {
            toast.error("Registrasi Gagal", {
              description: "Email sudah terdaftar",
              icon: <Mail className="h-5 w-5" />,
            });
          } else {
            toast.error("Registrasi Gagal", {
              description: error.message,
              icon: <XCircle className="h-5 w-5" />,
            });
          }
        } else {
          toast.success("Registrasi Berhasil", {
            description: "Akun berhasil dibuat, silakan login",
            icon: <UserCheck className="h-5 w-5" />,
          });
          setMode("login");
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

  const getTitle = () => {
    switch (mode) {
      case "login": return "Login Admin";
      case "register": return "Registrasi";
      case "forgot": return "Lupa Password";
      case "reset": return "Reset Password";
    }
  };

  const getDescription = () => {
    switch (mode) {
      case "login": return "Masuk untuk mengelola portofolio";
      case "register": return "Buat akun baru";
      case "forgot": return "Masukkan email untuk reset password";
      case "reset": return "Masukkan password baru Anda";
    }
  };

  const getIcon = () => {
    switch (mode) {
      case "login": return <Shield className="h-8 w-8 text-primary" />;
      case "register": return <UserPlus className="h-8 w-8 text-primary" />;
      case "forgot": return <Mail className="h-8 w-8 text-primary" />;
      case "reset": return <KeyRound className="h-8 w-8 text-primary" />;
    }
  };

  // Forgot password email sent success screen
  if (mode === "forgot" && resetEmailSent) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Cek Email Anda</h1>
            <p className="text-muted-foreground mb-6">
              Kami telah mengirim link reset password ke <strong>{email}</strong>. Silakan cek inbox Anda.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setMode("login");
                setResetEmailSent(false);
                setEmail("");
              }}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Login
            </Button>
          </div>
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
              {getIcon()}
            </div>
            <h1 className="text-2xl font-bold">{getTitle()}</h1>
            <p className="text-muted-foreground mt-2">{getDescription()}</p>
          </div>

          {/* Rate Limit Warning Banner */}
          {rateLimitState.blocked && (mode === "login" || mode === "register") && (
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
              {/* Email field - shown for login, register, forgot */}
              {(mode === "login" || mode === "register" || mode === "forgot") && (
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
              )}

              {/* Password field - shown for login, register, reset */}
              {(mode === "login" || mode === "register" || mode === "reset") && (
                <div className="space-y-2">
                  <Label htmlFor="password">
                    {mode === "reset" ? "Password Baru" : "Password"}
                  </Label>
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
              )}

              {/* Confirm Password field - shown for reset */}
              {mode === "reset" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={errors.confirmPassword ? "border-destructive" : ""}
                  />
                  <div className={`overflow-hidden transition-all duration-300 ease-out ${errors.confirmPassword ? 'max-h-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  </div>
                </div>
              )}

              {/* Forgot password link - only on login */}
              {mode === "login" && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setErrors({});
                    }}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Lupa password?
                  </button>
                </div>
              )}

              {/* Turnstile CAPTCHA - only for login and register */}
              {!rateLimitState.blocked && (mode === "login" || mode === "register") && (
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
                disabled={
                  isSubmitting || 
                  ((mode === "login" || mode === "register") && (!turnstileToken || rateLimitState.blocked))
                }
              >
                {rateLimitState.blocked && (mode === "login" || mode === "register") ? (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Tunggu {formatTime(rateLimitState.remainingSeconds)}
                  </>
                ) : isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : mode === "login" ? (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </>
                ) : mode === "register" ? (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Registrasi
                  </>
                ) : mode === "forgot" ? (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Kirim Link Reset
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4 mr-2" />
                    Ubah Password
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setErrors({});
                  }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  disabled={rateLimitState.blocked}
                >
                  Belum punya akun? Registrasi
                </button>
              )}
              
              {mode === "register" && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setErrors({});
                  }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  disabled={rateLimitState.blocked}
                >
                  Sudah punya akun? Login
                </button>
              )}
              
              {(mode === "forgot" || mode === "reset") && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setErrors({});
                    setPassword("");
                    setConfirmPassword("");
                  }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1 mx-auto"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Kembali ke Login
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
