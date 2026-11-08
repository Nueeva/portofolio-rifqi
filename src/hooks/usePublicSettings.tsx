import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
function useSettingsQuery() {
    const { pathname } = useLocation();
    const query = useQuery({ queryKey: ["public-site-settings"], staleTime: 60000,
        queryFn: async () => {
            const { supabase } = await import("@/integrations/supabase/client");
            const { data, error } = await supabase.from("site_settings").select("setting_key, setting_value");
            if (error)
                throw error;
            return Object.fromEntries((data ?? []).map(row => [row.setting_key, row.setting_value])) as Record<string, string>;
        }
    });
    const { isStale, refetch } = query;
    useEffect(() => { if (isStale)
        void refetch({ cancelRefetch: false }); }, [pathname, isStale, refetch]);
    const settings = query.data ?? {};
    const get = (key: string, fallback = "") => settings[key] || fallback;
    return { settings, loading: query.isPending, get, getList: (key: string, fallback: string[] = []) => settings[key] ? settings[key].split(",").map(s => s.trim()).filter(Boolean) : fallback };
}
const Context = createContext<ReturnType<typeof useSettingsQuery>>({ settings: {}, loading: true, get: (_key, fallback = "") => fallback, getList: (_key, fallback = []) => fallback });
// eslint-disable-next-line react-refresh/only-export-components -- shared context accessor
export const usePublicSettings = () => useContext(Context);
export function PublicSettingsProvider({ children }: {
    children: ReactNode;
}) { const value = useSettingsQuery(); return <Context.Provider value={value}>{children}</Context.Provider>; }
