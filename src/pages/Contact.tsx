import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { useTheme } from "next-themes";
import { CheckCircle, Github, Linkedin, Mail, Send } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { TurnstileCaptcha, type TurnstileCaptchaRef } from "@/components/TurnstileCaptcha";
import { useToast } from "@/hooks/use-toast";
import { usePageAnalytics } from "@/hooks/usePageAnalytics";
import { usePublicSettings } from "@/hooks/usePublicSettings";
import { supabase } from "@/integrations/api/client";
import { contactSchema, prefillContact, sendContactMessage, suggestEmails, type ContactData } from "@/lib/contactForm";
const emptyForm: ContactData = { name: "", email: "", message: "" };
type CaptchaStatus = "unverified" | "verified" | "expired" | "error";
export default function Contact() {
    usePageAnalytics("/contact");
    const { get } = usePublicSettings();
    const { resolvedTheme } = useTheme();
    const { toast } = useToast();
    const [searchParams] = useSearchParams();
    const [formData, setFormData] = useState<ContactData>(emptyForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [honeypot, setHoneypot] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [sendError, setSendError] = useState("");
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const [captchaStatus, setCaptchaStatus] = useState<CaptchaStatus>("unverified");
    const [captchaRetry, setCaptchaRetry] = useState(0);
    const [captchaTheme, setCaptchaTheme] = useState<"light" | "dark" | "auto">("auto");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
    const turnstileRef = useRef<TurnstileCaptchaRef>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const formStartTime = useRef(0);
    const suggestions = suggestEmails(formData.email);
    const suggestionsOpen = showSuggestions && suggestions.length > 0;
    const contactEmail = get("contact_email", "contact@rifqi.tech");
    useEffect(() => { formStartTime.current = Date.now(); }, []);
    useEffect(() => { setFormData(previous => prefillContact(previous, searchParams.get("topic") ?? "")); }, [searchParams]);
    useEffect(() => {
        setCaptchaTheme(resolvedTheme === "light" ? "light" : resolvedTheme === "dark" ? "dark" : "auto");
        setTurnstileToken(null);
        setCaptchaStatus("unverified");
    }, [resolvedTheme]);
    function change(name: keyof ContactData, value: string) {
        setFormData(previous => ({ ...previous, [name]: value }));
        const result = contactSchema.shape[name].safeParse(value);
        setErrors(previous => ({ ...previous, [name]: result.success ? "" : result.error.errors[0]?.message }));
        if (name === "email") {
            setShowSuggestions(true);
            setSelectedSuggestion(-1);
        }
    }
    function selectEmail(value: string) {
        change("email", value);
        setShowSuggestions(false);
        setSelectedSuggestion(-1);
    }
    function emailKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (!suggestionsOpen)
            return;
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setSelectedSuggestion(previous => event.key === "ArrowDown" ? Math.min(previous + 1, suggestions.length - 1) : Math.max(previous - 1, -1));
        }
        else if ((event.key === "Enter" && selectedSuggestion >= 0) || event.key === "Tab") {
            event.preventDefault();
            selectEmail(suggestions[Math.max(0, selectedSuggestion)]);
        }
        else if (event.key === "Escape")
            setShowSuggestions(false);
    }
    function invalidateCaptcha(status: CaptchaStatus) {
        setTurnstileToken(null);
        setCaptchaStatus(status);
    }
    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        if (isSubmitting)
            return;
        setErrors({});
        setSendError("");
        if (honeypot) {
            toast({ title: "Pesan terkirim", description: "Terima kasih sudah menghubungi." });
            return;
        }
        if (Date.now() - formStartTime.current < 3000) {
            toast({ title: "Tunggu sebentar", description: "Luangkan waktu untuk melengkapi formulir.", variant: "destructive" });
            return;
        }
        const result = contactSchema.safeParse(formData);
        if (!result.success) {
            const fieldErrors = Object.fromEntries(result.error.errors.map(error => [String(error.path[0]), error.message]));
            setErrors(fieldErrors);
            formRef.current?.querySelector<HTMLElement>(`[name="${result.error.errors[0]?.path[0]}"]`)?.focus();
            return;
        }
        if (!turnstileToken) {
            setSendError("Selesaikan verifikasi keamanan sebelum mengirim pesan.");
            return;
        }
        setIsSubmitting(true);
        try {
            await sendContactMessage(result.data, turnstileToken, (name, options) => supabase.functions.invoke(name, options));
            setIsSubmitted(true);
            setFormData(emptyForm);
            toast({ title: "Pesan terkirim", description: "Terima kasih. Saya akan membaca dan membalas pesanmu." });
        }
        catch {
            const message = "Pesan belum terkirim. Coba lagi atau hubungi saya langsung melalui email.";
            setSendError(message);
            toast({ title: "Gagal mengirim pesan", description: message, variant: "destructive" });
        }
        finally {
            setIsSubmitting(false);
            invalidateCaptcha("unverified");
            turnstileRef.current?.reset();
        }
    }
    function anotherMessage() {
        formStartTime.current = Date.now();
        setIsSubmitted(false);
        setSendError("");
        setErrors({});
    }
    return <Layout><div className="public-container public-page">
    <header className="public-page-heading"><h1>Percakapan yang<br /><em>membuka peluang.</em></h1><p className="public-lede">Punya kebutuhan security engineering, ingin membahas proyek, atau mengenalkan timmu? Ceritakan konteksnya di sini.</p></header>
    <div className="contact-grid"><aside className="contact-details"><h2>Terhubung langsung.</h2>
      <a href={`mailto:${contactEmail}`}><Mail aria-hidden="true"/><span>{contactEmail}</span></a>
      <a href={get("social_github", "https://github.com/Nueeva")} target="_blank" rel="noopener noreferrer"><Github aria-hidden="true"/><span>GitHub</span></a>
      <a href={get("social_linkedin", "https://linkedin.com/rifqia")} target="_blank" rel="noopener noreferrer"><Linkedin aria-hidden="true"/><span>LinkedIn</span></a>
      <p>Untuk peluang kerja, sertakan peran dan kebutuhan tim. Untuk proyek, gambaran sistem dan lingkup pekerjaan akan membantu saya memahami konteksnya.</p>
    </aside><section className="contact-form" aria-labelledby="contact-form-title"><h2 id="contact-form-title">Kirim pesan.</h2>
      {isSubmitted ? <div className="contact-success" role="status"><CheckCircle aria-hidden="true"/><h3>Pesanmu sudah terkirim.</h3><p>Terima kasih sudah menghubungi. Saya akan membaca dan membalasnya melalui email.</p><button className="public-text-link" type="button" onClick={anotherMessage}>Tulis pesan lain <Send /></button></div> : <form ref={formRef} onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
        <div hidden aria-hidden="true"><label htmlFor="website">Website</label><input id="website" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={event => setHoneypot(event.target.value)}/></div>
        <div className="contact-field"><label htmlFor="name">Nama</label><input id="name" name="name" value={formData.name} onChange={event => change("name", event.target.value)} placeholder="Nama lengkapmu" autoComplete="name" required minLength={2} maxLength={50} aria-invalid={!!errors.name} aria-describedby="name-info" disabled={isSubmitting}/><div id="name-info" className="contact-field-info"><span className="field-error">{errors.name}</span><span>{formData.name.length}/50</span></div></div>
        <div className="contact-field"><label htmlFor="email">Email</label><div className="email-combobox"><input id="email" name="email" type="email" role="combobox" aria-autocomplete="list" aria-expanded={suggestionsOpen} aria-controls={suggestionsOpen ? "email-suggestions" : undefined} aria-activedescendant={suggestionsOpen && selectedSuggestion >= 0 ? `email-option-${selectedSuggestion}` : undefined} value={formData.email} onChange={event => change("email", event.target.value)} onKeyDown={emailKeyDown} onBlur={() => setShowSuggestions(false)} onFocus={() => setShowSuggestions(true)} placeholder="nama@domain.com" autoComplete="email" required minLength={5} maxLength={100} aria-invalid={!!errors.email} aria-describedby="email-info" disabled={isSubmitting}/>
          {suggestionsOpen && <ul id="email-suggestions" className="email-suggestions" role="listbox" aria-label="Saran alamat email">{suggestions.map((suggestion, index) => <li key={suggestion} id={`email-option-${index}`} role="option" aria-selected={selectedSuggestion === index} onPointerDown={event => { event.preventDefault(); selectEmail(suggestion); }} onPointerEnter={() => setSelectedSuggestion(index)}>{suggestion}</li>)}</ul>}
        </div><div id="email-info" className="contact-field-info"><span className="field-error">{errors.email}</span><span>{formData.email.length}/100</span></div></div>
        <div className="contact-field"><label htmlFor="message">Pesan</label><textarea id="message" name="message" value={formData.message} onChange={event => change("message", event.target.value)} placeholder="Ceritakan kebutuhan dan konteksnya…" required minLength={10} maxLength={1000} rows={6} aria-invalid={!!errors.message} aria-describedby="message-info" disabled={isSubmitting}/><div id="message-info" className="contact-field-info"><span className="field-error">{errors.message}</span><span>{formData.message.length}/1000</span></div></div>
        <div className="contact-captcha"><TurnstileCaptcha key={captchaRetry} ref={turnstileRef} theme={captchaTheme} onVerify={token => { setTurnstileToken(token); setCaptchaStatus("verified"); setSendError(""); }} onExpire={() => invalidateCaptcha("expired")} onError={() => invalidateCaptcha("error")}/>
          <p className="captcha-help" role="status">{captchaStatus === "verified" ? "Verifikasi selesai. Pesan siap dikirim." : captchaStatus === "expired" ? "Verifikasi kedaluwarsa. Selesaikan kembali verifikasi keamanan." : captchaStatus === "error" ? "Verifikasi belum berhasil. Coba lagi atau gunakan email langsung." : "Selesaikan verifikasi keamanan sebelum mengirim."}</p>
          {captchaStatus === "error" && <button type="button" className="public-text-link" onClick={() => { invalidateCaptcha("unverified"); setCaptchaRetry(current => current + 1); }}>Ulangi verifikasi</button>}
        </div>
        {sendError && <p className="contact-send-error" role="alert">{sendError}</p>}
        <button className="public-submit" type="submit" disabled={isSubmitting || !turnstileToken}>{isSubmitting ? "Mengirim pesan…" : "Kirim pesan"}<Send aria-hidden="true"/></button>
      </form>}
    </section></div>
  </div></Layout>;
}
