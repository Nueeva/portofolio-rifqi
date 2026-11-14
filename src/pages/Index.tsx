import { usePortfolioContent } from "@/hooks/usePortfolioContent";
import { Layout } from "@/components/layout/Layout";
import { CybersecurityHero } from "@/components/CybersecurityHero";
import { HomeStory, HomeWork } from "@/components/public/HomeMotion";

import { usePageAnalytics } from "@/hooks/usePageAnalytics";

export default function Index() {
    usePageAnalytics("/");
    const {featured} = usePortfolioContent();
    return <Layout>
    <CybersecurityHero />
    <div id="featured-work">{featured.map((project,index)=><HomeWork key={project.id} project={project} index={index}/>)}</div>
    <HomeStory />
  </Layout>;
}
