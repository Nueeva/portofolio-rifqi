import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

// Generate a unique visitor ID if not already present
const getVisitorId = (): string => {
  const key = "visitor_id";
  let visitorId = localStorage.getItem(key);
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(key, visitorId);
  }
  return visitorId;
};

export const usePageAnalytics = (pagePath: string) => {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    const trackVisit = async () => {
      try {
        const visitorId = getVisitorId();
        
        // Use upsert with ignoreDuplicates to handle unique constraint
        // This prevents duplicate entries per visitor per page per day
        await supabase.from("page_analytics").upsert([
          {
            page_path: pagePath,
            visitor_id: visitorId,
            user_agent: navigator.userAgent,
            referrer: document.referrer || null,
          },
        ], { onConflict: 'visitor_id,page_path,visit_date', ignoreDuplicates: true });
      } catch (error) {
        // Silently fail - analytics shouldn't break the app
        console.error("Analytics tracking failed:", error);
      }
    };

    trackVisit();
  }, [pagePath]);
};

export const trackPageVisit = async (pagePath: string) => {
  try {
    const visitorId = getVisitorId();
    
    // Use upsert with ignoreDuplicates to handle unique constraint
    // This prevents duplicate entries per visitor per page per day
    await supabase.from("page_analytics").upsert([
      {
        page_path: pagePath,
        visitor_id: visitorId,
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
      },
    ], { onConflict: 'visitor_id,page_path,visit_date', ignoreDuplicates: true });
  } catch (error) {
    console.error("Analytics tracking failed:", error);
  }
};
