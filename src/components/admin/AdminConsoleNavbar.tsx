import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Shield, LogOut, Terminal, Lock } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/api/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function AdminConsoleNavbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsLoggedIn(!!session);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="admin-console-header fixed top-0 left-0 right-0 z-50 h-16 border-b border-border/70 bg-background/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="admin-console-brand flex items-center gap-2.5 text-sm font-medium tracking-tight text-foreground transition-opacity hover:opacity-80"
          aria-label="Kembali ke Portofolio Utama"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded border border-border/80 bg-card font-mono text-xs font-bold text-primary">
            H
          </div>
          <span className="font-sans font-semibold tracking-tight text-foreground">
            Rifqi Ariansyah
          </span>
          <span className="text-muted-foreground/50">/</span>
          <span className="font-mono text-xs text-primary tracking-wider uppercase">
            Console
          </span>
        </Link>

        <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-border/60">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-[11px] text-muted-foreground tracking-wide">
            {isAdminPage ? "Console Operasi [LIVE]" : "Autentikasi Sistem"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded border border-border/50 hover:border-border"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Portofolio</span>
        </Link>

        {isLoggedIn && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-destructive transition-colors px-2.5 py-1.5 rounded border border-border/50 hover:border-destructive/40"
              >
                <LogOut className="h-3 w-3" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-border bg-card text-foreground">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-sans font-bold">Konfirmasi Keluar</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground text-sm">
                  Apakah Anda yakin ingin keluar dari konsol administrasi? Sesi aktif Anda akan diakhiri.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-border">Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleLogout}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Keluar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        <div className="pl-1">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
