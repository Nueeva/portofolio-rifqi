import { changePublicTheme } from "@/lib/themeTransition";
import * as m from "motion/react-m";
import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useTheme } from "next-themes";
import { ArrowUpRight, Github, Linkedin, Mail, Menu, Moon, Sun, Twitter } from "lucide-react";
import { TembusMark } from "@/components/TembusMark";
import { usePublicSettings } from "@/hooks/usePublicSettings";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
const links = [{ to: "/", label: "Beranda" }, { to: "/projects", label: "Karya" }, { to: "/about", label: "Tentang" }, { to: "/contact", label: "Kontak" }];
export function PublicThemeSwitch() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const dark = mounted && resolvedTheme === "dark";
    return <button className="public-theme-switch" type="button" disabled={!mounted} aria-label={mounted ? `Gunakan tema ${dark ? "terang" : "gelap"}` : "Ganti tema"} onClick={() => void changePublicTheme(dark ? "light" : "dark",setTheme)}>
    {dark ? <Sun aria-hidden="true"/> : <Moon aria-hidden="true"/>}
  </button>;
}
export function PublicNavbar() {
    const { get } = usePublicSettings();
    const name = get("hero_name", "Rifqi Ariansyah");
    const [open, setOpen] = useState(false);
    const [loggedIn, setLoggedIn] = useState(false);
    useEffect(() => {
        let active = true;
        let unsubscribe: (() => void) | undefined;
        void import("@/integrations/api/client").then(({ supabase }) => {
            if (!active)
                return;
            const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { if (active)
                setLoggedIn(!!session); });
            unsubscribe = () => subscription.unsubscribe();
            void supabase.auth.getSession().then(({ data: { session } }) => { if (active)
                setLoggedIn(!!session); });
        });
        return () => { active = false; unsubscribe?.(); };
    }, []);
    const account = loggedIn && <>
    <Link to="/admin" onClick={() => setOpen(false)}>Admin</Link>
    <AlertDialog>
      <AlertDialogTrigger asChild><button type="button">Keluar</button></AlertDialogTrigger>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Keluar dari akun?</AlertDialogTitle><AlertDialogDescription>Kamu perlu masuk kembali untuk mengakses admin.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={async () => { const { supabase } = await import("@/integrations/api/client"); await supabase.auth.signOut(); setOpen(false); }}>Keluar</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>;
    return <header className="public-navbar"><div className="public-container public-navbar-inner">
    <Link to="/" className="public-brand" aria-label={`${name} — Beranda`}><TembusMark /><span>{name}</span></Link>
    <nav className="public-desktop-nav" aria-label="Navigasi utama">{links.map(link => <NavLink key={link.to} to={link.to} end={link.to === "/"}>{({isActive})=><>{link.label}{isActive&&<m.span className="nav-active-line" layoutId="public-nav-line"/>}</>}</NavLink>)}{account}</nav>
    <div className="public-nav-actions"><PublicThemeSwitch /><Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><button className="public-menu-trigger" type="button" aria-label="Buka navigasi"><Menu /></button></DialogTrigger>
      <DialogContent className="celah-mobile-menu" data-lenis-prevent><DialogTitle>Navigasi</DialogTitle><DialogDescription className="sr-only">Pilih halaman portofolio.</DialogDescription>
        <nav aria-label="Navigasi seluler">{links.map(link => <NavLink key={link.to} to={link.to} end={link.to === "/"} onClick={() => setOpen(false)}>{link.label}<ArrowUpRight aria-hidden="true"/></NavLink>)}{account}</nav>
      </DialogContent>
    </Dialog></div>
  </div></header>;
}
export function PublicFooter() {
    const { get } = usePublicSettings();
    const socials = [
        { label: "GitHub", url: get("social_github", "https://github.com/Nueeva"), Icon: Github },
        { label: "LinkedIn", url: get("social_linkedin", "https://linkedin.com/id/rifqia"), Icon: Linkedin },
        { label: "Twitter", url: get("social_twitter", ""), Icon: Twitter },
        { label: "Email", url: `mailto:${get("contact_email", "contact@rifqi.tech")}`, Icon: Mail },
    ];
    return <footer className="public-footer"><div className="public-container">
    <div className="public-footer-invitation"><h2>Mari bertukar<br /><em>perspektif.</em></h2><Link className="public-text-link" to="/contact">Mulai percakapan <ArrowUpRight /></Link></div>
    <div className="public-footer-base"><Link to="/" className="public-brand"><TembusMark /><span>{get("hero_name", "Rifqi Ariansyah")}</span></Link><p>Cybersecurity Engineer</p>
      <div className="public-socials">{socials.filter(item => item.url).map(({ label, url, Icon }) => <a key={label} href={url} aria-label={label} {...(!url.startsWith("mailto:") ? { target: "_blank", rel: "noopener noreferrer" } : {})}><Icon aria-hidden="true"/></a>)}</div>
    </div>
  </div></footer>;
}
