import { usePortfolioContent } from "@/hooks/usePortfolioContent";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Download, ExternalLink } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { usePageAnalytics } from "@/hooks/usePageAnalytics";
import { usePublicSettings } from "@/hooks/usePublicSettings";
import { supabase } from "@/integrations/api/client";
import { ProjectDiagram } from "@/components/public/ProjectDiagram";
import { publicProjects } from "@/data/projectCopy.id";
const security = ["Penetration Testing", "Vulnerability Assessment", "Web Application Security", "Network Security", "Secure Code Review", "Threat Modeling"];
const development = ["TypeScript", "React", "Python", "Node.js", "Go", "Bash"];
const instruments = ["Burp Suite", "Wireshark", "Nmap", "OWASP ZAP", "Metasploit", "Ghidra", "sqlmap", "Hashcat"];
export default function About() {
    usePageAnalytics("/about");
    const { getList,get } = usePublicSettings();
    const catalog=usePortfolioContent();
    const skills = catalog.skillsReady ? catalog.skills : [
        { title: "Keamanan", items: getList("skills_security", security) },
        { title: "Pengembangan", items: getList("skills_dev", development) },
        { title: "Tools", items: getList("skills_tools", instruments) },
    ];
    const { data: certifications, isError } = useQuery({
        queryKey: ["public-certifications"],
        queryFn: async () => {
            const { data, error } = await supabase.from("certifications").select("*").order("created_at", { ascending: false });
            if (error)
                throw error;
            return data;
        },
    });
    return <Layout><div className="public-container public-page">
    <header className="about-intro"><h1>Rifqi Ariansyah.<br /><em>Cybersecurity<br />Engineer.</em></h1><div>
      <p>Saya menelusuri celah aplikasi, membangun security tooling, dan memperbaiki sistem sampai ke produksi. Pekerjaan saya menghubungkan pengujian keamanan dengan pengembangan dan operasi.</p>
      <p>Dari reflected XSS di xssscope sampai audit ekosistem Apexsions, saya ingin memahami penyebab masalah dan memastikan perbaikannya bisa digunakan.</p>
      <a className="public-text-link" href={get("portfolio_cv_url","/cv-rifqi-ariansyah.pdf")} download="cv-rifqi-ariansyah.pdf">Unduh CV <Download /></a>
    </div></header>
    <section className="about-section" aria-labelledby="about-skills"><h2 id="about-skills">Keahlian & <em>perangkat kerja.</em></h2>
      {catalog.skillsReady&&!skills.length&&<p>Belum ada kelompok keahlian yang dipublikasikan.</p>}{skills.map(group => <div className="skill-line" key={group.title}><h3>{group.title}</h3><ul>{group.items.map(item => <li key={item}>{item}</li>)}</ul></div>)}
    </section>
    <section className="about-section capability-proof" aria-label="Keahlian dalam praktik"><div><h2>Batas akses,<br /><em>dalam praktik.</em></h2><p>Web Application Security bertemu pengembangan aplikasi: peran siswa, guru, dan admin pada Portfolio 71.</p><Link className="public-text-link" to="/projects/curated-portfolio71">Telusuri implementasi <ArrowUpRight /></Link></div><ProjectDiagram id="curated-portfolio71"/></section>
    <section className="about-section" aria-labelledby="about-experience"><h2 id="about-experience">Pengalaman melalui<br /><em>sistem yang dibangun.</em></h2>
      {catalog.featured.map(project => <article className="experience-entry" key={project.id}><div><h3>{project.title.split(" — ")[0]}</h3><p>{project.caseStudy?.role}</p><p className="experience-period">{project.caseStudy?.period}</p></div><div><p>{project.solution}</p><Link className="public-text-link" to={`/projects/${project.id}`}>Baca studi kasus <ArrowUpRight /></Link></div></article>)}
    </section>
    <section className="about-section" aria-labelledby="about-outcomes"><h2 id="about-outcomes">Pencapaian yang<br /><em>bisa ditelusuri.</em></h2><div className="personal-story">
      <p>Audit Apexsions menemukan dan memperbaiki 13 temuan critical serta 19 major melalui 16 commit. Sembilan plugin internalnya berjalan di produksi.</p>
      <p>Pada 29 Oktober 2026, Portfolio 71 memuat 51 karya dari 28 siswa, didampingi 4 guru pembimbing. Termasuk 5 proyek lintas jurusan yang melibatkan 10 siswa.</p>
      <p>xssscope dan CTF-Toolkit tersedia sebagai proyek open source. Proyek dan pencapaian ini menjadi bukti pekerjaan saya.</p>
    </div></section>
    <section className="about-section" aria-labelledby="about-certifications"><h2 id="about-certifications">Sertifikasi.</h2>
      {certifications?.length ? certifications.map(cert => <article className="experience-entry" key={cert.id}><div><h3>{cert.name}</h3><p>{cert.issuer} · {cert.year}</p></div><div><p>{cert.status === "active" ? "Aktif" : cert.status === "in-progress" || cert.status === "in_progress" ? "Dalam proses" : cert.status}</p>{(cert.credential_url || cert.image_url) && <a className="public-text-link" href={cert.credential_url || cert.image_url!} target="_blank" rel="noopener noreferrer">Lihat kredensial <ExternalLink /></a>}</div></article>) : <p className="public-lede">{isError ? "Data sertifikasi belum dapat dimuat. Silakan coba lagi nanti." : "Belum ada sertifikasi yang dipublikasikan."}</p>}
    </section>
    <section className="about-section" aria-labelledby="about-story"><h2 id="about-story">Berawal dari rumah.<br /><em>Berlanjut ke sistem.</em></h2><div className="personal-story">
      <p>Saya mulai menghasilkan uang sejak SMP. Totalnya sekitar Rp5 juta; lebih dari Rp2 juta di antaranya datang dari server Minecraft yang saya jalankan. Uang itu dipakai orang tua untuk cicilan keluarga.</p>
      <p>Perjalanan itu membawa saya ke Apexsions: merancang sistem, menulis plugin, membangun website komunitas, melakukan audit, dan menjalankan infrastrukturnya. Saya juga membangun Portfolio 71, platform portofolio yang digunakan di SMKN 71 Jakarta.</p>
      <p>Untuk routing dan orkestrasi model AI, saya mengoperasikan stack gateway pribadi 9Router + Hermes. Agen AI menjadi mitra engineering dalam pekerjaan dari desain sampai operasi.</p>
      <Link className="public-text-link" to="/contact">Mari bicara tentang pekerjaan berikutnya <ArrowUpRight /></Link>
    </div></section>
  </div></Layout>;
}
