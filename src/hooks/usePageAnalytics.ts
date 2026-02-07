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
        
        // Call the edge function with rate limiting
        const { error } = await supabase.functions.invoke('track-analytics', {
          body: {
            page_path: pagePath,
            visitor_id: visitorId,
            user_agent: navigator.userAgent,
            referrer: document.referrer || null,
          },
        });

        if (error) {
          console.error("Analytics tracking failed:", error);
        }
      } catch (error) {
        // Silently fail - analytics shouldn't break the app
        console.error("Analytics tracking failed:", error);
      }
    };

    // Defer analytics to avoid extending the critical request chain
    const schedule = typeof requestIdleCallback === 'function'
      ? requestIdleCallback
      : (cb: () => void) => setTimeout(cb, 2000);
    
    const id = schedule(trackVisit);
    return () => {
      if (typeof cancelIdleCallback === 'function' && typeof id === 'number') {
        cancelIdleCallback(id);
      }
    };
  }, [pagePath]);
};

export const trackPageVisit = async (pagePath: string) => {
  try {
    const visitorId = getVisitorId();
    
    // Call the edge function with rate limiting
    const { error } = await supabase.functions.invoke('track-analytics', {
      body: {
        page_path: pagePath,
        visitor_id: visitorId,
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
      },
    });

    if (error) {
      console.error("Analytics tracking failed:", error);
    }
  } catch (error) {
    console.error("Analytics tracking failed:", error);
  }
};
