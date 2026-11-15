import React, { useState } from "react";
import { Activity, ShieldCheck, Terminal, Award, Cpu } from "lucide-react";

interface TimelinePhase {
  id: string;
  badge: string;
  period: string;
  title: string;
  role: string;
  summary: string;
  highlights: string[];
  metrics: { label: string; value: string }[];
  icon: React.ElementType;
}

const timelinePhases: TimelinePhase[] = [
  {
    id: "smp",
    badge: "Fase 01",
    period: "2019 — 2022",
    title: "SMP: Fondasi Server & Monetisasi",
    role: "Self-Taught Sysadmin & Server Operator",
    summary:
      "Mulai merancang dan mengoperasikan server game Minecraft multiplayer mandiri sejak bangku sekolah menengah pertama. Meraup pendapatan lebih dari Rp5 juta (Rp2+ juta dari server game) yang langsung dialokasikan untuk membantu cicilan orang tua. Mengasah fondasi konfigurasi Linux, port forwarding, mitigasi serangan awal, dan runtime JVM.",
    highlights: [
      "Mengonfigurasi dedicated server pertama dan reverse proxy lokal untuk menangani ratusan pemain bersamaan.",
      "Meraup pendapatan mandiri >Rp5 juta untuk meringankan beban finansial dan cicilan keluarga.",
      "Mengeksplorasi internal Java Virtual Machine, socket networking, dan custom configurations.",
    ],
    metrics: [
      { label: "Pendapatan Awal", value: "> Rp5.000.000" },
      { label: "Lingkungan", value: "Self-Hosted Linux & JVM" },
      { label: "Skala Komunitas", value: "Ratusan Pemain" },
      { label: "Durasi Awal", value: "3+ Tahun Operasional" },
    ],
    icon: Terminal,
  },
  {
    id: "smkn71",
    badge: "Fase 02",
    period: "2022 — 2025",
    title: "SMKN 71: RPL & Portfolio 71",
    role: "Lead Software & Security Architect",
    summary:
      "Mendalami kurikulum Rekayasa Perangkat Lunak di SMKN 71 Jakarta dan merancang platform showcase institusi 'Portfolio 71'. Mengimplementasikan arsitektur Role-Based Access Control (RBAC) ketat yang memisahkan hak akses antara siswa, guru pembimbing, dan administrator secara tervalidasi.",
    highlights: [
      "Platform memuat 51 karya terkurasi dari 28 siswa dengan bimbingan 4 guru pembimbing.",
      "Implementasi 5 proyek kolaborasi lintas jurusan yang melibatkan 10 siswa aktif.",
      "Eliminasi broken access control dan IDOR melalui verifikasi otorisasi berlapis pada endpoint query.",
    ],
    metrics: [
      { label: "Karya Terverifikasi", value: "51 Proyek" },
      { label: "Partisipasi", value: "28 Siswa & 4 Pembimbing" },
      { label: "Kolaborasi Lintas Bidang", value: "5 Proyek (10 Siswa)" },
      { label: "Sertifikasi Kompetensi", value: "LSP / BNSP RPL" },
    ],
    icon: Award,
  },
  {
    id: "ctf",
    badge: "Fase 03",
    period: "2024 — 2025",
    title: "CTF & Riset Kerentanan Web",
    role: "Independent Security Researcher & Tool Author",
    summary:
      "Berfokus pada pengujian penetrasi aplikasi web (AppSec) dan riset kerentanan berbasis bukti. Mengembangkan perkakas open-source xssscope (scanner reflected & DOM XSS) dan CTF-Toolkit untuk otomasi reconnaissance, payload crafting, dan reverse engineering pada kompetisi keamanan siber.",
    highlights: [
      "Pengembangan xssscope: analisis payload deterministik dengan parser konteks HTML dan JavaScript.",
      "Pengembangan CTF-Toolkit: otomasi skrip kriptografi, forensic artifacts parsing, dan exploit chaining.",
      "Penyelesaian riset PortSwigger Web Security Academy mencakup XSS, CSRF, IDOR, dan race conditions.",
    ],
    metrics: [
      { label: "Security Tooling", value: "xssscope & CTF-Toolkit" },
      { label: "Fokus Pengujian", value: "Web Application Pentesting" },
      { label: "Knowledge Base", value: "PortSwigger Security Labs" },
      { label: "Metodologi", value: "OWASP Top 10 & PoC" },
    ],
    icon: ShieldCheck,
  },
  {
    id: "apexsions",
    badge: "Fase 04",
    period: "2025 — 2026",
    title: "Apexsions: Platform & Audit 32 Celah",
    role: "Founder & Lead Architect",
    summary:
      "Merancang dan mengoperasikan platform peradaban game Apexsions (The Peak Civilizations). Mengembangkan 9 custom Paper plugins di Java 21 LTS dan REST bridge sinkronisasi webstore Azuriom. Memimpin audit internal mendalam yang menemukan dan memperbaiki 32 kerentanan sistem di tingkat kode dan infrastruktur.",
    highlights: [
      "Audit komprehensif mengidentifikasi 13 temuan critical dan 19 temuan major pada plugin dan backend.",
      "Seluruh 32 temuan diperbaiki secara tuntas melalui 16 commit terdokumentasi tanpa downtime.",
      "Arsitektur failover SQLite atomik menjamin integritas data transaksi saat terjadi network latency.",
    ],
    metrics: [
      { label: "Custom Plugins", value: "9 Plugins (Java 21 LTS)" },
      { label: "Temuan Diperbaiki", value: "32 (13 Critical, 19 Major)" },
      { label: "Commits Perbaikan", value: "16 Hardened Commits" },
      { label: "Resilience", value: "SQLite Atomic Failover" },
    ],
    icon: Cpu,
  },
  {
    id: "agentic",
    badge: "Fase 05",
    period: "2026 — Sekarang",
    title: "Agentic AI & Infra Hardening",
    role: "Autonomous Systems & Infrastructure Engineer",
    summary:
      "Mengintegrasikan arsitektur swarm AI otonom ke dalam siklus rekayasa perangkat lunak dan pertahanan siber. Mengoperasikan gateway pribadi 9Router + Hermes untuk perutean multi-model AI berkecepatan tinggi, reproducible CI/CD verification, dan continuous defense-in-depth hardening.",
    highlights: [
      "Gateway pribadi 9Router + Hermes untuk orkestrasi model AI berkinerja tinggi dan terisolasi.",
      "Penerapan automated self-hardening pipeline dengan standar integritas berbasis bukti nyata.",
      "Verifikasi identitas kriptografis menggunakan PGP signature dan audit jejak keamanan transparan.",
    ],
    metrics: [
      { label: "AI Gateway Stack", value: "9Router + Hermes" },
      { label: "Paradigma Rekayasa", value: "Autonomous Swarm Systems" },
      { label: "Standar Integritas", value: "Evidence-Based Verification" },
      { label: "Verifikasi Identitas", value: "PGP Key & Verified Commits" },
    ],
    icon: Activity,
  },
];

