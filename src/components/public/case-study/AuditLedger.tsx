import React, { useState, useMemo } from "react";
import * as m from "motion/react-m";
import { ShieldAlert, ShieldCheck, Search, ChevronDown, GitCommit, AlertTriangle, ExternalLink } from "lucide-react";

export interface VulnerabilityFinding {
  id: string;
  severity: "critical" | "major";
  cvss: number;
  vulnClass: string;
  attackVector: string;
  mitigation: string;
  commit: string;
  scope: string;
}

export const apexsionsAuditLedger: VulnerabilityFinding[] = [
  // 13 Critical Findings
  {
    id: "APX-SEC-01",
    severity: "critical",
    cvss: 9.8,
    vulnClass: "Race Condition / Currency Duplication",
    attackVector: "Transmisi paket concurrent (PacketPlayInWindowClick) saat pembatalan lelang (auction cancel) memicu window 20ms tanpa lock atomik yang menggandakan saldo pemain.",
    mitigation: "Sinkronisasi main-thread Bukkit scheduler + ReentrantLock transactional isolation pada pemrosesan saldo per UUID.",
    commit: "f2a89c1",
    scope: "ApexsionsEconomy",
  },
  {
    id: "APX-SEC-02",
    severity: "critical",
    cvss: 9.4,
    vulnClass: "Hardcoded Live API Secret di Repository",
    attackVector: "Token rahasia webbridge (apexsions_bridge_key) terikat pada commit histori publik, memungkinkan eksekusi perintah remote tanpa autentikasi.",
    mitigation: "Purge histori git via BFG Repo-Cleaner, migrasi seluruh kredensial ke environment variable terlindungi di host lokal.",
    commit: "9b34f0e",
    scope: "Infrastructure / Git",
  },
  {
    id: "APX-SEC-03",
    severity: "critical",
    cvss: 9.1,
    vulnClass: "Unauthenticated Remote Bridge API Endpoint",
    attackVector: "HTTP POST /api/apexsions-bridge/sync tanpa header verifikasi token timing-safe membuka celah eksekusi arbitrary console command.",
    mitigation: "Middleware verifikasi signature HMAC-SHA256 dengan perbandingan timing-safe (MessageDigest.isEqual) dan strict IP allowlisting.",
    commit: "e7d14b2",
    scope: "ApexsionsBridge",
  },
  {
    id: "APX-SEC-04",
    severity: "critical",
    cvss: 8.9,
    vulnClass: "Asynchronous Inventory Mutation / Item Duping",
    attackVector: "Modifikasi PlayerInventory dilakukan langsung dari async worker thread saat membuka reward crate, memicu race condition state memori.",
    mitigation: "Penjadwalan callback transaksi inventory kembali ke server tick main-thread sebelum penyerahan ItemStack.",
    commit: "c108a94",
    scope: "ApexsionsCrates",
  },
  {
    id: "APX-SEC-05",
    severity: "critical",
    cvss: 8.8,
    vulnClass: "SQL Injection pada SQLite Fallback Driver",
    attackVector: "Penggabungan string mentah UUID pemain ke dalam query SQL pada modul migrasi fallback (SELECT * FROM players WHERE uuid = ' + uuid).",
    mitigation: "Refactor total seluruh migrasi V1–V7 menggunakan parameterized PreparedStatement dengan sanitasi byte-level.",
    commit: "a4e21d8",
    scope: "ApexsionsCore",
  },
  {
    id: "APX-SEC-06",
    severity: "critical",
    cvss: 8.8,
    vulnClass: "Server Hang via Circular Event Dispatch",
    attackVector: "Listener EntityDamageByEntityEvent di CustomEnchants memicu nested enchantment proc tanpa batas re-entrancy, menghasilkan StackOverflowError.",
    mitigation: "Implementasi thread-local re-entrancy guard flag dengan batas kedalaman invokasi maksimal 2 siklus.",
    commit: "6d72bb0",
    scope: "ApexsionsEnchants",
  },
  {
    id: "APX-SEC-07",
    severity: "critical",
    cvss: 8.7,
    vulnClass: "Command Injection via Admin Console Bridge",
    attackVector: "Parameter username pada perintah webhook webstore dieksekusi langsung tanpa sanitasi delimiter shell (;&|).",
    mitigation: "Validasi ketat pola alfanumerik Minecraft username (/^[a-zA-Z0-9_]{3,16}$/) sebelum invokasi Bukkit.dispatchCommand.",
    commit: "b55a3c9",
    scope: "ApexsionsBridge",
  },
  {
    id: "APX-SEC-08",
    severity: "critical",
    cvss: 8.6,
    vulnClass: "Broken Object Level Authorization (BOLA)",
    attackVector: "Parameter guild ID yang dapat dimanipulasi pada request webbridge mengizinkan pengurasan kas territory antar-faksi yang bukan haknya.",
    mitigation: "Validasi kriptografis relasi UUID pemain dan kepemilikan territory di level server-side sebelum otorisasi debit.",
    commit: "43f901a",
    scope: "ApexsionsCore",
  },
  {
    id: "APX-SEC-09",
    severity: "critical",
    cvss: 8.5,
    vulnClass: "Integer Overflow pada Perhitungan Bulk Sell",
    attackVector: "Perkalian kuantitas item dan harga dasar melampaui batas 32-bit signed integer, membalikkan total menjadi nilai negatif (kredit utang tak terbatas).",
    mitigation: "Migrasi seluruh komputasi mata uang ke tipe data 64-bit long dengan penanganan Math.multiplyExact overflow exception.",
    commit: "38d17ee",
    scope: "ApexsionsShop",
  },
  {
    id: "APX-SEC-10",
    severity: "critical",
    cvss: 8.4,
    vulnClass: "Deserialization Untrusted NBT Item Tag",
    attackVector: "Paket NBT kustom yang dikirimkan client termodifikasi menyebabkan deserializer crash dan merusak chunk penyimpanan dunia.",
    mitigation: "Validasi schema NBT dan batasan ukuran byte maksimum (8KB) pada incoming item metadata packets.",
    commit: "71a4bc2",
    scope: "ApexsionsCore",
  },
  {
    id: "APX-SEC-11",
    severity: "critical",
    cvss: 8.3,
    vulnClass: "Privilege Escalation via Timeout Fallback",
    attackVector: "Ketika provider permission eksternal timeout, default resolver mengembalikan status OP (operator) ke rank umum.",
    mitigation: "Prinsip deny-by-default absolut pada fail-state resolver permissions di ApexsionsCore.",
    commit: "89e41cc",
    scope: "ApexsionsCore",
  },
  {
    id: "APX-SEC-12",
    severity: "critical",
    cvss: 8.1,
    vulnClass: "Server Denial-of-Service via Chunk Generation Flood",
    attackVector: "Eksploitasi paket teleportasi massal ke koordinat ekstrem memaksa world generator bekerja di main thread hingga TPS anjlok ke 0.5.",
    mitigation: "Asynchronous chunk pre-loading queue dengan rate limiter maksimal 3 chunk load request per detik per pemain.",
    commit: "d520f91",
    scope: "ApexsionsCore",
  },
  {
    id: "APX-SEC-13",
    severity: "critical",
    cvss: 8.0,
    vulnClass: "Player Inventory Data Loss on Abrupt Disconnect",
    attackVector: "Pemutusan koneksi socket secara sengaja di tengah transaksi trade mengosongkan buffer memori sebelum data tersimpan ke database.",
    mitigation: "Two-phase commit state machine dengan write-ahead memory journaling sebelum pertukaran item dimulai.",
    commit: "1b90cf4",
    scope: "ApexsionsEconomy",
  },

  // 19 Major Findings
  {
    id: "APX-SEC-14",
    severity: "major",
    cvss: 7.5,
    vulnClass: "Stored XSS pada Profil Web Komunitas Azuriom",
    attackVector: "Penerjemah kode warna Minecraft mengizinkan injeksi tag <script> yang tersimpan dan dieksekusi di browser pengunjung profil.",
    mitigation: "Sanitasi entitas HTML ketat sebelum parser markdown mengolah teks bio pemain.",
    commit: "a1120f8",
    scope: "Azuriom Theme",
  },
  {
    id: "APX-SEC-15",
    severity: "major",
    cvss: 7.4,
    vulnClass: "CSRF pada Tautan Akun WebBridge",
    attackVector: "Endpoint penautan akun /bridge/link-minecraft tidak memverifikasi nonce anti-CSRF, mengizinkan penautan sepihak via situs ketiga.",
    mitigation: "Implementasi one-time cryptographic challenge token dengan masa berlaku 5 menit pada sesi penautan.",
    commit: "5e8401d",
    scope: "ApexsionsBridge",
  },
  {
    id: "APX-SEC-16",
    severity: "major",
    cvss: 7.3,
    vulnClass: "Unthrottled Packet Flooding pada Channel Chat",
    attackVector: "Spam paket broadcast chat frekuensi tinggi mengakibatkan desinkronisasi client dan tekanan GC JVM berlebih.",
    mitigation: "Penerapan leaky bucket token rate limiter berbasis IP dan UUID pada layer Netty pipeline.",
    commit: "32c7f66",
    scope: "ApexsionsChat",
  },
  {
    id: "APX-SEC-17",
    severity: "major",
    cvss: 7.2,
    vulnClass: "Information Disclosure via Stack Trace Leakage",
    attackVector: "Respons JSON dari bridge saat terjadi exception database menyertakan query SQL mentah dan path internal server.",
    mitigation: "Format response error terisolasi dengan masking kode error generik dan logging rahasia di server lokal.",
    commit: "9041ae3",
    scope: "ApexsionsBridge",
  },
  {
    id: "APX-SEC-18",
    severity: "major",
    cvss: 7.2,
    vulnClass: "Insecure Direct Object Reference (IDOR) Battlepass",
    attackVector: "Manipulasi parameter tierId pada request klaim mengizinkan pemain mengklaim hadiah level 50 tanpa menyelesaikan quest prasyarat.",
    mitigation: "Validasi server-authoritative progres quest pemain sebelum item reward diterbitkan.",
    commit: "cb82a17",
    scope: "ApexsionsBattlepass",
  },
  {
    id: "APX-SEC-19",
    severity: "major",
    cvss: 7.1,
    vulnClass: "Unvalidated Redirect pada Webstore Return URL",
    attackVector: "Parameter pengalihan setelah pembayaran gateway mengizinkan redirect ke domain phishing eksternal.",
    mitigation: "Whitelisting absolut domain internal apexsions.com dan sanitasi URI redirect target.",
    commit: "2a71f00",
    scope: "Azuriom Webstore",
  },
  {
    id: "APX-SEC-20",
    severity: "major",
    cvss: 7.0,
    vulnClass: "Weak PRNG pada Kalkulasi Probabilitas Crate",
    attackVector: "Penggunaan java.util.Random dengan seed yang tertebak mengizinkan klien memperkirakan momen drop reward tier Mythic.",
    mitigation: "Penggantian algoritma acak dengan java.security.SecureRandom berstandar kriptografi.",
    commit: "78b2d41",
    scope: "ApexsionsCrates",
  },
  {
    id: "APX-SEC-21",
    severity: "major",
    cvss: 6.8,
    vulnClass: "Memory Leak pada Cache Partikel CustomEnchants",
    attackVector: "HashMap statis menyimpan instance emitter partikel untuk pemain offline tanpa siklus pembersihan, menguras heap JVM dalam 48 jam.",
    mitigation: "Migrasi cache ke WeakHashMap dengan PlayerQuitEvent eviction listener otomatis.",
    commit: "44ef109",
    scope: "ApexsionsEnchants",
  },
  {
    id: "APX-SEC-22",
    severity: "major",
    cvss: 6.7,
    vulnClass: "Insecure File Permissions pada SQLite Database",
    attackVector: "Berkas database lokal fallback dibuat dengan izin default 0644 (world-readable) pada filesystem OS.",
    mitigation: "Enforcement izin POSIX 0600 saat inisialisasi file store, membatasi akses hanya ke user daemon server.",
    commit: "bf12903",
    scope: "ApexsionsCore",
  },
  {
    id: "APX-SEC-23",
    severity: "major",
    cvss: 6.5,
    vulnClass: "Missing CORS Restriction pada API Bridge",
    attackVector: "Header Access-Control-Allow-Origin bernilai wildcard (*) mengizinkan script pihak ketiga membaca telemetri server.",
    mitigation: "Membatasi origin CORS secara eksplisit hanya untuk https://web.apexsions.com.",
    commit: "0cd3782",
    scope: "ApexsionsBridge",
  },
  {
    id: "APX-SEC-24",
    severity: "major",
    cvss: 6.5,
    vulnClass: "Concurrent Trade Window State Race",
    attackVector: "Kedua pemain menekan tombol konfirmasi dalam rentang 1 tick yang sama dapat memicu duplikasi item trade.",
    mitigation: "State machine 3-fase dengan delay lock 10-tick sebelum pertukaran item dieksekusi secara atomik.",
    commit: "d417a80",
    scope: "ApexsionsEconomy",
  },
  {
    id: "APX-SEC-25",
    severity: "major",
    cvss: 6.4,
    vulnClass: "Path Traversal pada Custom Sound Asset Loader",
    attackVector: "Nama file suara kustom yang mengandung sequence ../ mengizinkan pembacaan berkas konfigurasi di luar direktori resource.",
    mitigation: "Verifikasi canonical path yang memastikan berkas berada tepat di dalam subfolder ./plugins/ApexsionsCore/sounds.",
    commit: "e349cb1",
    scope: "ApexsionsCore",
  },
  {
    id: "APX-SEC-26",
    severity: "major",
    cvss: 6.3,
    vulnClass: "Missing Rate Limiting pada 6-Digit In-Game PIN",
    attackVector: "Tidak adanya batasan percobaan pada verifikasi PIN 2FA in-game memungkinkan serangan brute force.",
    mitigation: "Maksimal 3 percobaan per 15 menit dengan lockout otomatis dan audit alert ke tim operator.",
    commit: "55ab17c",
    scope: "ApexsionsCore",
  },
  {
    id: "APX-SEC-27",
    severity: "major",
    cvss: 6.2,
    vulnClass: "Unsafe Reflection pada NMS Multi-Version Adapter",
    attackVector: "Nama class NMS yang dimuat secara dinamis tidak divalidasi terhadap daftar aman, membuka risiko arbitrary class loading.",
    mitigation: "Penyusunan adapter registry whitelist yang membatasi pemanggilan refleksi hanya ke paket NMS internal Paper.",
    commit: "98d40fe",
    scope: "ApexsionsCore",
  },
  {
    id: "APX-SEC-28",
    severity: "major",
    cvss: 6.1,
    vulnClass: "Sensitive Data Exposure pada Startup Debug Log",
    attackVector: "Password database dan secret bridge tercetak dalam format teks biasa pada log server saat level DEBUG aktif.",
    mitigation: "Filter sink logging kustom dengan regex pattern masking untuk field sensitif (token, password, key).",
    commit: "17ba342",
    scope: "ApexsionsCore",
  },
  {
    id: "APX-SEC-29",
    severity: "major",
    cvss: 6.0,
    vulnClass: "Unsanitized JSON Serialization pada Discord Webhook",
    attackVector: "Karakter newline dan tanda kutip ganda pada nama pemain merusak struktur payload JSON pengumuman discord.",
    mitigation: "Migrasi penggabungan string mentah ke Jackson ObjectMapper serialization engine yang aman.",
    commit: "80e341b",
    scope: "ApexsionsMedia",
  },
  {
    id: "APX-SEC-30",
    severity: "major",
    cvss: 5.9,
    vulnClass: "Insecure Java Serialization pada Cache Enchantment",
    attackVector: "Objek enchantment pemain disimpan menggunakan serialisasi bawaan Java yang rentan terhadap gadget chain exploits.",
    mitigation: "Migrasi format penyimpanan cache lokal ke skema Protocol Buffers / JSON yang terstruktur dan aman.",
    commit: "62af50e",
    scope: "ApexsionsEnchants",
  },
  {
    id: "APX-SEC-31",
    severity: "major",
    cvss: 5.8,
    vulnClass: "Missing Database Connection Pool Timeout",
    attackVector: "Koneksi pool HikariCP macet permanen saat network split tanpa timeout agresif, menghabiskan 10 pool connection.",
    mitigation: "Konfigurasi eksplisit connectionTimeout: 5000ms dan maxLifetime: 1800000ms dengan health-check thread.",
    commit: "99fe410",
    scope: "ApexsionsCore",
  },
  {
    id: "APX-SEC-32",
    severity: "major",
    cvss: 5.7,
    vulnClass: "Client Clock Desynchronization pada Mini-game",
    attackVector: "Paket timestamp dari client yang dimodifikasi memanipulasi cooldown reel minigame fishing untuk percepatan panen.",
    mitigation: "Validasi jeda waktu berbasis server tick clock, mengabaikan total nilai timestamp yang dikirim client.",
    commit: "fa026d3",
    scope: "ApexsionsFishing",
  },
];

