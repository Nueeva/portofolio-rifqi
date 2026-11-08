import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { PublicDesignContext } from "./PublicDesignContext";
import { getPublicProject } from "@/data/projectCopy.id";
import "./public-design.css";

/** CSS variables stop at this boundary, including the dedicated portal host.
 * Admin/auth keep their original root tokens and component contracts. */
export function PublicDesignBoundary({ children, pathname }: { children: ReactNode; pathname: string }) {
  const isPublic = !/^\/(admin|auth)\/?$/.test(pathname);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const value = useMemo(() => ({ isPublic, portalContainer: isPublic ? container ?? undefined : undefined }), [isPublic, container]);
  useEffect(() => {
    document.documentElement.lang = isPublic ? "id" : "en";
    if (!isPublic) return;
    const titles: Record<string, string> = { "/": "Cybersecurity Engineer", "/about": "Tentang", "/projects": "Karya", "/contact": "Kontak", "/403": "403 — Akses terbatas", "/500": "500 — Kendala sistem", "/502": "502 — Layanan belum terhubung", "/503": "503 — Layanan tidak tersedia", "/429": "429 — Terlalu banyak permintaan" };
    const project = pathname.startsWith("/projects/") ? getPublicProject(pathname.split("/")[2]) : undefined;
    document.title = `${titles[pathname.replace(/\/$/, "") || "/"] ?? project?.title ?? "404 — Halaman tidak ditemukan"} — Rifqi Ariansyah`;
  }, [isPublic, pathname]);

  return (
    <PublicDesignContext.Provider value={value}>
      <div className={isPublic ? "public-design" : undefined} data-design={isPublic ? "celah" : "legacy"}>
        {children}
        <Toaster />
        <Sonner containerAriaLabel={isPublic ? "Notifikasi" : undefined} />
        {isPublic && <div ref={setContainer} className="public-overlays" />}
      </div>
    </PublicDesignContext.Provider>
  );
}
