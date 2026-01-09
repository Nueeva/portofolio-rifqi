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
        
        await supabase.from("page_analytics").insert([
          {
            page_path: pagePath,
            visitor_id: visitorId,
            user_agent: navigator.userAgent,
            referrer: document.referrer || null,
          },
        ]);
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
    
    await supabase.from("page_analytics").insert([
      {
        page_path: pagePath,
        visitor_id: visitorId,
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
      },
    ]);
  } catch (error) {
    console.error("Analytics tracking failed:", error);
  }
};
