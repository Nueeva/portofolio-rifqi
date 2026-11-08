import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ProjectEntry } from "@/components/public/ProjectArtwork";
import { supabase } from "@/integrations/supabase/client";
import { usePageAnalytics } from "@/hooks/usePageAnalytics";
import { categoryLabels, filterProjects, mergeProjects } from "@/data/projectCopy.id";
import type { Project } from "@/data/projects";

type ProjectCategory = "all" | "pentesting" | "tools" | "web-security";
const categories: ProjectCategory[] = ["all", "tools", "web-security", "pentesting"];

export default function Projects() {
  const [activeCategory, setActiveCategory] = useState<ProjectCategory>("all");
  usePageAnalytics("/projects");
  const { data, isError } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const projects = mergeProjects((data ?? []) as Project[]);
  const filteredProjects = filterProjects(projects, activeCategory);
  return <Layout><div className="public-container public-page">
    <header className="public-page-heading"><h1>Sistem dibangun.<br /><em>Celah ditelusuri.</em></h1><p className="public-lede">Pilihan pekerjaan di security tooling, aplikasi web, dan operasi sistem. Baca masalahnya, keputusan teknisnya, dan hasil yang bisa ditelusuri.</p></header>
    <div className="project-filter" role="group" aria-label="Filter kategori proyek">{categories.map(category => <button type="button" key={category} aria-pressed={activeCategory === category} onClick={() => setActiveCategory(category)}>{categoryLabels[category]}</button>)}</div>
    {isError && <p className="public-notice" role="status">Proyek tambahan belum dapat dimuat. Proyek kurasi tetap tersedia di bawah.</p>}
    <p className="sr-only" role="status">{filteredProjects.length} karya ditampilkan.</p>
    {filteredProjects.length ? <div>{filteredProjects.map(project => <ProjectEntry key={project.id} project={project} />)}</div> : <div className="public-empty"><p>Belum ada karya dalam kategori ini.</p><button className="public-text-link" type="button" onClick={() => setActiveCategory("all")}>Tampilkan semua karya</button></div>}
  </div></Layout>;
}
