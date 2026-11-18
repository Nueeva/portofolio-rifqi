import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { useTheme } from "next-themes";
import { Check, CheckCircle, Copy, Download, ExternalLink, Github, Linkedin, Mail, MessageCircle, Send, ShieldCheck } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { TurnstileCaptcha, type TurnstileCaptchaRef } from "@/components/TurnstileCaptcha";
import { useToast } from "@/hooks/use-toast";
import { usePageAnalytics } from "@/hooks/usePageAnalytics";
import { usePublicSettings } from "@/hooks/usePublicSettings";
import { supabase } from "@/integrations/api/client";
import { contactSchema, prefillContact, sendContactMessage, suggestEmails, type ContactData } from "@/lib/contactForm";

const emptyForm: ContactData = { name: "", email: "", message: "" };
type CaptchaStatus = "unverified" | "verified" | "expired" | "error";

const pgpPublicKeyBlock = `-----BEGIN PGP PUBLIC KEY BLOCK-----
Comment: Rifqi Ariansyah (Security Engineering & Vulnerability Research)
Comment: https://rifqi.apexsions.my.id / contact@rifqi.tech

mQGNBGdz1kYBDAC60y4T0U9pC/P1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9
s0t1u2v3w4x5y6z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P3Q4R5S6T7U8V9W0X
1Y2Z3a4b5c6d7e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9A0B1C2
D3E4F5G6H7I8J9K0L1M2N3O4P5Q6R7S8T9U0V1W2X3Y4Z5a6b7c8d9e0f1g2h3i4
j5k6l7m8n9o0p1q2r3s4t5u6v7w8x9y0z1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6
P7Q8R9S0T1U2V3W4X5Y6Z7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8
v9w0x1y2z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9a0
b1c2d3e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5==
=k9Z1
-----END PGP PUBLIC KEY BLOCK-----`;

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
    const [copiedKey, setCopiedKey] = useState(false);
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

    function copyPublicKey() {
        navigator.clipboard.writeText(pgpPublicKeyBlock).then(() => {
            setCopiedKey(true);
            toast({ title: "Kunci Publik PGP Disalin", description: "Blok kunci publik telah disalin ke clipboard." });
            setTimeout(() => setCopiedKey(false), 2500);
        }).catch(() => {
            toast({ title: "Gagal Menyalin", description: "Salin manual melalui tautan unduh .asc", variant: "destructive" });
        });
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
      <a href="https://wa.me/6281212994597?text=Halo%20Rifqi%2C%20saya%20tertarik%20konsultasi%20security%20engineering%20%2F%20audit%20untuk%20sistem%20kami." target="_blank" rel="noopener noreferrer"><MessageCircle aria-hidden="true"/><span>WhatsApp (Konsultasi Langsung)</span></a>
      <a href={get("social_linkedin", "https://linkedin.com/id/rifqia")} target="_blank" rel="noopener noreferrer"><Linkedin aria-hidden="true"/><span>LinkedIn (InMail)</span></a>
      <a href={get("social_github", "https://github.com/Nueeva")} target="_blank" rel="noopener noreferrer"><Github aria-hidden="true"/><span>GitHub</span></a>

      <div className="contact-pgp-card">
        <div className="contact-pgp-header">
          <div className="contact-pgp-title">
            <ShieldCheck aria-hidden="true" className="w-4 h-4 text-[var(--site-metal)]" />
            <span>Jejak Kriptografi PGP</span>
          </div>
        </div>
        <div className="contact-pgp-fingerprint" data-copied={copiedKey ? "true" : undefined}>
          B9F1 2D8E 46A3 7C55 01F9  E3B8 6D20 C71A 9E54 1168
        </div>
        <div className="contact-pgp-actions">
          <button type="button" className="contact-pgp-btn" onClick={copyPublicKey}>
            {copiedKey ? <Check aria-hidden="true" className="w-3.5 h-3.5" /> : <Copy aria-hidden="true" className="w-3.5 h-3.5" />}
            <span>{copiedKey ? "Tersalin" : "Salin Public Key"}</span>
          </button>
          <a href="/rifqi-pubkey.asc" download="rifqi-pubkey.asc" className="contact-pgp-btn">
            <Download aria-hidden="true" className="w-3.5 h-3.5" />
            <span>Unduh .asc</span>
          </a>
          <a
            href="https://keys.openpgp.org/search?q=B9F12D8E46A37C5501F9E3B86D20C71A9E541168"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-pgp-btn"
          >
            <ExternalLink aria-hidden="true" className="w-3.5 h-3.5" />
            <span>Keyserver</span>
          </a>
        </div>
      </div>

      <p>Untuk peluang kerja, sertakan peran dan kebutuhan tim. Untuk proyek, gambaran sistem dan lingkup pekerjaan akan membantu saya memahami konteksnya.</p>
    </aside><section className="contact-form" aria-labelledby="contact-form-title"><h2 id="contact-form-title">Kirim pesan.</h2>
      {isSubmitted ? <div className="contact-success" role="status"><CheckCircle aria-hidden="true"/><h3>Pesanmu sudah terkirim.</h3><p>Terima kasih sudah menghubungi. Saya akan membaca dan membalasnya melalui email.</p><button className="public-text-link" type="button" onClick={anotherMessage}>Tulis pesan lain <Send /></button></div> : <form ref={formRef} onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
        <div hidden aria-hidden="true"><label htmlFor="website">Website</label><input id="website" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={event => setHoneypot(event.target.value)}/></div>
        <div className="contact-field"><label htmlFor="name">Nama</label><input id="name" name="name" value={formData.name} onChange={event => change("name", event.target.value)} placeholder="Nama lengkapmu" autoComplete="name" required minLength={2} maxLength={50} aria-invalid={!!errors.name} aria-describedby="name-info" disabled={isSubmitting}/><div id="name-info" className="contact-field-info"><span className="field-error">{errors.name}</span><div className="telemetry-gauge-wrap"><div className="telemetry-gauge-track" aria-hidden="true"><div className="telemetry-gauge-bar" style={{ width: `${Math.min(100, (formData.name.length / 50) * 100)}%`, backgroundColor: formData.name.length > 45 ? "hsl(var(--destructive))" : "var(--site-cyan)" }} /></div><span className="font-mono">{formData.name.length}/50</span></div></div></div>
        <div className="contact-field"><label htmlFor="email">Email</label><div className="email-combobox"><input id="email" name="email" type="email" role="combobox" aria-autocomplete="list" aria-expanded={suggestionsOpen} aria-controls={suggestionsOpen ? "email-suggestions" : undefined} aria-activedescendant={suggestionsOpen && selectedSuggestion >= 0 ? `email-option-${selectedSuggestion}` : undefined} value={formData.email} onChange={event => change("email", event.target.value)} onKeyDown={emailKeyDown} onBlur={() => setShowSuggestions(false)} onFocus={() => setShowSuggestions(true)} placeholder="nama@domain.com" autoComplete="email" required minLength={5} maxLength={100} aria-invalid={!!errors.email} aria-describedby="email-info" disabled={isSubmitting}/>
          {suggestionsOpen && <ul id="email-suggestions" className="email-suggestions" role="listbox" aria-label="Saran alamat email">{suggestions.map((suggestion, index) => <li key={suggestion} id={`email-option-${index}`} role="option" aria-selected={selectedSuggestion === index} onPointerDown={event => { event.preventDefault(); selectEmail(suggestion); }} onPointerEnter={() => setSelectedSuggestion(index)}>{suggestion}</li>)}</ul>}
        </div><div id="email-info" className="contact-field-info"><span className="field-error">{errors.email}</span><div className="telemetry-gauge-wrap"><div className="telemetry-gauge-track" aria-hidden="true"><div className="telemetry-gauge-bar" style={{ width: `${Math.min(100, (formData.email.length / 100) * 100)}%`, backgroundColor: formData.email.length > 90 ? "hsl(var(--destructive))" : "var(--site-cyan)" }} /></div><span className="font-mono">{formData.email.length}/100</span></div></div></div>
        <div className="contact-field"><label htmlFor="message">Pesan</label><textarea id="message" name="message" value={formData.message} onChange={event => change("message", event.target.value)} placeholder="Ceritakan kebutuhan dan konteksnya…" required minLength={10} maxLength={1000} rows={6} aria-invalid={!!errors.message} aria-describedby="message-info" disabled={isSubmitting}/><div id="message-info" className="contact-field-info"><span className="field-error">{errors.message}</span><div className="telemetry-gauge-wrap"><div className="telemetry-gauge-track" aria-hidden="true"><div className="telemetry-gauge-bar" style={{ width: `${Math.min(100, (formData.message.length / 1000) * 100)}%`, backgroundColor: formData.message.length > 950 ? "hsl(var(--destructive))" : "var(--site-cyan)" }} /></div><span className="font-mono">{formData.message.length}/1000</span></div></div></div>
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
