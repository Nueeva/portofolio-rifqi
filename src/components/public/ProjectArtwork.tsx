import { useState } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, ExternalLink, Github } from "lucide-react";
import { Link } from "react-router-dom";
import { caseStudyIds, type Project } from "@/data/projects";
import { categoryLabels } from "@/data/projectCopy.id";
import { Aperture } from "./PublicMotion";

/** Editorial diagrams of documented work; these are not simulated screenshots. */
export function ProjectArtwork({ project }: { project: Project }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const image = project.image_url && failedSource !== project.image_url;
  return <div className={`project-visual project-visual-${project.id}`} aria-hidden="true">
    {image ? <img src={project.image_url!} alt="" loading="lazy" decoding="async" onError={() => setFailedSource(project.image_url)} /> : <>
      {project.id === "curated-xssscope" ? <>
        <div className="art-process"><span>Parameter</span><ArrowDown /><span>Konteks refleksi</span><ArrowDown /><em>Verifikasi.</em></div>
        <p className="art-detail">HTML · Atribut · Script<br />JavaScript / Node.js</p>
      </> : project.id === "curated-apexsions" ? <>
        <span className="art-word">13 critical.</span><span className="art-accent">19 major.</span>
        <p className="art-detail">Temuan audit diperbaiki.<br />9 plugin Paper internal.</p>
      </> : project.id === "curated-portfolio71" ? <>
        <span className="art-word">Portfolio 71</span><div className="art-roles"><span>Siswa</span><ArrowRight /><span>Guru</span><ArrowRight /><span>Admin</span></div>
        <p className="art-detail">Publikasi · Verifikasi · Pengelolaan<br />Laravel / Nuxt / Sanctum</p>
      </> : project.id === "curated-ctf-toolkit" ? <>
        <span className="art-word">Siap sebelum</span><span className="art-accent">waktu berjalan.</span>
        <div className="art-categories"><span>Web</span><span>Crypto</span><span>Forensics</span><span>Reversing</span></div>
        <p className="art-detail">Helper Python untuk CTF.</p>
      </> : <>
        <span className="art-word">{categoryLabels[project.category] ?? project.category}</span>
        <p className="art-detail">{project.tech_stack.join(" / ")}</p>
      </>}
    </>}
  </div>;
}

export function ProjectActions({ project, showStudy = true }: { project: Project; showStudy?: boolean }) {
  return <div className="project-actions">
    {showStudy && caseStudyIds.has(project.id) && <Link to={`/projects/${project.id}`}>Baca studi kasus <ArrowUpRight aria-hidden="true" /></Link>}
    {project.github_url && <a href={project.github_url} target="_blank" rel="noopener noreferrer" aria-label={`Kode ${project.title} di GitHub`}><Github aria-hidden="true" />Kode</a>}
    {project.demo_url && <a href={project.demo_url} target="_blank" rel="noopener noreferrer" aria-label={`Buka situs ${project.title}`}><ExternalLink aria-hidden="true" />Situs proyek</a>}
  </div>;
}

export function ProjectEntry({ project }: { project: Project }) {
  return <article className="editorial-project">
    <div className="project-image"><Aperture><ProjectArtwork project={project} /></Aperture></div>
    <div className="project-copy"><h2>{project.title}</h2>
      <p className="project-category">{categoryLabels[project.category] ?? project.category}</p>
      <h3>Masalah</h3><p>{project.problem}</p>
      <h3>Pendekatan</h3><p>{project.solution}</p>
      <ul className="project-tech" aria-label="Teknologi">{project.tech_stack.map(tech => <li key={tech}>{tech}</li>)}</ul>
      <ProjectActions project={project} />
    </div>
  </article>;
}
