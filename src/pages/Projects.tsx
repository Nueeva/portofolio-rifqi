import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { ExternalLink, Github, Filter, ShieldCheck, Terminal, Wrench } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ScrollReveal } from "@/components/ScrollReveal";
import { ScrambleText } from "@/components/ScrambleText";
import { usePageAnalytics } from "@/hooks/usePageAnalytics";
import { LazyImage } from "@/components/LazyImage";
import { curatedProjects, type Project } from "@/data/projects";

type ProjectCategory = "all" | "pentesting" | "tools" | "web-security";

const categoryLabels: Record<ProjectCategory, string> = {
  all: "All Projects",
  pentesting: "Penetration Testing",
  tools: "Security Tools",
  "web-security": "Web Security",
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const coverGradients = [
  "from-emerald-950 via-teal-950 to-black",
  "from-zinc-950 via-emerald-950 to-black",
  "from-slate-950 via-cyan-950 to-black",
  "from-neutral-950 via-green-950 to-black",
];

const categoryIcons = {
  pentesting: Terminal,
  tools: Wrench,
  "web-security": ShieldCheck,
} as const;

/** Designed cover for projects without a screenshot: gradient + grid + category mark */
function ProjectCover({ project }: { project: Project }) {
  let hash = 0;
  for (const ch of project.title) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  const gradient = coverGradients[hash % coverGradients.length];
  const Icon = categoryIcons[project.category as keyof typeof categoryIcons] ?? Terminal;

  return (
    <div className={`relative h-48 overflow-hidden bg-gradient-to-br ${gradient}`}>
      <div className="absolute inset-0 bg-grid opacity-50" />
      <Icon className="absolute -right-5 -bottom-5 h-36 w-36 text-primary/10 -rotate-12 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-background/40 backdrop-blur-sm">
          <Icon className="h-7 w-7 text-primary" />
        </div>
        <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-foreground/70">
          {categoryLabels[project.category as ProjectCategory]}
        </span>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent pointer-events-none" />
    </div>
  );
}

const Projects = () => {
  const [activeCategory, setActiveCategory] = useState<ProjectCategory>("all");

  // Track page visit for analytics
  usePageAnalytics("/projects");

  const { data: dbProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Curated real projects always render first; admin-managed rows from
  // Supabase are appended (deduplicated by title). If the database is
  // unreachable the curated list keeps the page complete on its own.
  const curatedTitles = new Set(curatedProjects.map((p) => p.title.toLowerCase()));
  const projects: Project[] = [
    ...curatedProjects,
    ...((dbProjects ?? []) as Project[]).filter(
      (p) => !curatedTitles.has(p.title.toLowerCase())
    ),
  ];

  const filteredProjects = projects.filter(
    (project) => activeCategory === "all" || project.category === activeCategory
  );

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <ScrollReveal>
            <div className="mb-12">
              <h1 className="text-3xl sm:text-4xl font-bold mb-4">
                <ScrambleText parts={[{ text: "Projects", className: "text-primary" }]} />
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                A selection of security research, tools, and applications I've worked on.
                Each project addresses real security challenges with practical solutions.
              </p>
              <div className="w-20 h-1 bg-primary rounded-full mt-4" />
            </div>
          </ScrollReveal>

          {/* Category Filter — active pill glides between categories (layoutId) */}
          <ScrollReveal delay={100}>
            <div className="flex flex-wrap items-center gap-2 mb-10">
              <Filter className="h-4 w-4 text-muted-foreground" />
              {(Object.keys(categoryLabels) as ProjectCategory[]).map((category) => {
                const isActive = activeCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={`relative h-9 rounded-md px-3 text-sm font-medium transition-colors ${
                      isActive
                        ? "text-primary-foreground"
                        : "border border-input bg-background text-muted-foreground hover:text-primary hover:border-primary/50"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="filter-pill"
                        className="absolute inset-0 rounded-md bg-primary glow-primary"
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      />
                    )}
                    <span className="relative z-10">{categoryLabels[category]}</span>
                  </button>
                );
              })}
            </div>
          </ScrollReveal>

          {/* Projects Grid — Motion layout + AnimatePresence filter transitions */}
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No projects found in this category.</p>
            </div>
          ) : (
            <motion.div layout className="grid md:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredProjects.map((project, index) => (
                  <motion.article
                    key={project.id}
                    layout
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.45, delay: (index % 2) * 0.08, ease: EASE }}
                    whileHover={{ y: -4 }}
                    data-cursor="VIEW"
                    className="relative rounded-lg bg-card border border-border hover:border-primary/50 hover:shadow-[0_24px_48px_-24px_hsl(var(--primary)/0.35)] transition-[border-color,box-shadow] duration-500 ease-out-expo group h-full overflow-hidden"
                  >
                    {/* Thumbnail with lazy loading */}
                    {project.image_url ? (
                      <div className="relative h-48 overflow-hidden">
                        <LazyImage
                          src={project.image_url}
                          alt={project.title}
                          className="w-full h-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105"
                          wrapperClassName="h-full"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent pointer-events-none" />
                      </div>
                    ) : (
                      <ProjectCover project={project} />
                    )}

                    <div className="p-6">
                      <div className="line-accent" />

                      {/* Category Badge */}
                      <Badge variant="outline" className="mb-4 text-xs">
                        {categoryLabels[project.category as ProjectCategory]}
                      </Badge>

                      {/* Title */}
                      <h2 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                        {project.title}
                      </h2>

                      {/* Problem */}
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-primary mb-1">The Problem</h3>
                        <p className="text-sm text-muted-foreground">
                          {project.problem}
                        </p>
                      </div>

                      {/* Solution */}
                      <div className="mb-6">
                        <h3 className="text-sm font-medium text-primary mb-1">The Solution</h3>
                        <p className="text-sm text-muted-foreground">
                          {project.solution}
                        </p>
                      </div>

                      {/* Tech Stack */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        {project.tech_stack.map((tech) => (
                          <span
                            key={tech}
                            className="px-2 py-1 rounded text-xs font-mono bg-secondary/50 text-muted-foreground"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>

                      {/* Links */}
                      <div className="flex gap-3">
                        {project.github_url && (
                          <a
                            href={project.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Github className="h-4 w-4" />
                            Code
                          </a>
                        )}
                        {project.demo_url && (
                          <a
                            href={project.demo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Demo
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Projects;
