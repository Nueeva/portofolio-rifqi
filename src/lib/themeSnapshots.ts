type Theme = "dark" | "light";

function splitSelectors(value: string) {
    const selectors: string[] = [];
    let depth = 0, start = 0;
    for (let i = 0; i < value.length; i++) {
        if (value[i] === "(" || value[i] === "[") depth++;
        if (value[i] === ")" || value[i] === "]") depth--;
        if (value[i] === "," && depth === 0) { selectors.push(value.slice(start, i)); start = i + 1; }
    }
    selectors.push(value.slice(start));
    return selectors;
}
function scopedSelector(selector: string) {
    let value = selector.trim();
    if (value.includes("::view-transition") || value.includes("data-ink-") || value.includes("ink-overlay")) return "";
    value = value.replace(/\.dark(?=[\s.:)>+~#[]|$)/g, '[data-ink-scope="dark"]');
    value = value.replace(/:root/g, "[data-ink-scope]");
    value = value.replace(/:hover/g, "[data-ink-hover]").replace(/:focus-visible/g, "[data-ink-focus-visible]").replace(/:focus(?!-)/g, "[data-ink-focus]");
    value = value.replace(/(^|[\s>+~,(])(html|body)(?=$|[\s>+~.#:[,)])/g, "$1[data-ink-scope]");
    return value.startsWith("[data-ink-scope]") || value.startsWith('[data-ink-scope="dark"]')
        ? value : `[data-ink-scope] ${value}`;
}
function scopeRules(rules: CSSRuleList): string {
    return Array.from(rules).map(rule => {
        if (rule instanceof CSSStyleRule) {
            const selector = splitSelectors(rule.selectorText).map(scopedSelector).filter(Boolean).join(",");
            return selector ? `${selector}{${rule.style.cssText}}` : "";
        }
        if (rule instanceof CSSMediaRule || rule instanceof CSSSupportsRule)
            return `${rule.cssText.slice(0, rule.cssText.indexOf("{"))}{${scopeRules(rule.cssRules)}}`;
        if ("cssRules" in rule && rule.constructor.name === "CSSLayerBlockRule")
            return scopeRules((rule as CSSGroupingRule).cssRules);
        return "";
    }).join("\n");
}

function updateIcon(scope: HTMLElement, theme: Theme) {
    const icon = scope.querySelector(".public-theme-switch svg");
    if (!icon) return;
    icon.innerHTML = theme === "dark"
        ? '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>'
        : '<path d="M20.985 12.486A9 9 0 1 1 11.51 3.01a7 7 0 0 0 9.475 9.476Z"/>';
}

function copyPage(theme: Theme, prefix: string, width: number, scrollY: number) {
    const scope = document.createElement("div");
    scope.dataset.inkScope = theme;
    scope.style.width = `${width}px`; scope.style.top = `${-scrollY}px`; scope.style.colorScheme = theme;
    const app = document.getElementById("root");
    if (!app) throw new Error("Theme snapshot root unavailable");
    const clone = app.cloneNode(true) as HTMLElement;
    const sources = [app, ...app.querySelectorAll<HTMLElement>("*")];
    const copies = [clone, ...clone.querySelectorAll<HTMLElement>("*")];
    const pairs = new Map<Element, HTMLElement>(), ids = new Map<string, string>();
    sources.forEach((source, i) => {
        const copy = copies[i]; pairs.set(source, copy);
        if (source.matches(":hover")) copy.dataset.inkHover = "";
        if (source.matches(":focus-visible")) copy.dataset.inkFocusVisible = "";
        if (source.matches(":focus")) copy.dataset.inkFocus = "";
        if (copy.id) { ids.set(copy.id, `${prefix}-${copy.id}`); copy.id = `${prefix}-${copy.id}`; }
        if (source instanceof HTMLInputElement && copy instanceof HTMLInputElement) { copy.value = source.value; copy.checked = source.checked; }
        if (source instanceof HTMLTextAreaElement && copy instanceof HTMLTextAreaElement) copy.value = source.value;
        if (source instanceof HTMLSelectElement && copy instanceof HTMLSelectElement) copy.selectedIndex = source.selectedIndex;
        copy.scrollTop = source.scrollTop;
        copy.removeAttribute("autofocus");
        for (const name of copy.getAttributeNames()) if (name.startsWith("on")) copy.removeAttribute(name);
    });
    for (const copy of copies) for (const attr of Array.from(copy.attributes)) {
        let value = attr.value.replace(/url\(["']?#([^)'"\s]+)["']?\)/g, (match, id: string) => ids.has(id) ? `url(#${ids.get(id)})` : match);
        if (attr.name === "href" && value.startsWith("#") && ids.has(value.slice(1))) value = `#${ids.get(value.slice(1))}`;
        if (/^aria-(labelledby|describedby)$/.test(attr.name)) value = value.split(" ").map(id => ids.get(id) ?? id).join(" ");
        if (value !== attr.value) copy.setAttribute(attr.name, value);
    }
    for (const animation of document.getAnimations()) {
        const source = (animation.effect as KeyframeEffect | null)?.target;
        if (!(source instanceof Element)) continue;
        const copy = pairs.get(source);
        if (!copy) continue;
        const computed = getComputedStyle(source);
        for (const key of ["transform", "translate", "rotate", "scale", "opacity", "clip-path"])
            copy.style.setProperty(key, computed.getPropertyValue(key));
    }
    clone.querySelectorAll("script, style, link, iframe, object, embed").forEach(node => node.remove());
    clone.querySelectorAll("video, audio").forEach(node => node.removeAttribute("autoplay"));
    scope.append(clone); updateIcon(scope, theme);
    return { scope, pairs };
}

/** Two inert presentation trees, using the existing cascade with isolated theme ancestors.
 * React is never mounted in these copies. No handlers or application effects are attached.
 */
export function createThemeLayers(from: Theme, to: Theme) {
    const style = document.createElement("style"); style.dataset.inkStyle = "";
    style.textContent = Array.from(document.styleSheets).map(sheet => {
        try { return scopeRules(sheet.cssRules); } catch { return ""; }
    }).join("\n") + '\n[data-ink-scope], [data-ink-scope] *, [data-ink-scope] *::before, [data-ink-scope] *::after {animation:none!important;transition:none!important;caret-color:transparent!important}';
    const overlay = document.createElement("div"); overlay.className = "ink-overlay";
    overlay.setAttribute("aria-hidden", "true"); overlay.inert = true;
    const outgoing = document.createElement("div"), incoming = document.createElement("div");
    outgoing.className = incoming.className = "ink-overlay-layer";
    const width = document.documentElement.clientWidth, scrollY = window.scrollY;
    const oldCopy = copyPage(from, "ink-old", width, scrollY), newCopy = copyPage(to, "ink-new", width, scrollY);
    outgoing.append(oldCopy.scope); incoming.append(newCopy.scope); overlay.append(outgoing, incoming);
    overlay.style.visibility = "hidden";
    document.head.append(style); document.body.append(overlay);
    try {
        for (const { scope, pairs } of [oldCopy, newCopy]) {
            const css = getComputedStyle(scope.querySelector(".public-design") ?? scope);
            const colors = Object.fromEntries(["--site-bg", "--site-cyan", "--site-violet", "--site-copper"].map(key => [key, css.getPropertyValue(key).trim()]));
            const background = css.getPropertyValue("--site-bg").trim() || css.backgroundColor;
            scope.style.background = background; (scope.parentElement as HTMLElement).style.background = background;
            for (const [source, copy] of pairs) {
                if (!(source instanceof HTMLCanvasElement)) continue;
                let data: string | undefined;
                source.dispatchEvent(new CustomEvent("celah:ink-snapshot", { detail: { colors, capture: (value: string) => { data = value; } } }));
                data ??= source.toDataURL();
                const image = document.createElement("img"); image.src = data; image.alt = ""; image.className = copy.className;
                image.style.cssText = copy.style.cssText; image.width = source.width; image.height = source.height;
                image.style.display = "block";
                copy.replaceWith(image);
            }
        }
        return { overlay, incoming, show: async (signal: AbortSignal) => {
            await new Promise<void>((resolve, reject) => {
                const finish = (error?: Error) => {
                    clearTimeout(timer); signal.removeEventListener("abort", abort);
                    if (error) reject(error); else resolve();
                };
                const abort = () => finish(new Error("Theme snapshot cancelled"));
                const timer = setTimeout(() => finish(new Error("Theme snapshot decode timeout")), 1500);
                signal.addEventListener("abort", abort, { once: true });
                if (signal.aborted) { abort(); return; }
                void Promise.all(Array.from(overlay.querySelectorAll("img")).map(image => image.decode())).then(() => finish(), () => finish(new Error("Theme snapshot image unavailable")));
            });
            overlay.style.visibility = "visible";
        }, release: () => { overlay.remove(); style.remove(); } };
    } catch (error) { overlay.remove(); style.remove(); throw error; }
}
