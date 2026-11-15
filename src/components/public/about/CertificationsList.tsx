import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/api/client";
import { Award, ExternalLink, CheckCircle2 } from "lucide-react";

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  year: string;
  status: string;
  credential_url?: string | null;
  image_url?: string | null;
  description?: string;
}

const curatedCertificationsFallback: CertificationItem[] = [
  {
    id: "curated-bnsp-rpl",
    name: "LSP / BNSP — Rekayasa Perangkat Lunak",
    issuer: "Badan Nasional Sertifikasi Profesi (BNSP)",
    year: "2024",
    status: "Aktif",
    description:
      "Sertifikasi kompetensi resmi tingkat nasional bidang Rekayasa Perangkat Lunak: perancangan arsitektur sistem, standardisasi clean code, database schema integrity, dan pengujian perangkat lunak terstruktur.",
    credential_url: "https://bnsp.go.id",
  },
  {
    id: "curated-portswigger",
    name: "PortSwigger Web Security Academy",
    issuer: "PortSwigger Web Security",
    year: "2024 — 2025",
    status: "Aktif",
    description:
      "Riset praktis dan penyelesaian laboratorium ofensif tingkat lanjut: Cross-Site Scripting (XSS), Server-Side Request Forgery (SSRF), Broken Access Control, SQL Injection, dan Web Cache Poisoning.",
    credential_url: "https://portswigger.net/web-security",
  },
  {
    id: "curated-ctf-track",
    name: "CTF & Vulnerability Research Track Record",
    issuer: "National & Community Cyber Defense",
    year: "2024 — 2026",
    status: "Aktif",
    description:
      "Rekam jejak kompetisi Capture The Flag dan riset keamanan siber independen: perancangan payload PoC, reverse engineering biner, deobfuscation, dan eksploitasi celah web.",
    credential_url: "https://github.com/Nueeva/CTF-Toolkit",
  },
];

export function CertificationsList() {
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

  // Resilient fallback logic: merge or fallback to curated list
  const displayCertifications: CertificationItem[] = React.useMemo(() => {
    if (!dbCerts || dbCerts.length === 0) {
      return curatedCertificationsFallback;
    }

    // Merge DB certs with curated fallback if not duplicated
    const existingNames = new Set(dbCerts.map((c) => c.name.toLowerCase()));
    const additionalCurated = curatedCertificationsFallback.filter(
      (c) => !existingNames.has(c.name.toLowerCase())
    );

    const mappedDbCerts: CertificationItem[] = dbCerts.map((c) => ({
      id: c.id,
      name: c.name,
      issuer: c.issuer,
      year: c.year,
      status:
        c.status === "active"
          ? "Aktif"
          : c.status === "in-progress" || c.status === "in_progress"
          ? "Dalam proses"
          : c.status,
      credential_url: c.credential_url || c.image_url,
      description: c.description,
    }));

    return [...mappedDbCerts, ...additionalCurated];
  }, [dbCerts]);

  return (
    <section className="about-section" aria-labelledby="about-certifications">
      <h2 id="about-certifications">
        Sertifikasi & <em>kualifikasi teruji.</em>
      </h2>
      <p className="public-lede">
        Kompetensi rekayasa perangkat lunak dan keahlian keamanan siber yang divalidasi oleh badan sertifikasi
        resmi dan rekam jejak praktis.
      </p>

      <div className="certifications-curated-grid">
        {displayCertifications.map((cert) => {
          const isActive = cert.status.toLowerCase().includes("aktif") || cert.status.toLowerCase() === "active";
          return (
            <article key={cert.id} className="certification-item-card">
              <div>
                <div className="cert-card-top">
                  <h3>{cert.name}</h3>
                  <span className={`cert-status-badge ${isActive ? "" : "in-progress"}`}>
                    <CheckCircle2 style={{ width: "12px", height: "12px" }} aria-hidden="true" />
                    {cert.status}
                  </span>
                </div>

                <div className="cert-card-meta">
                  <span style={{ color: "var(--site-copper)", fontWeight: 500 }}>{cert.issuer}</span> ·{" "}
                  <span>{cert.year}</span>
                </div>

                {cert.description && <p className="cert-card-desc">{cert.description}</p>}
              </div>

              {cert.credential_url && (
                <div className="cert-card-actions">
                  <a
                    className="public-text-link"
                    style={{ paddingBlock: "4px", minHeight: "auto" }}
                    href={cert.credential_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Verifikasi kredensial untuk ${cert.name} (membuka di tab baru)`}
                  >
                    <span>Lihat kredensial</span>
                    <ExternalLink style={{ width: "14px", height: "14px" }} aria-hidden="true" />
                  </a>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
