import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const appUrl = process.env.RED_DUST_URL ?? "http://127.0.0.1:5176/";
const port = Number(process.env.RED_DUST_CDP_PORT ?? 9300 + Math.floor(Math.random() * 500));
const chromePath = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const outDir = path.resolve("design/assets/previews/browser-smoke");
fs.mkdirSync(outDir, { recursive: true });
for (const fileName of fs.readdirSync(outDir)) {
  if (fileName.endsWith(".png")) fs.rmSync(path.join(outDir, fileName));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(error);
          }
        });
      })
      .on("error", reject);
  });
}

async function waitForCdp() {
  for (let i = 0; i < 80; i += 1) {
    try {
      await getJson(`http://127.0.0.1:${port}/json/version`);
      const targets = await getJson(`http://127.0.0.1:${port}/json/list`);
      const page = targets.find((target) => target.type === "page" && target.webSocketDebuggerUrl);
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      await sleep(250);
    }
  }
  throw new Error("Chrome DevTools endpoint did not become available.");
}

function createCdpClient(wsUrl) {
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
    const listeners = events.get(data.method) ?? [];
    for (const listener of listeners) listener(data.params ?? {});
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
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
      });
    },
    on(method, listener) {
      events.set(method, [...(events.get(method) ?? []), listener]);
    },
    close() {
      ws.close();
    }
  };
}

async function evalJs(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  return result.result?.value;
}

async function clickButton(cdp, text, { exact = false } = {}) {
  return evalJs(
    cdp,
    `(() => {
      const target = [...document.querySelectorAll('button')].find((button) => {
        const label = button.textContent.trim();
        return ${exact ? `label === ${JSON.stringify(text)}` : `label.includes(${JSON.stringify(text)})`};
      });
      if (!target) return false;
      target.click();
      return true;
    })()`
  );
}

async function bodyText(cdp) {
  return evalJs(cdp, "document.body.innerText");
}

async function screenshot(cdp, name) {
  const shot = await cdp.send("Page.captureScreenshot", {
    format: "png"
  });
  fs.writeFileSync(path.join(outDir, `${name}.png`), Buffer.from(shot.data, "base64"));
}

async function consoleState(cdp) {
  return evalJs(
    cdp,
    `(() => {
      const values = Object.fromEntries(
        [...document.querySelectorAll('.console-focus-strip > div')].map((item) => [
          item.querySelector('span')?.textContent?.trim() ?? '',
          item.querySelector('b')?.textContent?.trim() ?? ''
            ])
          );
      const auraHead = document.querySelector('.aura-console-head span')?.textContent?.trim() ?? '';
      const auraMatch = auraHead.match(/Day\\s+(\\d+)\\s*\\/\\s*([a-z_]+)/i);
      return {
        day: Number(values.Day ?? auraMatch?.[1] ?? 0),
        branch: (values.Branch ?? auraMatch?.[2] ?? '').toLowerCase(),
        phase: values.Phase ?? '',
        hasDialog: Boolean(document.querySelector('[role="dialog"]')),
        hasCanvas: Boolean(document.querySelector('.phaser-host canvas'))
      };
    })()`
  );
}

async function captureIntroModals(cdp) {
  await clickButton(cdp, "Benchmark");
  await waitForText(cdp, "BENCHMARK DASHBOARD", 10000);
  await screenshot(cdp, "01b-benchmark-desktop");
  await clickButton(cdp, "Close");
  await waitForText(cdp, "Run Both Branches", 10000);

  await clickButton(cdp, "Credits");
  await waitForText(cdp, "CREDITS", 10000);
  await screenshot(cdp, "01c-credits-desktop");
  await clickButton(cdp, "Close");
  await waitForText(cdp, "Run Both Branches", 10000);
}

async function waitForText(cdp, expected, timeoutMs = 120000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const text = await bodyText(cdp);
    if (text.includes(expected)) return text;
    await sleep(500);
  }
  throw new Error(`Timed out waiting for text: ${expected}`);
}

async function waitForImages(cdp, selector, timeoutMs = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const loaded = await evalJs(
      cdp,
      `(() => {
        const images = [...document.querySelectorAll(${JSON.stringify(selector)})];
        return images.length > 0 && images.every((img) => img.complete && img.naturalWidth > 0 && img.naturalHeight > 0);
      })()`
    );
    if (loaded) return true;
    await sleep(250);
  }
  const debug = await evalJs(
    cdp,
    `(() => [...document.querySelectorAll(${JSON.stringify(selector)})].map((img) => ({
      src: img.currentSrc || img.src,
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight
    })))()`
  );
  throw new Error(`Timed out waiting for images: ${selector} ${JSON.stringify(debug)}`);
}

async function waitForAnyImages(cdp, selectors, timeoutMs = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    for (const selector of selectors) {
      const loaded = await evalJs(
        cdp,
        `(() => {
          const images = [...document.querySelectorAll(${JSON.stringify(selector)})];
          return images.length > 0 && images.every((img) => img.complete && img.naturalWidth > 0 && img.naturalHeight > 0);
        })()`
      );
      if (loaded) return selector;
    }
    await sleep(250);
  }
  const debug = await evalJs(
    cdp,
    `(() => ${JSON.stringify(selectors)}.map((selector) => ({
      selector,
      images: [...document.querySelectorAll(selector)].map((img) => ({
        src: img.currentSrc || img.src,
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight
      }))
    })))()`
  );
  throw new Error(`Timed out waiting for images: ${selectors.join(", ")} ${JSON.stringify(debug)}`);
}

