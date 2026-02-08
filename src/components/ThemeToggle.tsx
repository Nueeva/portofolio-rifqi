import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState, useCallback } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeChange = useCallback(() => {
    const html = document.documentElement;
    html.classList.add('theme-transitioning');
    setTheme(theme === "dark" ? "light" : "dark");
    const timeout = setTimeout(() => {
      html.classList.remove('theme-transitioning');
    }, 400);
    return () => clearTimeout(timeout);
  }, [theme, setTheme]);

  const isDark = theme === "dark";

  if (!mounted) {
    return (
      <div className="relative w-14 h-7 rounded-full bg-muted" />
    );
  }

  return (
    <button
      onClick={handleThemeChange}
      className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        isDark
          ? "bg-primary/20 border border-primary/40"
          : "bg-secondary border border-border"
      }`}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {/* Sliding knob */}
      <span
        className={`absolute top-0.5 flex items-center justify-center w-6 h-6 rounded-full shadow-md transition-all duration-300 ${
          isDark
            ? "translate-x-7 bg-primary text-primary-foreground"
            : "translate-x-0.5 bg-background text-foreground"
        }`}
      >
        {isDark ? (
          <Moon className="h-3.5 w-3.5" />
        ) : (
          <Sun className="h-3.5 w-3.5" />
        )}
      </span>
    </button>
  );
}
