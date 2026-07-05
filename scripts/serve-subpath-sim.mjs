// Simulates GitHub Pages' project-site hosting pattern (https://user.github.io/RedDust/ — one path
// segment of nesting, NOT root) by serving dist-web/ under a /RedDust/ prefix. Vite's `base: "./"`
// (web/vite.config.ts) makes every asset reference relative, so this is the exact scenario that
// proves (or breaks) "deployable to any subpath" — a plain `vite preview` at root does NOT exercise
// this. Run: `npm run deploy:check` (chains build:web), then open http://127.0.0.1:PORT/RedDust/.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const distDir = path.join(repoRoot, "dist-web");
const prefix = process.env.SIM_PREFIX ?? "/RedDust/";
const port = Number(process.env.SIM_PORT ?? 5199);

if (!fs.existsSync(distDir)) {
  console.error(`dist-web/ not found — run \`npm run build:web\` first.`);
  process.exit(1);
}

const MIME = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".png": "image/png", ".gif": "image/gif",
  ".svg": "image/svg+xml", ".woff2": "font/woff2"
};

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  if (!url.startsWith(prefix)) {
    res.writeHead(404).end(`Not found (this server only serves under ${prefix})`);
    return;
  }
  let rel = url.slice(prefix.length) || "index.html";
  if (rel.endsWith("/")) rel += "index.html";
  const filePath = path.join(distDir, rel);
  if (!filePath.startsWith(distDir)) {
    res.writeHead(403).end("forbidden");
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404).end(`404: ${rel}`);
      return;
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] ?? "application/octet-stream" });
    res.end(data);
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`[deploy:check] serving dist-web/ under http://127.0.0.1:${port}${prefix}`);
  console.log(`[deploy:check] this simulates GitHub Pages project-site hosting (base:'./' subpath test)`);
});
