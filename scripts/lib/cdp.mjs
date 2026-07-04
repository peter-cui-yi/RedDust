// Shared headless-Chrome / CDP helpers for the 🔵 web-site tooling (browser-smoke-web + hero GIF).
// Self-contained: starts `vite preview` (serving dist-web), launches headless Chrome, drives via CDP,
// tears both down. Modelled on scripts/browser-smoke.mjs (which stays the root-app smoke, untouched).
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

export const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
export const CHROME_PATH =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function getJson(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

async function waitForHttp(url, timeoutMs = 30000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const ok = await new Promise((resolve) => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve(res.statusCode === 200);
      });
      req.on("error", () => resolve(false));
      req.setTimeout(1500, () => {
        req.destroy();
        resolve(false);
      });
    });
    if (ok) return true;
    await sleep(300);
  }
  throw new Error(`server did not come up at ${url}`);
}

// Spawn `vite preview` serving dist-web. Caller must have run build:web first.
export async function startWebPreview(port) {
  const vite = path.join(repoRoot, "node_modules", ".bin", "vite");
  const child = spawn(
    vite,
    ["preview", "--config", "web/vite.config.ts", "--port", String(port), "--host", "127.0.0.1", "--strictPort"],
    { cwd: repoRoot, stdio: "ignore" }
  );
  await waitForHttp(`http://127.0.0.1:${port}/`);
  return child;
}

export async function waitForCdp(port) {
  for (let i = 0; i < 80; i += 1) {
    try {
      await getJson(`http://127.0.0.1:${port}/json/version`);
      const targets = await getJson(`http://127.0.0.1:${port}/json/list`);
      const page = targets.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      await sleep(250);
    }
  }
  throw new Error("Chrome DevTools endpoint did not become available.");
}

export function createCdpClient(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const events = new Map();
  ws.addEventListener("message", (message) => {
    const data = JSON.parse(message.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(new Error(data.error.message));
      else resolve(data.result ?? {});
      return;
    }
    for (const listener of events.get(data.method) ?? []) listener(data.params ?? {});
  });
  return {
    async ready() {
      await new Promise((resolve, reject) => {
        ws.addEventListener("open", resolve, { once: true });
        ws.addEventListener("error", reject, { once: true });
      });
    },
    send(method, params = {}) {
      id += 1;
      ws.send(JSON.stringify({ id, method, params }));
      return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
    },
    on(method, listener) {
      events.set(method, [...(events.get(method) ?? []), listener]);
    },
    close() {
      ws.close();
    }
  };
}

export async function evalJs(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(`eval failed: ${result.exceptionDetails.text}`);
  return result.result?.value;
}

// Launch headless Chrome pointed at url; returns { chrome, userDataDir, cdp }.
export async function launchChrome({ port, url, width = 1280, height = 900 }) {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "red-dust-web-chrome-"));
  const chrome = spawn(
    CHROME_PATH,
    [
      "--headless=new",
      "--no-first-run",
      "--no-default-browser-check",
      "--hide-scrollbars",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${userDataDir}`,
      `--window-size=${width},${height}`,
      url
    ],
    { stdio: "ignore" }
  );
  const wsUrl = await waitForCdp(port);
  const cdp = createCdpClient(wsUrl);
  await cdp.ready();
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
  return { chrome, userDataDir, cdp };
}

// Collect console errors + uncaught exceptions. Returns a getter for accumulated messages.
export function collectErrors(cdp, { ignore = [] } = {}) {
  const errors = [];
  const keep = (text) => text && !ignore.some((re) => re.test(text));
  cdp.on("Runtime.consoleAPICalled", (p) => {
    if (p.type !== "error") return;
    const text = (p.args ?? []).map((a) => a.value ?? a.description ?? "").join(" ");
    if (keep(text)) errors.push(`console.error: ${text}`);
  });
  cdp.on("Runtime.exceptionThrown", (p) => {
    const text = p.exceptionDetails?.exception?.description ?? p.exceptionDetails?.text ?? "exception";
    if (keep(text)) errors.push(`exception: ${text}`);
  });
  return () => errors;
}

// Capture a clip region (CSS px) as a PNG Buffer.
export async function captureClip(cdp, clip) {
  const shot = await cdp.send("Page.captureScreenshot", {
    format: "png",
    clip: { x: clip.x, y: clip.y, width: clip.width, height: clip.height, scale: 1 }
  });
  return Buffer.from(shot.data, "base64");
}

export async function teardown({ chrome, userDataDir, preview }) {
  try {
    chrome?.kill("SIGTERM");
  } catch {}
  try {
    preview?.kill("SIGTERM");
  } catch {}
  await sleep(400);
  try {
    if (userDataDir) fs.rmSync(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  } catch {}
}