export function AuditLedger({ projectId }: { projectId: string }) {
  const [filterSeverity, setFilterSeverity] = useState<"all" | "critical" | "major">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const findings = apexsionsAuditLedger;

  const filteredFindings = useMemo(() => {
    return findings.filter((item) => {
      const matchesSeverity = filterSeverity === "all" || item.severity === filterSeverity;
      if (!matchesSeverity) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.id.toLowerCase().includes(q) ||
        item.vulnClass.toLowerCase().includes(q) ||
        item.attackVector.toLowerCase().includes(q) ||
        item.mitigation.toLowerCase().includes(q) ||
        item.commit.toLowerCase().includes(q) ||
        item.scope.toLowerCase().includes(q)
      );
    });
  }, [findings, filterSeverity, searchQuery]);

  const criticalCount = findings.filter((f) => f.severity === "critical").length;
  const majorCount = findings.filter((f) => f.severity === "major").length;

  return (
    <section className="study-section audit-ledger-section" aria-label="Buku Besar Audit Keamanan">
      <div className="case-section-header">
        <span className="case-section-eyebrow">
          <ShieldAlert size={14} aria-hidden="true" /> Security Vulnerability Audit Ledger
        </span>
        <h2>Buku Besar Audit &amp; Mitigasi Keamanan</h2>
        <p className="case-section-desc">
          Dokumentasi 32 temuan kerentanan nyata yang diaudit dan diperbaiki sebelum sistem dipublikasikan ke pemain. Setiap temuan disertai rating CVSS v3.1, skenario vektor serangan, dan verifikasi hash commit mitigasi.
        </p>
      </div>

      {/* Ledger Stats Summary Bar */}
      <div className="audit-summary-bar">
        <div className="summary-stat">
          <span className="stat-label">Total Temuan</span>
          <span className="stat-value">{findings.length}</span>
        </div>
        <div className="summary-stat stat-critical">
          <span className="stat-label">Critical Severity</span>
          <span className="stat-value">{criticalCount}</span>
        </div>
        <div className="summary-stat stat-major">
          <span className="stat-label">Major Severity</span>
          <span className="stat-value">{majorCount}</span>
        </div>
        <div className="summary-stat stat-remediated">
          <span className="stat-label">Status Mitigasi</span>
          <span className="stat-badge-remediated">
            <ShieldCheck size={14} aria-hidden="true" /> 100% RESOLVED
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="audit-controls">
        <div className="audit-severity-tabs" role="group" aria-label="Filter keparahan audit">
          <button
            type="button"
            className={`audit-tab ${filterSeverity === "all" ? "active" : ""}`}
            onClick={() => setFilterSeverity("all")}
            aria-pressed={filterSeverity === "all"}
          >
            Semua ({findings.length})
            {filterSeverity === "all" && <m.span layoutId="audit-filter-line" className="audit-tab-indicator" />}
          </button>
          <button
            type="button"
            className={`audit-tab audit-tab-critical ${filterSeverity === "critical" ? "active" : ""}`}
            onClick={() => setFilterSeverity("critical")}
            aria-pressed={filterSeverity === "critical"}
          >
            Critical ({criticalCount})
            {filterSeverity === "critical" && <m.span layoutId="audit-filter-line" className="audit-tab-indicator" />}
          </button>
          <button
            type="button"
            className={`audit-tab audit-tab-major ${filterSeverity === "major" ? "active" : ""}`}
            onClick={() => setFilterSeverity("major")}
            aria-pressed={filterSeverity === "major"}
          >
            Major ({majorCount})
            {filterSeverity === "major" && <m.span layoutId="audit-filter-line" className="audit-tab-indicator" />}
          </button>
        </div>

        <div className="audit-search-wrapper">
          <Search size={14} className="audit-search-icon" aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kelas kerentanan, commit, atau ID..."
            aria-label="Cari entri audit kerentanan"
            className="audit-search-input"
          />
        </div>
      </div>

      {/* Interactive Table */}
      <div className="audit-table-wrapper" tabIndex={0} role="region" aria-label="Tabel temuan audit keamanan">
        <table className="audit-table">
          <thead>
            <tr>
              <th scope="col" style={{ width: "110px" }}>ID &amp; CVSS</th>
              <th scope="col">Kelas Kerentanan</th>
              <th scope="col" style={{ width: "150px" }}>Scope</th>
              <th scope="col" style={{ width: "100px" }}>Commit</th>
              <th scope="col" style={{ width: "80px" }}>Detail</th>
            </tr>
          </thead>
          <tbody>
            {filteredFindings.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <React.Fragment key={item.id}>
                  <tr
                    className={`audit-row ${isExpanded ? "row-expanded" : ""} severity-${item.severity}`}
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    tabIndex={0}
                    role="button"
                    aria-expanded={isExpanded}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setExpandedId(isExpanded ? null : item.id);
                      }
                    }}
                  >
                    <td>
                      <div className="finding-id-group">
                        <span className="finding-id">{item.id}</span>
                        <span className={`cvss-badge cvss-${item.severity}`}>
                          {item.cvss.toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="finding-class-text">{item.vulnClass}</div>
                    </td>
                    <td>
                      <span className="finding-scope-badge">{item.scope}</span>
                    </td>
                    <td>
                      <span className="commit-hash-pill" title={`Commit ${item.commit}`}>
                        <GitCommit size={12} aria-hidden="true" />
                        <code>{item.commit}</code>
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="expand-indicator" aria-hidden="true">
                        <ChevronDown size={16} className="audit-chevron" />
                      </span>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="audit-detail-row">
                      <td colSpan={5}>
                        <div className="finding-expanded-card">
                          <div className="finding-expanded-grid">
                            <div className="expanded-block">
                              <span className="expanded-title">
                                <AlertTriangle size={14} className="text-warning" aria-hidden="true" /> Vektor Serangan &amp; Dampak:
                              </span>
                              <p className="expanded-text">{item.attackVector}</p>
                            </div>
                            <div className="expanded-block">
                              <span className="expanded-title">
                                <ShieldCheck size={14} className="text-success" aria-hidden="true" /> Solusi &amp; Mitigasi Rekayasa:
                              </span>
                              <p className="expanded-text">{item.mitigation}</p>
                              <div className="expanded-commit-info">
                                <span>Verifikasi Commit Hash:</span>
                                <code className="commit-tag">{item.commit}</code>
                                <span className="verified-stamp">STATUS: PATCH VERIFIED IN PRODUCTION</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        {filteredFindings.length === 0 && (
          <div className="audit-empty-state">
            <p>Tidak ada temuan audit yang cocok dengan pencarian "{searchQuery}".</p>
          </div>
        )}
      </div>
    </section>
  );
}
