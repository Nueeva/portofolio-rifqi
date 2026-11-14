import { QueryClient } from "@tanstack/react-query";
import type { PublicContent } from "@/integrations/api/types";

export const createQueryClient = (content?: PublicContent, browser = typeof window !== "undefined") => {
    const client = new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60000,
                gcTime: browser ? 5 * 60000 : Infinity,
                refetchOnWindowFocus: false,
            },
        },
    });
    if (content) {
        // Preserve the SSR snapshot for hydration, then revalidate against the API.
        const options = { updatedAt: browser ? 0 : Date.now() };
        client.setQueryData(["projects"], content.projects, options);
        client.setQueryData(["project-editorial"], content.portfolio_project_content, options);
        client.setQueryData(["skill-groups"], content.portfolio_skill_groups, options);
        client.setQueryData(["public-certifications"], content.certifications, options);
        client.setQueryData(["public-site-settings"], Object.fromEntries(content.site_settings.map(row => [row.setting_key, row.setting_value])), options);
    }
    return client;
};
