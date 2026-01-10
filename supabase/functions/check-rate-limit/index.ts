import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const adminEmail = Deno.env.get("ADMIN_EMAIL");

// Track recently notified emails to avoid spam (in-memory, resets on function restart)
const notifiedEmails = new Map<string, number>();
const NOTIFICATION_COOLDOWN = 15 * 60 * 1000; // 15 minutes

async function sendBruteForceAlert(identifier: string, attemptCount: number) {
  if (!adminEmail || !resend) {
    console.log("Admin email or Resend not configured, skipping notification");
    return;
  }

  // Check cooldown to avoid spam
  const lastNotified = notifiedEmails.get(identifier);
  if (lastNotified && Date.now() - lastNotified < NOTIFICATION_COOLDOWN) {
    console.log(`Notification cooldown active for ${identifier}`);
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: "Security Alert <onboarding@resend.dev>",
      to: [adminEmail],
      subject: "🚨 Brute Force Attack Detected",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626;">⚠️ Security Alert</h1>
          <p>A potential brute force attack has been detected on your login page.</p>
          
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Target Email:</strong> ${identifier}</p>
            <p style="margin: 8px 0 0;"><strong>Failed Attempts:</strong> ${attemptCount}+ in the last 15 minutes</p>
            <p style="margin: 8px 0 0;"><strong>Action Taken:</strong> Login blocked for 15 minutes</p>
            <p style="margin: 8px 0 0;"><strong>Time:</strong> ${new Date().toISOString()}</p>
          </div>
          
          <p style="color: #666;">This email was sent automatically by your portfolio's security system.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Failed to send brute force alert:", error);
    } else {
      console.log(`Brute force alert sent to ${adminEmail} for ${identifier}`);
      notifiedEmails.set(identifier, Date.now());
    }
  } catch (err) {
    console.error("Error sending brute force alert:", err);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { identifier, action, success } = body;

    if (!identifier) {
      return new Response(
        JSON.stringify({ error: "Identifier is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === "check") {
      // Check if rate limited
      const { data: isBlocked, error } = await supabase.rpc("check_rate_limit", {
        p_identifier: identifier,
        p_max_attempts: 5,
        p_window_minutes: 15,
      });

      if (error) {
        console.error("Error checking rate limit:", error);
        return new Response(
          JSON.stringify({ error: "Failed to check rate limit" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // If blocked, send alert to admin (fire and forget)
      if (isBlocked) {
        sendBruteForceAlert(identifier, 5).catch(console.error);
      }

      return new Response(
        JSON.stringify({ 
          blocked: isBlocked,
          message: isBlocked ? "Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit." : null
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action === "record") {
      // Record the attempt
      const { error } = await supabase.rpc("record_login_attempt", {
        p_identifier: identifier,
        p_success: success || false,
      });

      if (error) {
        console.error("Error recording attempt:", error);
      }

      return new Response(
        JSON.stringify({ recorded: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Rate limit error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
