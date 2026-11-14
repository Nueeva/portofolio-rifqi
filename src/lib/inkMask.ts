import { INK, inkGeometry, rasterizeInk, type InkRaster, type InkRequest } from "./inkRaster";
export { INK } from "./inkRaster";

let atlasCache: { key: string; raster: InkRaster } | undefined;
export interface InkAtlas { url: string; keyframes: Keyframe[]; size: string; release: () => void }

async function loadAtlas(raster: InkRaster, signal: AbortSignal): Promise<InkAtlas> {
    const url = URL.createObjectURL(raster.blob), image = new Image();
    image.src = url;
    try { await image.decode(); signal.throwIfAborted(); }
    catch (error) { image.src = ""; URL.revokeObjectURL(url); throw error; }
    return { url, keyframes: raster.keyframes, size: raster.size, release: () => { image.src = ""; URL.revokeObjectURL(url); } };
}

function rasterizeInWorker(request: InkRequest, signal: AbortSignal): Promise<InkRaster> {
    return new Promise((resolve, reject) => {
        const worker = new Worker(new URL("./inkMask.worker.ts", import.meta.url), { type: "module", name: "ink-pigment" });
        const dispose = () => {
            clearTimeout(timer); signal.removeEventListener("abort", abort);
            worker.onmessage = worker.onerror = worker.onmessageerror = null;
            worker.terminate();
        };
        const abort = () => { dispose(); reject(signal.reason ?? new DOMException("Ink cancelled", "AbortError")); };
        const timer = setTimeout(() => { dispose(); reject(new Error("Ink worker timed out")); }, 8000);
        signal.addEventListener("abort", abort, { once: true });
        worker.onmessage = (event: MessageEvent<{ result?: InkRaster; error?: string }>) => {
            dispose();
            if (event.data.result) resolve(event.data.result);
            else reject(new Error(event.data.error ?? "Ink worker returned no raster"));
        };
        worker.onerror = event => { event.preventDefault(); dispose(); reject(new Error("Ink worker unavailable")); };
        worker.onmessageerror = () => { dispose(); reject(new Error("Ink worker response unavailable")); };
        if (signal.aborted) abort();
        else {
            try { worker.postMessage(request); }
            catch (error) { dispose(); reject(error); }
        }
    });
}

async function rasterizeOnPage(request: InkRequest, signal: AbortSignal) {
    return rasterizeInk(request, (width, height) => {
        const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Ink atlas context unavailable");
        return {
            context,
            encode: () => new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Ink encoding failed")), "image/png")),
            dispose: () => { canvas.width = canvas.height = 0; },
        };
    }, signal);
}

export function clearInkCache() { atlasCache = undefined; }

/** Cache one compressed atlas; decoded handles and each worker are always released. */
export async function createInkAtlas(width: number, height: number, x: number, y: number, signal: AbortSignal): Promise<InkAtlas> {
    signal.throwIfAborted();
    const request = { width, height, x, y }, geometry = inkGeometry(request);
    const key = `${width}/${height}/${geometry.w}/${geometry.h}/${geometry.ox}/${geometry.oy}/${INK.frames}`;
    if (atlasCache?.key === key) return loadAtlas(atlasCache.raster, signal);
    let raster: InkRaster | undefined;
    if (typeof Worker === "function" && typeof OffscreenCanvas === "function") {
        try { raster = await rasterizeInWorker(request, signal); }
        catch { signal.throwIfAborted(); }
    }
    raster ??= await rasterizeOnPage(request, signal);
    signal.throwIfAborted();
    atlasCache = { key, raster };
    return loadAtlas(raster, signal);
}
