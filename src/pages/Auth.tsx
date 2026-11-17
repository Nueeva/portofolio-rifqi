import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { z } from "zod";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TurnstileCaptcha,
  type TurnstileCaptchaRef,
} from "@/components/TurnstileCaptcha";
import { useAuth } from "@/hooks/useAuth";
import { api, type Failure } from "@/integrations/api/client";

type Mode = "login" | "register" | "forgot" | "reset";
const modes = {
  login: {
    title: "Selamat datang kembali.",
    description: "Masuk untuk merawat karya dan cerita di portofolio Anda.",
    action: "Masuk",
  },
  register: {
    title: "Buat akun Anda.",
    description:
      "Akun baru perlu verifikasi email dan tidak otomatis memiliki akses pengelola.",
    action: "Buat akun",
  },
  forgot: {
    title: "Lupa kata sandi?",
    description: "Minta tautan pemulihan untuk akun Anda.",
    action: "Kirim tautan pemulihan",
  },
  reset: {
    title: "Mulai dengan sandi baru.",
    description:
      "Gunakan sedikitnya 12 karakter. Kata sandi baru akan mengakhiri seluruh sesi aktif.",
    action: "Simpan kata sandi baru",
  },
};
export default function Auth() {
  const [params, setParams] = useSearchParams();
  const requested = params.get("mode");
  const mode: Mode =
    params.get("reset") === "true"
      ? "reset"
      : requested === "register" || requested === "forgot"
        ? requested
        : "login";
  const auth = useAuth();
  const { resolvedTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [blockedUntil, setBlockedUntil] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const captchaRef = useRef<TurnstileCaptchaRef>(null);
  const capabilities = useQuery({
    queryKey: ["auth-capabilities"],
    retry: false,
    queryFn: async () => {
      const response = await fetch("/api/config");
      if (!response.ok) throw Error("Layanan belum terhubung.");
      return response.json() as Promise<{ emailEnabled?: boolean }>;
    },
  });
  const emailUnavailable = capabilities.data?.emailEnabled === false;
  const badToken =
    mode === "reset" && !/^[a-f0-9]{64}$/i.test(params.get("token") ?? "");
  useEffect(() => {
    setFeedback("");
    setErrors({});
    setPassword("");
    setConfirmPassword("");
    setVisible(false);
  }, [mode]);
  useEffect(() => {
    const tick = () =>
      setRemaining(Math.max(0, Math.ceil((blockedUntil - Date.now()) / 1000)));
    tick();
    if (!blockedUntil) return;
    const id = window.setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [blockedUntil]);
  useEffect(() => {
    if (feedback) feedbackRef.current?.focus();
  }, [feedback]);
  const changeMode = (next: Mode) => {
    if (busy) return;
    setSuccess("");
    setParams(next === "login" ? {} : { mode: next });
  };
  const report = (error: Failure) => {
    setFeedback(error.message);
    if (error.status === 429)
      setBlockedUntil(Date.now() + (error.retryAfter || 60) * 1000);
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || (mode === "login" && remaining > 0)) return;
    setFeedback("");
    setSuccess("");
    const next: Record<string, string> = {};
    const parsed = z
      .string()
      .trim()
      .email("Masukkan alamat email yang valid.")
      .safeParse(email);
    if (mode !== "reset" && !parsed.success)
      next.email = "Masukkan alamat email yang valid.";
    if (mode !== "forgot" && password.length < (mode === "login" ? 1 : 12))
      next.password =
        mode === "login"
          ? "Masukkan kata sandi Anda."
          : "Gunakan sedikitnya 12 karakter.";
    if (mode === "reset" && password !== confirmPassword)
      next.confirmPassword = "Kedua kata sandi harus sama.";
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(Object.keys(next)[0])?.focus();
      return;
    }
    if ((mode === "login" || mode === "register") && !captcha) {
      setFeedback("Selesaikan verifikasi keamanan sebelum melanjutkan.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "login" || mode === "register") {
        const verification = await api.functions.invoke<{ success: boolean }>(
          "verify-turnstile",
          { body: { token: captcha } },
        );
        if (verification.error || !verification.data?.success) {
          report(
            verification.error || {
              message: "Verifikasi kedaluwarsa. Silakan coba kembali.",
            },
          );
          return;
        }
      }
      const address = parsed.success ? parsed.data : email.trim();
      const result =
        mode === "login"
          ? await auth.signIn(address, password)
          : mode === "register"
            ? await auth.signUp(address, password)
            : mode === "forgot"
              ? await auth.resetPassword(address)
              : await auth.updatePassword(password);
      if (result.error) {
        report(result.error);
        return;
      }
      if (mode === "forgot")
        setSuccess(
          "Jika alamat ini terhubung dengan akun, tautan pemulihan akan dikirim. Periksa kotak masuk dan folder spam Anda.",
        );
      if (mode === "register")
        setSuccess(
          "Permintaan akun diterima. Periksa email untuk verifikasi. Hak pengelola diberikan secara terpisah.",
        );
      if (mode === "reset") {
        setParams({}, { replace: true });
        setSuccess("Kata sandi berhasil diubah. Silakan masuk kembali.");
      }
    } catch {
      setFeedback(
        "Layanan belum terhubung. Isian Anda tetap tersedia untuk dicoba kembali.",
      );
    } finally {
      setBusy(false);
      if (mode === "login" || mode === "register") {
        setCaptcha(null);
        captchaRef.current?.reset();
      }
    }
  };
  if (
    !auth.loading &&
    !auth.error &&
    auth.user &&
    auth.isAdmin &&
    mode !== "reset"
  )
    return <Navigate to="/admin" replace />;
  const panel = auth.loading ? (
    <div className="console-state" role="status">
      <Loader2 className="animate-spin" />
      <h1>Memeriksa sesi…</h1>
      <p>Menyiapkan ruang kerja Anda.</p>
    </div>
  ) : auth.error ? (
    <div className="console-state" role="alert">
      <h1>Sesi belum dapat diperiksa.</h1>
      <p>Koneksi mungkin terputus. Coba lagi untuk melanjutkan dengan aman.</p>
      <Button onClick={auth.retry}>Coba lagi</Button>
    </div>
  ) : auth.user && !auth.isAdmin && mode !== "reset" ? (
    <div className="console-state">
      <h1>Akses pengelola belum tersedia.</h1>
      <p>
        Akun ini sudah masuk, tetapi belum memiliki hak untuk mengelola
        portofolio.
      </p>
      <Link to="/">Kembali ke portofolio</Link>
      <Button
        variant="outline"
        onClick={async () => {
          const { error } = await auth.signOut();
          if (error) report(error);
        }}
      >
        Gunakan akun lain
      </Button>
      {feedback && <p role="alert">{feedback}</p>}
    </div>
  ) : (
    <div className="auth-form-card">
      <span className="console-eyebrow">
        {mode === "login" ? "Akses pengelola" : "Akun Anda"}
      </span>
      <h1>{badToken ? "Tautan tidak valid." : modes[mode].title}</h1>
      <p className="auth-description">
        {badToken
          ? "Tautan pemulihan tidak lengkap. Minta tautan baru sebelum mengubah kata sandi."
          : modes[mode].description}
      </p>
      {success && (
        <div className="console-notice console-success" role="status">
          <Check size={18} />
          <p>{success}</p>
        </div>
      )}
      {feedback && (
        <div
          ref={feedbackRef}
          tabIndex={-1}
          className="console-notice console-error"
          role="alert"
        >
          {feedback}
        </div>
      )}
      {emailUnavailable && (mode === "forgot" || mode === "register") ? (
        <div className="console-notice">
          Layanan email belum diaktifkan. Pemulihan dan verifikasi akun melalui
          email belum tersedia.
        </div>
      ) : (
        !badToken &&
        !(success && mode !== "login") && (
          <form onSubmit={submit} noValidate aria-busy={busy}>
            <fieldset disabled={busy} className="auth-fields">
              {mode !== "reset" && (
                <div className="console-field">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    inputMode="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    placeholder="nama@contoh.com"
                  />
                  {errors.email && (
                    <p id="email-error" className="console-field-error">
                      {errors.email}
                    </p>
                  )}
                </div>
              )}
              {mode !== "forgot" && (
                <div className="console-field">
                  <Label htmlFor="password">
                    {mode === "reset" ? "Kata sandi baru" : "Kata sandi"}
                  </Label>
                  <div className="console-password">
                    <Input
                      id="password"
                      name="password"
                      type={visible ? "text" : "password"}
                      autoComplete={
                        mode === "login" ? "current-password" : "new-password"
                      }
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      aria-invalid={!!errors.password}
                      aria-describedby={
                        errors.password ? "password-error" : undefined
                      }
                    />
                    <button
                      type="button"
                      aria-label={
                        visible
                          ? "Sembunyikan kata sandi"
                          : "Tampilkan kata sandi"
                      }
                      aria-pressed={visible}
                      onClick={() => setVisible(!visible)}
                    >
                      {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p id="password-error" className="console-field-error">
                      {errors.password}
                    </p>
                  )}
                </div>
              )}
              {mode === "reset" && (
                <div className="console-field">
                  <Label htmlFor="confirmPassword">
                    Ulangi kata sandi baru
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={visible ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={
                      errors.confirmPassword ? "confirm-error" : undefined
                    }
                  />
                  {errors.confirmPassword && (
                    <p id="confirm-error" className="console-field-error">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              )}
              {mode === "login" && (
                <button
                  type="button"
                  className="auth-recovery"
                  onClick={() => changeMode("forgot")}
                >
                  Lupa kata sandi?
                </button>
              )}
              {(mode === "login" || mode === "register") && (
                <div className="auth-verification">
                  <TurnstileCaptcha
                    key={mode}
                    ref={captchaRef}
                    onVerify={setCaptcha}
                    onExpire={() => setCaptcha(null)}
                    onError={() => setCaptcha(null)}
                    theme={resolvedTheme === "light" ? "light" : "dark"}
                  />
                </div>
              )}
              {mode === "login" && remaining > 0 && (
                <p className="console-notice" role="status">
                  Tunggu {Math.floor(remaining / 60)}:
                  {String(remaining % 60).padStart(2, "0")} sebelum mencoba
                  masuk kembali.
                </p>
              )}
              <Button
                type="submit"
                className="auth-submit"
                disabled={busy || (mode === "login" && remaining > 0)}
              >
                {busy ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Memproses…
                  </>
                ) : (
                  <>
                    {modes[mode].action}
                    <ArrowRight size={18} />
                  </>
                )}
              </Button>
            </fieldset>
          </form>
        )
      )}
      {mode === "login" ? (
        <p className="auth-access-note">
          Area ini untuk pengelola portofolio.{" "}
          {emailUnavailable ? (
            ""
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => changeMode("register")}
            >
              Informasi pembuatan akun
            </button>
          )}
        </p>
      ) : (
        <button
          className="auth-back"
          type="button"
          disabled={busy}
          onClick={() => changeMode("login")}
        >
          <ArrowLeft size={16} />
          Kembali ke halaman masuk
        </button>
      )}
    </div>
  );
  return (
    <Layout>
      <div className="auth-composition">
        <aside className="auth-brand-panel" aria-label="Celah">
          <span className="console-eyebrow">Pengelolaan portofolio</span>
          <h2>
            Ruang untuk
            <br />
            karya berikutnya<span>.</span>
          </h2>
          <div className="auth-seam" aria-hidden="true">
            <span />
            <span />
          </div>
          <p>
            Rawat karya, susun cerita, dan bagikan perjalanan Anda dengan lebih
            utuh.
          </p>
          <div className="auth-brand-footer">
            <span>Rifqi Ariansyah</span>
            <span>Celah — 01</span>
          </div>
        </aside>
        <section className="auth-form-panel">{panel}</section>
      </div>
    </Layout>
  );
}
