import { renderToPipeableStream } from "react-dom/server";
import { Writable } from "node:stream";
import App from "./App";

/**
 * Build-time prerender entry (built by vite.ssr.config.ts into
 * dist-server/, consumed by scripts/prerender-body.mjs).
 *
 * Renders the real app for one URL with a StaticRouter and resolves with
 * the full HTML once every Suspense boundary (lazy route chunks, the lazy
 * three.js hero) has resolved — onAllReady is the bot-friendly mode.
 * Effects never run here, so anything browser-only that lives in an
 * effect (canvas setups, localStorage, analytics) stays client-side.
 */
export function render(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let html = "";
    const sink = new Writable({
      write(chunk, _encoding, callback) {
        html += chunk.toString();
        callback();
      },
    });

    const timer = setTimeout(() => {
      reject(new Error(`entry-server: render timed out for ${url}`));
    }, 60_000);

    const { pipe } = renderToPipeableStream(<App ssrPath={url} />, {
      onAllReady() {
        pipe(sink);
      },
      onError(error) {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    });

    sink.on("finish", () => {
      clearTimeout(timer);
      resolve(html);
    });
    sink.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}
