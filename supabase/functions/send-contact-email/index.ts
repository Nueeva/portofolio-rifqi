import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const TURNSTILE_SECRET_KEY = Deno.env.get("TURNSTILE_SECRET_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactRequest {
  name: string;
  email: string;
  message: string;
  turnstileToken: string;
}

interface TurnstileResponse {
  success: boolean;
  'error-codes'?: string[];
}

// HTML escape function to prevent XSS attacks in email content
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 5; // Max 5 emails per hour per IP

// In-memory store for rate limiting (resets on cold start)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getClientIP(req: Request): string {
  // Try various headers for client IP
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIP = req.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  const cfConnectingIP = req.headers.get("cf-connecting-ip");
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  return "unknown";
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  // Clean up expired entries periodically
  if (rateLimitStore.size > 1000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }

  if (!record || now > record.resetTime) {
    // First request or window expired
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Increment count
  record.count++;
  rateLimitStore.set(ip, record);
  return { allowed: true };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check rate limit
    const clientIP = getClientIP(req);
    const { allowed, retryAfter } = checkRateLimit(clientIP);
    
    if (!allowed) {
      console.log(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ 
          error: "Too many requests. Please try again later.",
          retryAfter 
        }),
        {
          status: 429,
          headers: { 
            "Content-Type": "application/json",
            "Retry-After": String(retryAfter),
            ...corsHeaders 
          },
        }
      );
    }

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { name, email, message, turnstileToken }: ContactRequest = await req.json();

    console.log(`Received contact form submission from ${name} (${email})`);

    // Validate input
    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: "All fields are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Verify Turnstile token
    if (!turnstileToken) {
      console.error("Missing Turnstile token");
      return new Response(JSON.stringify({ error: "CAPTCHA verification required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!TURNSTILE_SECRET_KEY) {
      console.error("TURNSTILE_SECRET_KEY is not configured");
      return new Response(JSON.stringify({ error: "CAPTCHA service not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Verify the Turnstile token with Cloudflare
    const turnstileVerifyResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: TURNSTILE_SECRET_KEY,
          response: turnstileToken,
          remoteip: clientIP,
        }),
      }
    );

    const turnstileResult: TurnstileResponse = await turnstileVerifyResponse.json();
    console.log("Turnstile verification result:", turnstileResult);

    if (!turnstileResult.success) {
      console.error("Turnstile verification failed:", turnstileResult['error-codes']);
      return new Response(
        JSON.stringify({ error: "CAPTCHA verification failed. Please try again." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send notification email using Resend REST API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Portfolio Contact <noreply@resend.rifqi.tech>",
        to: ["rifqiariansyah123@gmail.com"],
        reply_to: email,
        subject: `New Contact Form Submission from ${name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #00e5a0;">New Portfolio Contact</h2>
            <div style="background: #1a1a2e; padding: 20px; border-radius: 8px; color: #fff;">
              <p><strong style="color: #00e5a0;">Name:</strong> ${escapeHtml(name)}</p>
              <p><strong style="color: #00e5a0;">Email:</strong> ${escapeHtml(email)}</p>
              <p><strong style="color: #00e5a0;">Message:</strong></p>
              <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
            </div>
            <p style="color: #888; font-size: 12px; margin-top: 20px;">
              This message was sent from your portfolio contact form.
            </p>
          </div>
        `,
      }),
    });

    const data = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", data);
      throw new Error(data.message || "Failed to send email");
    }

    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
