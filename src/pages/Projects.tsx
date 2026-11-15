import { usePortfolioContent } from "@/hooks/usePortfolioContent";
import * as m from "motion/react-m";
import { ProjectArtwork, ProjectActions } from "@/components/public/ProjectArtwork";
import { caseStudyIds } from "@/data/projects";
import { useState, useEffect, useMemo } from "react";
import { Search, X } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { usePageAnalytics } from "@/hooks/usePageAnalytics";
import { categoryLabels, filterProjects } from "@/data/projectCopy.id";
import "@/components/public/case-study/case-study.css";

type ProjectCategory = "all" | "pentesting" | "tools" | "web-security";
const categories: ProjectCategory[] = ["all", "tools", "web-security", "pentesting"];

export default function Projects() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<ProjectCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  usePageAnalytics("/projects");
  const { projects, isError } = usePortfolioContent();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 1023px)");
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const getCategoryCount = (category: ProjectCategory) => {
    if (category === "all") return projects.length;
    return projects.filter((p) => p.category === category).length;
  };

  const categoryProjects = filterProjects(projects, activeCategory);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categoryProjects;

    return categoryProjects.filter((project) => {
      const inTitle = project.title.toLowerCase().includes(q);
      const inProblem = project.problem.toLowerCase().includes(q);
      const inSolution = project.solution.toLowerCase().includes(q);
      const inTech = project.tech_stack.some((t) => t.toLowerCase().includes(q));
      const inCat = (categoryLabels[project.category] ?? project.category).toLowerCase().includes(q);

      const study = (project as import("@/data/projects").CuratedProject).caseStudy;
      const inStudy = study
        ? [
            study.overview,
            ...study.challenges,
            ...study.approach,
            ...study.outcomes,
            study.lessons ?? "",
          ].some((text) => typeof text === "string" && text.toLowerCase().includes(q))
        : false;

      return inTitle || inProblem || inSolution || inTech || inCat || inStudy;
    });
  }, [categoryProjects, searchQuery]);

  const selected = filteredProjects.find((p) => p.id === selectedId) ?? filteredProjects[0];

  return (
    <Layout>
      <div className="public-container public-page">
        <header className="public-page-heading">
          <h1>
            Sistem dibangun.
            <br />
            <em>Celah ditelusuri.</em>
          </h1>
          <p className="public-lede">
            Pilihan pekerjaan di security tooling, aplikasi web, dan operasi sistem. Baca masalahnya, keputusan teknisnya, dan hasil yang bisa ditelusuri.
          </p>
        </header>

        <div className="project-toolbar">
          {/* Instant Search Bar */}
          <div className="project-search-bar" role="search">
            <div className="project-search-wrapper">
              <Search size={16} className="project-search-icon" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari karya atau stack teknologi (Java, Python, Node, Sanctum, AST)..."
                aria-label="Cari proyek berdasarkan kata kunci atau stack teknologi"
                className="project-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="project-search-clear"
                  onClick={() => setSearchQuery("")}
                  aria-label="Hapus kata kunci pencarian"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Badges with Counter */}
          <div className="project-filter" role="group" aria-label="Filter kategori proyek">
            {categories.map((category) => {
              const count = getCategoryCount(category);
              return (
                <button
                  type="button"
                  key={category}
                  data-cursor="FILTER"
                  aria-pressed={activeCategory === category}
                  onClick={() => setActiveCategory(category)}
                >
                  <span>{categoryLabels[category]}</span>
                  <span className="category-badge-count">({count})</span>
                  {activeCategory === category && (
                    <m.span className="filter-line" layoutId="category-line" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {isError && (
          <p className="public-notice" role="status">
            Proyek tambahan belum dapat dimuat. Proyek kurasi tetap tersedia di bawah.
          </p>
        )}

        <p className="sr-only" role="status">
          {filteredProjects.length} karya ditampilkan.
        </p>

        {filteredProjects.length ? (
          <div className="project-gallery">
            {/* Desktop Stage: only mounted on desktop to eliminate SVG DOM duplication penalty */}
            <div className="gallery-stage" aria-label="Pratinjau karya terpilih">
              {!isMobile && (
                <m.div layout layoutId="project-preview" key={selected.id}>
                  <ProjectArtwork project={selected} />
                </m.div>
              )}
              <h2>{selected.title}</h2>
              <ProjectActions project={selected} />
            </div>

            {/* Gallery Index: mobile art is only mounted on mobile when active to avoid duplicate SVG rendering */}
            <div className="gallery-index">
              {filteredProjects.map((project) => (
                <m.article
                  layout="position"
                  key={project.id}
                  className={project.id === selected.id ? "gallery-entry selected" : "gallery-entry"}
                  onMouseEnter={() => setSelectedId(project.id)}
                  onFocus={() => setSelectedId(project.id)}
                >
                  <button
                    type="button"
                    className="gallery-select"
                    data-cursor="LIHAT"
                    aria-pressed={selected.id === project.id}
                    onClick={() => setSelectedId(project.id)}
                  >
                    {project.title}
                    <span>{categoryLabels[project.category] ?? project.category}</span>
                  </button>

                  <div className="gallery-mobile-art">
                    {isMobile && project.id === selected.id && (
                      <ProjectArtwork project={project} />
                    )}
                  </div>

                  <p>{project.tech_stack.join(" / ")}</p>

                  <details>
                    <summary>
                      {caseStudyIds.has(project.id)
                        ? "Ringkasan karya"
                        : "Masalah dan pendekatan"}
                    </summary>
                    <h3>Masalah</h3>
                    <p>{project.problem}</p>
                    <h3>Pendekatan</h3>
                    <p>{project.solution}</p>
                  </details>

                  <ProjectActions project={project} />
                </m.article>
              ))}
            </div>
          </div>
        ) : (
          <div className="public-empty">
            <p>
              {searchQuery
                ? `Tidak ada karya yang cocok dengan "${searchQuery}".`
                : "Belum ada karya dalam kategori ini."}
            </p>
            <button
              className="public-text-link"
              type="button"
              onClick={() => {
                setActiveCategory("all");
                setSearchQuery("");
              }}
            >
              Tampilkan semua karya
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
