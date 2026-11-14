import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { LazyMotion } from "motion/react";
import { Bot, ArrowUp } from "lucide-react";
import { PublicSettingsProvider } from "@/hooks/usePublicSettings";
import { OptionalFeatureBoundary } from "./OptionalFeatureBoundary";
import { PublicNavbar, PublicFooter } from "./PublicChrome";
import { MotionPolicyProvider } from "./MotionPolicy";
import { useMotionPolicy } from "./motionPolicyContext";
const Cursor = lazy(() => import("@/components/CustomCursor").then(m => ({ default: m.CustomCursor })));
const Riva = lazy(() => import("./PublicRiva").then(m => ({ default: m.PublicRiva })));
const loadFeatures = () => import("./motionFeatures").then(m => m.default);
function ScrollManager() {
    const { reduced } = useMotionPolicy();
    const location = useLocation();
    const action = useNavigationType();
    const positions = useRef(new Map<string, number>());
    const last = useRef(location.key);
    const initial = useRef(true);
    useEffect(() => {
        const old = history.scrollRestoration;
        history.scrollRestoration = "manual";
        return () => { history.scrollRestoration = old; };
    }, []);
    useEffect(() => {
        if (initial.current) {
            initial.current = false;
            return;
        }
        positions.current.set(last.current, window.scrollY);
        last.current = location.key;
        const destination = action === "POP" ? positions.current.get(location.key) ?? 0 : 0;
        let frame = 0;
        const restore = () => {
            const ready = [...document.querySelectorAll<HTMLElement>("main [data-page-path]")].some(node => node.dataset.pagePath === location.pathname);
            if (!ready && !document.querySelector("main [role=alert]"))
                return;
            observer.disconnect();
            frame = requestAnimationFrame(() => { window.scrollTo(0, destination); window.dispatchEvent(new Event("celah:scroll-restored")); });
        };
        const observer = new MutationObserver(restore);
        const main = document.getElementById("main-content");
        if (main)
            observer.observe(main, { childList: true, subtree: true });
        restore();
        return () => { observer.disconnect(); cancelAnimationFrame(frame); };
    }, [location.key, location.pathname, action]);
    useEffect(() => {
        if (reduced)
            return;
        let cleanup: (() => void) | undefined;
        let cancelled = false;
        void Promise.all([import("lenis"), import("motion")]).then(([{ default: Lenis }, { frame, cancelFrame }]) => {
            if (cancelled)
                return;
            const lenis = new Lenis({ autoRaf: false, lerp: .1 });
            const tick = ({ timestamp }: {
                timestamp: number;
            }) => { if (!document.hidden)
                lenis.raf(timestamp); };
            const reset = () => lenis.scrollTo(window.scrollY, { immediate: true, force: true });
            window.addEventListener("celah:scroll-restored", reset);
            const visibility = () => {
                cancelFrame(tick);
                if (!document.hidden) { reset(); frame.setup(tick, true); }
            };
            document.addEventListener("visibilitychange", visibility);
            visibility();
            cleanup = () => { document.removeEventListener("visibilitychange", visibility); window.removeEventListener("celah:scroll-restored", reset); cancelFrame(tick); lenis.destroy(); };
        });
        return () => { cancelled = true; cleanup?.(); };
    }, [reduced]);
    return null;
}
function Shell({ children }: {
    children: ReactNode;
}) {
    const [riva, setRiva] = useState(false);
    const [top, setTop] = useState(false);
    const { reduced, allowWebGL } = useMotionPolicy();
    useEffect(() => { const scroll = () => setTop(scrollY > 600); window.addEventListener("scroll", scroll, { passive: true }); return () => window.removeEventListener("scroll", scroll); }, []);
    return <LazyMotion features={loadFeatures}><ScrollManager /><a className="public-skip" href="#main-content">Lewati ke konten utama</a><PublicNavbar />

 {allowWebGL && <OptionalFeatureBoundary><Suspense fallback={null}><Cursor /></Suspense></OptionalFeatureBoundary>}
 <main id="main-content" className="public-main">{children}</main><PublicFooter />

 {riva ? <OptionalFeatureBoundary fallback={<button className="public-riva-launcher" onClick={() => window.location.reload()} aria-label="RIVA gagal dimuat. Muat ulang halaman."><Bot /></button>}><Suspense fallback={<span role="status" className="public-riva-launcher">Memuat RIVA…</span>}><Riva initiallyOpen/></Suspense></OptionalFeatureBoundary> : <button type="button" className="public-riva-launcher" aria-label="Buka RIVA, asisten portofolio" onClick={() => setRiva(true)}><Bot /></button>}

 {top && <button type="button" className="public-back-top" aria-label="Kembali ke atas" onClick={() => window.scrollTo({ top: 0, behavior: reduced ? "instant" : "smooth" })}><ArrowUp /></button>}

 </LazyMotion>;
}
export function PublicShell({ children }: {
    children: ReactNode;
}) { return <MotionPolicyProvider><PublicSettingsProvider><Shell>{children}</Shell></PublicSettingsProvider></MotionPolicyProvider>; }
