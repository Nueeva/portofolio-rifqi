import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { CybersecurityHero } from "@/components/CybersecurityHero";
import { Aperture } from "@/components/public/PublicMotion";
import { ProjectArtwork } from "@/components/public/ProjectArtwork";
import { publicProjects } from "@/data/projectCopy.id";
import { usePageAnalytics } from "@/hooks/usePageAnalytics";

const [xssscope, apexsions, portfolio, ctf] = publicProjects;

export default function Index() {
  usePageAnalytics("/");
  return <Layout>
    <CybersecurityHero />
    <section className="home-section home-proof" aria-labelledby="home-reasoning"><div className="public-container home-split">
      <div><h2 id="home-reasoning">Refleksi perlu<br /><em>dibuktikan.</em></h2>
        <p>Input yang muncul kembali di respons belum tentu sebuah celah. Di xssscope, saya menelusuri parameter, membaca konteks HTML, atribut, atau script, lalu memverifikasi kandidat temuan sebelum melaporkannya.</p>
        <p className="home-followup">Proses itu saya bangun sebagai scanner JavaScript di Node.js, tanpa dependency.</p>
        <Link className="public-text-link" to={`/projects/${xssscope.id}`}>Ikuti penalaran xssscope <ArrowUpRight /></Link>
      </div>
      <Aperture><ProjectArtwork project={xssscope} /></Aperture>
    </div></section>
    <section className="home-section home-audit" aria-labelledby="home-apexsions"><div className="public-container home-split">
      <Aperture><ProjectArtwork project={apexsions} /></Aperture>
      <div><h2 id="home-apexsions">Dari temuan,<br /><em>sampai perbaikan.</em></h2>
        <p>Apexsions mempertemukan pengembangan dan operasi: sembilan plugin Paper internal, website komunitas, bridge dua arah, dan infrastruktur produksi.</p>
        <p className="home-followup">Audit seluruh codebase menemukan 13 temuan critical dan 19 major. Semuanya diperbaiki melalui 16 commit. Saat PostgreSQL gagal, fallback SQLite menjaga layanan inti tetap berjalan.</p>
        <Link className="public-text-link" to={`/projects/${apexsions.id}`}>Telusuri audit Apexsions <ArrowUpRight /></Link>
      </div>
    </div></section>
    <section className="home-section" aria-labelledby="home-more"><div className="public-container">
      <h2 id="home-more">Keamanan dalam<br /><em>konteks berbeda.</em></h2>
      <div className="home-other-work">
        <article><h3>Portfolio 71</h3><p>Platform siswa SMKN 71 Jakarta dengan akses siswa, guru, dan admin; verifikasi karya terstruktur; serta pengamanan aplikasi Laravel dan Nuxt di produksi.</p><Link className="public-text-link" to={`/projects/${portfolio.id}`}>Lihat batas aksesnya <ArrowUpRight /></Link></article>
        <article><h3>CTF-Toolkit</h3><p>Helper Python untuk web, crypto, forensics, dan reversing. Persiapan yang melengkapi Burp Suite, Wireshark, dan Ghidra sebelum waktu kompetisi berjalan.</p><Link className="public-text-link" to={`/projects/${ctf.id}`}>Lihat alur persiapannya <ArrowUpRight /></Link></article>
      </div>
      <Link className="public-text-link home-all-work" to="/projects">Jelajahi semua karya <ArrowUpRight /></Link>
    </div></section>
    <section className="home-section home-personal" aria-labelledby="home-story"><div className="public-container home-split">
      <h2 id="home-story">Kode yang berarti<br /><em>sesuatu di rumah.</em></h2>
      <div><p>Saya mulai menghasilkan uang sejak SMP, termasuk dari server Minecraft yang saya jalankan. Penghasilan itu dipakai orang tua untuk cicilan keluarga. Dari sana, saya terus belajar merancang, membangun, mengaudit, dan mengoperasikan sistem sendiri.</p>
        <Link className="public-text-link" to="/about">Kenali perjalanan saya <ArrowUpRight /></Link>
      </div>
    </div></section>
  </Layout>;
}
