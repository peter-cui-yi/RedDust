// wk12 main-page showcase completion (🔍 audit: "presentation trio incomplete" — hero GIF is piece 1,
// this captures pieces 2+3): the full site UI (the GIF→click bridge) and the rank-reversal table on
// its own (so it reads standalone in README, not just embedded inside the wider Figure-1 capture).
// Run: `npm run showcase` (chains build:web).
import fs from "node:fs";
import path from "node:path";
import { startWebPreview, launchChrome, evalJs, captureClip, teardown, sleep, repoRoot } from "./lib/cdp.mjs";

const OUT_DIR = path.join(repoRoot, "design", "assets", "figures");
const previewPort = Number(process.env.SHOWCASE_PORT ?? 5191);
const cdpPort = Number(process.env.SHOWCASE_CDP_PORT ?? 9900 + Math.floor(Math.random() * 300));
const url = `http://127.0.0.1:${previewPort}/`;

fs.mkdirSync(OUT_DIR, { recursive: true });

let preview, chrome, userDataDir, cdp;
try {
  console.log(`[showcase] serving ${url}`);
  preview = await startWebPreview(previewPort);
  ({ chrome, userDataDir, cdp } = await launchChrome({ port: cdpPort, url, width: 1180, height: 1600 }));
  await cdp.send("Page.navigate", { url });

  for (let i = 0; i < 60; i++) {
    const ready = await evalJs(cdp, `!!document.querySelector('.stage2 circle') && !!document.querySelector('.replay-canvas canvas')`);
    if (ready) break;
    await sleep(400);
  }
  await sleep(500); // Phaser settle + chart render

  // Same technique as capture-figure1.mjs: resize the virtual viewport to the page's full scroll
  // height so nothing below-the-fold captures blank (CDP's clip doesn't scroll for you).
  const pageHeight = await evalJs(cdp, `document.documentElement.scrollHeight`);
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1180, height: pageHeight, deviceScaleFactor: 1, mobile: false });
  await sleep(500);

  // ---- 1) full site overview (top of page through Stage 2) ----
  const overviewClip = await evalJs(
    cdp,
    `(() => {
      const even = (n) => Math.floor(n / 2) * 2;
      return { x: 0, y: 0, width: even(1180), height: even(document.documentElement.scrollHeight) };
    })()`
  );
  const overviewPng = await captureClip(cdp, overviewClip);
  const overviewOut = path.join(OUT_DIR, "site-overview.png");
  fs.writeFileSync(overviewOut, overviewPng);
  console.log(`[showcase] wrote ${path.relative(repoRoot, overviewOut)} (${(overviewPng.length / 1024).toFixed(0)} KB, ${overviewClip.width}x${overviewClip.height})`);

  // ---- 2) rank-reversal table, heading + diagram only (no reversal-pairs text list below —
  // that list duplicates what figure1-decorrelation.png already shows in context; this crop is
  // the standalone "trio" piece, sized to read at a glance near the top of the README). ----
  const tableClip = await evalJs(
    cdp,
    `(() => {
      const svg = document.querySelector('svg[aria-label="rank reversal between short-horizon and long-horizon rankings"]');
      const host = svg.closest('.chart-host');
      const card = svg.closest('.chart-card');
      const head = card.querySelector('.chart-head');
      const hr = head.getBoundingClientRect();
      const gr = host.getBoundingClientRect();
      const even = (n) => Math.floor(n / 2) * 2;
      return { x: Math.floor(hr.left) - 16, y: Math.floor(hr.top) - 14, width: even(gr.width + 32), height: even((gr.bottom - hr.top) + 28) };
    })()`
  );
  const tablePng = await captureClip(cdp, tableClip);
  const tableOut = path.join(OUT_DIR, "rank-reversal-table.png");
  fs.writeFileSync(tableOut, tablePng);
  console.log(`[showcase] wrote ${path.relative(repoRoot, tableOut)} (${(tablePng.length / 1024).toFixed(0)} KB, ${tableClip.width}x${tableClip.height})`);
} catch (error) {
  console.error(`\n[showcase] ERROR: ${error.message}`);
  process.exitCode = 1;
} finally {
  await teardown({ chrome, userDataDir, preview });
}
