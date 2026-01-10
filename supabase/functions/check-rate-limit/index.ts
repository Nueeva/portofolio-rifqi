import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { identifier, action } = await req.json();

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

      return new Response(
        JSON.stringify({ 
          blocked: isBlocked,
          message: isBlocked ? "Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit." : null
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action === "record") {
      const { success } = await req.json().catch(() => ({ success: false }));
      
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
