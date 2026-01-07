import { useState, useRef, useEffect } from "react";
import { Mail, Github, Linkedin, Send, CheckCircle, Sparkles } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { ScrollReveal } from "@/components/ScrollReveal";

const TURNSTILE_SITE_KEY = "0x4AAAAAACLFADmrVmL9XOiI";

const contactSchema = z.object({
  name: z.string()
    .trim()
    .min(2, "Nama minimal 2 karakter")
    .max(50, "Nama maksimal 50 karakter"),
  email: z.string()
    .trim()
    .min(5, "Email minimal 5 karakter")
    .max(100, "Email maksimal 100 karakter")
    .regex(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Format email tidak valid (contoh: nama@domain.com)"
    ),
  message: z.string()
    .trim()
    .min(10, "Pesan minimal 10 karakter")
    .max(1000, "Pesan maksimal 1000 karakter"),
});

declare global {
  interface Window {
    turnstile: {
      render: (container: string | HTMLElement, options: {
        sitekey: string;
        callback: (token: string) => void;
        'expired-callback'?: () => void;
        'error-callback'?: () => void;
        theme?: 'light' | 'dark' | 'auto';
      }) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState(false);
  const turnstileWidgetId = useRef<string | null>(null);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const formStartTime = useRef<number>(Date.now());
  const { toast } = useToast();

  // Honeypot field (hidden from users, bots will fill it)
  const [honeypot, setHoneypot] = useState("");

  // Load Turnstile script and render widget
  useEffect(() => {
    const loadTurnstile = () => {
      if (document.querySelector('script[src*="turnstile"]')) {
        renderWidget();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.onload = renderWidget;
      document.head.appendChild(script);
    };

    const renderWidget = () => {
      if (!window.turnstile || !turnstileContainerRef.current) {
        setTimeout(renderWidget, 100);
        return;
      }

      // Clear any existing widget
      if (turnstileWidgetId.current) {
        try {
          window.turnstile.remove(turnstileWidgetId.current);
        } catch (e) {
          // Widget might already be removed
        }
      }

      turnstileWidgetId.current = window.turnstile.render(turnstileContainerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token: string) => {
          setTurnstileToken(token);
          setTurnstileError(false);
        },
        'expired-callback': () => {
          setTurnstileToken(null);
        },
        'error-callback': () => {
          setTurnstileError(true);
        },
        theme: 'dark',
      });
    };

    loadTurnstile();

    return () => {
      if (turnstileWidgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(turnstileWidgetId.current);
        } catch (e) {
          // Widget might already be removed
        }
      }
    };
  }, [isSubmitted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Anti-spam: Check honeypot
    if (honeypot) {
      toast({
        title: "Message sent!",
        description: "Thank you for reaching out.",
      });
      return; // Silently reject spam
    }

    // Anti-spam: Check submission time (bots submit too fast)
    const timeTaken = Date.now() - formStartTime.current;
    if (timeTaken < 3000) {
      toast({
        title: "Please slow down",
        description: "Please take a moment to fill out the form.",
        variant: "destructive",
      });
      return;
    }

    // Validate form data
    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // Verify Turnstile token exists
    if (!turnstileToken) {
      setTurnstileError(true);
      toast({
        title: "Verification required",
        description: "Please complete the CAPTCHA verification.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke("send-contact-email", {
        body: { ...result.data, turnstileToken },
      });

      if (error) throw error;

      setIsSubmitted(true);
      setFormData({ name: "", email: "", message: "" });
      toast({
        title: "Message sent!",
        description: "Thank you for reaching out. I'll get back to you soon.",
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Failed to send message",
        description: "Please try again or contact me directly via email.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateField = (name: string, value: string) => {
    const fieldSchema = contactSchema.shape[name as keyof typeof contactSchema.shape];
    if (!fieldSchema) return "";
    
    const result = fieldSchema.safeParse(value);
    if (!result.success) {
      return result.error.errors[0]?.message || "";
    }
    return "";
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Real-time validation
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <ScrollReveal>
            <div className="mb-12">
              <h1 className="text-3xl sm:text-4xl font-bold mb-4">
                Get in <span className="text-primary">Touch</span>
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                Interested in working together or have a security question? 
                Feel free to reach out. I'm always open to discussing new projects 
                and opportunities.
              </p>
              <div className="w-20 h-1 bg-primary rounded-full mt-4" />
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Info */}
            <ScrollReveal delay={100}>
              <div>
                <h2 className="text-xl font-semibold mb-6">Connect With Me</h2>
                
                <div className="space-y-4">
                  <a
                    href="mailto:contact@example.com"
                    className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors group"
                  >
                    <div className="p-2 rounded-md bg-primary/10">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium group-hover:text-primary transition-colors">
                        contact@example.com
                      </p>
                    </div>
                  </a>

                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors group"
                  >
                    <div className="p-2 rounded-md bg-primary/10">
                      <Github className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">GitHub</p>
                      <p className="font-medium group-hover:text-primary transition-colors">
                        github.com/username
                      </p>
                    </div>
                  </a>

                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors group"
                  >
                    <div className="p-2 rounded-md bg-primary/10">
                      <Linkedin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">LinkedIn</p>
                      <p className="font-medium group-hover:text-primary transition-colors">
                        linkedin.com/in/username
                      </p>
                    </div>
                  </a>
                </div>
              </div>
            </ScrollReveal>

            {/* Contact Form */}
            <ScrollReveal delay={200}>
              <div className="p-6 rounded-lg bg-card border border-border">
                <h2 className="text-xl font-semibold mb-6">Send a Message</h2>

              {isSubmitted ? (
                <div className="p-8 rounded-lg bg-card border border-primary/50 text-center animate-scale-in">
                  <div className="relative inline-block mb-4">
                    <CheckCircle className="h-16 w-16 text-primary animate-[pulse_2s_ease-in-out_infinite]" />
                    <Sparkles className="h-6 w-6 text-primary absolute -top-1 -right-1 animate-[bounce_1s_ease-in-out_infinite]" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 animate-fade-in">Message Sent Successfully!</h3>
                  <p className="text-muted-foreground mb-6 animate-fade-in">
                    Thank you for reaching out. I'll respond as soon as possible.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsSubmitted(false);
                      formStartTime.current = Date.now();
                    }}
                    className="animate-fade-in"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Honeypot field - hidden from users */}
                  <input
                    type="text"
                    name="website"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    className="absolute opacity-0 pointer-events-none"
                    tabIndex={-1}
                    autoComplete="off"
                  />

                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Nama lengkap (2-50 karakter)"
                      required
                      minLength={2}
                      maxLength={50}
                      className={errors.name ? "border-destructive" : ""}
                    />
                    <div className="flex justify-between items-center min-h-[20px]">
                      <div className={`overflow-hidden transition-all duration-300 ease-out ${errors.name ? 'max-h-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <p className="text-sm text-destructive">{errors.name}</p>
                      </div>
                      <span className={`text-xs transition-colors duration-200 ${formData.name.length > 50 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {formData.name.length}/50
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="nama@domain.com"
                      required
                      minLength={5}
                      maxLength={100}
                      className={errors.email ? "border-destructive" : ""}
                    />
                    <div className="flex justify-between items-center min-h-[20px]">
                      <div className={`overflow-hidden transition-all duration-300 ease-out ${errors.email ? 'max-h-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <p className="text-sm text-destructive">{errors.email}</p>
                      </div>
                      <span className={`text-xs transition-colors duration-200 ${formData.email.length > 100 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {formData.email.length}/100
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tulis pesan Anda (10-1000 karakter)"
                      required
                      minLength={10}
                      maxLength={1000}
                      rows={5}
                      className={errors.message ? "border-destructive" : ""}
                    />
                    <div className="flex justify-between items-center min-h-[20px]">
                      <div className={`overflow-hidden transition-all duration-300 ease-out ${errors.message ? 'max-h-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <p className="text-sm text-destructive">{errors.message}</p>
                      </div>
                      <span className={`text-xs transition-colors duration-200 ${formData.message.length > 1000 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {formData.message.length}/1000
                      </span>
                    </div>
                  </div>

                  {/* Turnstile CAPTCHA */}
                  <div className="space-y-2">
                    <div 
                      ref={turnstileContainerRef} 
                      className="flex justify-center"
                    />
                    <div className={`overflow-hidden transition-all duration-300 ease-out ${turnstileError || (!turnstileToken && formData.name && formData.email && formData.message) ? 'max-h-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                      <p className="text-sm text-destructive text-center">
                        {turnstileError ? "Verifikasi gagal, silakan coba lagi" : "Silakan selesaikan verifikasi CAPTCHA"}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full glow-primary"
                    disabled={isSubmitting || !turnstileToken}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      <>
                        Send Message
                        <Send className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              )}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
