import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SiteSettings {
  [key: string]: string;
}

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("setting_key, setting_value");

        if (error) throw error;

        const map: SiteSettings = {};
        (data || []).forEach((row: { setting_key: string; setting_value: string }) => {
          map[row.setting_key] = row.setting_value;
        });
        setSettings(map);
      } catch (error) {
        console.error("Error fetching site settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const get = (key: string, fallback: string = "") => settings[key] || fallback;
  const getList = (key: string, fallback: string[] = []) => {
    const val = settings[key];
    return val ? val.split(",").map((s) => s.trim()).filter(Boolean) : fallback;
  };

  return { settings, loading, get, getList, refetch: () => {
    setLoading(true);
    supabase
      .from("site_settings")
      .select("setting_key, setting_value")
      .then(({ data }) => {
        const map: SiteSettings = {};
        (data || []).forEach((row: { setting_key: string; setting_value: string }) => {
          map[row.setting_key] = row.setting_value;
        });
        setSettings(map);
        setLoading(false);
      });
  }};
};
