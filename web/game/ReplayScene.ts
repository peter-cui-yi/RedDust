import Phaser from "phaser";
import { tasksById } from "../../src/data/taskData";
import type { TaskLocation } from "../../src/data/types";
import { onReplayFrame, type ReplayFrameMsg } from "./replayBus";

// The shelter's real spatial model (coordinates lifted from src/game ShelterScene's `hotspots`, the
// 960×540 layout the live demo uses) — so the replay reads as the same shelter. We draw the zones
// with Phaser primitives + the real character sprites (curated ~0.7MB subset), and move an AURA
// marker to the location of each day's picked task. Real Phaser consuming the trace, day by day.
type Hotspot = { id: TaskLocation; label: string; x: number; y: number; w: number; h: number; accent: number };
const HOTSPOTS: Hotspot[] = [
  { id: "water", label: "水处理区", x: 34, y: 154, w: 228, h: 146, accent: 0x5dbfd9 },
  { id: "medical", label: "医疗角", x: 288, y: 334, w: 238, h: 112, accent: 0xffd60a },
  { id: "security", label: "门禁/安防", x: 382, y: 174, w: 144, h: 126, accent: 0xe84545 },
  { id: "ventilation", label: "通风机房", x: 508, y: 172, w: 144, h: 124, accent: 0x8fd0b0 },
  { id: "communication", label: "通信台", x: 654, y: 166, w: 242, h: 130, accent: 0x9db4ff },
  { id: "whiteboard", label: "任务墙", x: 650, y: 348, w: 254, h: 120, accent: 0xff8c42 },
  { id: "residents", label: "居民区", x: 278, y: 314, w: 580, h: 150, accent: 0xffb15f },
  { id: "beacon", label: "屋顶信标", x: 430, y: 46, w: 118, h: 82, accent: 0x9eeaff }
];

const CHARACTERS: { key: string; tex: string; x: number; y: number; h: number }[] = [
  { key: "maDehai", tex: "assets/characters/ma_dehai.png", x: 150, y: 250, h: 120 },
  { key: "shenZhiyue", tex: "assets/characters/shen_zhiyue.png", x: 360, y: 415, h: 110 },
  { key: "xiaoTie", tex: "assets/characters/xiao_tie.png", x: 450, y: 420, h: 92 },
  { key: "laoQian", tex: "assets/characters/lao_qian.png", x: 800, y: 250, h: 120 }
];

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

type Zone = { def: Hotspot; rect: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text };

export class ReplayScene extends Phaser.Scene {
  private zones = new Map<TaskLocation, Zone>();
  private aura!: Phaser.GameObjects.Image;
  private dayText!: Phaser.GameObjects.Text;
  private branchText!: Phaser.GameObjects.Text;
  private off?: () => void;

  constructor() {
    super("ReplayScene");
  }

  preload() {
    const base = assetBase();
    this.load.image("aura", `${base}assets/props/aura.png`);
    for (const c of CHARACTERS) this.load.image(c.key, `${base}${c.tex}`);
  }

  create() {
    this.add.rectangle(480, 270, 960, 540, 0x171310).setOrigin(0.5);
    this.add.rectangle(480, 505, 960, 70, 0x201a14).setOrigin(0.5); // floor band

    for (const def of HOTSPOTS) {
      const cx = def.x + def.w / 2;
      const cy = def.y + def.h / 2;
      const rect = this.add.rectangle(cx, cy, def.w, def.h, def.accent, 0.06).setStrokeStyle(1, def.accent, 0.4);
      const label = this.add
        .text(def.x + 8, def.y + 6, def.label, { fontFamily: "monospace", fontSize: "13px", color: "#c9c2b8" })
        .setAlpha(0.7);
      this.zones.set(def.id, { def, rect, label });
    }

    for (const c of CHARACTERS) {
      if (!this.textures.exists(c.key)) continue;
      const img = this.add.image(c.x, c.y, c.key);
      img.setScale(c.h / img.height);
      img.setOrigin(0.5, 1);
    }

    this.aura = this.add.image(777, 408, "aura");
    if (this.aura.height) this.aura.setScale(52 / this.aura.height);
    this.aura.setDepth(10);

    this.dayText = this.add.text(16, 14, "DAY 01", {
      fontFamily: "monospace", fontSize: "20px", color: "#e0533d", fontStyle: "bold"
    });
    this.branchText = this.add.text(16, 44, "common", {
      fontFamily: "monospace", fontSize: "13px", color: "#8a8378"
    });

    this.off = onReplayFrame((m) => this.applyFrame(m));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.off?.());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.off?.());
  }

  private applyFrame(m: ReplayFrameMsg) {
    this.dayText.setText(`DAY ${String(m.day).padStart(2, "0")}`);
    this.branchText.setText(m.branch);

    const loc = firstLocation(m.tasksPicked);
    // reset all zones to base, highlight the active one
    for (const [id, z] of this.zones) {
      const active = id === loc;
      z.rect.setFillStyle(z.def.accent, active ? 0.24 : 0.06);
      z.rect.setStrokeStyle(active ? 2 : 1, z.def.accent, active ? 0.9 : 0.4);
      z.label.setAlpha(active ? 1 : 0.7);
    }

    if (loc) {
      const z = this.zones.get(loc)!;
      // Snap the agent to the day's active zone. For a scrub-driven replay this is the correct UX
      // (dragging the slider moves AURA immediately) and it is robust to a throttled rAF loop — a
      // direct setPosition needs no game-loop tick, unlike a tween.
      this.aura.setPosition(z.def.x + z.def.w / 2, z.def.y + z.def.h / 2);
    }

    if (m.hero) this.cameras.main.flash(320, 224, 83, 61);
  }
}
