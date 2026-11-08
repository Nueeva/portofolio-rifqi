import { useEffect, useState } from "react";
import Lenis from "lenis";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "motion/react";
import { ArrowUp } from "lucide-react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { RivaAgent } from "@/components/RivaAgent";
import { CustomCursor } from "@/components/CustomCursor";


import { usePublicDesign } from "@/components/public/PublicDesignContext";
import { PublicNavbar, PublicFooter } from "@/components/public/PublicChrome";
import { PublicRiva } from "@/components/public/PublicRiva";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isPublic } = usePublicDesign();
  const { scrollY } = useScroll();

  const [showBackToTop, setShowBackToTop] = useState(false);
  useMotionValueEvent(scrollY, "change", (v) => setShowBackToTop(v > 600));

  // Buttery smooth scrolling (Lenis) — skipped for reduced motion.
  // Lenis drives the real window scroll, so motion's useScroll keeps working.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.1 });
    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Skip link — first focusable element; visible only on keyboard focus */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        {isPublic ? "Lewati ke konten utama" : "Skip to main content"}
      </a>
      {isPublic ? <PublicNavbar /> : <Navbar />}
      <main id="main-content" className="flex-1 pt-16">{children}</main>
      {isPublic ? <PublicFooter /> : <Footer />}

      {/* Back to top — appears after scrolling past ~600px */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            type="button"
            aria-label={isPublic ? "Kembali ke atas" : "Back to top"}
            initial={isPublic ? { y: 8 } : { opacity: 0, scale: 0.8, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={isPublic ? { y: 8 } : { opacity: 0, scale: 0.8, y: 12 }}
            whileHover={isPublic ? { y: -2 } : { scale: 1.08, y: -2 }}
            whileTap={{ scale: isPublic ? 1 : 0.94 }}
            transition={isPublic ? { duration: 0.18, ease: "easeOut" } : { type: "spring", stiffness: 400, damping: 22 }}
            onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })}
            className={`${isPublic ? "public-back-top " : ""}fixed bottom-24 right-6 z-[60] flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25`}
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
      {isPublic ? <PublicRiva /> : <RivaAgent />}
      <CustomCursor />

    </div>
  );
}
