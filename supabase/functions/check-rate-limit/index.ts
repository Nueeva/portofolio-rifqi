import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const adminEmail = Deno.env.get("ADMIN_EMAIL");

// Track recently notified to avoid spam (in-memory, resets on function restart)
const notifiedTargets = new Map<string, number>();
const NOTIFICATION_COOLDOWN = 15 * 60 * 1000; // 15 minutes
const IP_BLOCK_THRESHOLD = 10; // Block IP after 10 failed attempts

async function sendBruteForceAlert(
  identifier: string, 
  attemptCount: number, 
  ipAddress?: string,
  isIpBlocked?: boolean
) {
  if (!adminEmail || !resend) {
    console.log("Admin email or Resend not configured, skipping notification");
    return;
  }

  const notifyKey = `${identifier}-${ipAddress || 'unknown'}`;
  
  // Check cooldown to avoid spam
  const lastNotified = notifiedTargets.get(notifyKey);
  if (lastNotified && Date.now() - lastNotified < NOTIFICATION_COOLDOWN) {
    console.log(`Notification cooldown active for ${notifyKey}`);
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: "Security Alert <onboarding@resend.dev>",
      to: [adminEmail],
      subject: isIpBlocked 
        ? "🚫 IP Address Blocked - Brute Force Attack" 
        : "🚨 Brute Force Attack Detected",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626;">⚠️ Security Alert</h1>
          <p>A potential brute force attack has been detected on your login page.</p>
          
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Target Email:</strong> ${identifier}</p>
            <p style="margin: 8px 0 0;"><strong>IP Address:</strong> ${ipAddress || 'Unknown'}</p>
            <p style="margin: 8px 0 0;"><strong>Failed Attempts:</strong> ${attemptCount}+ in the last 15 minutes</p>
            <p style="margin: 8px 0 0;"><strong>Action Taken:</strong> ${isIpBlocked 
              ? 'IP address blocked for 24 hours' 
              : 'Login blocked for 15 minutes'}</p>
            <p style="margin: 8px 0 0;"><strong>Time:</strong> ${new Date().toISOString()}</p>
          </div>
          
          ${isIpBlocked ? `
          <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;"><strong>⚠️ IP Blocked:</strong> This IP address has been automatically blocked for 24 hours due to excessive failed login attempts.</p>
          </div>
          ` : ''}
          
          <p style="color: #666;">This email was sent automatically by your portfolio's security system.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Failed to send brute force alert:", error);
    } else {
      console.log(`Brute force alert sent to ${adminEmail} for ${notifyKey}`);
      notifiedTargets.set(notifyKey, Date.now());
    }
  } catch (err) {
    console.error("Error sending brute force alert:", err);
  }
}

interface GeoLocation {
  country: string | null;
  city: string | null;
  region: string | null;
  isp: string | null;
}

function getClientIP(req: Request): string {
  // Try various headers in order of preference
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Take the first IP if there are multiple
    return forwardedFor.split(",")[0].trim();
  }
  
  const realIP = req.headers.get("x-real-ip");
  if (realIP) {
    return realIP.trim();
  }
  
  const cfConnectingIP = req.headers.get("cf-connecting-ip");
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }
  
  return "unknown";
}

