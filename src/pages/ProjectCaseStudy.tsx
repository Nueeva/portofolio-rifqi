import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CircleCheck,
  ExternalLink,
  Github,
  Lightbulb,
  User,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { ScrollReveal } from "@/components/ScrollReveal";
import { usePageAnalytics } from "@/hooks/usePageAnalytics";
import { curatedProjects, getCuratedProject } from "@/data/projects";

const categoryLabels: Record<string, string> = {
  pentesting: "Penetration Testing",
  tools: "Security Tools",
  "web-security": "Web Security",
};

function SectionHeading({ children }: { children: string }) {
  return (
    <h2 className="text-2xl font-bold mb-5 flex items-center gap-3">
      <span className="h-px w-8 bg-primary" aria-hidden="true" />
      {children}
    </h2>
  );
}

const ProjectCaseStudy = () => {
  const { id } = useParams<{ id: string }>();
  const project = id ? getCuratedProject(id) : undefined;
  const caseStudy = project?.caseStudy;

  usePageAnalytics(`/projects/${id ?? ""}`);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [id]);

  // Unknown id, or a project without a case study: back to the grid.
  if (!project || !caseStudy) {
    return <Navigate to="/projects" replace />;
  }

  // Prev / next across the case studies, in curated order.
  const studies = curatedProjects.filter((p) => p.caseStudy);
  const index = studies.findIndex((p) => p.id === project.id);
  const prev = index > 0 ? studies[index - 1] : undefined;
  const next = index < studies.length - 1 ? studies[index + 1] : undefined;

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <ScrollReveal>
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-10"
            >
              <ArrowLeft className="h-4 w-4" />
              All Projects
            </Link>
          </ScrollReveal>

          {/* Header */}
          <ScrollReveal delay={60}>
            <header className="mb-14">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary mb-4">
                Case Study
              </p>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-[-0.03em] leading-[1.05] mb-6">
                {project.title}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
                {caseStudy.overview}
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-8">
                <Badge variant="outline" className="text-xs">
                  {categoryLabels[project.category] ?? project.category}
                </Badge>
                {project.github_url && (
                  <a
                    href={project.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Github className="h-4 w-4" />
                    View Code
                  </a>
                )}
                {project.demo_url && (
                  <a
                    href={project.demo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Live Demo
                  </a>
                )}
              </div>

              {/* Meta strip */}
              <div className="grid sm:grid-cols-2 gap-4 mt-10">
                <div className="rounded-lg border border-border bg-card p-5">
                  <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
                    <User className="h-3.5 w-3.5 text-primary" />
                    Role
                  </p>
                  <p className="font-medium">{caseStudy.role}</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-5">
                  <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
                    <CalendarDays className="h-3.5 w-3.5 text-primary" />
                    Period
                  </p>
                  <p className="font-medium">{caseStudy.period}</p>
                </div>
              </div>

              {/* Tech stack */}
              <div className="flex flex-wrap gap-2 mt-6">
                {project.tech_stack.map((tech) => (
                  <span
                    key={tech}
                    className="px-2.5 py-1 rounded text-xs font-mono bg-secondary/50 text-muted-foreground"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </header>
          </ScrollReveal>

          {/* The Problem */}
          <ScrollReveal>
            <section className="mb-16">
              <SectionHeading>The Problem</SectionHeading>
              <p className="text-muted-foreground leading-relaxed">{project.problem}</p>
              <p className="text-muted-foreground leading-relaxed mt-4">{project.solution}</p>
            </section>
          </ScrollReveal>

          {/* Challenges */}
          <ScrollReveal>
            <section className="mb-16">
              <SectionHeading>Challenges</SectionHeading>
              <ul className="space-y-4">
                {caseStudy.challenges.map((challenge) => (
                  <li key={challenge} className="flex gap-3">
                    <span
                      className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                    <p className="text-muted-foreground leading-relaxed">{challenge}</p>
                  </li>
                ))}
              </ul>
            </section>
          </ScrollReveal>

          {/* Approach */}
          <ScrollReveal>
            <section className="mb-16">
              <SectionHeading>Approach</SectionHeading>
              <ol className="space-y-5">
                {caseStudy.approach.map((step, i) => (
                  <li key={step} className="flex gap-4">
                    <span className="font-mono text-sm text-primary font-semibold pt-0.5 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="text-muted-foreground leading-relaxed">{step}</p>
                  </li>
                ))}
              </ol>
            </section>
          </ScrollReveal>

          {/* Outcomes */}
          <ScrollReveal>
            <section className="mb-16">
              <SectionHeading>Outcomes</SectionHeading>
              <ul className="space-y-4">
                {caseStudy.outcomes.map((outcome) => (
                  <li key={outcome} className="flex gap-3">
                    <CircleCheck className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                    <p className="text-muted-foreground leading-relaxed">{outcome}</p>
                  </li>
                ))}
              </ul>
            </section>
          </ScrollReveal>

          {/* Lessons */}
          {caseStudy.lessons && (
            <ScrollReveal>
              <section className="mb-20">
                <div className="relative rounded-lg border border-primary/30 bg-card p-7 sm:p-9 overflow-hidden">
                  <div className="line-accent" />
                  <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-primary mb-4">
                    <Lightbulb className="h-4 w-4" />
                    Lessons Learned
                  </p>
                  <p className="text-lg leading-relaxed">{caseStudy.lessons}</p>
                </div>
              </section>
            </ScrollReveal>
          )}

          {/* Prev / Next */}
          {(prev || next) && (
            <ScrollReveal>
              <nav
                aria-label="More case studies"
                className="grid sm:grid-cols-2 gap-4 border-t border-border pt-10"
              >
                {prev ? (
                  <Link
                    to={`/projects/${prev.id}`}
                    className="card-lift group rounded-lg border border-border bg-card p-5"
                  >
                    <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Previous Case Study
                    </p>
                    <p className="font-semibold group-hover:text-primary transition-colors">
                      {prev.title}
                    </p>
                  </Link>
                ) : (
                  <span className="hidden sm:block" />
                )}
                {next && (
                  <Link
                    to={`/projects/${next.id}`}
                    className="card-lift group rounded-lg border border-border bg-card p-5 text-right"
                  >
                    <p className="flex items-center justify-end gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
                      Next Case Study
                      <ArrowRight className="h-3.5 w-3.5" />
                    </p>
                    <p className="font-semibold group-hover:text-primary transition-colors">
                      {next.title}
                    </p>
                  </Link>
                )}
              </nav>
            </ScrollReveal>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ProjectCaseStudy;
