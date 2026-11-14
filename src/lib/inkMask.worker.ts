import { rasterizeInk, type InkRequest } from "./inkRaster";

self.onmessage = async (event: MessageEvent<InkRequest>) => {
    try {
        const result = await rasterizeInk(event.data, (width, height) => {
            const canvas = new OffscreenCanvas(width, height);
            const context = canvas.getContext("2d");
            if (!context) throw new Error("Offscreen ink context unavailable");
            return {
                context,
                encode: () => canvas.convertToBlob({ type: "image/png" }),
                dispose: () => { canvas.width = canvas.height = 0; },
            };
        }, new AbortController().signal, false);
        self.postMessage({ result });
    } catch (error) {
        self.postMessage({ error: error instanceof Error ? error.message : "Ink worker failed" });
    }
};
