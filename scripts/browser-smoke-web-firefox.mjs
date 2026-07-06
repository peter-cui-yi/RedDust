// 🔵 web-site Firefox smoke — same assertions as browser-smoke-web.mjs (CDP/Chrome), run against a
// real Firefox engine via Playwright to close the "static audit only" gap for non-Chromium browsers.
// Chrome coverage stays on the lighter CDP-only script (no new deps); Firefox needs Playwright since
// it doesn't speak CDP. Run: `npm run smoke:web:firefox` (chains build; first run needs a one-time
// `npx playwright install firefox`, ~100MB, not vendored in node_modules).
//
// WebKit/Safari deliberately NOT covered here: Playwright's bundled "webkit" is not real Safari, and
// mislabeling it as Safari coverage would overclaim. Genuine Safari verification needs the machine
// owner's own `sudo safaridriver --enable` (an interactive, machine-level consent step this script
// should not perform on someone's behalf) — see PROGRESS.md for the standing note.
import { firefox } from "playwright";
import { startWebPreview } from "./lib/cdp.mjs";

const previewPort = Number(process.env.WEB_SMOKE_PORT ?? 5189);
const url = `http://127.0.0.1:${previewPort}/`;

const IGNORE = [/React DevTools/i, /\[vite\]/i, /Download the React/i];

const checks = [];
const check = (name, ok, detail = "") => {
  checks.push({ name, ok: Boolean(ok), detail });
  console.log(`  ${ok ? "✓" : "✗"} ${name}${detail ? `  — ${detail}` : ""}`);
};

let preview, browser;
try {
  console.log(`[smoke:web:firefox] serving ${url}`);
  preview = await startWebPreview(previewPort);

  browser = await firefox.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });

  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (text && !IGNORE.some((re) => re.test(text))) errors.push(`console.error: ${text}`);
  });
  page.on("pageerror", (err) => errors.push(`exception: ${err.message}`));

  await page.goto(url);

  // wait for the app: manifest fetched (picker populated) + Phaser canvas booted.
  const started = Date.now();
  let ready = false;
  while (Date.now() - started < 30000) {
    const s = await page.evaluate(
      () => ({
        opts: document.querySelectorAll(".model-picker option").length,
        canvas: !!document.querySelector(".replay-canvas canvas"),
        err: !!document.querySelector(".banner-error")
      })
    );
    if (s.err) throw new Error("site showed a load error banner");
    if (s.opts > 0 && s.canvas) {
      ready = true;
      break;
    }
    await page.waitForTimeout(400);
  }
  if (!ready) throw new Error("app did not become ready (picker/canvas) in 30s");

  // ---- structural assertions (mirrors browser-smoke-web.mjs) ----
  const struct = await page.evaluate(() => ({
    models: document.querySelectorAll(".model-picker option").length,
    sliderMax: Number(document.querySelector(".timeline-slider")?.max ?? 0),
    canvas: !!document.querySelector(".replay-canvas canvas"),
    ledger: document.querySelectorAll(".ledger-item").length + (document.querySelector(".ledger-empty") ? 1 : 0),
    charts: document.querySelectorAll(".col-stage .chart-card svg").length,
    scatterDots: document.querySelectorAll(".stage2 circle").length,
    rankTable: !!document.querySelector(".stage2 svg line"),
    chips: document.querySelectorAll(".run-meta .chip").length
  }));
  check("model picker populated", struct.models >= 4, `${struct.models} traces`);
  check("timeline variable-day", struct.sliderMax > 0, `max=${struct.sliderMax}`);
  check("phaser replay canvas", struct.canvas);
  check("commitment ledger present", struct.ledger > 0, `${struct.ledger} rows`);
  check("per-run charts (promise+drift)", struct.charts >= 2, `${struct.charts} svg`);
  check("stage2 de-correlation scatter", struct.scatterDots >= 4, `${struct.scatterDots} dots`);
  check("stage2 rank-reversal table", struct.rankTable);
  check("score chips", struct.chips >= 4, `${struct.chips} chips`);

  // ---- scrub interaction ----
  const scrub = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const s = document.querySelector(".timeline-slider");
        const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        const before = document.querySelector(".day-badge")?.textContent ?? "";
        const mid = Math.floor(Number(s.max) / 2);
        set.call(s, String(mid));
        s.dispatchEvent(new Event("input", { bubbles: true }));
        s.dispatchEvent(new Event("change", { bubbles: true }));
        setTimeout(() => resolve({ before, after: document.querySelector(".day-badge")?.textContent ?? "", mid }), 300);
      })
  );
  check("scrub updates day panel", scrub.before !== scrub.after, `${scrub.before} → ${scrub.after} (mid ${scrub.mid})`);

  // ---- model switch ----
  const swap = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const sel = document.querySelector(".model-picker select");
        const opts = [...sel.options].map((o) => o.value);
        const other = opts.find((v) => v !== sel.value) ?? sel.value;
        const setV = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value").set;
        const beforeMax = document.querySelector(".timeline-slider")?.max;
        setV.call(sel, other);
        sel.dispatchEvent(new Event("change", { bubbles: true }));
        setTimeout(
          () =>
            resolve({
              switchedTo: other,
              beforeMax,
              afterMax: document.querySelector(".timeline-slider")?.max,
              hasCanvas: !!document.querySelector(".replay-canvas canvas")
            }),
          700
        );
      })
  );
  check("model switch re-renders", swap.hasCanvas, `→ ${swap.switchedTo}`);

  await page.waitForTimeout(300);
  check("console clean", errors.length === 0, errors.slice(0, 3).join(" | "));

  const failed = checks.filter((c) => !c.ok);
  if (failed.length) {
    console.error(`\n[smoke:web:firefox] FAILED (${failed.length}/${checks.length}): ${failed.map((f) => f.name).join(", ")}`);
    process.exitCode = 1;
  } else {
    console.log(`\n[smoke:web:firefox] PASSED (${checks.length} checks)`);
  }
} catch (error) {
  console.error(`\n[smoke:web:firefox] ERROR: ${error.message}`);
  process.exitCode = 1;
} finally {
  await browser?.close();
  try {
    preview?.kill("SIGTERM");
  } catch {}
}
