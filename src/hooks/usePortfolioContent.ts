import { useQuery } from "@tanstack/react-query";
import { applyEditorial, featuredProjects, resolveProjectCatalog } from "@/data/editorial";
export function usePortfolioContent() {
    const projects = useQuery({ queryKey: ["projects"], queryFn: async () => { const { supabase } = await import("@/integrations/api/client"); const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false }); if (error)
            throw error; return data; } });
    const editorial = useQuery({ queryKey: ["project-editorial"], queryFn: async () => { const { supabase } = await import("@/integrations/api/client"); const { data, error } = await supabase.from("portfolio_project_content").select("*").order("sort_order"); if (error)
            throw error; return data; }, retry: false });
    const skills = useQuery({ queryKey: ["skill-groups"], queryFn: async () => { const { supabase } = await import("@/integrations/api/client"); const { data, error } = await supabase.from("portfolio_skill_groups").select("*").order("sort_order"); if (error)
            throw error; return data; }, retry: false });
    const base = resolveProjectCatalog(projects.data === undefined ? undefined : projects.data ?? []);
    const records = applyEditorial(base, editorial.data ?? []);
    return { projects: records, featured: featuredProjects(records, editorial.data ?? []), skillsReady: skills.isSuccess, skills: skills.data ?? [], entries: editorial.data ?? [], loading: projects.isPending || editorial.isPending, isError: projects.isError, editorialError: editorial.error, refetch: async () => { await Promise.all([projects.refetch(), editorial.refetch(), skills.refetch()]); } };
}
