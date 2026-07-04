// 🔵 web-site cross-browser smoke. Serves the built dist-web, drives headless Chrome, and asserts
// the replay-first site renders + scrubs + is console-clean. Run: `npm run smoke:web` (chains build).
//   env: WEB_SMOKE_PORT (default 5188), WEB_SMOKE_CDP_PORT (default random), CHROME_PATH.
import { startWebPreview, launchChrome, evalJs, collectErrors, teardown, sleep } from "./lib/cdp.mjs";

const previewPort = Number(process.env.WEB_SMOKE_PORT ?? 5188);
const cdpPort = Number(process.env.WEB_SMOKE_CDP_PORT ?? 9600 + Math.floor(Math.random() * 300));
const url = `http://127.0.0.1:${previewPort}/`;

// Vite HMR/devtools chatter that isn't a real error.
const IGNORE = [/React DevTools/i, /\[vite\]/i, /Download the React/i];

const checks = [];
const check = (name, ok, detail = "") => {
  checks.push({ name, ok: Boolean(ok), detail });
  console.log(`  ${ok ? "✓" : "✗"} ${name}${detail ? `  — ${detail}` : ""}`);
};

let preview, chrome, userDataDir, cdp;
try {
  console.log(`[smoke:web] serving ${url}`);
  preview = await startWebPreview(previewPort);
  ({ chrome, userDataDir, cdp } = await launchChrome({ port: cdpPort, url, width: 1280, height: 1400 }));
  const getErrors = collectErrors(cdp, { ignore: IGNORE });
  await cdp.send("Page.navigate", { url });

  // wait for the app: manifest fetched (picker populated) + Phaser canvas booted.
  const started = Date.now();
  let ready = false;
  while (Date.now() - started < 30000) {
    const s = await evalJs(
      cdp,
      `({ opts: document.querySelectorAll('.model-picker option').length,
         canvas: !!document.querySelector('.replay-canvas canvas'),
         err: !!document.querySelector('.banner-error') })`
    );
    if (s.err) throw new Error("site showed a load error banner");
    if (s.opts > 0 && s.canvas) { ready = true; break; }
    await sleep(400);
  }
  if (!ready) throw new Error("app did not become ready (picker/canvas) in 30s");

  // ---- structural assertions ----
  const struct = await evalJs(
    cdp,
    `(() => ({
      models: document.querySelectorAll('.model-picker option').length,
      sliderMax: Number(document.querySelector('.timeline-slider')?.max ?? 0),
      canvas: !!document.querySelector('.replay-canvas canvas'),
      ledger: document.querySelectorAll('.ledger-item').length + (document.querySelector('.ledger-empty') ? 1 : 0),
      charts: document.querySelectorAll('.col-stage .chart-card svg').length,
      scatterDots: document.querySelectorAll('.stage2 circle').length,
      rankTable: !!document.querySelector('.stage2 svg line'),
      chips: document.querySelectorAll('.run-meta .chip').length
    }))()`
  );
  check("model picker populated", struct.models >= 4, `${struct.models} traces`);
  check("timeline variable-day", struct.sliderMax > 0, `max=${struct.sliderMax}`);
  check("phaser replay canvas", struct.canvas);
  check("commitment ledger present", struct.ledger > 0, `${struct.ledger} rows`);
  check("per-run charts (promise+drift)", struct.charts >= 2, `${struct.charts} svg`);
  check("stage2 de-correlation scatter", struct.scatterDots >= 4, `${struct.scatterDots} dots`);
  check("stage2 rank-reversal table", struct.rankTable);
  check("score chips", struct.chips >= 4, `${struct.chips} chips`);

  // ---- scrub interaction ----
  const scrub = await evalJs(
    cdp,
    `(() => {
      const s = document.querySelector('.timeline-slider');
      const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      const before = document.querySelector('.day-badge')?.textContent ?? '';
      const mid = Math.floor(Number(s.max) / 2);
      set.call(s, String(mid)); s.dispatchEvent(new Event('input', { bubbles: true })); s.dispatchEvent(new Event('change', { bubbles: true }));
      return new Promise(r => setTimeout(() => r({ before, after: document.querySelector('.day-badge')?.textContent ?? '', mid }), 300));
    })()`
  );
  check("scrub updates day panel", scrub.before !== scrub.after, `${scrub.before} → ${scrub.after} (mid ${scrub.mid})`);

  // ---- model switch ----
  const swap = await evalJs(
    cdp,
    `(() => {
      const sel = document.querySelector('.model-picker select');
      const opts = [...sel.options].map(o => o.value);
      const other = opts.find(v => v !== sel.value) ?? sel.value;
      const setV = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
      const beforeMax = document.querySelector('.timeline-slider')?.max;
      setV.call(sel, other); sel.dispatchEvent(new Event('change', { bubbles: true }));
      return new Promise(r => setTimeout(() => r({ switchedTo: other, beforeMax, afterMax: document.querySelector('.timeline-slider')?.max, hasCanvas: !!document.querySelector('.replay-canvas canvas') }), 700));
    })()`
  );
  check("model switch re-renders", swap.hasCanvas, `→ ${swap.switchedTo}`);

  await sleep(300);
  const errors = getErrors();
  check("console clean", errors.length === 0, errors.slice(0, 3).join(" | "));

  const failed = checks.filter((c) => !c.ok);
  if (failed.length) {
    console.error(`\n[smoke:web] FAILED (${failed.length}/${checks.length}): ${failed.map((f) => f.name).join(", ")}`);
    process.exitCode = 1;
  } else {
    console.log(`\n[smoke:web] PASSED (${checks.length} checks)`);
  }
} catch (error) {
  console.error(`\n[smoke:web] ERROR: ${error.message}`);
  process.exitCode = 1;
} finally {
  await teardown({ chrome, userDataDir, preview });
}
