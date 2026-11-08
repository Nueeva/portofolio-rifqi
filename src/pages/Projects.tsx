import * as m from "motion/react-m";
import { ProjectArtwork, ProjectActions } from "@/components/public/ProjectArtwork";
import { caseStudyIds } from "@/data/projects";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { usePageAnalytics } from "@/hooks/usePageAnalytics";
import { categoryLabels, filterProjects, mergeProjects } from "@/data/projectCopy.id";
import type { Project } from "@/data/projects";
type ProjectCategory = "all" | "pentesting" | "tools" | "web-security";
const categories: ProjectCategory[] = ["all", "tools", "web-security", "pentesting"];
export default function Projects() {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<ProjectCategory>("all");
    usePageAnalytics("/projects");
    const { data, isError } = useQuery({
        queryKey: ["projects"],
        queryFn: async () => {
            const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
            if (error)
                throw error;
            return data;
        },
    });
    const projects = mergeProjects((data ?? []) as Project[]);
    const filteredProjects = filterProjects(projects, activeCategory);
    const selected = filteredProjects.find(p => p.id === selectedId) ?? filteredProjects[0];
    return <Layout><div className="public-container public-page">
    <header className="public-page-heading"><h1>Sistem dibangun.<br /><em>Celah ditelusuri.</em></h1><p className="public-lede">Pilihan pekerjaan di security tooling, aplikasi web, dan operasi sistem. Baca masalahnya, keputusan teknisnya, dan hasil yang bisa ditelusuri.</p></header>
    <div className="project-filter" role="group" aria-label="Filter kategori proyek">{categories.map(category => <button type="button" key={category} aria-pressed={activeCategory === category} onClick={() => setActiveCategory(category)}>{categoryLabels[category]}{activeCategory === category && <m.span className="filter-line" layoutId="category-line"/>}</button>)}</div>
    {isError && <p className="public-notice" role="status">Proyek tambahan belum dapat dimuat. Proyek kurasi tetap tersedia di bawah.</p>}
    <p className="sr-only" role="status">{filteredProjects.length} karya ditampilkan.</p>
    {filteredProjects.length ? <div className="project-gallery"><div className="gallery-stage" aria-label="Pratinjau karya terpilih"><m.div layout layoutId="project-preview" key={selected.id}><ProjectArtwork project={selected}/></m.div><h2>{selected.title}</h2><ProjectActions project={selected}/></div><div className="gallery-index">{filteredProjects.map(project => <m.article layout="position" key={project.id} className={project.id === selected.id ? "gallery-entry selected" : "gallery-entry"} onMouseEnter={() => setSelectedId(project.id)} onFocus={() => setSelectedId(project.id)}><button type="button" className="gallery-select" aria-pressed={selected.id === project.id} onClick={() => setSelectedId(project.id)}>{project.title}<span>{categoryLabels[project.category] ?? project.category}</span></button><div className="gallery-mobile-art"><ProjectArtwork project={project}/></div><p>{project.tech_stack.join(" / ")}</p><details><summary>{caseStudyIds.has(project.id) ? "Ringkasan karya" : "Masalah dan pendekatan"}</summary><h3>Masalah</h3><p>{project.problem}</p><h3>Pendekatan</h3><p>{project.solution}</p></details><ProjectActions project={project}/></m.article>)}</div></div> : <div className="public-empty"><p>Belum ada karya dalam kategori ini.</p><button className="public-text-link" type="button" onClick={() => setActiveCategory("all")}>Tampilkan semua karya</button></div>}
  </div></Layout>;
}
