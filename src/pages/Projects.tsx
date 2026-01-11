import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Github, Filter, Image as ImageIcon } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ScrollReveal } from "@/components/ScrollReveal";
import { usePageAnalytics } from "@/hooks/usePageAnalytics";
import { LazyImage } from "@/components/LazyImage";

type ProjectCategory = "all" | "pentesting" | "tools" | "web-security";

const categoryLabels: Record<ProjectCategory, string> = {
  all: "All Projects",
  pentesting: "Penetration Testing",
  tools: "Security Tools",
  "web-security": "Web Security",
};

const Projects = () => {
  const [activeCategory, setActiveCategory] = useState<ProjectCategory>("all");
  
  // Track page visit for analytics
  usePageAnalytics("/projects");

  const { data: projects, isLoading, error } = useQuery({
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

  const filteredProjects = projects?.filter(
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
                <span className="text-primary">Projects</span>
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                A selection of security research, tools, and applications I've worked on. 
                Each project addresses real security challenges with practical solutions.
              </p>
              <div className="w-20 h-1 bg-primary rounded-full mt-4" />
            </div>
          </ScrollReveal>

          {/* Category Filter */}
          <ScrollReveal delay={100}>
            <div className="flex flex-wrap items-center gap-2 mb-10">
              <Filter className="h-4 w-4 text-muted-foreground" />
              {(Object.keys(categoryLabels) as ProjectCategory[]).map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(category)}
                  className={activeCategory === category ? "glow-primary" : ""}
                >
                  {categoryLabels[category]}
                </Button>
              ))}
            </div>
          </ScrollReveal>

          {/* Projects Grid */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 rounded-lg bg-card border border-border animate-pulse">
                  <div className="h-40 bg-secondary rounded mb-4" />
                  <div className="h-6 bg-secondary rounded w-3/4 mb-4" />
                  <div className="h-4 bg-secondary rounded w-full mb-2" />
                  <div className="h-4 bg-secondary rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive">Failed to load projects. Please try again.</p>
            </div>
          ) : filteredProjects?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No projects found in this category.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filteredProjects?.map((project, index) => (
                <ScrollReveal key={project.id} delay={index * 100}>
                  <article
                    className="relative rounded-lg bg-card border border-border hover:border-primary/50 transition-colors group h-full overflow-hidden"
                  >
                    {/* Thumbnail with lazy loading */}
                    {project.image_url ? (
                      <div className="relative h-48 overflow-hidden">
                        <LazyImage
                          src={project.image_url}
                          alt={project.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          wrapperClassName="h-full"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent pointer-events-none" />
                      </div>
                    ) : (
                      <div className="h-48 bg-muted flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                      </div>
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
                  </article>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Projects;
