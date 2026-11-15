import React from "react";
import { ShieldCheck, Server, Bug, Cpu, Layers, CheckCircle2, Zap } from "lucide-react";

interface TelemetryMetric {
  value: string;
  label: string;
  detail: string;
  badge: string;
  badgeType: "accent" | "cyan" | "muted";
}

const projectMetrics: Record<string, TelemetryMetric[]> = {
  "curated-apexsions": [
    {
      value: "9 Plugin",
      label: "In-House Paper Suite",
      detail: "Monorepo Java 21 dengan ApexsionsCore bersama, mengonsolidasi 28 file duplikat (~5.300 baris).",
      badge: "ARSITEKTUR MONOREPO",
      badgeType: "cyan",
    },
    {
      value: "32 Temuan",
      label: "Vulnerabilitas Diperbaiki",
      detail: "13 critical (money duplication, race condition, live secret) & 19 major terselesaikan di 16 commit.",
      badge: "AUDIT KEAMANAN",
      badgeType: "accent",
    },
    {
      value: "Zero Downtime",
      label: "Disiplin Operasional",
      detail: "Aturan ketat zero restart saat pemain online; automated failover SQLite V1–V7 saat PostgreSQL padam.",
      badge: "TOLERANSI GANGGUAN",
      badgeType: "cyan",
    },
    {
      value: "0 Eksternal",
      label: "Dependency Tanpa Audit",
      detail: "Semua JAR dirakit shaded secara mandiri, tanpa plugin blackbox pihak ketiga di jalur kritis.",
      badge: "ZERO-TRUST",
      badgeType: "muted",
    },
    {
      value: "14 / 14 E2E",
      label: "Skenario Integrasi Lolos",
      detail: "Sinkronisasi REST bridge dua arah, linking akun in-game, dan visualisasi data finansial territory.",
      badge: "PENGUJIAN VALIDASI",
      badgeType: "cyan",
    },
    {
      value: "2 Host",
      label: "Topologi Produksi Terisolasi",
      detail: "Game server Pterodactyl di Jagoanhosting + VPS Nginx/PHP-FPM web Azuriom + Cloudflare R2.",
      badge: "INFRASTRUKTUR",
      badgeType: "muted",
    },
  ],
  "curated-xssscope": [
    {
      value: "0 Dependency",
      label: "Node.js Native Prober",
      detail: "Tanpa framework atau third-party package; memanfaatkan modul native HTTP/HTTPS untuk probing.",
      badge: "MINIMALIST ENGINE",
      badgeType: "cyan",
    },
    {
      value: "3 Konteks",
      label: "Klasifikasi Refleksi",
      detail: "Menganalisis parser boundary pada HTML body, atribut tag, dan string JavaScript runtime.",
      badge: "AST CONTEXT",
      badgeType: "accent",
    },
    {
      value: "100% Otomatis",
      label: "Verifikasi Eksploitasi",
      detail: "Eliminasi false positive dengan memvalidasi eksekusi payload aktif sebelum pelaporan temuan.",
      badge: "ZERO FALSE POSITIVES",
      badgeType: "cyan",
    },
    {
      value: "1 Perintah",
      label: "Eksekusi Portabel",
      detail: "Cukup clone dan eksekusi; menghasilkan laporan triase terstruktur siap tindak lanjut.",
      badge: "CLI TOOLING",
      badgeType: "muted",
    },
  ],
  "curated-portfolio71": [
    {
      value: "51 Karya",
      label: "Portofolio Terpublikasi",
      detail: "Lintas 3 jurusan (RPL 20, Animasi 16, DKV 15) dari 28 siswa dan 4 guru pembimbing aktif.",
      badge: "PRODUKSI INSTITUSIONAL",
      badgeType: "cyan",
    },
    {
      value: "5 Tahap",
      label: "Alur Verifikasi Bertingkat",
      detail: "Draf pengajuan siswa hingga verifikasi bertingkat AI-assisted dan validasi guru pembimbing.",
      badge: "VALIDASI GURU",
      badgeType: "accent",
    },
    {
      value: "Role-Based",
      label: "Sanctum Authorization",
      detail: "Pemisahan hak akses ketat antara siswa kreator, guru penilai, dan administrator sistem.",
      badge: "ZERO-TRUST RBAC",
      badgeType: "cyan",
    },
    {
      value: "1-Click PDF",
      label: "Ekspor CV Standar ATS",
      detail: "Generasi CV instan langsung dari catatan proyek terverifikasi dengan QR code autentikasi.",
      badge: "OTOMASI DOKUMEN",
      badgeType: "muted",
    },
  ],
  "curated-ctf-toolkit": [
    {
      value: "4 Kategori",
      label: "Disiplin CTF Terpadu",
      detail: "Otomasi micro-task untuk challenge Web Exploitation, Cryptography, Forensics, dan Reversing.",
      badge: "BATTLE-TESTED",
      badgeType: "cyan",
    },
    {
      value: "Zero Setup",
      label: "Kesiapan Sebelum Ronde",
      detail: "Seluruh helper siap eksekusi sebelum timer kompetisi berjalan, menghemat menit krusial.",
      badge: "EFISIENSI WAKTU",
      badgeType: "accent",
    },
    {
      value: "50+ Solusi",
      label: "Koleksi Writeup & Script",
      detail: "Arsip eksploitasi terdokumentasi yang diintegrasikan kembali ke dalam toolkit kompetisi.",
      badge: "KNOWLEDGE BASE",
      badgeType: "cyan",
    },
    {
      value: "4 Integrasi",
      label: "Harmonisasi Toolchain",
      detail: "Melengkapi workflow Burp Suite, CyberChef, Wireshark, dan Ghidra tanpa overhead framework.",
      badge: "TOOLING INTEGRATION",
      badgeType: "muted",
    },
  ],
};

export function TelemetryStatsGrid({ projectId }: { projectId: string }) {
  const metrics = projectMetrics[projectId] ?? projectMetrics["curated-apexsions"];

  return (
    <section className="study-section case-telemetry-section" aria-label="Metrik dan Telemetri Rekayasa">
      <div className="case-section-header">
        <span className="case-section-eyebrow">
          <Zap size={14} aria-hidden="true" /> Telemetri Rekayasa
        </span>
        <h2>Metrik Sistem &amp; Integritas Operasional</h2>
        <p className="case-section-desc">
          Data kuantitatif yang membuktikan keandalan arsitektur, disiplin pengujian, dan penanganan risiko di lingkungan produksi nyata.
        </p>
      </div>

      <div className="telemetry-grid">
        {metrics.map((metric, idx) => (
          <div key={idx} className="telemetry-card">
            <div className="telemetry-card-top">
              <span className={`telemetry-badge telemetry-badge-${metric.badgeType}`}>
                {metric.badge}
              </span>
            </div>
            <div className="telemetry-card-value">{metric.value}</div>
            <div className="telemetry-card-label">{metric.label}</div>
            <p className="telemetry-card-detail">{metric.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
