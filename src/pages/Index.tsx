import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { CybersecurityHero } from "@/components/CybersecurityHero";
import { TembusMark } from "@/components/TembusMark";
import { curatedProjects } from "@/data/projects";
import { usePageAnalytics } from "@/hooks/usePageAnalytics";
import "./cinema.css";

function ProjectScene({ id, className, children }: { id: string; className: string; children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const preference = useReducedMotion();
  const [reduced, setReduced] = useState(false);
  useEffect(() => setReduced(!!preference), [preference]);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-4, 4]);
  const project = curatedProjects.find((item) => item.id === id);
  return <section ref={ref} className={`film-project ${className}`}>
    <motion.div className="film-art" aria-hidden="true" style={reduced ? undefined : { y, rotate }}>{children}</motion.div>
    <div className="film-project-copy"><h2>{project?.title.split(" — ")[0]}</h2>
      <p>{id === "curated-apexsions" ? "Server Minecraft. Sembilan plugin Paper berjalan di produksi, dibangun dan diaudit sendiri. 32 temuan keamanan diperbaiki." : "Sistem manajemen portofolio siswa yang live dan dipakai di SMKN 71."}</p>
      <Link className="film-link" to={`/projects/${id}`}>Lihat bagaimana sistemnya dibangun <ArrowUpRight size={20} /></Link>
    </div>
  </section>;
}

export default function Index() {
  usePageAnalytics("/");

  const origin = useRef<HTMLElement>(null);
  const preference = useReducedMotion();
  const [reduced, setReduced] = useState(false);
  useEffect(() => setReduced(!!preference), [preference]);
  const { scrollYProgress: originProgress } = useScroll({ target: origin, offset: ["start end", "end start"] });
  const originX = useTransform(originProgress, [0, 1], [70, -70]);

  return <Layout><div className="cinema">
    <CybersecurityHero />
    <section ref={origin} className="film-origin">
      <motion.div className="film-origin-word" aria-hidden="true" style={reduced ? undefined : { x: originX }}>Berawal.</motion.div>
      <div className="film-origin-copy"><h2>Sejak SMP,<br />kode sudah berarti<br /><em>sesuatu di rumah.</em></h2>
        <p>Saya mulai menghasilkan uang sejak SMP. Total sekitar Rp5 juta, lebih dari Rp2 juta di antaranya dari server Minecraft yang saya jalankan. Uang itu dipakai orang tua untuk cicilan keluarga.</p>
        <p>Dari server Minecraft, ke sistem yang saya desain, bangun, audit, dan operasikan sendiri.</p>
      </div>
    </section>
    <ProjectScene id="curated-apexsions" className="film-apex">
      <div className="film-blocks">{Array.from({ length: 9 }, (_, i) => <span key={i} style={{ "--block": i } as React.CSSProperties} />)}</div>
      <span className="film-art-caption">Apexsions</span>
    </ProjectScene>
    <ProjectScene id="curated-portfolio71" className="film-school">
      <div className="film-sheets"><span /><span /><span><strong>Portfolio<br />71.</strong><i /><i /><i /></span></div>
    </ProjectScene>
    <section className="film-orchestration">
      <div className="film-signal" aria-hidden="true"><span /><TembusMark /><span /></div>
      <h2>Satu operator.<br /><em>Seluruh alur.</em></h2>
      <p>9Router + Hermes menjadi stack gateway pribadi saya untuk routing dan orkestrasi model AI. Saya bekerja dengan agen AI sebagai mitra engineering, dari desain sampai operasi.</p>
      <Link className="film-link" to="/about">Kenali cara saya bekerja <ArrowUpRight size={20} /></Link>
    </section>
    <section className="film-end"><TembusMark className="film-end-mark" /><h2>Mari mulai<br />percakapan.</h2><Link className="film-link" to="/contact">Hubungi saya <ArrowUpRight size={28} /></Link></section>
  </div></Layout>;
}
