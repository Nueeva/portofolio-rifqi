import React from "react";
import { Link } from "react-router-dom";
import { Terminal, ShieldCheck, Server, Cpu, ArrowUpRight } from "lucide-react";

interface DefenseLayer {
  layer: string;
  num: string;
  title: string;
  focus: string;
  description: string;
  icon: React.ElementType;
  proofs: { label: string; url: string }[];
}

const defenseLayers: DefenseLayer[] = [
  {
    layer: "Offensive",
    num: "Layer 01",
    title: "Offensive & Pentesting",
    focus: "Vulnerability Discovery & Payload Crafting",
    description:
      "Pengujian penetrasi berbasis bukti dan metodologi OWASP Top 10. Mengembangkan payload deterministik untuk mengungkap celah reflected/DOM XSS, IDOR, dan broken authentication sebelum dieksploitasi pihak tidak berwenang.",
    icon: Terminal,
    proofs: [
      { label: "xssscope (DOM Scanner)", url: "/projects/curated-xssscope" },
      { label: "CTF-Toolkit (Exploit Automation)", url: "/projects/curated-ctf-toolkit" },
    ],
  },
  {
    layer: "Defensive",
    num: "Layer 02",
    title: "Defensive & AppSec",
    focus: "Secure Architecture & Access Control",
    description:
      "Perancangan kontrol otorisasi berlapis (Role-Based Access Control) yang tahan terhadap tampering. Eliminasi celah Broken Access Control pada alur verifikasi data siswa, guru, dan admin dengan sanitasi input kontekstual.",
    icon: ShieldCheck,
    proofs: [
      { label: "Portfolio 71 (Multi-Role RBAC)", url: "/projects/curated-portfolio71" },
    ],
  },
  {
    layer: "Infrastructure",
    num: "Layer 03",
    title: "Infra Hardening",
    focus: "Host Lockdown & Failover Resilience",
    description:
      "Pengerasan kernel Linux server produksi, isolasi process permissions, perlindungan reverse proxy, serta arsitektur failover SQLite lokal atomik yang mempertahankan integritas status transaksi saat terjadi latensi jaringan.",
    icon: Server,
    proofs: [
      { label: "Apexsions (Failover & Kernel Tuning)", url: "/projects/curated-apexsions" },
    ],
  },
  {
    layer: "Automation",
    num: "Layer 04",
    title: "Security Tooling & Automation",
    focus: "Automated Auditing & Custom Bridges",
    description:
      "Pengembangan perkakas otomasi audit berbasis Abstract Syntax Tree (AST), REST bridge terotentikasi kriptografis untuk sinkronisasi runtime, serta orkestrasi agen AI untuk continuous defense hardening.",
    icon: Cpu,
    proofs: [
      { label: "Apexsions REST Bridge", url: "/projects/curated-apexsions" },
      { label: "CTF Payload Automation", url: "/projects/curated-ctf-toolkit" },
    ],
  },
];

export function DefenseMatrix() {
  return (
    <section className="about-section" aria-labelledby="about-matrix-heading">
      <h2 id="about-matrix-heading">
        Matriks Pertahanan <em>defense-in-depth.</em>
      </h2>
      <p className="public-lede">
        Empat lapisan proteksi berlapis yang menghubungkan pengujian ofensif, perancangan defensif, pengerasan
        infrastruktur server, dan otomasi audit keandalan sistem.
      </p>

      <div className="defense-matrix-grid">
        {defenseLayers.map((layer) => {
          const Icon = layer.icon;
          return (
            <div key={layer.num} className="defense-layer-card">
              <div>
                <div className="defense-layer-indicator">
                  <span className="defense-layer-num">{layer.num}</span>
                  <div className="defense-layer-icon">
                    <Icon aria-hidden="true" />
                  </div>
                </div>

                <h3>{layer.title}</h3>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--site-cyan)",
                    marginBottom: "12px",
                  }}
                >
                  {layer.focus}
                </div>

                <p className="defense-layer-desc">{layer.description}</p>
              </div>

              <div>
                <div className="defense-proof-tags">
                  {layer.proofs.map((proof) => (
                    <Link
                      key={proof.label}
                      to={proof.url}
                      className="defense-proof-tag"
                      aria-label={`Lihat bukti implementasi: ${proof.label}`}
                    >
                      <span>{proof.label}</span>
                      <ArrowUpRight aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
