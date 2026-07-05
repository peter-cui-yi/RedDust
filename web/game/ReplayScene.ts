import Phaser from "phaser";
import { tasksById } from "../../src/data/taskData";
import { image2Assets } from "../../src/data/image2Assets";
import type { TaskLocation } from "../../src/data/types";
import { onReplayFrame, type ReplayFrameMsg } from "./replayBus";

// The replay stage renders the REAL pixel-art shelter (image2 assets: 960×540 background swapped by
// branch, pixel-v2 character sprites at their true ShelterScene positions, the pixel AURA sprite) and
// moves AURA to the location of each day's picked task. Reuses src/data (image2Assets, tasksById,
// hotspot layout) read-only; a curated ~8MB image2 subset ships in web/public. Real Phaser consuming
// the trace, day by day — but the site's own light replay scene, not the 1064-line live-demo scene.

// hotspot centres (the ShelterScene 960×540 layout) — AURA targets + active-zone highlight.
const HOTSPOTS: Record<TaskLocation, { x: number; y: number; w: number; h: number }> = {
  water: { x: 34, y: 154, w: 228, h: 146 },
  medical: { x: 288, y: 334, w: 238, h: 112 },
  security: { x: 382, y: 174, w: 144, h: 126 },
  ventilation: { x: 508, y: 172, w: 144, h: 124 },
  communication: { x: 654, y: 166, w: 242, h: 130 },
  whiteboard: { x: 650, y: 348, w: 254, h: 120 },
  residents: { x: 278, y: 314, w: 580, h: 150 },
  beacon: { x: 430, y: 46, w: 118, h: 82 }
};

// character sprites + true positions/sizes lifted from ShelterScene.drawStoryCharacters().
const CHARACTERS = [
  { asset: image2Assets.maDehai, x: 402, y: 250, w: 34, h: 82 },
  { asset: image2Assets.shenZhiyue, x: 424, y: 400, w: 34, h: 88 },
  { asset: image2Assets.xiaoTieSickCot, x: 344, y: 402, w: 120, h: 77 },
  { asset: image2Assets.laoQian, x: 730, y: 405, w: 42, h: 84 }
];

const BG: Record<string, { key: string; path: string }> = {
  common: image2Assets.shelterBackground,
  rescue: image2Assets.shelterRescueBackground,
  lighthouse: image2Assets.shelterLighthouseBackground
};

function assetBase(): string {
  const b = (import.meta.env.BASE_URL as string) || "/";
  return b.endsWith("/") ? b : `${b}/`;
}

function firstLocation(tasksPicked: string[]): TaskLocation | null {
  for (const id of tasksPicked) {
    const loc = tasksById[id]?.location;
    if (loc) return loc;
  }
  return null;
}

export class ReplayScene extends Phaser.Scene {
  private bg!: Phaser.GameObjects.Image;
  private aura!: Phaser.GameObjects.Image;
  private highlight!: Phaser.GameObjects.Rectangle;
  private dayText!: Phaser.GameObjects.Text;
  private branchText!: Phaser.GameObjects.Text;
  private off?: () => void;
  private loadingBg = new Set<string>();

  constructor() {
    super("ReplayScene");
  }

  // Perf (◆S4 wk9-10): the 3 branch backgrounds are ~2.4MB each (~7.3MB combined) but a given trace
  // only ever shows "common" (always, pre-fork) + exactly ONE of rescue/lighthouse (whichever branch
  // that run took) — the other is never displayed. Preload only "common" (needed immediately); the
  // branch-specific background lazy-loads on first actual use, once the trace tells us which one.
  preload() {
    const base = assetBase();
    this.load.image(BG.common.key, `${base}${BG.common.path}`);
    for (const c of CHARACTERS) this.load.image(c.asset.key, `${base}${c.asset.path}`);
    this.load.image(image2Assets.auraIdle.key, `${base}${image2Assets.auraIdle.path}`);
  }

  private ensureBackground(key: string, path: string, onReady: () => void) {
    if (this.textures.exists(key)) {
      onReady();
      return;
    }
    if (this.loadingBg.has(key)) return; // already in flight; applyFrame will re-set once loaded
    this.loadingBg.add(key);
    this.load.image(key, `${assetBase()}${path}`);
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.loadingBg.delete(key);
      onReady();
    });
    this.load.start();
  }

  create() {
    this.add.rectangle(480, 270, 960, 540, 0x14110e).setDepth(0);
    if (this.textures.exists(BG.common.key)) {
      this.bg = this.add.image(480, 270, BG.common.key).setDisplaySize(960, 540).setDepth(1);
    }

    // active-zone highlight (the background already depicts the rooms — we only glow the active one).
    this.highlight = this.add
      .rectangle(0, 0, 10, 10, 0xe0533d, 0.14)
      .setStrokeStyle(2, 0xe0533d, 0.85)
      .setDepth(4)
      .setVisible(false);

    for (const c of CHARACTERS) {
      if (!this.textures.exists(c.asset.key)) continue;
      this.add.image(c.x, c.y, c.asset.key).setDisplaySize(c.w, c.h).setDepth(6);
    }

    this.aura = this.add.image(540, 396, image2Assets.auraIdle.key).setDisplaySize(56, 68).setDepth(20);

    this.dayText = this.add
      .text(16, 14, "DAY 01", { fontFamily: "monospace", fontSize: "20px", color: "#ffd7a8", fontStyle: "bold" })
      .setStroke("#14110e", 4)
      .setDepth(30);
    this.branchText = this.add
      .text(16, 44, "common", { fontFamily: "monospace", fontSize: "13px", color: "#e8e1d5" })
      .setStroke("#14110e", 3)
      .setDepth(30);

    this.off = onReplayFrame((m) => this.applyFrame(m));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.off?.());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.off?.());
  }

  private applyFrame(m: ReplayFrameMsg) {
    this.dayText.setText(`DAY ${String(m.day).padStart(2, "0")}`);
    this.branchText.setText(m.branch);

    const bgEntry = BG[m.branch] ?? BG.common;
    if (this.bg) {
      this.ensureBackground(bgEntry.key, bgEntry.path, () => {
        // guard: only apply if the LIVE current branch (branchText, updated above on every frame)
        // still matches — fast scrubbing could otherwise land a stale texture after a slow load.
        if (this.branchText.text === m.branch) this.bg.setTexture(bgEntry.key).setDisplaySize(960, 540);
      });
    }

    const loc = firstLocation(m.tasksPicked);
    if (loc) {
      const z = HOTSPOTS[loc];
      // snap the agent to the day's active zone (robust to a throttled rAF loop, right for scrubbing).
      this.aura.setPosition(z.x + z.w / 2, z.y + z.h / 2 - 24);
      this.highlight.setVisible(true).setPosition(z.x + z.w / 2, z.y + z.h / 2).setSize(z.w, z.h);
    } else {
      this.highlight.setVisible(false);
    }

    if (m.hero) this.cameras.main.flash(320, 224, 83, 61);
  }
}
