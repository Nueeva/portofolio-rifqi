import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { ProjectActions, ProjectArtwork } from "@/components/public/ProjectArtwork";
import { Aperture } from "@/components/public/PublicMotion";
import { usePageAnalytics } from "@/hooks/usePageAnalytics";
import { usePortfolioContent } from "@/hooks/usePortfolioContent";

export default function ProjectCaseStudy() {
  const { id } = useParams<{ id: string }>();
  const {projects,loading,isError} = usePortfolioContent();
  const project = projects.find(p=>p.id===id);
  const study = project?.caseStudy;
  usePageAnalytics(`/projects/${id ?? ""}`);
  const pageTitle=project?.title;
  useEffect(()=>{if(pageTitle)document.title=`${pageTitle} — Rifqi Ariansyah`;},[pageTitle]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [id]);
  if(!project && loading) return <Layout><div className="public-container public-page" role="status">Memuat studi kasus…</div></Layout>;
  if(!project && isError) return <Layout><div className="public-container public-page" role="alert"><h1>Studi kasus belum dapat dimuat.</h1><a href="/projects">Kembali ke karya</a></div></Layout>;
  if (!project || !study) return <Navigate to="/projects" replace />;
  const studies = projects.filter(item => item.caseStudy);
  const index = studies.findIndex(item => item.id === project.id);
  const prev = studies[index - 1];
  const next = studies[index + 1];
  return <Layout><div className="public-container public-page">
    <header className="study-header"><Link to="/projects" className="public-text-link"><ArrowLeft />Semua karya</Link>
      <h1>{project.title}</h1><p className="public-lede">{project.solution}</p>
      <dl className="study-meta"><div><dt>Peran</dt><dd>{study.role}</dd></div><div><dt>Periode</dt><dd>{study.period}</dd></div></dl>
      <ul className="project-tech" aria-label="Teknologi">{project.tech_stack.map(tech => <li key={tech}>{tech}</li>)}</ul><ProjectActions project={project} showStudy={false} />
    </header>
    <Aperture><ProjectArtwork project={project} /></Aperture>
    <article className="study-article" aria-label={`Studi kasus ${project.title}`}>
      <section className="study-section"><h2>Konteks</h2><p>{study.overview}</p></section>
      <section className="study-section"><h2>Masalah yang dihadapi</h2><p>{project.problem}</p><ul>{study.challenges.map(item => <li key={item}>{item}</li>)}</ul></section>
      <section className="study-section"><h2>Pendekatan</h2><ol>{study.approach.map(item => <li key={item}>{item}</li>)}</ol></section>
      <section className="study-section"><h2>Hasil</h2><ul>{study.outcomes.map(item => <li key={item}>{item}</li>)}</ul></section>
      {study.lessons && <section className="study-section"><h2>Yang saya pelajari</h2><p>{study.lessons}</p></section>}
    </article>
    <nav className="study-navigation" aria-label="Studi kasus lainnya">
      {prev && <Link className="public-text-link" to={`/projects/${prev.id}`}><ArrowLeft /><span>Sebelumnya<br />{prev.title.split(" — ")[0]}</span></Link>}
      {next && <Link className="public-text-link" to={`/projects/${next.id}`}><span>Berikutnya<br />{next.title.split(" — ")[0]}</span><ArrowRight /></Link>}
    </nav>
  </div></Layout>;
}
