import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The SPA lives in web/. Build output → web/dist (served by the API in prod).
// In dev, /api is proxied to the Express backend.
export default defineConfig({
  root: resolve(__dirname, "web"),
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8787",
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
