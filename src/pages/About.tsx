import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Download } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { usePageAnalytics } from "@/hooks/usePageAnalytics";
import { usePublicSettings } from "@/hooks/usePublicSettings";
import { usePortfolioContent } from "@/hooks/usePortfolioContent";
import { ProjectDiagram } from "@/components/public/ProjectDiagram";

import "@/components/public/about/about-elevation.css";
import { FounderCredentials } from "@/components/public/about/FounderCredentials";
import { ForensicTimeline } from "@/components/public/about/ForensicTimeline";
import { SecurityFootprintCard } from "@/components/public/about/SecurityFootprintCard";
import { DefenseMatrix } from "@/components/public/about/DefenseMatrix";
import { CertificationsList } from "@/components/public/about/CertificationsList";

const security = [
  "Penetration Testing",
  "Vulnerability Assessment",
  "Web Application Security",
  "Network Security",
  "Secure Code Review",
  "Threat Modeling",
];
const development = ["TypeScript", "React", "Python", "Node.js", "Go", "Bash", "Java"];
const instruments = ["Burp Suite", "Wireshark", "Nmap", "OWASP ZAP", "Metasploit", "Ghidra", "sqlmap", "Hashcat"];

export default function About() {
  usePageAnalytics("/about");
  const { getList, get } = usePublicSettings();
  const catalog = usePortfolioContent();

  const skills = catalog.skillsReady
    ? catalog.skills
    : [
        { title: "Keamanan", items: getList("skills_security", security) },
        { title: "Pengembangan", items: getList("skills_dev", development) },
        { title: "Tools", items: getList("skills_tools", instruments) },
      ];

  return (
    <Layout>
      <div className="public-container public-page">
        {/* Intro Hero Section - Preserving exact single h1 requirement */}
        <header className="about-intro">
          <h1>
            Rifqi Ariansyah.
            <br />
            <em>
              Cybersecurity
              <br />
              Engineer.
            </em>
          </h1>
          <div>
            <p>
              Saya menelusuri celah aplikasi, membangun security tooling, dan memperbaiki sistem sampai ke produksi.
              Pekerjaan saya menghubungkan pengujian keamanan ofensif dengan rekayasa sistem dan ketahanan operasi.
            </p>
            <p>
              Dari reflected XSS di xssscope sampai audit ekosistem Apexsions, saya membuktikan akar masalah secara empiris
              dan memastikan setiap mitigasi terpasang kokoh tanpa regresi.
            </p>
            <a
              className="public-text-link"
              href={get("portfolio_cv_url", "/cv-rifqi-ariansyah.pdf")}
              download="cv-rifqi-ariansyah.pdf"
            >
              Unduh CV <Download aria-hidden="true" />
            </a>
          </div>
        </header>

        {/* 1. Founder & Lead Architect Apexsions Credentials */}
        <FounderCredentials />

        {/* 2. Skills & Working Tools */}
        <section className="about-section" aria-labelledby="about-skills">
          <h2 id="about-skills">
            Keahlian & <em>perangkat kerja.</em>
          </h2>
          {catalog.skillsReady && !skills.length && (
            <p>Belum ada kelompok keahlian yang dipublikasikan.</p>
          )}
          {skills.map((group) => (
            <div className="skill-line" key={group.title}>
              <h3>{group.title}</h3>
              <ul>
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        {/* 3. 4-Layer Defense-in-Depth Security Matrix */}
        <DefenseMatrix />

        {/* 4. Practical Capability Proof Diagram */}
        <section className="about-section capability-proof" aria-label="Keahlian dalam praktik">
          <div>
            <h2>
              Batas akses,
              <br />
              <em>dalam praktik.</em>
            </h2>
            <p>
              Web Application Security bertemu pengembangan aplikasi: pemisahan peran siswa, guru, dan admin pada
              Portfolio 71 dengan verifikasi otorisasi ketat.
            </p>
            <Link className="public-text-link" to="/projects/curated-portfolio71">
              Telusuri implementasi <ArrowUpRight aria-hidden="true" />
            </Link>
          </div>
          <ProjectDiagram id="curated-portfolio71" />
        </section>

        {/* 5. Interactive Forensic Career Timeline */}
        <ForensicTimeline />

        {/* 6. Verifiable Security Footprint & PGP Card */}
        <SecurityFootprintCard />

        {/* 7. Experience through built systems */}
        <section className="about-section" aria-labelledby="about-experience">
          <h2 id="about-experience">
            Pengalaman melalui
            <br />
            <em>sistem yang dibangun.</em>
          </h2>
          {catalog.featured.map((project) => (
            <article className="experience-entry" key={project.id}>
              <div>
                <h3>{project.title.split(" — ")[0]}</h3>
                <p>{project.caseStudy?.role}</p>
                <p className="experience-period">{project.caseStudy?.period}</p>
              </div>
              <div>
                <p>{project.solution}</p>
                <Link className="public-text-link" to={`/projects/${project.id}`}>
                  Baca studi kasus <ArrowUpRight aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </section>

        {/* 8. Resilient Curated Certifications Fallback */}
        <CertificationsList />

        {/* 9. Personal Story & Vision */}
        <section className="about-section" aria-labelledby="about-story">
          <h2 id="about-story">
            Berawal dari rumah.
            <br />
            <em>Berlanjut ke sistem.</em>
          </h2>
          <div className="personal-story">
            <p>
              Saya mulai menghasilkan uang sejak SMP. Totalnya lebih dari Rp5 juta; lebih dari Rp2 juta di antaranya
              datang dari server Minecraft yang saya operasikan secara mandiri. Seluruh pendapatan itu langsung dipakai
              orang tua untuk membantu cicilan keluarga.
            </p>
            <p>
              Perjalanan tersebut membawa saya ke Apexsions: merancang sistem berdaya tahan tinggi, menulis 9 plugin Java 21,
              membangun bridge sinkronisasi transaksi, memimpin audit 32 temuan keamanan tanpa downtime, dan menjalankan
              infrastruktur server produksi. Saya juga membangun Portfolio 71 yang dipercaya di SMKN 71 Jakarta.
            </p>
            <p>
              Untuk perutean dan orkestrasi multi-model AI, saya mengoperasikan stack gateway pribadi 9Router + Hermes.
              Agen AI menjadi mitra kolaborasi engineering dalam setiap tahapan, mulai dari arsitektur hingga operasi
              pertahanan siber.
            </p>
            <Link className="public-text-link" to="/contact">
              Mari bicara tentang pekerjaan berikutnya <ArrowUpRight aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
}
