import { flushSync } from "react-dom";
import { clearInkCache, createInkAtlas, INK, type InkAtlas } from "./inkMask";
import { createThemeLayers } from "./themeSnapshots";
import { playThemeInkSound, primeThemeAudio } from "./themeAudio";
import "./theme-transition.css";

export { primeThemeAudio };

type Theme = "dark" | "light";
type Request = { theme: Theme; setTheme: (theme: string) => void; origin: { x: number; y: number }; owner: HTMLElement };
type Transition = { ready: Promise<void>; finished: Promise<void>; updateCallbackDone?: Promise<void>; skipTransition?: () => void };

let pending: Request | undefined;
let desired: Theme | undefined;
let running: Promise<void> | undefined;
let controller: AbortController | undefined;
let warming: Promise<void> | undefined, warmController: AbortController | undefined;

const reduced = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

const supportsMask = () => {
    return (
        typeof CSS !== "undefined" &&
        typeof CSS.supports === "function" &&
        (CSS.supports("mask-image", 'url("data:image/png;base64,")') ||
         CSS.supports("-webkit-mask-image", 'url("data:image/png;base64,")') ||
         CSS.supports("mask", 'url("data:image/png;base64,")'))
    );
};

function apply(request: Request) {
    flushSync(() => request.setTheme(request.theme));
    const root = document.documentElement;
    root.classList.toggle("dark", request.theme === "dark");
    root.classList.toggle("light", request.theme === "light");
    root.style.colorScheme = request.theme;
}

function animationFor(target: HTMLElement, atlas: InkAtlas, pseudoElement?: string) {
    const keyframes = atlas.keyframes.map(k => ({
        ...k,
        webkitMaskPosition: k.maskPosition,
    }));
    return target.animate(keyframes, { duration: INK.duration, fill: "both", pseudoElement });
}

async function reveal(request: Request, signal: AbortSignal) {
    const root = document.documentElement;
    let atlas: InkAtlas | undefined, animation: Animation | undefined, transition: Transition | undefined;
    let layers: ReturnType<typeof createThemeLayers> | undefined, midpoint: ReturnType<typeof setTimeout> | undefined;
    const abort = () => { animation?.cancel(); transition?.skipTransition?.(); };
    signal.addEventListener("abort", abort, { once: true });
    try {
        if (reduced()) {
            root.style.transition = "opacity 150ms ease";
            root.style.opacity = "0.75";
            await new Promise(r => setTimeout(r, 75));
            apply(request);
            window.dispatchEvent(new Event("celah:theme-rendered"));
            root.style.opacity = "1";
            await new Promise(r => setTimeout(r, 75));
            root.style.removeProperty("transition");
            root.style.removeProperty("opacity");
            return;
        }

        if (document.hidden || !supportsMask()) {
            apply(request);
            window.dispatchEvent(new Event("celah:theme-rendered"));
            return;
        }

        // Trigger procedural fluid audio micro-interaction (silently handled if disabled)
        try { playThemeInkSound(request.theme === "dark"); } catch { /* Audio is optional; continue the visual transition. */ }

        await warming;
        signal.throwIfAborted();
        atlas = await createInkAtlas(innerWidth, innerHeight, request.origin.x, request.origin.y, signal);
        signal.throwIfAborted();
        if (!request.owner.isConnected) throw new Error("Theme toggle unmounted");

        const doc = document as Document & { startViewTransition?: (update: () => void) => Transition };
        if (typeof doc.startViewTransition === "function") {
            root.dataset.inkTransition = "view";
            root.style.setProperty("--ink-atlas", `url("${atlas.url}")`);
            root.style.setProperty("--ink-atlas-size", atlas.size);
            transition = doc.startViewTransition(() => {
                apply(request);
                window.dispatchEvent(new Event("celah:theme-rendered"));
            });
            void transition.finished.catch(() => undefined);
            if (transition.updateCallbackDone) void transition.updateCallbackDone.catch(() => undefined);
            await transition.ready;
            signal.throwIfAborted();
            animation = animationFor(root, atlas, "::view-transition-new(root)");
            await animation.finished;
            await transition.finished;
        } else {
            root.dataset.inkTransition = "layers";
            layers = createThemeLayers(root.classList.contains("dark") ? "dark" : "light", request.theme);
            layers.incoming.style.maskImage = `url("${atlas.url}")`;
            layers.incoming.style.webkitMaskImage = `url("${atlas.url}")`;
            layers.incoming.style.maskSize = atlas.size;
            layers.incoming.style.webkitMaskSize = atlas.size;
            layers.incoming.style.maskPosition = "0% 0%";
            layers.incoming.style.webkitMaskPosition = "0% 0%";
            await layers.show(signal);
            signal.throwIfAborted();
            midpoint = setTimeout(() => {
                apply(request);
                window.dispatchEvent(new Event("celah:theme-rendered"));
            }, INK.midpoint);
            animation = animationFor(layers.incoming, atlas);
            await animation.finished;
            clearTimeout(midpoint);
            apply(request);
            window.dispatchEvent(new Event("celah:theme-rendered"));
        }
    } catch {
        apply(request);
        window.dispatchEvent(new Event("celah:theme-rendered"));
    } finally {
        clearTimeout(midpoint);
        transition?.skipTransition?.();
        if (transition) await transition.finished.catch(() => undefined);
        animation?.cancel();
        layers?.release();
        atlas?.release();
        delete root.dataset.inkTransition;
        root.style.removeProperty("--ink-atlas");
        root.style.removeProperty("--ink-atlas-size");
        signal.removeEventListener("abort", abort);
    }
}

