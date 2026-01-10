import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const SMTP_HOST = Deno.env.get("SMTP_HOST");
const SMTP_PORT = Deno.env.get("SMTP_PORT");
const SMTP_USER = Deno.env.get("SMTP_USER");
const SMTP_PASS = Deno.env.get("SMTP_PASS");
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

  if (rateLimitStore.size > 1000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }

  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count++;
  rateLimitStore.set(ip, record);
  return { allowed: true };
}

// Base64 encode for SMTP AUTH
function base64Encode(str: string): string {
  return btoa(str);
}

// Send email via raw SMTP using Deno.connect
async function sendEmailViaSMTP(
  host: string,
  port: number,
  username: string,
  password: string,
  to: string,
  subject: string,
  htmlContent: string,
  textContent: string,
  replyTo: string
): Promise<void> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Connect using TLS for port 465
  let conn: Deno.Conn;
  
  if (port === 465) {
    conn = await Deno.connectTls({
      hostname: host,
      port: port,
    });
  } else {
    conn = await Deno.connect({
      hostname: host,
      port: port,
    });
  }

  const reader = conn.readable.getReader();
  const writer = conn.writable.getWriter();

  async function readResponse(): Promise<string> {
    const { value } = await reader.read();
    if (!value) return "";
    return decoder.decode(value);
  }

  async function sendCommand(cmd: string): Promise<string> {
    await writer.write(encoder.encode(cmd + "\r\n"));
    return await readResponse();
  }

  try {
    // Read initial greeting
    await readResponse();

    // EHLO
    let response = await sendCommand(`EHLO localhost`);
    console.log("EHLO response received");

    // For port 587, upgrade to TLS using STARTTLS
    if (port === 587) {
      await sendCommand("STARTTLS");
      
      // Upgrade connection to TLS
      reader.releaseLock();
      writer.releaseLock();
      
      const tlsConn = await Deno.startTls(conn as Deno.TcpConn, { hostname: host });
      const tlsReader = tlsConn.readable.getReader();
      const tlsWriter = tlsConn.writable.getWriter();
      
      // Reassign for the rest of the session
      const readTls = async (): Promise<string> => {
        const { value } = await tlsReader.read();
        if (!value) return "";
        return decoder.decode(value);
      };

      const sendTls = async (cmd: string): Promise<string> => {
        await tlsWriter.write(encoder.encode(cmd + "\r\n"));
        return await readTls();
      };

      // EHLO again after STARTTLS
      await sendTls(`EHLO localhost`);

      // AUTH LOGIN
      await sendTls("AUTH LOGIN");
      await sendTls(base64Encode(username));
      response = await sendTls(base64Encode(password));
      
      if (!response.startsWith("235")) {
        throw new Error("SMTP authentication failed: " + response);
      }

      // MAIL FROM
      await sendTls(`MAIL FROM:<${username}>`);
      
      // RCPT TO
      await sendTls(`RCPT TO:<${to}>`);
      
      // DATA
      await sendTls("DATA");

      // Construct MIME email with both HTML and plain text
      const boundary = "----=_Part_" + Date.now();
      const emailContent = [
        `From: ${username}`,
        `To: ${to}`,
        `Reply-To: ${replyTo}`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        ``,
        `--${boundary}`,
        `Content-Type: text/plain; charset=UTF-8`,
        ``,
        textContent,
        ``,
        `--${boundary}`,
        `Content-Type: text/html; charset=UTF-8`,
        ``,
        htmlContent,
        ``,
        `--${boundary}--`,
        `.`
      ].join("\r\n");

      response = await sendTls(emailContent);
      
      if (!response.startsWith("250")) {
        throw new Error("Failed to send email: " + response);
      }

      await sendTls("QUIT");
      tlsReader.releaseLock();
      tlsWriter.releaseLock();
      tlsConn.close();
    } else {
      // For port 465 (already TLS)
      // AUTH LOGIN
      await sendCommand("AUTH LOGIN");
      await sendCommand(base64Encode(username));
      response = await sendCommand(base64Encode(password));
      
      if (!response.startsWith("235")) {
        throw new Error("SMTP authentication failed: " + response);
      }

      // MAIL FROM
      await sendCommand(`MAIL FROM:<${username}>`);
      
      // RCPT TO
      await sendCommand(`RCPT TO:<${to}>`);
      
      // DATA
      await sendCommand("DATA");

      // Construct MIME email
      const boundary = "----=_Part_" + Date.now();
      const emailContent = [
        `From: ${username}`,
        `To: ${to}`,
        `Reply-To: ${replyTo}`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        ``,
        `--${boundary}`,
        `Content-Type: text/plain; charset=UTF-8`,
        ``,
        textContent,
        ``,
        `--${boundary}`,
        `Content-Type: text/html; charset=UTF-8`,
        ``,
        htmlContent,
        ``,
        `--${boundary}--`,
        `.`
      ].join("\r\n");

      response = await sendCommand(emailContent);
      
      if (!response.startsWith("250")) {
        throw new Error("Failed to send email: " + response);
      }

      await sendCommand("QUIT");
      reader.releaseLock();
      writer.releaseLock();
      conn.close();
    }
  } catch (error) {
    try {
      reader.releaseLock();
      writer.releaseLock();
      conn.close();
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
      console.error("SMTP configuration is incomplete");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { name, email, message, turnstileToken }: ContactRequest = await req.json();

    console.log(`Received contact form submission from ${name} (${email})`);

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: "All fields are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

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

    console.log(`Connecting to SMTP server: ${SMTP_HOST}:${SMTP_PORT}`);
    
    const port = parseInt(SMTP_PORT, 10);
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 520px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #00e5a0 0%, #00b8d4 100%); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center;">
                <span style="font-size: 28px;">🛡️</span>
              </div>
            </td>
          </tr>
          
          <!-- Main Card -->
          <tr>
            <td style="background: linear-gradient(180deg, #1a1a2e 0%, #16162a 100%); border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); padding: 40px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
              <!-- Title -->
              <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #ffffff; text-align: center;">
                📬 Pesan Baru Masuk!
              </h1>
              <p style="margin: 0 0 32px 0; font-size: 15px; color: #a1a1aa; text-align: center; line-height: 1.5;">
                Ada yang menghubungi Anda melalui portfolio
              </p>
              
              <!-- Divider -->
              <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(0, 229, 160, 0.3), transparent); margin: 0 0 32px 0;"></div>
              
              <!-- Sender Info -->
              <div style="background: rgba(0, 229, 160, 0.1); border: 1px solid rgba(0, 229, 160, 0.2); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding-bottom: 12px;">
                      <p style="margin: 0; font-size: 11px; color: #00e5a0; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                        👤 Nama Pengirim
                      </p>
                      <p style="margin: 6px 0 0 0; font-size: 16px; color: #ffffff; font-weight: 500;">
                        ${escapeHtml(name)}
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <p style="margin: 0; font-size: 11px; color: #00e5a0; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                        📧 Email
                      </p>
                      <p style="margin: 6px 0 0 0; font-size: 16px; color: #ffffff;">
                        <a href="mailto:${escapeHtml(email)}" style="color: #00e5a0; text-decoration: none;">${escapeHtml(email)}</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Message Content -->
              <div style="background: rgba(0, 0, 0, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 12px 0; font-size: 11px; color: #00e5a0; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                  💬 Pesan
                </p>
                <p style="margin: 0; font-size: 15px; color: #e4e4e7; line-height: 1.7; white-space: pre-wrap;">
${escapeHtml(message)}
                </p>
              </div>
              
              <!-- Reply Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="mailto:${escapeHtml(email)}?subject=Re: Pesan dari Portfolio" style="display: inline-block; background: linear-gradient(135deg, #00e5a0 0%, #00b8d4 100%); color: #0a0a0f; font-size: 15px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 12px; box-shadow: 0 4px 14px 0 rgba(0, 229, 160, 0.4);">
                      Balas Pesan
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Timestamp -->
              <p style="margin: 24px 0 0 0; font-size: 12px; color: #71717a; text-align: center;">
                Diterima pada ${new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Jakarta' })} WIB
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding-top: 32px; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 14px; color: #71717a;">
                Rifqi Ariansyah Portfolio
              </p>
              <p style="margin: 0 0 12px 0; font-size: 12px; color: #52525b;">
                Cybersecurity Developer
              </p>
              <p style="margin: 0 0 16px 0; font-size: 11px; color: #00e5a0; letter-spacing: 2px; font-weight: 500;">
                Secure • Reliable • Professional
              </p>
              <div style="margin-bottom: 12px;">
                <a href="https://github.com/Nueeva" style="color: #71717a; font-size: 12px; text-decoration: none; margin: 0 8px;">GitHub</a>
                <span style="color: #52525b;">•</span>
                <a href="https://linkedin.com/in/rifqia" style="color: #71717a; font-size: 12px; text-decoration: none; margin: 0 8px;">LinkedIn</a>
                <span style="color: #52525b;">•</span>
                <a href="https://rifqi.tech" style="color: #00e5a0; font-size: 12px; text-decoration: none; margin: 0 8px;">rifqi.tech</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const textContent = `
📬 Pesan Baru dari Portfolio!

👤 Nama: ${name}
📧 Email: ${email}

💬 Pesan:
${message}

---
Diterima pada ${new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Jakarta' })} WIB

Rifqi Ariansyah Portfolio
https://rifqi.tech
    `;
    const subject = `📬 Pesan Baru dari ${escapeHtml(name)} | Portfolio Contact`;

    await sendEmailViaSMTP(
      SMTP_HOST,
      port,
      SMTP_USER,
      SMTP_PASS,
      SMTP_USER, // Send to yourself
      subject,
      htmlContent,
      textContent,
      email // Reply-To sender's email
    );

    console.log("Email sent successfully via SMTP");

    return new Response(JSON.stringify({ success: true, message: "Email sent successfully" }), {
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
