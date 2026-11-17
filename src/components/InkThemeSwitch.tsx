import { Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";

type Preference = "dark" | "light" | "system";
type Props = {
  className?: string;
  preference?: Preference;
  children?: ReactNode;
  "aria-pressed"?: boolean;
};

/** One ink transition and persisted theme preference for public and console pages. */
export function InkThemeSwitch({
  className = "public-theme-switch",
  preference,
  children,
  "aria-pressed": pressed,
}: Props) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [requestedTheme, setRequestedTheme] = useState<"dark" | "light">();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const moduleRef = useRef<typeof import("@/lib/themeTransition")>();
  const cancelRef = useRef<() => void>();

  useEffect(() => {
    let active = true;
    setMounted(true);
    void import("@/lib/themeTransition")
      .then((module) => {
        if (!active) return;
        moduleRef.current = module;
        if (!preference && buttonRef.current?.isConnected) {
          cancelRef.current = module.cancelPublicThemeTransition;
          return module.warmPublicTheme(buttonRef.current);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
      cancelRef.current?.();
    };
  }, [preference]);

  const dark = mounted && resolvedTheme === "dark";
  const actionDark = requestedTheme ? requestedTheme === "dark" : dark;
  return (
    <button
      ref={buttonRef}
      className={className}
      type="button"
      disabled={!mounted}
      data-ink-theme-switch={preference ?? "toggle"}
      aria-pressed={pressed}
      aria-label={
        children
          ? undefined
          : mounted
            ? `Gunakan tema ${actionDark ? "terang" : "gelap"}`
            : "Ganti tema"
      }
      onPointerDown={() => {
        void import("@/lib/themeAudio")
          .then((module) => module.primeThemeAudio())
          .catch(() => undefined);
      }}
      onClick={(event) => {
        const button = event.currentTarget;
        const next =
          preference ??
          (document.documentElement.classList.contains("dark")
            ? "light"
            : "dark");
        const applyDirectly = () => {
          const resolved =
            next === "system"
              ? matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light"
              : next;
          setTheme(next);
          document.documentElement.classList.toggle(
            "dark",
            resolved === "dark",
          );
          document.documentElement.classList.toggle(
            "light",
            resolved === "light",
          );
          document.documentElement.style.colorScheme = resolved;
          window.dispatchEvent(new Event("celah:theme-rendered"));
        };
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
          applyDirectly();
          return;
        }
        const execute = (module: typeof import("@/lib/themeTransition")) => {
          if (!button.isConnected) return;
          cancelRef.current = module.cancelPublicThemeTransition;
          const task = preference
            ? module.changeThemeWithInk(preference, setTheme, button)
            : module.togglePublicTheme(setTheme, button);
          setRequestedTheme(module.requestedPublicTheme());
          return task.finally(() => {
            if (button.isConnected) setRequestedTheme(undefined);
          });
        };
        if (moduleRef.current) void execute(moduleRef.current);
        else
          void import("@/lib/themeTransition")
            .then(execute)
            .catch(applyDirectly);
      }}
    >
      {children ??
        (dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />)}
    </button>
  );
}
