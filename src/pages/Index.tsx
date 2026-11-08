import { usePortfolioContent } from "@/hooks/usePortfolioContent";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { CybersecurityHero } from "@/components/CybersecurityHero";
import { ProjectArtwork } from "@/components/public/ProjectArtwork";

import { usePageAnalytics } from "@/hooks/usePageAnalytics";

export default function Index() {
    usePageAnalytics("/");
    const {featured} = usePortfolioContent();
    return <Layout>
    <CybersecurityHero />
    <div id="featured-work">{featured.map((project,index)=><section className="home-section home-proof" key={project.id} aria-labelledby={`work-${project.id}`}><div className={`public-container home-split ${index%2?"work-reverse":""}`}><div><h2 id={`work-${project.id}`}>{project.title.split(" — ")[0]}</h2><p>{project.solution.split(/\s+/).length>25?project.solution.split(/\s+/).slice(0,25).join(" ")+"…":project.solution}</p><Link className="public-text-link" to={`/projects/${project.id}`}>Telusuri karya <ArrowUpRight/></Link></div><div className="home-visual"><ProjectArtwork project={project}/></div></div></section>)}</div>
    <section className="home-section home-personal" aria-labelledby="home-story"><div className="public-container home-split">
      <h2 id="home-story">Kode yang berarti<br /><em>sesuatu di rumah.</em></h2>
      <div><p>Saya mulai menghasilkan uang sejak SMP, termasuk dari server Minecraft yang saya jalankan. Penghasilan itu dipakai orang tua untuk cicilan keluarga. Dari sana, saya terus belajar merancang, membangun, mengaudit, dan mengoperasikan sistem sendiri.</p>
        <Link className="public-text-link" to="/about">Kenali perjalanan saya <ArrowUpRight /></Link>
      </div>
    </div></section>
  </Layout>;
}
