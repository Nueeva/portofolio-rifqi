import { curatedProjects, type CuratedProject, type Project } from "./projects";
import { publicProjects, presentText } from "./projectCopy.id";

// A successful catalog response is authoritative, including an empty list.
// Canonical records supply offline content and long-form studies, never undo CMS edits.
export function resolveProjectCatalog(managed?: Project[]): CuratedProject[] {
    if (managed === undefined) return publicProjects;
    return [...new Map(managed.map(row => [row.id, row])).values()].map(row => {
        const original = curatedProjects.find(project => project.id === row.id);
        const fallback = publicProjects.find(project => project.id === row.id);
        return {
            ...fallback,
            ...row,
            problem: original && row.problem === original.problem ? fallback!.problem : presentText(row.problem),
            solution: original && row.solution === original.solution ? fallback!.solution : presentText(row.solution),
        };
    });
}
export type ProjectEditorial = {
    project_key: string;
    summary: string;
    featured: boolean;
    sort_order: number;
    role: string;
    period: string;
    overview: string;
    challenges: string[];
    approach: string[];
    outcomes: string[];
    lessons: string;
};
export type SkillGroup = {
    id: string;
    title: string;
    items: string[];
    sort_order: number;
};
export function applyEditorial(projects: CuratedProject[], entries: ProjectEditorial[]): CuratedProject[] {
    return projects.map(project => {
        const saved = entries.find(e => e.project_key === project.id);
        const entry = saved ? normalizeEditorial(saved) : undefined;
        const base = project.caseStudy ?? { role: "", period: "", overview: project.solution, challenges: [project.problem], approach: [project.solution], outcomes: [] };
        const caseStudy = entry?.overview.trim() ? { role: entry.role, period: entry.period, overview: entry.overview, challenges: entry.challenges.map(s => s.trim()).filter(Boolean), approach: entry.approach.map(s => s.trim()).filter(Boolean), outcomes: entry.outcomes.map(s => s.trim()).filter(Boolean), lessons: entry.lessons } : base;
        return { ...project, solution: entry?.summary.trim() || project.solution, caseStudy };
    });
}
export function featuredProjects(projects: CuratedProject[], entries: ProjectEditorial[]) { if (!entries.length)
    return projects.slice(0, 4); return entries.filter(e => e.featured).sort((a, b) => a.sort_order - b.sort_order || a.project_key.localeCompare(b.project_key)).flatMap(e => { const p = projects.find(p => p.id === e.project_key); return p ? [p] : []; }); }

/** Older database exports may omit optional study fields. */
export function normalizeEditorial(value: ProjectEditorial): ProjectEditorial {
    const text = (v: unknown) => typeof v === "string" ? v : "";
    const list = (v: unknown) => Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : [];
    return { ...value, summary: text(value.summary), role: text(value.role), period: text(value.period),
        overview: text(value.overview), lessons: text(value.lessons), challenges: list(value.challenges),
        approach: list(value.approach), outcomes: list(value.outcomes), featured: value.featured === true,
        sort_order: Number.isInteger(value.sort_order) ? value.sort_order : 0 };
}