async function getGeoLocation(ipAddress: string): Promise<GeoLocation> {
  if (ipAddress === "unknown" || ipAddress === "127.0.0.1" || ipAddress.startsWith("192.168.") || ipAddress.startsWith("10.")) {
    return { country: null, city: null, region: null, isp: null };
  }

  try {
    // Using ip-api.com free tier (no API key needed, 45 requests/minute)
    const response = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,country,regionName,city,isp`);
    
    if (!response.ok) {
      console.error("Geo-location API error:", response.status);
      return { country: null, city: null, region: null, isp: null };
    }

    const data = await response.json();
    
    if (data.status === "success") {
      return {
        country: data.country || null,
        city: data.city || null,
        region: data.regionName || null,
        isp: data.isp || null,
      };
    }
    
    return { country: null, city: null, region: null, isp: null };
  } catch (error) {
    console.error("Error fetching geo-location:", error);
    return { country: null, city: null, region: null, isp: null };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { identifier, action, success, userAgent } = body;
    
    // Get IP from request headers
    const ipAddress = getClientIP(req);
    console.log(`Request from IP: ${ipAddress}, identifier: ${identifier}, action: ${action}`);

    if (!identifier && action !== "check-ip") {
      return new Response(
        JSON.stringify({ error: "Identifier is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Action: check-ip - Check if IP is blocked
    if (action === "check-ip") {
      // Query directly to get expires_at for countdown
      const { data: ipBlockData, error: ipError } = await supabase
        .from("blocked_ips")
        .select("expires_at")
        .eq("ip_address", ipAddress)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (ipError && ipError.code !== "PGRST116") {
        console.error("Error checking IP block:", ipError);
      }

      if (ipBlockData) {
        const expiresAt = new Date(ipBlockData.expires_at);
        const remainingSeconds = Math.ceil((expiresAt.getTime() - Date.now()) / 1000);
        
        return new Response(
          JSON.stringify({ 
            blocked: true,
            blockedType: "ip",
            message: "IP address Anda telah diblokir karena aktivitas mencurigakan.",
            remainingSeconds,
            expiresAt: ipBlockData.expires_at
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ blocked: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "check") {
      // First check if IP is blocked - query directly to get expires_at
      const { data: ipBlockData, error: ipError } = await supabase
        .from("blocked_ips")
        .select("expires_at")
        .eq("ip_address", ipAddress)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (ipError && ipError.code !== "PGRST116") {
        console.error("Error checking IP block:", ipError);
      }

      if (ipBlockData) {
        const expiresAt = new Date(ipBlockData.expires_at);
        const remainingSeconds = Math.ceil((expiresAt.getTime() - Date.now()) / 1000);
        
        return new Response(
          JSON.stringify({ 
            blocked: true,
            blockedType: "ip",
            message: "IP address Anda telah diblokir karena aktivitas mencurigakan.",
            remainingSeconds,
            expiresAt: ipBlockData.expires_at
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check email rate limit - get failed attempts in the window
      const windowMinutes = 15;
      const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
      
      const { data: attempts, error: attemptsError } = await supabase
        .from("login_attempts")
        .select("attempted_at")
        .eq("identifier", identifier)
        .eq("success", false)
        .gte("attempted_at", windowStart)
        .order("attempted_at", { ascending: true });

      if (attemptsError) {
        console.error("Error fetching attempts:", attemptsError);
      }

      const attemptCount = attempts?.length || 0;
      const isBlocked = attemptCount >= 5;

      if (isBlocked && attempts && attempts.length > 0) {
        // Calculate when the oldest attempt in the window will expire
        const oldestAttempt = new Date(attempts[0].attempted_at);
        const expiresAt = new Date(oldestAttempt.getTime() + windowMinutes * 60 * 1000);
        const remainingSeconds = Math.ceil((expiresAt.getTime() - Date.now()) / 1000);

        // Send alert to admin (fire and forget)
        EdgeRuntime.waitUntil(sendBruteForceAlert(identifier, attemptCount, ipAddress, false));

        return new Response(
          JSON.stringify({ 
            blocked: true,
            blockedType: "email",
            message: "Terlalu banyak percobaan login.",
            remainingSeconds: Math.max(0, remainingSeconds),
            expiresAt: expiresAt.toISOString(),
            attemptCount
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ 
          blocked: false,
          blockedType: null,
          message: null,
          attemptCount
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action === "record") {
      // Fetch geo-location in background
      const geoLocation = await getGeoLocation(ipAddress);
      console.log(`Geo-location for ${ipAddress}:`, geoLocation);

      // Log IP activity with geo-location
      const { error: logError } = await supabase.rpc("log_ip_activity", {
        p_ip_address: ipAddress,
        p_identifier: identifier,
        p_action: "login",
        p_success: success || false,
        p_user_agent: userAgent || null,
        p_country: geoLocation.country,
        p_city: geoLocation.city,
        p_region: geoLocation.region,
        p_isp: geoLocation.isp,
      });

      if (logError) {
        console.error("Error logging IP activity:", logError);
      }

      // Record the login attempt
      const { error } = await supabase.rpc("record_login_attempt", {
        p_identifier: identifier,
        p_success: success || false,
      });

      if (error) {
        console.error("Error recording attempt:", error);
      }

      // If failed attempt, check if IP should be blocked
      if (!success) {
        const { data: ipFailedCount, error: countError } = await supabase.rpc("count_ip_failed_attempts", {
          p_ip_address: ipAddress,
          p_window_minutes: 15,
        });

        if (countError) {
          console.error("Error counting IP failed attempts:", countError);
        }

        console.log(`IP ${ipAddress} has ${ipFailedCount} failed attempts`);

        // Block IP if threshold exceeded
        if (ipFailedCount && ipFailedCount >= IP_BLOCK_THRESHOLD) {
          console.log(`Blocking IP ${ipAddress} due to ${ipFailedCount} failed attempts`);
          
          const { error: blockError } = await supabase.rpc("block_ip", {
            p_ip_address: ipAddress,
            p_reason: "brute_force",
            p_hours: 24,
          });

          if (blockError) {
            console.error("Error blocking IP:", blockError);
          } else {
            // Send alert about IP block
            EdgeRuntime.waitUntil(sendBruteForceAlert(identifier, ipFailedCount, ipAddress, true));
          }
        }
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