export function ForensicTimeline() {
  const [activeId, setActiveId] = useState<string>("apexsions");
  const activePhase = timelinePhases.find((p) => p.id === activeId) ?? timelinePhases[3];
  const IconComponent = activePhase.icon;

  return (
    <section className="about-section" aria-labelledby="about-timeline-heading">
      <h2 id="about-timeline-heading">
        Linimasa Forensik & <em>evolusi sistem.</em>
      </h2>
      <p className="public-lede">
        Rekam jejak teknis dari pengoperasian infrastruktur server mandiri sejak SMP hingga arsitektur platform
        berskala tinggi dan sistem otonom berbasis agen AI.
      </p>

      <div className="forensic-timeline-container">
        {/* Phase selector tabs */}
        <div className="timeline-phase-nav" role="tablist" aria-label="Fase perjalanan karier">
          {timelinePhases.map((phase) => {
            const isSelected = phase.id === activeId;
            return (
              <button
                key={phase.id}
                role="tab"
                id={`tab-${phase.id}`}
                aria-selected={isSelected}
                aria-controls={`panel-${phase.id}`}
                aria-pressed={isSelected}
                className="timeline-phase-btn"
                onClick={() => setActiveId(phase.id)}
              >
                <span className="timeline-btn-phase">{phase.badge}</span>
                <span className="timeline-btn-title">{phase.title.split(":")[0]}</span>
                <span className="timeline-btn-period">{phase.period}</span>
              </button>
            );
          })}
        </div>

        {/* Phase detailed card */}
        <div
          id={`panel-${activePhase.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${activePhase.id}`}
          className="timeline-phase-detail"
        >
          <div className="timeline-detail-content">
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <span className="about-founder-kicker" style={{ color: "var(--site-cyan)" }}>
                <IconComponent style={{ width: "16px", height: "16px" }} aria-hidden="true" />
                {activePhase.period} · {activePhase.badge}
              </span>
            </div>
            <h3>{activePhase.title}</h3>
            <p className="timeline-detail-role">{activePhase.role}</p>
            <p className="timeline-detail-summary">{activePhase.summary}</p>

            <ul className="timeline-detail-highlights">
              {activePhase.highlights.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="timeline-metrics-card">
            <h4
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--site-ink)",
                margin: 0,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Metrik & Bukti Forensik
            </h4>
            {activePhase.metrics.map((metric, idx) => (
              <div key={idx} className="timeline-metric-row">
                <span className="timeline-metric-k">{metric.label}</span>
                <span className="timeline-metric-v">{metric.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
