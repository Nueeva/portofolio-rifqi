import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Download, ExternalLink } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { usePageAnalytics } from "@/hooks/usePageAnalytics";
import { usePublicSettings } from "@/hooks/usePublicSettings";
import { usePortfolioContent } from "@/hooks/usePortfolioContent";
import { supabase } from "@/integrations/api/client";
import { ProjectDiagram } from "@/components/public/ProjectDiagram";

interface Certification {
  id: string;
  name: string;
  issuer: string;
  year: string;
  status: string;
  credential_url?: string | null;
  image_url?: string | null;
}

const fallbackCertifications: Certification[] = [
  {
    id: "curated-bnsp-rpl",
    name: "LSP / BNSP — Rekayasa Perangkat Lunak",
    issuer: "Badan Nasional Sertifikasi Profesi (BNSP)",
    year: "2024",
    status: "Aktif",
    credential_url: "https://bnsp.go.id",
  },
  {
    id: "curated-portswigger",
    name: "PortSwigger Web Security Academy",
    issuer: "PortSwigger Web Security",
    year: "2024 — 2025",
    status: "Aktif",
    credential_url: "https://portswigger.net/web-security",
  },
  {
    id: "curated-ctf-track",
    name: "CTF & Vulnerability Research Track Record",
    issuer: "National & Community Cyber Defense",
    year: "2024 — 2026",
    status: "Aktif",
    credential_url: "https://github.com/Nueeva/CTF-Toolkit",
  },
];

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

  const { data: dbCerts } = useQuery({
    queryKey: ["public-certifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const displayCertifications: Certification[] =
    dbCerts && dbCerts.length > 0 ? dbCerts : fallbackCertifications;

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

        {/* Section 1: Keahlian & perangkat kerja */}
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

        {/* Section 2: Batas akses, dalam praktik */}
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

        {/* Section 3: Pengalaman melalui sistem yang dibangun */}
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

        {/* Section 4: Pencapaian yang bisa ditelusuri */}
        <section className="about-section" aria-labelledby="about-outcomes">
          <h2 id="about-outcomes">
            Pencapaian yang
            <br />
            <em>bisa ditelusuri.</em>
          </h2>
          <div className="personal-story">
            <p>
              Audit Apexsions menemukan dan memitigasi 32 temuan keamanan—13 temuan critical dan 19 major—melalui 16 commit hardening tanpa downtime produksi. Sembilan plugin internal Java 21 berjalan stabil melayani ekosistem server.
            </p>
            <p>
              Pada peluncurannya, Portfolio 71 memuat 51 karya dari 28 siswa dengan pendampingan 4 guru pembimbing di SMKN 71 Jakarta, mencakup 5 proyek kolaborasi lintas jurusan yang melibatkan 10 siswa dengan kontrol akses terverifikasi.
            </p>
            <p>
              Perangkat pengujian xssscope dan repositori riset CTF-Toolkit dirilis sebagai proyek open source yang dapat diaudit publik, membuktikan metodologi analisis celah dan reproduksi kerentanan yang terukur.
            </p>
          </div>
        </section>

        {/* Section 5: Sertifikasi */}
        <section className="about-section" aria-labelledby="about-certifications">
          <h2 id="about-certifications">Sertifikasi.</h2>
          {displayCertifications.map((cert) => {
            const isActive =
              cert.status === "active" || cert.status?.toLowerCase() === "aktif";
            const statusLabel = isActive
              ? "Aktif"
              : cert.status === "in-progress" || cert.status === "in_progress"
              ? "Dalam proses"
              : cert.status;
            const credUrl = cert.credential_url || cert.image_url;

            return (
              <article className="experience-entry" key={cert.id}>
                <div>
                  <h3>{cert.name}</h3>
                  <p>
                    {cert.issuer} · {cert.year}
                  </p>
                </div>
                <div>
                  <p>{statusLabel}</p>
                  {credUrl && (
                    <a
                      className="public-text-link"
                      href={credUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Lihat kredensial <ExternalLink aria-hidden="true" />
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        {/* Section 6: Berawal dari rumah. Berlanjut ke sistem */}
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
