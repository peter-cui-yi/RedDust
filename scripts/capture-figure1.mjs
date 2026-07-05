// Archives the Stage 2 "Figure-1" region (de-correlation scatter + rank-reversal table) as a PNG for
// README/paper use. Run: `npm run figure1` (chains build:web). Re-run whenever the authoritative
// decorrelation dataset refreshes (npm run sync:decorrelation) to keep the archived figure current.
import fs from "node:fs";
import path from "node:path";
import { startWebPreview, launchChrome, evalJs, captureClip, teardown, sleep, repoRoot } from "./lib/cdp.mjs";

const OUT = path.join(repoRoot, "design", "assets", "figures", "figure1-decorrelation.png");
const previewPort = Number(process.env.FIGURE1_PORT ?? 5190);
const cdpPort = Number(process.env.FIGURE1_CDP_PORT ?? 9800 + Math.floor(Math.random() * 300));
const url = `http://127.0.0.1:${previewPort}/`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });

let preview, chrome, userDataDir, cdp;
try {
  console.log(`[figure1] serving ${url}`);
  preview = await startWebPreview(previewPort);
  ({ chrome, userDataDir, cdp } = await launchChrome({ port: cdpPort, url, width: 1180, height: 1600 }));
  await cdp.send("Page.navigate", { url });

  for (let i = 0; i < 60; i++) {
    const ready = await evalJs(cdp, `!!document.querySelector('.stage2 circle') && !!document.querySelector('.stage2 svg line')`);
    if (ready) break;
    await sleep(400);
  }
  await sleep(300);

  // The full page (replay panel + Stage 2) is taller than any fixed viewport we'd guess — a clip
  // region below the fold of a SHORTER viewport captures as blank/white (CDP does not scroll for
  // you; Page.captureScreenshot's clip is relative to the current viewport, not page). Resize the
  // virtual viewport to the page's full scroll height so `.stage2` is captured in a single,
  // never-scrolled frame — robust to future content growth, no scroll-timing races.
  const pageHeight = await evalJs(cdp, `document.documentElement.scrollHeight`);
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1180, height: pageHeight, deviceScaleFactor: 1, mobile: false });
  await sleep(500); // let the resize reflow settle before measuring

  const clip = await evalJs(
    cdp,
    `(() => {
      const region = document.querySelector('.stage2');
      const r = region.getBoundingClientRect();
      const even = (n) => Math.floor(n / 2) * 2;
      return { x: Math.floor(r.left), y: Math.floor(r.top), width: even(r.width), height: even(r.height) };
    })()`
  );
  await sleep(300);
  const png = await captureClip(cdp, clip);
  fs.writeFileSync(OUT, png);
  console.log(`\n[figure1] wrote ${path.relative(repoRoot, OUT)} (${(png.length / 1024).toFixed(0)} KB, ${clip.width}x${clip.height})`);
} catch (error) {
  console.error(`\n[figure1] ERROR: ${error.message}`);
  process.exitCode = 1;
} finally {
  await teardown({ chrome, userDataDir, preview });
}
