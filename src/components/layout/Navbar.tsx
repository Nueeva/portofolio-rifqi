import { Link, useLocation } from "react-router-dom";
import { Shield, Menu, X, Settings, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/projects", label: "Projects" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
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
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-primary">
            <Shield className="h-6 w-6" />
            <span className="font-mono font-semibold text-foreground">
              Rifqi<span className="text-primary">A</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === link.href
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isLoggedIn && (
              <>
                <Link
                  to="/admin"
                  className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary ${
                    location.pathname === "/admin"
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  Admin
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            )}
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location.pathname === link.href
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {isLoggedIn && (
                <>
                  <Link
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary ${
                      location.pathname === "/admin"
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                    Admin
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
