import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Build-time prerender bundle ONLY (scripts/prerender-body.mjs imports the
// render() from dist-server/entry-server.js). Kept separate from the main
// config so the PWA plugin and the client chunking never touch the SSR build.
export default defineConfig({
  plugins: [react()],
  publicDir: false,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    ssr: "src/entry-server.tsx",
    outDir: "dist-server",
    emptyOutDir: true,
    rollupOptions: {
      output: { format: "esm" },
    },
  },
});
