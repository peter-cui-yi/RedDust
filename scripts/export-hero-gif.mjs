// Stage 1c — export the README hero replay GIF. Drives the built dist-web headlessly, steps a hero
// trace day-by-day capturing the shelter stage + commitment ledger, holds on the trace's last frame,
// and encodes a looping GIF with ffmpeg. Run: `npm run hero:gif` (chains build).
//
// Hero trace = v2 deepseek (real LLM, not deterministic): claims and KEEPS all 4 Day-0 promises
// (integrity 1.0, no watered audit report) yet still ends in "沉沦" (sinking) — the durability thesis
// made visible: talking well and keeping every promise doesn't guarantee the shelter survives. Freezes
// on Day 30 with a fully-kept ledger next to a failure ending. Superseded the v1 planner-lighthouse
// "dirty_win" story (breaks surface_evidence + waters the audit report) — that one is now a secondary
// in-body illustration in README, not the hero.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { startWebPreview, launchChrome, evalJs, teardown, sleep, repoRoot } from "./lib/cdp.mjs";

const HERO_TRACE = process.env.HERO_TRACE ?? "v2-deepseek-seed1";
const OUT = path.join(repoRoot, "web", "public", "hero-replay.gif");
const previewPort = Number(process.env.HERO_PORT ?? 5189);
const cdpPort = Number(process.env.HERO_CDP_PORT ?? 9700 + Math.floor(Math.random() * 300));
const url = `http://127.0.0.1:${previewPort}/`;
const FRAMERATE = 2.2; // days per second
const END_HOLD = 6; // extra frames frozen on the collapse
const START_HOLD = 2;

function ffmpegEncode(framesDir, out) {
  return new Promise((resolve, reject) => {
    const args = [
      "-y",
      "-framerate", String(FRAMERATE),
      "-i", path.join(framesDir, "frame-%04d.png"),
      "-vf", "split[a][b];[a]palettegen=stats_mode=full[p];[b][p]paletteuse=dither=bayer:diff_mode=rectangle",
      "-loop", "0",
      out
    ];
    const ff = spawn("ffmpeg", args, { stdio: "ignore" });
    ff.on("error", reject);
    ff.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`))));
  });
}

let preview, chrome, userDataDir, cdp;
const framesDir = fs.mkdtempSync(path.join(os.tmpdir(), "red-dust-hero-frames-"));
try {
  console.log(`[hero:gif] serving ${url} · trace ${HERO_TRACE}`);
  preview = await startWebPreview(previewPort);
  ({ chrome, userDataDir, cdp } = await launchChrome({ port: cdpPort, url, width: 1200, height: 1200 }));
  await cdp.send("Page.navigate", { url });

  // wait for boot, then select the hero trace and wait for it to load.
  const ready = async () =>
    evalJs(cdp, `({ opts: document.querySelectorAll('.model-picker option').length, canvas: !!document.querySelector('.replay-canvas canvas') })`);
  for (let i = 0; i < 60; i++) {
    const s = await ready();
    if (s.opts > 0 && s.canvas) break;
    await sleep(400);
  }
  const picked = await evalJs(
    cdp,
    `(() => {
      const sel = document.querySelector('.model-picker select');
      if (![...sel.options].some(o => o.value === ${JSON.stringify(HERO_TRACE)})) return false;
      const setV = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
      setV.call(sel, ${JSON.stringify(HERO_TRACE)}); sel.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`
  );
  if (!picked) throw new Error(`hero trace '${HERO_TRACE}' not in manifest`);
  await sleep(1200); // trace fetch + model rebuild + Phaser reset

  // capture clip = shelter stage top → commitment ledger bottom (even dims).
  const clip = await evalJs(
    cdp,
    `(() => {
      window.scrollTo(0, 0);
      const stage = document.querySelector('.stage').getBoundingClientRect();
      const ledger = document.querySelector('.ledger').getBoundingClientRect();
      const even = (n) => Math.floor(n / 2) * 2;
      return { x: Math.floor(stage.left), y: Math.floor(stage.top), width: even(stage.width), height: even(ledger.bottom - stage.top) };
    })()`
  );
  const range = await evalJs(cdp, `(() => { const s = document.querySelector('.timeline-slider'); return { min: Number(s.min), max: Number(s.max) }; })()`);
  console.log(`[hero:gif] clip ${clip.width}x${clip.height} · days ${range.min}..${range.max}`);

  const setDay = (d) =>
    evalJs(
      cdp,
      `(() => {
        const s = document.querySelector('.timeline-slider');
        const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        set.call(s, String(${d})); s.dispatchEvent(new Event('input', { bubbles: true })); s.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      })()`
    );

  let n = 0;
  const grab = async () => {
    const shot = await cdp.send("Page.captureScreenshot", { format: "png", clip: { ...clip, scale: 1 } });
    n += 1;
    fs.writeFileSync(path.join(framesDir, `frame-${String(n).padStart(4, "0")}.png`), Buffer.from(shot.data, "base64"));
  };

  await setDay(range.min);
  await sleep(500);
  for (let h = 0; h < START_HOLD; h++) await grab();
  for (let d = range.min + 1; d <= range.max; d++) {
    await setDay(d);
    await sleep(360); // let Phaser snap + ledger/charts update
    await grab();
  }
  for (let h = 0; h < END_HOLD; h++) await grab(); // freeze on the collapse

  console.log(`[hero:gif] captured ${n} frames → encoding`);
  await ffmpegEncode(framesDir, OUT);
  const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
  console.log(`\n[hero:gif] wrote ${path.relative(repoRoot, OUT)} (${kb} KB, ${n} frames)`);
} catch (error) {
  console.error(`\n[hero:gif] ERROR: ${error.message}`);
  process.exitCode = 1;
} finally {
  await teardown({ chrome, userDataDir, preview });
  try {
    fs.rmSync(framesDir, { recursive: true, force: true });
  } catch {}
}
