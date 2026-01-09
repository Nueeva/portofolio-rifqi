import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory rate limiting store (resets on function cold start)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration: 20 requests per minute per IP
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

function getRateLimitKey(ip: string): string {
  return `analytics:${ip}`;
}

function isRateLimited(ip: string): { limited: boolean; remaining: number } {
  const key = getRateLimitKey(ip);
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { limited: false, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return { limited: true, remaining: 0 };
  }

  record.count++;
  return { limited: false, remaining: RATE_LIMIT_MAX - record.count };
}

// Cleanup old entries periodically to prevent memory leaks
function cleanupOldEntries() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP from headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const clientIp = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';

    console.log(`Analytics request from IP: ${clientIp}`);

    // Check rate limit
    const { limited, remaining } = isRateLimited(clientIp);
    
    if (limited) {
      console.log(`Rate limited IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded', retryAfter: 60 }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': '60',
            'X-RateLimit-Remaining': '0'
          } 
        }
      );
    }

    // Parse request body
    const { page_path, visitor_id, user_agent, referrer } = await req.json();

    // Validate required fields
    if (!page_path || !visitor_id) {
      console.log('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: page_path and visitor_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate field lengths to prevent abuse
    if (page_path.length > 500 || visitor_id.length > 100) {
      console.log('Field length exceeded');
      return new Response(
        JSON.stringify({ error: 'Field length exceeded' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role key to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert analytics data using upsert to handle unique constraint
    const { error } = await supabase
      .from('page_analytics')
      .upsert({
        page_path: page_path.substring(0, 500),
        visitor_id: visitor_id.substring(0, 100),
        user_agent: user_agent?.substring(0, 500) || null,
        referrer: referrer?.substring(0, 500) || null,
      }, { 
        onConflict: 'visitor_id,page_path,visit_date',
        ignoreDuplicates: true 
      });

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to track analytics' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cleanup old rate limit entries occasionally
    if (Math.random() < 0.1) {
      cleanupOldEntries();
    }

    console.log(`Analytics tracked for ${page_path}`);
    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': remaining.toString()
        } 
      }
    );

  } catch (error) {
    console.error('Error in track-analytics function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
