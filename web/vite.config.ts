import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// The 🔵 interaction line's replay-first site. It lives in web/ (owned exclusively by this
// line) and is a SEPARATE Vite app from the root MVP demo — so `npm run build` (root, relied
// on by the other lines + browser-smoke) stays untouched. We consume src/engine + src/game as
// read-only libraries; we never build the root index.html here.
const here = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = fileURLToPath(new URL("..", import.meta.url));

export default defineConfig({
  root: here,
  // Relative base so the static export works under GitHub Pages / Vercel / any subpath.
  base: "./",
  plugins: [react()],
  build: {
    outDir: `${repoRoot}dist-web`,
    emptyOutDir: true,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ["phaser"],
          react: ["react", "react-dom"],
          plot: ["@observablehq/plot"]
        }
      }
    }
  },
  server: {
    host: "127.0.0.1",
    port: 5177,
    // dev server needs to read src/engine + src/game which live above web/.
    fs: { allow: [repoRoot] }
  }
});
