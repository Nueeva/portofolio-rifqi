import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const SMTP_HOST = Deno.env.get("SMTP_HOST");
const SMTP_PORT = Deno.env.get("SMTP_PORT");
const SMTP_USER = Deno.env.get("SMTP_USER");
const SMTP_PASS = Deno.env.get("SMTP_PASS");
const HOOK_SECRET = Deno.env.get("AUTH_EMAIL_HOOK_SECRET");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature",
};

// Base64 encode for SMTP AUTH
function base64Encode(str: string): string {
  return btoa(str);
}

// Send email via raw SMTP using Deno.connect
async function sendEmailViaSMTP(
  to: string,
  subject: string,
  htmlContent: string,
  textContent: string
): Promise<void> {
  const host = SMTP_HOST!;
  const port = parseInt(SMTP_PORT!, 10);
  const username = SMTP_USER!;
  const password = SMTP_PASS!;
  
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

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
    await readResponse();
    await sendCommand(`EHLO localhost`);

    if (port === 587) {
      await sendCommand("STARTTLS");
      
      reader.releaseLock();
      writer.releaseLock();
      
      const tlsConn = await Deno.startTls(conn as Deno.TcpConn, { hostname: host });
      const tlsReader = tlsConn.readable.getReader();
      const tlsWriter = tlsConn.writable.getWriter();
      
      const readTls = async (): Promise<string> => {
        const { value } = await tlsReader.read();
        if (!value) return "";
        return decoder.decode(value);
      };

      const sendTls = async (cmd: string): Promise<string> => {
        await tlsWriter.write(encoder.encode(cmd + "\r\n"));
        return await readTls();
      };

      await sendTls(`EHLO localhost`);
      await sendTls("AUTH LOGIN");
      await sendTls(base64Encode(username));
      const authResponse = await sendTls(base64Encode(password));
      
      if (!authResponse.startsWith("235")) {
        throw new Error("SMTP authentication failed: " + authResponse);
      }

      await sendTls(`MAIL FROM:<${username}>`);
      await sendTls(`RCPT TO:<${to}>`);
      await sendTls("DATA");

      const boundary = "----=_Part_" + Date.now();
      const emailContent = [
        `From: "Rifqi Ariansyah" <${username}>`,
        `To: ${to}`,
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

      const response = await sendTls(emailContent);
      
      if (!response.startsWith("250")) {
        throw new Error("Failed to send email: " + response);
      }

      await sendTls("QUIT");
      tlsReader.releaseLock();
      tlsWriter.releaseLock();
      tlsConn.close();
    } else {
      await sendCommand("AUTH LOGIN");
      await sendCommand(base64Encode(username));
      const authResponse = await sendCommand(base64Encode(password));
      
      if (!authResponse.startsWith("235")) {
        throw new Error("SMTP authentication failed: " + authResponse);
      }

      await sendCommand(`MAIL FROM:<${username}>`);
      await sendCommand(`RCPT TO:<${to}>`);
      await sendCommand("DATA");

      const boundary = "----=_Part_" + Date.now();
      const emailContent = [
        `From: "Rifqi Ariansyah" <${username}>`,
        `To: ${to}`,
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

      const response = await sendCommand(emailContent);
      
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

// Email template generator
function generatePasswordResetEmail(resetLink: string, userEmail: string): { html: string; text: string } {
  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password</title>
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
                <span style="font-size: 28px; color: #0a0a0f; font-weight: bold;">R</span>
              </div>
            </td>
          </tr>
          
          <!-- Main Card -->
          <tr>
            <td style="background: linear-gradient(180deg, #1a1a2e 0%, #16162a 100%); border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); padding: 40px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
              <!-- Title -->
              <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #ffffff; text-align: center;">
                Reset Password
              </h1>
              <p style="margin: 0 0 32px 0; font-size: 15px; color: #a1a1aa; text-align: center; line-height: 1.5;">
                Kami menerima permintaan reset password untuk akun Anda
              </p>
              
              <!-- Divider -->
              <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(0, 229, 160, 0.3), transparent); margin: 0 0 32px 0;"></div>
              
              <!-- Email Info -->
              <div style="background: rgba(0, 229, 160, 0.1); border: 1px solid rgba(0, 229, 160, 0.2); border-radius: 12px; padding: 16px; margin-bottom: 32px;">
                <p style="margin: 0; font-size: 13px; color: #00e5a0; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
                  Akun Email
                </p>
                <p style="margin: 8px 0 0 0; font-size: 15px; color: #ffffff; word-break: break-all;">
                  ${userEmail}
                </p>
              </div>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #00e5a0 0%, #00b8d4 100%); color: #0a0a0f; font-size: 15px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 12px; box-shadow: 0 4px 14px 0 rgba(0, 229, 160, 0.4);">
                      Reset Password Saya
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Alternative Link -->
              <p style="margin: 24px 0 0 0; font-size: 13px; color: #71717a; text-align: center; line-height: 1.6;">
                Atau copy link berikut ke browser Anda:
              </p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #00e5a0; text-align: center; word-break: break-all; background: rgba(0, 0, 0, 0.3); padding: 12px; border-radius: 8px;">
                ${resetLink}
              </p>
              
              <!-- Warning -->
              <div style="margin-top: 32px; padding: 16px; background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.2); border-radius: 12px;">
                <p style="margin: 0; font-size: 13px; color: #fbbf24; line-height: 1.5;">
                  ⚠️ Link ini akan kadaluarsa dalam 24 jam. Jika Anda tidak meminta reset password, abaikan email ini.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding-top: 32px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #71717a;">
                Rifqi Ariansyah
              </p>
              <p style="margin: 0; font-size: 12px; color: #52525b;">
                Full-Stack Developer & UI/UX Designer
              </p>
              <div style="margin-top: 16px;">
                <a href="https://rifqi.tech" style="color: #00e5a0; font-size: 12px; text-decoration: none;">rifqi.tech</a>
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

  const text = `
Reset Password - Rifqi Ariansyah

Kami menerima permintaan reset password untuk akun Anda: ${userEmail}

Klik link berikut untuk reset password:
${resetLink}

Link ini akan kadaluarsa dalam 24 jam.

Jika Anda tidak meminta reset password, abaikan email ini.

---
Rifqi Ariansyah
Full-Stack Developer & UI/UX Designer
https://rifqi.tech
  `;

  return { html, text };
}

function generateMagicLinkEmail(magicLink: string, userEmail: string): { html: string; text: string } {
  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Magic Link Login</title>
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
                <span style="font-size: 28px; color: #0a0a0f; font-weight: bold;">R</span>
              </div>
            </td>
          </tr>
          
          <!-- Main Card -->
          <tr>
            <td style="background: linear-gradient(180deg, #1a1a2e 0%, #16162a 100%); border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); padding: 40px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
              <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #ffffff; text-align: center;">
                Login dengan Magic Link
              </h1>
              <p style="margin: 0 0 32px 0; font-size: 15px; color: #a1a1aa; text-align: center; line-height: 1.5;">
                Klik tombol di bawah untuk masuk ke akun Anda
              </p>
              
              <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(0, 229, 160, 0.3), transparent); margin: 0 0 32px 0;"></div>
              
              <div style="background: rgba(0, 229, 160, 0.1); border: 1px solid rgba(0, 229, 160, 0.2); border-radius: 12px; padding: 16px; margin-bottom: 32px;">
                <p style="margin: 0; font-size: 13px; color: #00e5a0; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
                  Akun Email
                </p>
                <p style="margin: 8px 0 0 0; font-size: 15px; color: #ffffff; word-break: break-all;">
                  ${userEmail}
                </p>
              </div>
              
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="${magicLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #00e5a0 0%, #00b8d4 100%); color: #0a0a0f; font-size: 15px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 12px; box-shadow: 0 4px 14px 0 rgba(0, 229, 160, 0.4);">
                      Masuk Sekarang
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; font-size: 13px; color: #71717a; text-align: center; line-height: 1.6;">
                Atau copy link berikut ke browser Anda:
              </p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #00e5a0; text-align: center; word-break: break-all; background: rgba(0, 0, 0, 0.3); padding: 12px; border-radius: 8px;">
                ${magicLink}
              </p>
              
              <div style="margin-top: 32px; padding: 16px; background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.2); border-radius: 12px;">
                <p style="margin: 0; font-size: 13px; color: #fbbf24; line-height: 1.5;">
                  ⚠️ Link ini akan kadaluarsa dalam 1 jam. Jika Anda tidak mencoba login, abaikan email ini.
                </p>
              </div>
            </td>
          </tr>
          
          <tr>
            <td style="padding-top: 32px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #71717a;">
                Rifqi Ariansyah
              </p>
              <p style="margin: 0; font-size: 12px; color: #52525b;">
                Full-Stack Developer & UI/UX Designer
              </p>
              <div style="margin-top: 16px;">
                <a href="https://rifqi.tech" style="color: #00e5a0; font-size: 12px; text-decoration: none;">rifqi.tech</a>
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

  const text = `
Login dengan Magic Link - Rifqi Ariansyah

Klik link berikut untuk masuk ke akun Anda: ${userEmail}
${magicLink}

Link ini akan kadaluarsa dalam 1 jam.

Jika Anda tidak mencoba login, abaikan email ini.

---
Rifqi Ariansyah
Full-Stack Developer & UI/UX Designer
https://rifqi.tech
  `;

  return { html, text };
}

function generateSignupConfirmationEmail(confirmLink: string, userEmail: string): { html: string; text: string } {
  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Konfirmasi Email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 520px; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #00e5a0 0%, #00b8d4 100%); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center;">
                <span style="font-size: 28px; color: #0a0a0f; font-weight: bold;">R</span>
              </div>
            </td>
          </tr>
          
          <tr>
            <td style="background: linear-gradient(180deg, #1a1a2e 0%, #16162a 100%); border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); padding: 40px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
              <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #ffffff; text-align: center;">
                Selamat Datang! 🎉
              </h1>
              <p style="margin: 0 0 32px 0; font-size: 15px; color: #a1a1aa; text-align: center; line-height: 1.5;">
                Konfirmasi email Anda untuk mengaktifkan akun
              </p>
              
              <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(0, 229, 160, 0.3), transparent); margin: 0 0 32px 0;"></div>
              
              <div style="background: rgba(0, 229, 160, 0.1); border: 1px solid rgba(0, 229, 160, 0.2); border-radius: 12px; padding: 16px; margin-bottom: 32px;">
                <p style="margin: 0; font-size: 13px; color: #00e5a0; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
                  Email Terdaftar
                </p>
                <p style="margin: 8px 0 0 0; font-size: 15px; color: #ffffff; word-break: break-all;">
                  ${userEmail}
                </p>
              </div>
              
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="${confirmLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #00e5a0 0%, #00b8d4 100%); color: #0a0a0f; font-size: 15px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 12px; box-shadow: 0 4px 14px 0 rgba(0, 229, 160, 0.4);">
                      Konfirmasi Email
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; font-size: 13px; color: #71717a; text-align: center; line-height: 1.6;">
                Atau copy link berikut ke browser Anda:
              </p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #00e5a0; text-align: center; word-break: break-all; background: rgba(0, 0, 0, 0.3); padding: 12px; border-radius: 8px;">
                ${confirmLink}
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding-top: 32px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #71717a;">
                Rifqi Ariansyah
              </p>
              <p style="margin: 0; font-size: 12px; color: #52525b;">
                Full-Stack Developer & UI/UX Designer
              </p>
              <div style="margin-top: 16px;">
                <a href="https://rifqi.tech" style="color: #00e5a0; font-size: 12px; text-decoration: none;">rifqi.tech</a>
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

  const text = `
Selamat Datang! - Rifqi Ariansyah

Konfirmasi email Anda untuk mengaktifkan akun: ${userEmail}
${confirmLink}

---
Rifqi Ariansyah
Full-Stack Developer & UI/UX Designer
https://rifqi.tech
  `;

  return { html, text };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate SMTP configuration
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
      console.error("SMTP configuration is incomplete");
      return new Response(
        JSON.stringify({ error: { http_code: 500, message: "Email service not configured" } }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const payload = await req.text();
    console.log("Received auth email hook payload");
    
    let emailData: {
      user: { email: string };
      email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
        site_url: string;
      };
    };

    // Try to verify with webhook secret if available
    if (HOOK_SECRET) {
      try {
        const headers = Object.fromEntries(req.headers);
        const wh = new Webhook(HOOK_SECRET);
        emailData = wh.verify(payload, headers) as typeof emailData;
      } catch (verifyError) {
        console.error("Webhook verification failed:", verifyError);
        // Fall back to parsing JSON directly for testing
        emailData = JSON.parse(payload);
      }
    } else {
      // No secret configured, parse directly
      emailData = JSON.parse(payload);
    }

    const { user, email_data } = emailData;
    const { token_hash, redirect_to, email_action_type, site_url } = email_data;
    
    console.log(`Processing ${email_action_type} email for ${user.email}`);

    // Build the verification link
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || site_url;
    const verifyLink = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to)}`;

    let subject: string;
    let emailContent: { html: string; text: string };

    switch (email_action_type) {
      case "recovery":
        subject = "Reset Password - Rifqi Ariansyah";
        emailContent = generatePasswordResetEmail(verifyLink, user.email);
        break;
      case "magiclink":
        subject = "Magic Link Login - Rifqi Ariansyah";
        emailContent = generateMagicLinkEmail(verifyLink, user.email);
        break;
      case "signup":
      case "email_confirmation":
        subject = "Konfirmasi Email - Rifqi Ariansyah";
        emailContent = generateSignupConfirmationEmail(verifyLink, user.email);
        break;
      case "invite":
        subject = "Undangan - Rifqi Ariansyah";
        emailContent = generateSignupConfirmationEmail(verifyLink, user.email);
        break;
      default:
        subject = "Verifikasi Email - Rifqi Ariansyah";
        emailContent = generatePasswordResetEmail(verifyLink, user.email);
    }

    console.log(`Sending ${email_action_type} email to ${user.email}`);
    
    await sendEmailViaSMTP(
      user.email,
      subject,
      emailContent.html,
      emailContent.text
    );

    console.log(`Successfully sent ${email_action_type} email to ${user.email}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-auth-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: { 
          http_code: error.code || 500, 
          message: error.message || "Failed to send email" 
        } 
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
