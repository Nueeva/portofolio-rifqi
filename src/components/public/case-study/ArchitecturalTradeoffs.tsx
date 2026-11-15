import React from "react";
import { Compass, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";

interface ADRCard {
  id: string;
  status: string;
  title: string;
  context: string;
  decision: string;
  alternatives: string[];
  securityRationale: string;
}

const adrList: ADRCard[] = [
  {
    id: "ADR-01",
    status: "TERVERIFIKASI & DIADOPSI",
    title: "Arsitektur Monorepo ApexsionsCore vs. Multi-Repo Plugin Independen",
    context: "Sembilan plugin Paper (Core, Economy, Chat, Shop, Crates, Battlepass, CustomEnchants, Fishing, Media) membutuhkan akses ke database, cache pemain, dan formatting utilitas yang identik.",
    decision: "Mengonsolidasikan seluruh plugin ke dalam satu monorepo Java 21 dengan satu modul pustaka inti (ApexsionsCore), memindahkan 28 file duplikat (~5.300 baris kode berulang).",
    alternatives: [
      "9 repositori Git terpisah dengan shared Maven artifact publik.",
      "Copy-paste kode utilitas di setiap plugin independen.",
    ],
    securityRationale: "Menghilangkan version skew risiko tinggi di mana satu plugin telah menambal race condition saldo sementara plugin lain masih menjalankan logika lama yang rentan. Satu perimeter keamanan audit tunggal.",
  },
  {
    id: "ADR-02",
    status: "TERVERIFIKASI & DIADOPSI",
    title: "Fallback Database Lokal SQLite Otomatis vs. Mode Pemeliharaan Offline",
    context: "Pada managed hosting, kegagalan database PostgreSQL eksternal dapat terjadi akibat network partition atau provider maintenance yang berada di luar kendali langsung operator.",
    decision: "Menerapkan engine dual-driver storage provider: ketika koneksi PostgreSQL primer gagal, sistem mengalihkan query kritis secara otomatis ke SQLite lokal dengan migrasi SQL terstruktur V1–V7.",
    alternatives: [
      "Menghentikan server dan mengaktifkan maintenance mode hingga database hosting pulih.",
      "Membiarkan server berjalan tanpa persistensi data (in-memory unbacked mode).",
    ],
    securityRationale: "Mencegah server crash mendadak dan rollback inventori saat terjadi split network. Transaksi data pemain tetap dicatat secara aman dalam format terisolasi, menjaga integritas ekonomi dari rollback duping.",
  },
  {
    id: "ADR-03",
    status: "TERVERIFIKASI & DIADOPSI",
    title: "Two-Way REST Bridge dengan Signature HMAC vs. Akses Direct Database",
    context: "Website komunitas Azuriom (PHP) membutuhkan pertukaran status pemain, transaksi webstore, dan data territory secara real-time dengan server game Minecraft (Java).",
    decision: "Memisahkan game server dan website pada dua host berbeda dengan jembatan REST dua arah yang dilindungi tanda tangan HMAC-SHA256, secret token timing-safe, dan strict IP whitelisting.",
    alternatives: [
      "Menghubungkan CMS Azuriom langsung ke port database internal PostgreSQL game server.",
      "Menggunakan plugin RCON standar Minecraft tanpa enkripsi transport layer.",
    ],
    securityRationale: "Prinsip Defense-in-Depth absolut: Kompromi pada layer web (misal celah pada tema atau ekstensi web) tidak akan memberikan akses langsung ke port database server game atau izin eksekusi konsol tanpa token sah.",
  },
  {
    id: "ADR-04",
    status: "TERVERIFIKASI & DIADOPSI",
    title: "Shaded Fat JARs dengan Relokasi Package vs. Runtime Dependency Loading",
    context: "Plugin menggunakan pustaka modern seperti HikariCP connection pool, Jackson JSON mapper, dan SLF4J yang mungkin bertabrakan dengan classloader bawaan server runtime Paper.",
    decision: "Membangun seluruh shaded fat JAR secara terkendali dengan Maven Shade Plugin, merelokasi namespace package (misal `com.zaxxer.hikari` menjadi `com.apexsions.libs.hikari`).",
    alternatives: [
      "Menggunakan Paper Runtime Library Loader (`paper-plugin.yml`).",
      "Meletakkan raw dependency JARs ke dalam folder `/libraries` server root.",
    ],
    securityRationale: "Menghindari serangan dependency confusion, classpath pollution, dan manipulasi classloader dinamis. Plugin beroperasi sebagai binary otonom yang deterministik tanpa risiko terpengaruh pustaka luar.",
  },
];

export function ArchitecturalTradeoffs({ projectId }: { projectId: string }) {
  return (
    <section className="study-section adr-section" aria-label="Catatan Keputusan Arsitektur">
      <div className="case-section-header">
        <span className="case-section-eyebrow">
          <Compass size={14} aria-hidden="true" /> Architectural Decision Records (ADR)
        </span>
        <h2>Pertukaran &amp; Keputusan Rekayasa Arsitektur</h2>
        <p className="case-section-desc">
          Setiap keputusan sistem dibangun atas kompromi sadar antara performa, isolasi kegagalan, dan ketahanan keamanan. Berikut adalah catatan keputusan teknis utama (ADR).
        </p>
      </div>

      <div className="adr-grid">
        {adrList.map((adr) => (
          <article key={adr.id} className="adr-card">
            <div className="adr-card-top">
              <span className="adr-id-badge">{adr.id}</span>
              <span className="adr-status-badge">
                <CheckCircle2 size={12} aria-hidden="true" /> {adr.status}
              </span>
            </div>

            <h3 className="adr-title">{adr.title}</h3>
            <p className="adr-context">{adr.context}</p>

            <div className="adr-block adr-decision-block">
              <span className="adr-block-label">
                <CheckCircle2 size={14} className="text-success" aria-hidden="true" /> Keputusan yang Diambil:
              </span>
              <p className="adr-block-text">{adr.decision}</p>
            </div>

            <div className="adr-block adr-alt-block">
              <span className="adr-block-label">
                <XCircle size={14} className="text-muted" aria-hidden="true" /> Alternatif yang Dipertimbangkan:
              </span>
              <ul className="adr-alt-list">
                {adr.alternatives.map((alt, i) => (
                  <li key={i}>{alt}</li>
                ))}
              </ul>
            </div>

            <div className="adr-block adr-security-block">
              <span className="adr-block-label">
                <ShieldCheck size={14} className="text-cyan" aria-hidden="true" /> Rasional Keamanan (Security Rationale):
              </span>
              <p className="adr-block-text">{adr.securityRationale}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