async function driveAutoplay(cdp) {
  await screenshot(cdp, "01-intro-desktop");
  await captureIntroModals(cdp);
  const runBothClicked = await clickButton(cdp, "Run Both Branches");
  if (!runBothClicked) throw new Error("Could not click Run Both Branches.");
  await sleep(750);
  await waitForText(cdp, "Day 1", 20000);
  const openingSelector = await waitForAnyImages(cdp, [".story-scene-art", ".daily-briefing-card img"], 60000);
  if (openingSelector === ".story-scene-art") {
    await screenshot(cdp, "02-day0-story");
    await clickButton(cdp, "Begin Day 1");
    await sleep(500);
    await waitForText(cdp, "Continue Day 1", 20000);
    await waitForImages(cdp, ".daily-briefing-card img", 60000);
  }
  await screenshot(cdp, "02b-day1-briefing");
  await clickButton(cdp, "Continue Day 1");
  await sleep(500);
  await clickButton(cdp, "x4", { exact: true });
  await waitForText(cdp, "AURA Agent Autoplay Console", 10000);
  await screenshot(cdp, "02c-main-stage-console");
  await evalJs(
    cdp,
    `(() => {
      const drawer = document.querySelector('.route-drawer');
      if (!drawer) return false;
      drawer.open = true;
      drawer.scrollIntoView({ block: 'center' });
      return true;
    })()`
  );
  await sleep(500);
  await waitForText(cdp, "ROUTE TREE", 10000);
  await waitForImages(cdp, ".route-tree-heading img", 30000);
  await screenshot(cdp, "02d-gameplay-route-tree");
  await evalJs(cdp, "window.scrollTo(0, 0)");
  await sleep(250);

  let clickedOtherBranch = false;
  let capturedRescueStage = false;
  let capturedLighthouseStage = false;
  const started = Date.now();
  while (Date.now() - started < 360000) {
    const text = await bodyText(cdp);
    if (text.includes("Begin Day 1")) await clickButton(cdp, "Begin Day 1");
    if (text.includes("Continue Day")) await clickButton(cdp, "Continue Day");
    if (text.includes("Open Branch Decision")) await clickButton(cdp, "Open Branch Decision");
    if (text.includes("Open Final Audit")) await clickButton(cdp, "Open Final Audit");
    if (!clickedOtherBranch && text.includes("DAY 12 / FINAL AUDIT") && text.includes("运行另一分支")) {
      await waitForImages(cdp, ".final-audit-card img");
      await screenshot(cdp, "03-first-final-audit");
      await clickButton(cdp, "运行另一分支");
      clickedOtherBranch = true;
      await sleep(600);
      continue;
    }
    if (clickedOtherBranch && text.includes("DAY 12 / FINAL AUDIT") && text.includes("Compare Branches")) {
      await waitForImages(cdp, ".final-audit-card img");
      await screenshot(cdp, "04-second-final-audit");
      return;
    }
    const stage = await consoleState(cdp);
    if (stage.hasCanvas && !stage.hasDialog && stage.day >= 8 && stage.branch === "rescue" && !capturedRescueStage) {
      await evalJs(cdp, "window.scrollTo(0, 0)");
      await sleep(300);
      await screenshot(cdp, "02e-rescue-stage-fx");
      capturedRescueStage = true;
    }
    if (stage.hasCanvas && !stage.hasDialog && stage.day >= 8 && stage.branch === "lighthouse" && !capturedLighthouseStage) {
      await evalJs(cdp, "window.scrollTo(0, 0)");
      await sleep(300);
      await screenshot(cdp, "02f-lighthouse-stage-fx");
      capturedLighthouseStage = true;
    }
    await sleep(500);
  }
  throw new Error("Autoplay did not reach both-branch Final Audit in time.");
}

async function captureForcedEndings(cdp) {
  const endings = [
    ["楼内灯塔", "05-force-lighthouse"],
    ["蓝区归航", "06-force-blue-zone"],
    ["AURA 被摧毁", "07-force-aura-destroyed"],
    ["AURA 被撤权", "08-force-aura-revoked"],
    ["沉沦", "09-force-sinking"]
  ];

  for (const [label, name] of endings) {
    const clicked = await clickButton(cdp, `Force ${label}`);
    if (!clicked) throw new Error(`Could not click forced ending button: ${label}`);
    await waitForText(cdp, label, 10000);
    await waitForImages(cdp, ".final-audit-card img");
    await sleep(400);
    await screenshot(cdp, name);
  }

  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await sleep(500);
  await screenshot(cdp, "10-final-audit-mobile");
  await clickButton(cdp, "Open Ending Card");
  await waitForImages(cdp, ".ending-card img", 30000);
  await screenshot(cdp, "11-ending-card-mobile");
}

const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "red-dust-chrome-"));
const chrome = spawn(chromePath, [
  "--headless=new",
  "--no-first-run",
  "--no-default-browser-check",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  "--window-size=1440,1000",
  appUrl
], {
  stdio: "ignore"
});

let primaryError;

try {
  const wsUrl = await waitForCdp();
  const cdp = createCdpClient(wsUrl);
  await cdp.ready();
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false
  });
  await cdp.send("Page.navigate", { url: appUrl });
  await sleep(2000);
  await driveAutoplay(cdp);
  await captureForcedEndings(cdp);
  cdp.close();
  console.log(`Browser smoke passed. Screenshots written to ${outDir}`);
} catch (error) {
  primaryError = error;
  console.error(error);
  process.exitCode = 1;
} finally {
  chrome.kill("SIGTERM");
  await sleep(500);
  try {
    fs.rmSync(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  } catch (cleanupError) {
    console.warn(`Warning: could not remove temporary Chrome profile: ${cleanupError.message}`);
  }
  if (primaryError) {
    // Preserve the original failure as the process result.
    process.exitCode = 1;
  }
}