export function togglePublicTheme(setTheme: (theme: string) => void, owner: HTMLElement) {
    const current = desired ?? (document.documentElement.classList.contains("dark") ? "dark" : "light");
    const bounds = owner.getBoundingClientRect();
    desired = current === "dark" ? "light" : "dark";
    pending = { theme: desired, setTheme, owner, origin: { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 } };
    document.documentElement.dataset.inkBusy = "true";
    if (!running) running = (async () => {
        while (pending) {
            const request = pending; pending = undefined;
            controller = new AbortController();
            const activeController = controller;
            const cancel = () => {
                if (pending) { request.theme = pending.theme; pending = undefined; }
                warmController?.abort();
                activeController.abort();
            };
            const media = matchMedia("(prefers-reduced-motion: reduce)");
            const unmounted = new MutationObserver(() => { if (!request.owner.isConnected) cancel(); });
            unmounted.observe(document.body, { childList: true, subtree: true });
            // Note: Never cancel on scroll! Lenis smooth-scrolling or user scrolling must not kill ink transitions.
            window.addEventListener("pagehide", cancel, { once: true });
            document.addEventListener("visibilitychange", cancel, { once: true });
            media.addEventListener("change", cancel, { once: true });
            try {
                const currentTheme = document.documentElement.classList.contains("dark") ? "dark" : "light";
                if (currentTheme === request.theme) {
                    apply(request);
                } else {
                    await reveal(request, activeController.signal);
                }
            } finally {
                unmounted.disconnect();
                window.removeEventListener("pagehide", cancel);
                document.removeEventListener("visibilitychange", cancel);
                media.removeEventListener("change", cancel);
            }
        }
    })().finally(() => { running = undefined; desired = undefined; controller = undefined; delete document.documentElement.dataset.inkBusy; });
    return running;
}

export function cancelPublicThemeTransition() { pending = undefined; controller?.abort(); warmController?.abort(); clearInkCache(); }
export function requestedPublicTheme() { return desired; }

/** Prepare geometry after the initial hero has settled; no page snapshots or theme changes. */
export function warmPublicTheme(owner: HTMLElement) {
    if (running || warming || reduced() || document.hidden || !owner.isConnected) return;
    warmController = new AbortController();
    const local = warmController, bounds = owner.getBoundingClientRect();
    const cancel = () => local.abort();
    document.addEventListener("visibilitychange", cancel, { once: true });
    warming = createInkAtlas(innerWidth, innerHeight, bounds.left + bounds.width / 2, bounds.top + bounds.height / 2, local.signal)
        .then(() => undefined).catch(() => undefined).finally(() => {
            document.removeEventListener("visibilitychange", cancel);
            warming = undefined; warmController = undefined;
        });
    return warming;
}
