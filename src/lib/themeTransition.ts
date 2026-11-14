import { flushSync } from "react-dom";
import { clearInkCache, createInkAtlas, INK, type InkAtlas } from "./inkMask";
import { createThemeLayers } from "./themeSnapshots";
import "./theme-transition.css";

type Theme = "dark" | "light";
type Request = { theme: Theme; setTheme: (theme: string) => void; origin: { x: number; y: number }; owner: HTMLElement };
type Transition = { ready: Promise<void>; finished: Promise<void>; updateCallbackDone: Promise<void>; skipTransition: () => void };
let pending: Request | undefined;
let desired: Theme | undefined;
let running: Promise<void> | undefined;
let controller: AbortController | undefined;
let warming: Promise<void> | undefined, warmController: AbortController | undefined;
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

function apply(request: Request) {
    flushSync(() => request.setTheme(request.theme));
    const root = document.documentElement;
    root.classList.toggle("dark", request.theme === "dark");
    root.classList.toggle("light", request.theme === "light");
    root.style.colorScheme = request.theme;
}

async function paint(signal: AbortSignal) {
    signal.throwIfAborted();
    await new Promise<void>(resolve => {
        let frame = 0;
        const done = () => { clearTimeout(timer); cancelAnimationFrame(frame); window.removeEventListener("celah:theme-rendered", done); signal.removeEventListener("abort", done); resolve(); };
        const timer = setTimeout(done, 100);
        window.addEventListener("celah:theme-rendered", done, { once: true });
        signal.addEventListener("abort", done, { once: true });
        frame = requestAnimationFrame(() => { frame = requestAnimationFrame(done); });
    });
    signal.throwIfAborted();
}
function animationFor(target: HTMLElement, atlas: InkAtlas, pseudoElement?: string) {
    return target.animate(atlas.keyframes, { duration: INK.duration, fill: "both", pseudoElement });
}
async function reveal(request: Request, signal: AbortSignal) {
    const root = document.documentElement;
    let atlas: InkAtlas | undefined, animation: Animation | undefined, transition: Transition | undefined;
    let layers: ReturnType<typeof createThemeLayers> | undefined, midpoint: ReturnType<typeof setTimeout> | undefined;
    const abort = () => { animation?.cancel(); transition?.skipTransition(); };
    signal.addEventListener("abort", abort, { once: true });
    try {
        if (reduced() || document.hidden || !CSS.supports("mask-image", 'url("data:image/png;base64,")')) { apply(request); return; }
        await warming;
        signal.throwIfAborted();
        atlas = await createInkAtlas(innerWidth, innerHeight, request.origin.x, request.origin.y, signal);
        signal.throwIfAborted();
        if (!request.owner.isConnected) throw new Error("Theme toggle unmounted");
        const doc = document as Document & { startViewTransition?: (update: () => Promise<void>) => Transition };
        if (typeof doc.startViewTransition === "function") {
            root.dataset.inkTransition = "view";
            root.style.setProperty("--ink-atlas", `url("${atlas.url}")`);
            root.style.setProperty("--ink-atlas-size", atlas.size);
            transition = doc.startViewTransition(async () => { signal.throwIfAborted(); apply(request); await paint(signal); });
            void transition.finished.catch(() => undefined);
            void transition.updateCallbackDone.catch(() => undefined);
            await transition.ready;
            signal.throwIfAborted();
            animation = animationFor(root, atlas, "::view-transition-new(root)");
            await animation.finished;
            await transition.finished;
        } else {
            root.dataset.inkTransition = "layers";
            layers = createThemeLayers(root.classList.contains("dark") ? "dark" : "light", request.theme);
            layers.incoming.style.maskImage = `url("${atlas.url}")`;
            layers.incoming.style.maskSize = atlas.size;
            layers.incoming.style.maskPosition = "0% 0%";
            await layers.show(signal);
            signal.throwIfAborted();
            midpoint = setTimeout(() => apply(request), INK.midpoint);
            animation = animationFor(layers.incoming, atlas);
            await animation.finished;
            clearTimeout(midpoint); apply(request); await paint(signal);
        }
    } catch {
        apply(request);
    } finally {
        clearTimeout(midpoint); transition?.skipTransition();
        if (transition) await transition.finished.catch(() => undefined);
        animation?.cancel(); layers?.release(); atlas?.release();
        delete root.dataset.inkTransition;
        root.style.removeProperty("--ink-atlas"); root.style.removeProperty("--ink-atlas-size");
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
            window.addEventListener("resize", cancel, { once: true });
            window.addEventListener("scroll", cancel, { once: true, passive: true });
            window.addEventListener("pagehide", cancel, { once: true });
            document.addEventListener("visibilitychange", cancel, { once: true });
            media.addEventListener("change", cancel, { once: true });
            try {
                const currentTheme = document.documentElement.classList.contains("dark") ? "dark" : "light";
                if (currentTheme === request.theme) apply(request);
                else await reveal(request, activeController.signal);
            } finally {
                unmounted.disconnect();
                window.removeEventListener("resize", cancel); window.removeEventListener("scroll", cancel); window.removeEventListener("pagehide", cancel);
                document.removeEventListener("visibilitychange", cancel); media.removeEventListener("change", cancel);
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
    window.addEventListener("resize", cancel, { once: true });
    document.addEventListener("visibilitychange", cancel, { once: true });
    warming = createInkAtlas(innerWidth, innerHeight, bounds.left + bounds.width / 2, bounds.top + bounds.height / 2, local.signal)
        .then(atlas => atlas.release()).catch(() => undefined).finally(() => {
            window.removeEventListener("resize", cancel); document.removeEventListener("visibilitychange", cancel);
            warming = undefined; warmController = undefined;
        });
    return warming;
}
