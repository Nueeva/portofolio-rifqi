import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),

  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split the big vendor families into their own chunks so a content
        // change does not invalidate React/router/motion/three for returning
        // visitors (assets are served immutable for 1y by nginx).
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],

          three: ["three"],
        },
      },
    },
  },
}));
