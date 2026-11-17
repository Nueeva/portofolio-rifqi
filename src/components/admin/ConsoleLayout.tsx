import { consoleSections, canLeaveConsole } from "@/lib/consoleNavigation";
import { useState, type ReactNode } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { ArrowUpRight, LogOut, Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { TembusMark } from "@/components/TembusMark";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function ConsoleLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const authPage = pathname === "/auth";
  const active = params.get("section") || "projects";
  const { resolvedTheme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const account = (
    <div className="console-account">
      <span className="console-eyebrow">Akun pengelola</span>
      <p title={user?.email}>{user?.email || "Memeriksa sesi…"}</p>
      <Button
        variant="ghost"
        disabled={loggingOut}
        onClick={async () => {
          if (!canLeaveConsole()) return;
          setLoggingOut(true);
          setLogoutError("");
          const { error } = await signOut();
          if (error) setLogoutError("Gagal keluar. Coba kembali.");
          else window.location.assign("/auth");
          setLoggingOut(false);
        }}
      >
        <LogOut size={16} />
        {loggingOut ? "Sedang keluar…" : "Keluar"}
      </Button>
      {logoutError && <p role="alert">{logoutError}</p>}
    </div>
  );
  const links = (
    <nav aria-label="Navigasi pengelolaan">
      {["Konten", "Pemantauan", "Pengaturan"].map((group) => (
        <div className="console-nav-group" key={group}>
          <p>{group}</p>
          {consoleSections
            .filter((item) => item.group === group)
            .map((item) => (
              <Link
                key={item.id}
                to={`/admin?section=${item.id}`}
                aria-current={active === item.id ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
              >
                <item.icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            ))}
        </div>
      ))}
    </nav>
  );
  return (
    <div
      className={
        authPage ? "console-layout console-auth-layout" : "console-layout"
      }
    >
      <a className="console-skip" href="#main-content">
        Lewati ke konten utama
      </a>
      <header className="console-header">
        <Link className="console-brand" to="/">
          <TembusMark className="console-mark" />
          <span>
            Celah<span className="console-brand-caption">Rifqi Ariansyah</span>
          </span>
        </Link>
        <div className="console-header-actions">
          <Link className="console-public-link" to="/">
            Lihat portofolio <ArrowUpRight size={16} />
          </Link>
          <button
            className="console-icon-button"
            type="button"
            aria-label={
              resolvedTheme === "dark"
                ? "Gunakan tema terang"
                : "Gunakan tema gelap"
            }
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
          >
            {resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {!authPage && (
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="console-icon-button console-menu-toggle"
                  aria-label="Buka navigasi"
                >
                  <Menu size={21} />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="console-mobile-menu">
                <SheetHeader>
                  <SheetTitle>Pengelolaan portofolio</SheetTitle>
                </SheetHeader>
                {links}
                {account}
              </SheetContent>
            </Sheet>
          )}
        </div>
      </header>
      {!authPage && (
        <aside className="console-sidebar">
          {links}
          {account}
        </aside>
      )}
      <main
        id="main-content"
        className={authPage ? "console-auth-main" : "console-main"}
      >
        {children}
      </main>
      {!authPage && (
        <footer className="console-footer">
          Celah <span>Ruang untuk merawat karya.</span>
        </footer>
      )}
    </div>
  );
}
