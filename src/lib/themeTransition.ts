type Transition = {
    ready: Promise<void>;
    finished: Promise<void>;
};
let running = false;
export async function changePublicTheme(theme: "dark" | "light", setTheme: (theme: string) => void) {
    if (running)
        return;
    running = true;
    const root = document.documentElement;
    const apply = () => { setTheme(theme); root.classList.toggle("dark", theme === "dark"); root.style.colorScheme = theme; };
    try {
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
            apply();
            return;
        }
        const doc = document as Document & {
            startViewTransition?: (update: () => Promise<void>) => Transition;
        };
        if (!doc.startViewTransition) {
            root.classList.add("theme-color-transition");
            apply();
            await new Promise(r => setTimeout(r, 220));
            return;
        }
        const transition = doc.startViewTransition(async () => {
            apply();
            await new Promise<void>(resolve => {
                const done = () => { clearTimeout(timer); window.removeEventListener("celah:theme-rendered", done); resolve(); };
                const timer = setTimeout(done, 100);
                window.addEventListener("celah:theme-rendered", done, { once: true });
            });
        });
        await transition.ready;
        await root.animate({ clipPath: ["polygon(-30% 0,0 0,-30% 100%,-60% 100%)", "polygon(-30% 0,160% 0,130% 100%,-60% 100%)"] }, { duration: 500, easing: "cubic-bezier(.22,1,.36,1)", pseudoElement: "::view-transition-new(root)", fill: "both" }).finished;
        await transition.finished;
    }
    catch {
        apply();
    }
    finally {
        root.classList.remove("theme-color-transition");
        running = false;
    }
}
