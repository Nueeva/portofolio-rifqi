import { flushSync } from "react-dom";
import "./theme-transition.css";

type Theme = "dark" | "light";
type Request = {
    theme: Theme;
    setTheme: (theme: string) => void;
    origin: { x: number; y: number };
    owner: HTMLElement;
};
type Transition = {
    ready: Promise<void>;
    finished: Promise<void>;
    updateCallbackDone?: Promise<void>;
    skipTransition?: () => void;
};

let pending: Request | undefined;
let desired: Theme | undefined;
let running: Promise<void> | undefined;
let activeTransition: Transition | undefined;

const reduced = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

function apply(request: Request) {
    flushSync(() => request.setTheme(request.theme));
    const root = document.documentElement;
    root.classList.toggle("dark", request.theme === "dark");
    root.classList.toggle("light", request.theme === "light");
    root.style.colorScheme = request.theme;
}

async function paint() {
    await new Promise<void>(resolve => {
        let frame = 0;
        const done = () => {
            clearTimeout(timer);
            cancelAnimationFrame(frame);
            window.removeEventListener("celah:theme-rendered", done);
            resolve();
        };
        const timer = setTimeout(done, 80);
        window.addEventListener("celah:theme-rendered", done, { once: true });
        frame = requestAnimationFrame(() => {
            frame = requestAnimationFrame(done);
        });
    });
}

async function reveal(request: Request) {
    const root = document.documentElement;
    const { x, y } = request.origin;
    const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
    ) + 60;

    if (reduced() || document.hidden) {
        apply(request);
        return;
    }

    const doc = document as Document & {
        startViewTransition?: (update: () => Promise<void> | void) => Transition;
    };

    if (typeof doc.startViewTransition === "function") {
        root.dataset.inkTransition = "view";
        try {
            const transition = doc.startViewTransition(async () => {
                apply(request);
                await paint();
            });
            activeTransition = transition;
            void transition.finished.catch(() => undefined);

            await transition.ready;

            const animation = root.animate(
                {
                    clipPath: [
                        `circle(0px at ${x}px ${y}px)`,
                        `circle(${endRadius}px at ${x}px ${y}px)`
                    ]
                },
                {
                    duration: 520,
                    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                    pseudoElement: "::view-transition-new(root)",
                    fill: "both"
                }
            );

            await animation.finished.catch(() => undefined);
            await transition.finished.catch(() => undefined);
        } catch {
            apply(request);
        } finally {
            delete root.dataset.inkTransition;
            activeTransition = undefined;
        }
    } else {
        root.classList.add("theme-color-transition");
        apply(request);
        await new Promise(r => setTimeout(r, 220));
        root.classList.remove("theme-color-transition");
    }
}

export function togglePublicTheme(setTheme: (theme: string) => void, owner: HTMLElement): Promise<void> {
    const current = desired ?? (document.documentElement.classList.contains("dark") ? "dark" : "light");
    const bounds = owner.getBoundingClientRect();
    desired = current === "dark" ? "light" : "dark";
    pending = {
        theme: desired,
        setTheme,
        owner,
        origin: { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 }
    };
    document.documentElement.dataset.inkBusy = "true";

    if (!running) {
        running = (async () => {
            while (pending) {
                const request = pending;
                pending = undefined;
                try {
                    const currentTheme = document.documentElement.classList.contains("dark") ? "dark" : "light";
                    if (currentTheme === request.theme) {
                        apply(request);
                    } else {
                        await reveal(request);
                    }
                } catch {
                    apply(request);
                }
            }
        })().finally(() => {
            running = undefined;
            desired = undefined;
            delete document.documentElement.dataset.inkBusy;
        });
    }
    return running;
}

export function cancelPublicThemeTransition() {
    pending = undefined;
    activeTransition?.skipTransition?.();
}

export function requestedPublicTheme() {
    return desired;
}

export function warmPublicTheme(_owner: HTMLElement): Promise<void> {
    return Promise.resolve();
}
