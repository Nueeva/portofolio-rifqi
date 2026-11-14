import type { PublicContent } from "./integrations/api/types";
import { applyEditorial, resolveProjectCatalog } from "./data/editorial";
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
export function render(url: string, publicContent?: PublicContent): Promise<string> {
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

    const { pipe } = renderToPipeableStream(<App ssrPath={url} publicContent={publicContent} />, {
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

export function prerenderRoutes(content?: PublicContent) {
  const projects = applyEditorial(resolveProjectCatalog(content?.projects), content?.portfolio_project_content ?? []);
  return [
    { path: "", title: "Rifqi Ariansyah — Cybersecurity Engineer", description: "Portofolio Rifqi Ariansyah: keamanan aplikasi, tooling, dan engineering." },
    { path: "about", title: "Tentang — Rifqi Ariansyah", description: "Keahlian, pengalaman, perjalanan, dan CV Rifqi Ariansyah." },
    { path: "projects", title: "Karya — Rifqi Ariansyah", description: "Security tooling, aplikasi web, dan operasi sistem dari Rifqi Ariansyah." },
    { path: "contact", title: "Kontak — Rifqi Ariansyah", description: "Hubungi Rifqi Ariansyah untuk pekerjaan keamanan aplikasi dan kolaborasi engineering." },
    ...projects.map(project => {
      if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,149}$/.test(project.id)) throw new Error("Project ID cannot be used as a prerender path");
      return { path: `projects/${project.id}`, title: `${project.title} — Rifqi Ariansyah`, description: project.solution.slice(0, 300) };
    }),
  ];
}
