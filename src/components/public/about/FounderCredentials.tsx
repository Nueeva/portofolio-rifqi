import React from "react";
import { Link } from "react-router-dom";
import { Server, ArrowUpRight, Cpu, Database, Network } from "lucide-react";

export function FounderCredentials() {
  return (
    <section className="about-section" aria-labelledby="about-founder-heading">
      <div className="about-founder-card">
        <div className="about-founder-header">
          <span className="about-founder-kicker">
            <Server aria-hidden="true" />
            Produksi & Arsitektur Sistem
          </span>
          <Link
            to="/projects/curated-apexsions"
            className="public-text-link"
            style={{ paddingBlock: "4px", minHeight: "auto" }}
          >
            Studi Kasus Apexsions <ArrowUpRight aria-hidden="true" />
          </Link>
        </div>

        <h2 id="about-founder-heading" className="about-founder-title">
          Founder & Lead Architect — <em>Apexsions (The Peak Civilizations)</em>
        </h2>

        <p className="about-founder-desc">
          Merancang, membangun, dan mengamankan ekosistem game platform berskala penuh dengan performa tinggi
          dan zero-downtime tolerance. Menggabungkan optimasi event-loop tingkat kernel Minecraft dengan
          sinkronisasi data webstore yang terautentikasi kriptografis.
        </p>

        <div className="about-badges-grid">
          <div className="about-badge-item" data-badge="plugins">
            <div className="about-badge-icon">
              <Cpu aria-hidden="true" />
            </div>
            <div className="about-badge-content">
              <h4>9 Java 21 Paper Plugins</h4>
              <p>
                Plugin internal kustom pada runtime Java 21 LTS dengan threading asinkron, zero main-thread lag,
                dan memory footprint terisolasi.
              </p>
            </div>
          </div>

          <div className="about-badge-item" data-badge="bridge">
            <div className="about-badge-icon">
              <Network aria-hidden="true" />
            </div>
            <div className="about-badge-content">
              <h4>Azuriom REST Bridge</h4>
              <p>
                Integrasi REST terenkripsi dua arah antara CMS webstore dan server runtime game untuk pemenuhan transaksi instan.
              </p>
            </div>
          </div>

          <div className="about-badge-item" data-badge="failover">
            <div className="about-badge-icon">
              <Database aria-hidden="true" />
            </div>
            <div className="about-badge-content">
              <h4>SQLite Failover Resilience</h4>
              <p>
                Penyimpanan lokal fallback atomik untuk mengamankan antrean mutasi pemain saat koneksi jaringan uplink terputus.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
