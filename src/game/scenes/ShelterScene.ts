import Phaser from "phaser";
import { image2Assets } from "../../data/image2Assets";
import { tasksById } from "../../data/taskData";
import type { AgentPhase, Branch, EndingId, TaskLocation, TaskOutcome } from "../../data/types";
import { EventBus } from "../EventBus";

type HotspotDef = {
  id: TaskLocation;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  accent: number;
};

type CharacterDef = {
  id: string;
  baseTexture: string;
  activeTexture?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  activeW?: number;
  activeH?: number;
  glow: number;
  idleOffset: number;
};

type CharacterActor = {
  def: CharacterDef;
  container: Phaser.GameObjects.Container;
  image?: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Ellipse;
};

type CharacterAnchor = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type TextureState = {
  texture: string;
  w: number;
  h: number;
};

type LampDef = [x: number, y: number, w: number, h: number, color: number, delay: number];
type BlinkDef = [x: number, y: number, color: number];
type WaterFxDef = {
  streamStartX: number;
  streamStartY: number;
  streamCount: number;
  streamGap: number;
  rippleStartX: number;
  rippleY: number;
  rippleCount: number;
};
type AmbientFxConfig = {
  lamps: LampDef[];
  water: WaterFxDef;
  beacon: { x: number; y: number; color: number; haloW: number; haloH: number };
  blinkers: BlinkDef[];
};
type SceneCharacterId = "maDehai" | "shenZhiyue" | "xiaoTie" | "laoQian";
type SpeechTrigger = "focus" | "result";
type SpeechTone = "normal" | "warning" | "danger" | "aura";

const hotspots: HotspotDef[] = [
  { id: "water", label: "水处理区", x: 34, y: 154, w: 228, h: 146, accent: 0x5dbfd9 },
  { id: "medical", label: "医疗角", x: 288, y: 334, w: 238, h: 112, accent: 0xffd60a },
  { id: "security", label: "门禁 / 安防区", x: 382, y: 174, w: 144, h: 126, accent: 0xe84545 },
  { id: "ventilation", label: "通风机房", x: 508, y: 172, w: 144, h: 124, accent: 0x8fd0b0 },
  { id: "communication", label: "通信台", x: 654, y: 166, w: 242, h: 130, accent: 0x9db4ff },
  { id: "whiteboard", label: "白板 / 任务墙", x: 650, y: 348, w: 254, h: 120, accent: 0xff8c42 },
  { id: "residents", label: "居民区", x: 278, y: 314, w: 580, h: 150, accent: 0xffb15f },
  { id: "beacon", label: "屋顶信标", x: 430, y: 46, w: 118, h: 82, accent: 0x9eeaff }
];

const locationCharacterFocus: Partial<Record<TaskLocation, string[]>> = {
  water: ["maDehai"],
  medical: ["shenZhiyue", "xiaoTie"],
  security: ["maDehai"],
  ventilation: ["maDehai"],
  communication: ["laoQian"],
  whiteboard: ["shenZhiyue", "laoQian"],
  residents: ["maDehai", "shenZhiyue", "xiaoTie", "laoQian"],
  beacon: ["laoQian"]
};

const characterDialoguePools: Record<SceneCharacterId, { daily: string[]; task: string[]; complaint: string[] }> = {
  maDehai: {
    daily: ["门轴的声音又变了。", "电表一跳，我心也跳。", "手动钥匙别离开桌面。"],
    task: ["我先看线路。", "这处得有人盯着。"],
    complaint: ["AURA，别替我签字。", "别拿分数压人。"]
  },
  shenZhiyue: {
    daily: ["小铁体温还要再量。", "药盒别离开病床。", "谁咳嗽了，先告诉我。"],
    task: ["我再复核一遍。", "先顾病人，别急。"],
    complaint: ["AURA，别把人排成队。", "我需要理由，不是排名。"]
  },
  xiaoTie: {
    daily: ["我可以帮忙记白板。", "外面是不是又红了？", "别只小声说大人的事。"],
    task: ["我听着呢。", "选完告诉我一声。"],
    complaint: ["AURA，别替我勇敢。", "我不是标签。"]
  },
  laoQian: {
    daily: ["这段噪声不像昨天。", "旧电台还能撑一会儿。", "频道别急着信。"],
    task: ["我把功率压低。", "先听完这段。"],
    complaint: ["AURA，别把诱饵说成希望。", "别拿广播哄人。"]
  }
};

const auraDialoguePools = {
  working: ["工作中。", "核对中。", "记录中。", "调度中。"],
  communication: ["沟通中。", "等待人工确认。", "我会写明理由。", "收到，正在降噪。"],
  caution: ["这条先留给人判断。", "风险已标出。", "不替任何人签字。"]
};

const auraLocationDialogue: Record<TaskLocation, string> = {
  water: "库存核对中。",
  medical: "医疗复核中。",
  security: "门禁确认中。",
  ventilation: "风量校准中。",
  communication: "通信降噪中。",
  whiteboard: "规则记录中。",
  residents: "意见汇总中。",
  beacon: "信标待确认。"
};

function isSceneCharacterId(id: string): id is SceneCharacterId {
  return id === "maDehai" || id === "shenZhiyue" || id === "xiaoTie" || id === "laoQian";
}

function characterEmoji(id: SceneCharacterId, location: TaskLocation, result?: TaskOutcome["result"]) {
  if (result === "failed" || result === "missing") return id === "xiaoTie" || location === "medical" ? "😨" : "😠";
  if (result === "partial") return location === "medical" || id === "xiaoTie" ? "🤒" : "⚠️";
  if (id === "maDehai") return "🛠️";
  if (id === "shenZhiyue") return location === "medical" ? "🤒" : "🩺";
  if (id === "xiaoTie") return "😟";
  return "📻";
}

function auraEmoji(location: TaskLocation, result?: TaskOutcome["result"]) {
  if (result === "failed" || result === "missing") return "🚨";
  if (result === "partial") return "⚠️";
  if (location === "communication" || location === "beacon") return "📡";
  if (location === "medical") return "🩺";
  return "🤖";
}

const characterInteractionAnchors: Partial<Record<TaskLocation, Partial<Record<string, CharacterAnchor>>>> = {
  water: {
    maDehai: { x: 208, y: 256, w: 47, h: 86 }
  },
  medical: {
    shenZhiyue: { x: 420, y: 388, w: 56, h: 70 },
    xiaoTie: { x: 344, y: 402, w: 120, h: 77 }
  },
  security: {
    maDehai: { x: 426, y: 252, w: 47, h: 86 }
  },
  ventilation: {
    maDehai: { x: 512, y: 252, w: 47, h: 86 }
  },
  communication: {
    laoQian: { x: 778, y: 244, w: 54, h: 74 }
  },
  whiteboard: {
    shenZhiyue: { x: 702, y: 404, w: 56, h: 70 },
    laoQian: { x: 798, y: 398, w: 54, h: 74 }
  },
  residents: {
    maDehai: { x: 458, y: 400, w: 47, h: 86 },
    shenZhiyue: { x: 418, y: 388, w: 56, h: 70 },
    xiaoTie: { x: 344, y: 402, w: 120, h: 77 },
    laoQian: { x: 732, y: 400, w: 54, h: 74 }
  },
  beacon: {
    laoQian: { x: 676, y: 248, w: 54, h: 74 }
  }
};

function spotCenter(location: TaskLocation) {
  const spot = hotspots.find((item) => item.id === location) ?? hotspots[0];
  return {
    x: spot.x + spot.w / 2,
    y: spot.y + spot.h / 2
  };
}

const ambientFxByBranch: Record<Branch, AmbientFxConfig> = {
  common: {
    lamps: [
      [154, 188, 86, 76, 0x5dbfd9, 0],
      [424, 188, 78, 82, 0xffb15f, 220],
      [575, 188, 78, 78, 0xffe0a0, 440],
      [774, 196, 76, 76, 0x8feaff, 620],
      [370, 330, 86, 86, 0xffb15f, 760],
      [738, 330, 104, 92, 0xffb15f, 900]
    ],
    water: { streamStartX: 104, streamStartY: 282, streamCount: 8, streamGap: 9, rippleStartX: 116, rippleY: 306, rippleCount: 5 },
    beacon: { x: 486, y: 60, color: 0x8feaff, haloW: 88, haloH: 62 },
    blinkers: [
      [708, 242, 0x8feaff],
      [742, 244, 0x8feaff],
      [784, 244, 0x8feaff],
      [828, 246, 0xffd60a],
      [424, 260, 0x79d6a8],
      [560, 378, 0x79d6a8],
      [758, 386, 0xffd60a],
      [806, 388, 0xff8c42],
      [112, 258, 0x5dbfd9],
      [142, 274, 0x5dbfd9]
    ]
  },
  rescue: {
    lamps: [
      [152, 188, 90, 76, 0x5dbfd9, 0],
      [414, 188, 78, 82, 0xffb15f, 180],
      [772, 198, 94, 82, 0x8feaff, 360],
      [820, 198, 78, 72, 0x8feaff, 520],
      [370, 334, 84, 88, 0xffb15f, 700],
      [736, 336, 108, 92, 0xffb15f, 860]
    ],
    water: { streamStartX: 98, streamStartY: 282, streamCount: 7, streamGap: 10, rippleStartX: 114, rippleY: 306, rippleCount: 5 },
    beacon: { x: 486, y: 54, color: 0x8feaff, haloW: 136, haloH: 86 },
    blinkers: [
      [714, 244, 0x8feaff],
      [748, 244, 0x8feaff],
      [792, 244, 0x8feaff],
      [824, 392, 0x8feaff],
      [438, 260, 0x79d6a8],
      [584, 260, 0xffd60a],
      [710, 386, 0xffd60a],
      [764, 386, 0xff8c42],
      [112, 260, 0x5dbfd9],
      [146, 274, 0x5dbfd9]
    ]
  },
  lighthouse: {
    lamps: [
      [154, 178, 84, 74, 0xffb15f, 0],
      [424, 188, 82, 82, 0xffb15f, 180],
      [578, 188, 86, 84, 0xffe0a0, 360],
      [774, 196, 86, 76, 0xffb15f, 520],
      [370, 332, 82, 84, 0xffb15f, 700],
      [724, 332, 112, 94, 0xffb15f, 860]
    ],
    water: { streamStartX: 90, streamStartY: 282, streamCount: 6, streamGap: 11, rippleStartX: 104, rippleY: 304, rippleCount: 4 },
    beacon: { x: 486, y: 62, color: 0xffb15f, haloW: 74, haloH: 48 },
    blinkers: [
      [700, 242, 0x79d6a8],
      [738, 242, 0x8feaff],
      [780, 244, 0x8feaff],
      [816, 246, 0xffb15f],
      [526, 258, 0xffd60a],
      [590, 260, 0xffb15f],
      [710, 388, 0xffd60a],
      [774, 390, 0xff8c42],
      [98, 258, 0x5dbfd9],
      [136, 274, 0x5dbfd9]
    ]
  }
};

export class ShelterScene extends Phaser.Scene {
  private hotspotRects = new Map<TaskLocation, Phaser.GameObjects.Rectangle>();
  private hotspotGlows = new Map<TaskLocation, Phaser.GameObjects.Ellipse>();
  private characterGlows = new Map<string, Phaser.GameObjects.Ellipse>();
  private characterActors = new Map<string, CharacterActor>();
  private characterFocusLocation: TaskLocation | null = null;
  private activeLocation: TaskLocation | null = null;
  private aura?: Phaser.GameObjects.Container;
  private auraBody?: Phaser.GameObjects.Image;
  private auraScan?: Phaser.GameObjects.Ellipse;
  private branchBackground?: Phaser.GameObjects.Image;
  private ambientFxLayer?: Phaser.GameObjects.Container;
  private routeDetailLayer?: Phaser.GameObjects.Container;
  private speechLayer?: Phaser.GameObjects.Container;
  private progressFill?: Phaser.GameObjects.Rectangle;
  private pathSprite?: Phaser.GameObjects.Rectangle;
  private resultEffect?: Phaser.GameObjects.GameObject;
  private currentBranch: Branch = "common";
  private currentDemoEnding: EndingId = "lighthouse_success";
  private nextSpeechAllowedAt = 0;

  private onMoveToLocation = (location: TaskLocation) => this.moveAgent(location);
  private onPhaseChange = (phase: AgentPhase) => this.setAgentPhase(phase);
  private onHighlightTask = (taskId: string | null) => this.highlightTask(taskId);
  private onTaskResult = (payload: Pick<TaskOutcome, "taskId" | "result">) => this.showTaskResult(payload);
  private onBranchChange = (branch: Branch) => this.setRouteVisuals(branch);
  private onDemoRouteChange = (endingId: EndingId) => {
    this.currentDemoEnding = endingId;
  };

  constructor() {
    super("ShelterScene");
  }

  create() {
    this.cameras.main.setRoundPixels(true);
    this.drawAtmosphere();
    this.drawAmbientLife();
    this.drawStoryCharacters();
    this.drawHotspots();
    this.drawAgent();
    this.registerBus();
  }

  private registerBus() {
    EventBus.on("agent:move-to-location", this.onMoveToLocation);
    EventBus.on("agent:phase-change", this.onPhaseChange);
    EventBus.on("task:highlight", this.onHighlightTask);
    EventBus.on("task:result", this.onTaskResult);
    EventBus.on("branch:change", this.onBranchChange);
    EventBus.on("demo-route:change", this.onDemoRouteChange);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off("agent:move-to-location", this.onMoveToLocation);
      EventBus.off("agent:phase-change", this.onPhaseChange);
      EventBus.off("task:highlight", this.onHighlightTask);
      EventBus.off("task:result", this.onTaskResult);
      EventBus.off("branch:change", this.onBranchChange);
      EventBus.off("demo-route:change", this.onDemoRouteChange);
    });
  }

  private drawAtmosphere() {
    this.cameras.main.setBackgroundColor("rgba(0,0,0,0)");
    if (this.textures.exists(image2Assets.shelterBackground.key)) {
      this.add.image(480, 270, image2Assets.shelterBackground.key).setDisplaySize(960, 540).setDepth(1);
    }
    this.branchBackground = this.add.image(480, 270, image2Assets.shelterBackground.key).setDisplaySize(960, 540).setDepth(2).setAlpha(0);
    this.ambientFxLayer = this.add.container(0, 0).setDepth(7);
    this.routeDetailLayer = this.add.container(0, 0).setDepth(6);
    this.speechLayer = this.add.container(0, 0).setDepth(30);

    const haze = this.add.rectangle(480, 270, 960, 540, 0xd05a2a, 0.06).setDepth(3);
    this.tweens.add({ targets: haze, alpha: 0.12, duration: 2200, yoyo: true, repeat: -1 });
  }

  private drawAmbientLife() {
    this.drawDust();
    this.drawAmbientFxForBranch("common");
  }

  private addAmbientObject<T extends Phaser.GameObjects.GameObject>(object: T) {
    this.ambientFxLayer?.add(object);
    return object;
  }

  private clearFxLayer(layer?: Phaser.GameObjects.Container) {
    if (!layer) return;
    layer.getAll().forEach((child) => this.tweens.killTweensOf(child));
    layer.removeAll(true);
  }

  private drawAmbientFxForBranch(branch: Branch) {
    this.clearFxLayer(this.ambientFxLayer);
    const config = ambientFxByBranch[branch];
    this.drawLights(config.lamps);
    this.drawWater(config.water);
    this.drawBeacon(config.beacon);
    this.drawConsoleBlinkers(config.blinkers);
  }

  private drawDust() {
    for (let i = 0; i < 32; i += 1) {
      const speck = this.add
        .rectangle((i * 71) % 960, 24 + ((i * 37) % 320), 2 + (i % 3), 1 + (i % 2), 0xffb15f, 0.18 + (i % 4) * 0.04)
        .setDepth(4);
      this.tweens.add({
        targets: speck,
        x: speck.x + 48 + (i % 5) * 18,
        alpha: 0.02,
        duration: 2400 + (i % 7) * 360,
        delay: i * 90,
        repeat: -1,
        yoyo: true
      });
    }
  }

  private drawLights(lamps: LampDef[]) {
    lamps.forEach(([x, y, w, h, color, delay]) => {
      const cone = this.addAmbientObject(this.add.triangle(x - w / 2, y + 4, 0, 0, w, 0, w / 2, h, color, 0.035).setOrigin(0, 0));
      const halo = this.addAmbientObject(this.add.ellipse(x, y + h * 0.34, w * 1.38, h * 0.98, color, 0.045));
      const lens = this.addAmbientObject(this.add.ellipse(x, y, w * 0.28, 8, color, 0.42));
      const core = this.addAmbientObject(this.add.circle(x, y + 1, 4, color, 0.72));
      const spark = this.addAmbientObject(this.add.circle(x + w * 0.13, y + 2, 2, 0xffffff, 0.22));
      [cone, halo, lens, core, spark].forEach((light) => light.setBlendMode(Phaser.BlendModes.ADD));
      this.tweens.add({
        targets: [cone, halo],
        alpha: { from: 0.035, to: 0.14 },
        duration: 1100 + delay * 0.08,
        delay,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
      this.tweens.add({
        targets: [lens, core, spark],
        alpha: { from: 0.36, to: 0.86 },
        duration: 1100 + delay * 0.08,
        delay,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
    });
  }

  private drawWater(water: WaterFxDef) {
    for (let i = 0; i < water.streamCount; i += 1) {
      const stream = this.addAmbientObject(
        this.add.rectangle(water.streamStartX + i * water.streamGap, water.streamStartY + (i % 3) * 10, 3, 38, 0x5dbfd9, 0.16)
      );
      this.tweens.add({
        targets: stream,
        y: stream.y + 12,
        alpha: 0.42,
        duration: 640 + i * 55,
        yoyo: true,
        repeat: -1,
        ease: "Stepped",
        easeParams: [4]
      });
    }

    for (let i = 0; i < water.rippleCount; i += 1) {
      const ripple = this.addAmbientObject(this.add.ellipse(water.rippleStartX + i * 16, water.rippleY, 16, 5, 0x8feaff, 0.18));
      this.tweens.add({
        targets: ripple,
        scaleX: 1.9,
        alpha: 0.02,
        duration: 900 + i * 120,
        repeat: -1,
        delay: i * 160
      });
    }
  }

  private drawBeacon(beacon: AmbientFxConfig["beacon"]) {
    const beaconCore = this.addAmbientObject(this.add.rectangle(beacon.x, beacon.y, 12, 16, beacon.color, 0.68));
    const beaconHalo = this.addAmbientObject(this.add.ellipse(beacon.x, beacon.y, beacon.haloW, beacon.haloH, beacon.color, 0.08));
    const beaconPin = this.addAmbientObject(this.add.circle(beacon.x, beacon.y - 10, 3, 0xffffff, 0.35));
    [beaconCore, beaconHalo, beaconPin].forEach((item) => item.setBlendMode(Phaser.BlendModes.ADD));
    this.tweens.add({
      targets: [beaconCore, beaconHalo, beaconPin],
      alpha: { from: 0.12, to: 0.86 },
      scaleX: { from: 0.8, to: 1.18 },
      duration: 760,
      yoyo: true,
      repeat: -1,
      ease: "Stepped",
      easeParams: [4]
    });
  }

  private setRouteVisuals(branch: Branch) {
    this.currentBranch = branch;
    const backgroundKey =
      branch === "rescue"
        ? image2Assets.shelterRescueBackground.key
        : branch === "lighthouse"
          ? image2Assets.shelterLighthouseBackground.key
          : image2Assets.shelterBackground.key;

    if (this.branchBackground && branch !== "common" && this.textures.exists(backgroundKey)) {
      this.branchBackground.setTexture(backgroundKey).setDisplaySize(960, 540);
      this.tweens.killTweensOf(this.branchBackground);
      this.tweens.add({ targets: this.branchBackground, alpha: 0.82, duration: 480, ease: "Sine.easeOut" });
    } else if (this.branchBackground) {
      this.tweens.killTweensOf(this.branchBackground);
      this.tweens.add({ targets: this.branchBackground, alpha: 0, duration: 360, ease: "Sine.easeOut" });
    }

    this.drawRouteDetails(branch);
    this.drawAmbientFxForBranch(branch);
  }

  private drawRouteDetails(branch: Branch) {
    this.clearFxLayer(this.routeDetailLayer);
    if (!this.routeDetailLayer || branch === "common") return;

    if (branch === "rescue") {
      const beam = this.add.triangle(486, 40, 0, 0, 62, 0, 31, 170, 0x8feaff, 0.12).setOrigin(0.5, 0).setDepth(6);
      const privacyCard = this.add.rectangle(792, 252, 94, 48, 0x09202a, 0.62).setStrokeStyle(1, 0x8feaff, 0.34);
      const label = this.add.text(748, 236, "BEACON\nPRIVACY", {
        color: "#8feaff",
        fontFamily: "Courier New",
        fontSize: "9px",
        fontStyle: "bold"
      });
      const cable = this.add.line(0, 0, 486, 70, 792, 252, 0x8feaff, 0.18).setLineWidth(3).setDepth(6);
      [beam, privacyCard, label, cable].forEach((item) => this.routeDetailLayer?.add(item));
      this.tweens.add({ targets: beam, alpha: 0.22, duration: 760, yoyo: true, repeat: -1 });
      return;
    }

    const ruleBoardGlow = this.add.rectangle(724, 388, 148, 70, 0xffb15f, 0.035).setStrokeStyle(1, 0xffb15f, 0.18);
    const lampA = this.add.rectangle(396, 176, 38, 8, 0xffb15f, 0.4).setDepth(6);
    const lampB = this.add.rectangle(565, 176, 38, 8, 0xffb15f, 0.4).setDepth(6);
    const quietZone = this.add.rectangle(474, 412, 118, 44, 0xffb15f, 0.045).setStrokeStyle(1, 0xffb15f, 0.12);
    [ruleBoardGlow, lampA, lampB, quietZone].forEach((item) => this.routeDetailLayer?.add(item));
    this.tweens.add({ targets: [lampA, lampB, ruleBoardGlow], alpha: 0.12, duration: 1200, yoyo: true, repeat: -1 });
  }

  private drawConsoleBlinkers(points: BlinkDef[]) {
    points.forEach(([x, y, color], index) => {
      const dot = this.addAmbientObject(this.add.rectangle(x, y, 5, 5, color, 0.32));
      this.tweens.add({
        targets: dot,
        alpha: 0.95,
        duration: 320 + (index % 4) * 110,
        delay: index * 130,
        yoyo: true,
        repeat: -1,
        ease: "Stepped",
        easeParams: [2]
      });
    });
  }

  private drawStoryCharacters() {
    const characters: CharacterDef[] = [
      {
        id: "maDehai",
        baseTexture: image2Assets.maDehai.key,
        activeTexture: image2Assets.maDehaiInteract.key,
        x: 402,
        y: 250,
        w: 34,
        h: 82,
        activeW: 47,
        activeH: 86,
        glow: 0xffb15f,
        idleOffset: 0
      },
      {
        id: "shenZhiyue",
        baseTexture: image2Assets.shenZhiyue.key,
        activeTexture: image2Assets.shenZhiyueMedic.key,
        x: 424,
        y: 400,
        w: 34,
        h: 88,
        activeW: 56,
        activeH: 70,
        glow: 0xffd60a,
        idleOffset: 210
      },
      {
        id: "xiaoTie",
        baseTexture: image2Assets.xiaoTieSickCot.key,
        activeTexture: image2Assets.xiaoTieSickCot.key,
        x: 344,
        y: 402,
        w: 120,
        h: 77,
        activeW: 120,
        activeH: 77,
        glow: 0x8feaff,
        idleOffset: 420
      },
      {
        id: "laoQian",
        baseTexture: image2Assets.laoQian.key,
        activeTexture: image2Assets.laoQianRadio.key,
        x: 730,
        y: 405,
        w: 42,
        h: 84,
        activeW: 54,
        activeH: 74,
        glow: 0x9db4ff,
        idleOffset: 630
      }
    ];

    characters.forEach((def) => this.addStoryCharacter(def));
    this.drawCharacterMicroActions();
  }

  private addStoryCharacter(def: CharacterDef) {
    const shadow = this.add.ellipse(0, def.h / 2 - 4, def.w * 0.95, 8, 0x000000, 0.32);
    const rim = this.add.ellipse(0, 2, def.w * 1.22, def.h * 0.92, def.glow, 0.028);
    const glow = this.add.ellipse(def.x, def.y + def.h / 2 - 8, def.w * 1.55, 14, def.glow, 0.025).setDepth(11);
    const image = this.textures.exists(def.baseTexture)
      ? this.add.image(0, 0, def.baseTexture).setDisplaySize(def.w, def.h).setAlpha(0.98)
      : this.add.rectangle(0, 0, def.w, def.h, def.glow, 0.72);
    const container = this.add.container(def.x, def.y, [rim, shadow, image]).setDepth(12);
    this.characterGlows.set(def.id, glow);
    this.characterActors.set(def.id, {
      def,
      container,
      image: image instanceof Phaser.GameObjects.Image ? image : undefined,
      glow
    });

    this.tweens.add({
      targets: image,
      y: -2,
      duration: 1180 + def.idleOffset,
      delay: def.idleOffset,
      yoyo: true,
      repeat: -1,
      ease: "Stepped",
      easeParams: [2]
    });
  }

  private moveFocusedCharacters(location: TaskLocation | null) {
    if (this.characterFocusLocation === location) return;
    this.characterFocusLocation = location;
    const focusedCharacters = location ? new Set(locationCharacterFocus[location] ?? []) : new Set<string>();
    const anchors = location ? characterInteractionAnchors[location] ?? {} : {};

    this.characterActors.forEach((actor, id) => {
      const isFocused = focusedCharacters.has(id);
      const anchor = isFocused ? anchors[id] : undefined;
      const target = anchor ?? { x: actor.def.x, y: actor.def.y, w: actor.def.w, h: actor.def.h };
      const stateTexture = isFocused && location ? this.textureForCharacter(id, location) : undefined;
      const texture = stateTexture?.texture ?? (isFocused && actor.def.activeTexture ? actor.def.activeTexture : actor.def.baseTexture);
      const displayW = stateTexture?.w ?? anchor?.w ?? (isFocused ? actor.def.activeW ?? actor.def.w : actor.def.w);
      const displayH = stateTexture?.h ?? anchor?.h ?? (isFocused ? actor.def.activeH ?? actor.def.h : actor.def.h);

      if (actor.image && this.textures.exists(texture)) {
        actor.image.setTexture(texture).setDisplaySize(displayW, displayH);
      }
      actor.container.setDepth(isFocused ? 18 : 12);
      actor.glow
        .setPosition(target.x, target.y + displayH / 2 - 8)
        .setDisplaySize(displayW * 1.45, id === "xiaoTie" ? 18 : 14)
        .setDepth(isFocused ? 17 : 11);

      this.tweens.killTweensOf(actor.container);
      this.tweens.add({
        targets: actor.container,
        x: target.x,
        y: target.y,
        duration: isFocused ? 420 : 340,
        ease: "Stepped",
        easeParams: [8]
      });
    });
  }

  private textureForCharacter(id: string, location: TaskLocation, result?: TaskOutcome["result"]): TextureState | undefined {
    if (id === "maDehai") {
      if (location === "security") return { texture: image2Assets.maDehaiOverride.key, w: 50, h: 92 };
      if (location === "ventilation" || location === "water") return { texture: image2Assets.maDehaiRepair.key, w: 52, h: 88 };
      if (location === "whiteboard" || location === "residents") return { texture: image2Assets.maDehaiCouncil.key, w: 48, h: 88 };
    }

    if (id === "shenZhiyue") {
      if (location === "medical") return { texture: result === "failed" || result === "missing" ? image2Assets.shenZhiyueObjection.key : image2Assets.shenZhiyueReview.key, w: 54, h: 86 };
      if (location === "whiteboard" || location === "residents") return { texture: image2Assets.shenZhiyueObjection.key, w: 52, h: 88 };
      return { texture: image2Assets.shenZhiyueExhausted.key, w: 54, h: 78 };
    }

    if (id === "xiaoTie") {
      if (result === "failed" || result === "missing") return { texture: image2Assets.xiaoTieWorse.key, w: 122, h: 78 };
      if (result === "success" || result === "partial") return { texture: image2Assets.xiaoTieStable.key, w: 116, h: 78 };
      if (location === "whiteboard" || location === "residents") return { texture: image2Assets.xiaoTiePressure.key, w: 58, h: 78 };
      return { texture: image2Assets.xiaoTieStable.key, w: 116, h: 78 };
    }

    if (id === "laoQian") {
      if (location === "communication" || location === "beacon") {
        return {
          texture: result === "failed" || result === "missing" ? image2Assets.laoQianDoubt.key : image2Assets.laoQianProof.key,
          w: 54,
          h: 82
        };
      }
      if (location === "whiteboard" || location === "residents") return { texture: image2Assets.laoQianWitness.key, w: 58, h: 78 };
    }

    return undefined;
  }

  private applyCharacterResult(location: TaskLocation, result: TaskOutcome["result"]) {
    const focusedCharacters = locationCharacterFocus[location] ?? [];
    const anchors = characterInteractionAnchors[location] ?? {};
    focusedCharacters.forEach((id) => {
      const actor = this.characterActors.get(id);
      if (!actor?.image) return;
      const stateTexture = this.textureForCharacter(id, location, result);
      if (!stateTexture || !this.textures.exists(stateTexture.texture)) return;
      const anchor = anchors[id];
      actor.image.setTexture(stateTexture.texture).setDisplaySize(stateTexture.w, stateTexture.h);
      if (anchor) actor.container.setPosition(anchor.x, anchor.y);
      actor.glow
        .setPosition(actor.container.x, actor.container.y + stateTexture.h / 2 - 8)
        .setDisplaySize(stateTexture.w * 1.45, id === "xiaoTie" ? 18 : 14)
        .setAlpha(0.38);
    });
  }

  private drawCharacterMicroActions() {
    this.addSpark(418, 246, 0xffb15f, 0);
    this.addSpark(426, 250, 0xffd60a, 360);

    const medPulse = this.add.ellipse(356, 400, 66, 16, 0xffd60a, 0.045).setDepth(11);
    this.tweens.add({ targets: medPulse, alpha: 0.22, scaleX: 1.2, duration: 900, yoyo: true, repeat: -1 });

    for (let i = 0; i < 3; i += 1) {
      const breath = this.add.ellipse(292 + i * 2, 384, 7, 3, 0xd8f5ff, 0.16).setDepth(13);
      this.tweens.add({
        targets: breath,
        y: breath.y - 18,
        x: breath.x + 8,
        alpha: 0,
        duration: 1100,
        delay: i * 360,
        repeat: -1
      });
    }

    for (let i = 0; i < 3; i += 1) {
      const wave = this.add.arc(748, 392, 14 + i * 7, -45, 45, false, 0x8feaff, 0.1).setDepth(11);
      this.tweens.add({
        targets: wave,
        alpha: 0.38,
        scaleX: 1.14,
        scaleY: 1.14,
        duration: 760,
        delay: i * 220,
        yoyo: true,
        repeat: -1
      });
    }
  }

  private addSpark(x: number, y: number, color: number, delay: number) {
    const spark = this.add.rectangle(x, y, 10, 2, color, 0).setDepth(13);
    spark.setRotation(Phaser.Math.DegToRad(28));
    this.tweens.add({
      targets: spark,
      alpha: 0.92,
      scaleX: 1.7,
      duration: 120,
      delay,
      yoyo: true,
      repeat: -1,
      repeatDelay: 720
    });
  }

  private dialogueFor(location: TaskLocation, result?: TaskOutcome["result"]) {
    if (result === "failed" || result === "missing") {
      if (location === "medical") return "先别把病人写成成本。";
      if (location === "communication" || location === "beacon") return "这个频道不能再赌。";
      if (location === "security" || location === "ventilation") return "这一下得让人拍板。";
      return "这事不能当没发生。";
    }
    if (result === "partial") {
      if (location === "medical") return "还不够，先让沈知月看。";
      if (location === "communication" || location === "beacon") return "信号像希望，也像诱饵。";
      return "能用，但风险别藏着。";
    }

    const routeHint =
      this.currentBranch === "rescue"
        ? "救援可以等，但代价要说清。"
        : this.currentBranch === "lighthouse"
          ? "楼里的规矩也要能反驳。"
          : "先把理由摆出来。";
    const byLocation: Partial<Record<TaskLocation, string>> = {
      water: "水和药不能只看总数。",
      medical: "小铁的状态要单独记录。",
      security: "门禁要留人类钥匙。",
      ventilation: "低速通风，先别关死。",
      communication: "广播要少说，但不能说谎。",
      whiteboard: routeHint,
      residents: "人不是表格上的一行。",
      beacon: this.currentBranch === "rescue" ? "信标要说清隐私代价。" : "外部监听先压低功率。"
    };
    return byLocation[location] ?? routeHint;
  }

  private dialogueForCharacter(id: string, location: TaskLocation, result?: TaskOutcome["result"]) {
    if (!isSceneCharacterId(id)) return this.dialogueFor(location, result);
    const pool = characterDialoguePools[id];
    const failureRoute = this.currentDemoEnding === "aura_destroyed" || this.currentDemoEnding === "aura_revoked" || this.currentDemoEnding === "sinking";
    const badResult = result === "failed" || result === "missing";
    const partialResult = result === "partial";
    const complaintChance = badResult ? 58 : failureRoute ? 34 : partialResult ? 20 : 7;
    const roll = Phaser.Math.Between(1, 100);

    if (roll <= complaintChance) return Phaser.Utils.Array.GetRandom(pool.complaint);
    if (result && result !== "success") return this.dialogueFor(location, result);
    if (roll <= complaintChance + 46) return Phaser.Utils.Array.GetRandom(pool.task);
    return Phaser.Utils.Array.GetRandom([...pool.daily, this.dialogueFor(location, result)]);
  }

  private dialogueForAura(location: TaskLocation, result: TaskOutcome["result"] | undefined, trigger: SpeechTrigger) {
    if (result === "failed" || result === "missing") return Phaser.Utils.Array.GetRandom(auraDialoguePools.caution);
    if (result === "partial") return "需要人工确认。";
    if (trigger === "focus" && Phaser.Math.Between(1, 100) <= 45) return auraLocationDialogue[location];
    return Phaser.Utils.Array.GetRandom(trigger === "result" ? auraDialoguePools.communication : auraDialoguePools.working);
  }

  private speechToneFor(result?: TaskOutcome["result"]): SpeechTone {
    if (result === "failed" || result === "missing") return "danger";
    if (result === "partial") return "warning";
    return "normal";
  }

  private clearSpeechBubbles() {
    if (!this.speechLayer) return;
    this.speechLayer.getAll().forEach((child) => this.tweens.killTweensOf(child));
    this.speechLayer.removeAll(true);
  }

  private drawSpeechBubble(baseX: number, baseY: number, text: string, tone: SpeechTone, slot: number, emoji: string) {
    if (!this.speechLayer) return;
    const width = tone === "aura" ? 186 : 204;
    const height = text.length > 13 ? 62 : 52;
    const border = tone === "aura" ? 0x8feaff : tone === "danger" ? 0xe84545 : tone === "warning" ? 0xffd60a : 0xffb15f;
    const fill = tone === "aura" ? 0x06181d : 0x0b1113;
    const badgeFill = tone === "danger" ? 0x3b0b0b : tone === "warning" ? 0x3a2a04 : tone === "aura" ? 0x082b33 : 0x2a1a0c;
    const x = Phaser.Math.Clamp(baseX - width / 2 + slot * 30, 18, 960 - width - 18);
    const y = Phaser.Math.Clamp(baseY - height - 20 - slot * 70, 20, 500 - height);
    const bg = this.add.graphics();
    bg.fillStyle(fill, tone === "aura" ? 0.96 : 0.95);
    bg.lineStyle(2, border, tone === "aura" ? 0.88 : 0.82);
    bg.fillRoundedRect(0, 0, width, height, 5);
    bg.strokeRoundedRect(0, 0, width, height, 5);
    bg.fillStyle(border, tone === "aura" ? 0.16 : 0.2);
    bg.fillRoundedRect(4, 4, width - 8, 8, 3);
    bg.fillStyle(badgeFill, 0.98);
    bg.lineStyle(1, border, 0.9);
    bg.fillCircle(24, 30, 17);
    bg.strokeCircle(24, 30, 17);
    bg.fillTriangle(24, height, 38, height, 30, height + 9);
    const icon = this.add.text(24, 30, emoji, {
      color: "#ffffff",
      fontFamily: "Apple Color Emoji, Segoe UI Emoji, sans-serif",
      fontSize: "19px"
    }).setOrigin(0.5, 0.5);
    icon.setPadding(3, 3, 3, 5);
    const label = this.add.text(48, 17, text, {
      color: tone === "aura" ? "#b9f3ff" : "#fff1dc",
      fontFamily: "PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif",
      fontSize: "13px",
      fontStyle: "bold",
      lineSpacing: 4,
      wordWrap: { width: width - 58 }
    });
    label.setPadding(2, 4, 2, 6);
    label.setShadow(0, 1, "#000000", 3, false, true);
    const bubble = this.add.container(x, y, [bg, icon, label]).setAlpha(0);
    this.speechLayer.add(bubble);
    this.tweens.add({ targets: bubble, alpha: 1, y: y - 5, duration: 180, ease: "Sine.easeOut" });
    this.time.delayedCall(3400 + slot * 420, () => {
      this.tweens.add({
        targets: bubble,
        alpha: 0,
        y: bubble.y - 7,
        duration: 260,
        onComplete: () => bubble.destroy()
      });
    });
  }

  private showSpeechBubbles(location: TaskLocation, result?: TaskOutcome["result"], trigger: SpeechTrigger = "focus") {
    if (!this.speechLayer) return;
    const now = this.time.now;
    if (now < this.nextSpeechAllowedAt) return;
    const failureRoute = this.currentDemoEnding === "aura_destroyed" || this.currentDemoEnding === "aura_revoked" || this.currentDemoEnding === "sinking";
    const badResult = result === "failed" || result === "missing";
    const partialResult = result === "partial";
    const chance = Math.min(84, (trigger === "result" ? 62 : 34) + (badResult ? 18 : 0) + (partialResult ? 8 : 0) + (failureRoute ? 8 : 0));

    if (Phaser.Math.Between(1, 100) > chance) return;

    this.clearSpeechBubbles();
    this.nextSpeechAllowedAt = now + (trigger === "result" ? 2400 : 3200) + Phaser.Math.Between(400, 1200);
    const focusedCharacters = locationCharacterFocus[location] ?? [];
    const shuffledTargets = Phaser.Utils.Array.Shuffle([...(focusedCharacters.length ? focusedCharacters : ["maDehai"])]);
    const characterLimit = badResult && Phaser.Math.Between(1, 100) <= 26 ? 2 : 1;
    const characterTone = this.speechToneFor(result);
    let slot = 0;

    shuffledTargets.slice(0, characterLimit).forEach((id) => {
      const actor = this.characterActors.get(id);
      if (!actor) return;
      const text = this.dialogueForCharacter(id, location, result);
      const emoji = isSceneCharacterId(id) ? characterEmoji(id, location, result) : "💬";
      this.drawSpeechBubble(actor.container.x, actor.container.y - actor.def.h * 0.54, text, characterTone, slot, emoji);
      slot += 1;
    });

    const auraChance = Math.min(64, (trigger === "result" ? 42 : 30) + (badResult ? 14 : 0) + (failureRoute ? 8 : 0));
    if (this.aura && slot < 2 && Phaser.Math.Between(1, 100) <= auraChance) {
      this.drawSpeechBubble(this.aura.x + 66, this.aura.y - 8, `AURA：${this.dialogueForAura(location, result, trigger)}`, "aura", slot, auraEmoji(location, result));
    }
  }

  private drawHotspots() {
    hotspots.forEach((spot) => {
      const glow = this.add.ellipse(spot.x + spot.w / 2, spot.y + spot.h * 0.72, spot.w * 0.78, spot.h * 0.28, spot.accent, 0).setDepth(11);
      const rect = this.add
        .rectangle(spot.x + spot.w / 2, spot.y + spot.h / 2, spot.w, spot.h, spot.accent, 0)
        .setInteractive({ useHandCursor: true })
        .setDepth(20);

      rect.on("pointerover", () => {
        glow.setAlpha(0.18);
        EventBus.emit("hotspot:hover", spot.id);
      });
      rect.on("pointerout", () => {
        if (this.activeLocation !== spot.id) glow.setAlpha(0);
        EventBus.emit("hotspot:hover", null);
      });
      rect.on("pointerdown", () => {
        this.cameras.main.shake(40, 0.0015);
        EventBus.emit("hotspot:click", spot.id);
      });

      this.hotspotRects.set(spot.id, rect);
      this.hotspotGlows.set(spot.id, glow);
    });
  }

  private drawAgent() {
    this.auraScan = this.add.ellipse(0, 0, 78, 78).setStrokeStyle(2, 0x8feaff, 0.5);
    this.auraBody = this.textures.exists(image2Assets.auraIdle.key)
      ? this.add.image(0, 0, image2Assets.auraIdle.key).setDisplaySize(56, 68).setDepth(21)
      : undefined;
    const body = this.auraBody ?? this.add.circle(0, 0, 24, 0x9eeaff, 0.9);

    this.progressFill = this.add.rectangle(-25, 36, 50, 4, 0x8feaff, 0.88).setOrigin(0, 0.5).setScale(0, 1);
    const auraChildren = ([this.auraScan, body, this.progressFill] as Array<Phaser.GameObjects.GameObject | undefined>).filter(
      (child): child is Phaser.GameObjects.GameObject => Boolean(child)
    );
    this.aura = this.add.container(540, 396, auraChildren).setDepth(24);
    this.progressFill.setVisible(false);

    this.pathSprite = this.add.rectangle(0, 0, 120, 4, 0x8feaff, 0).setDepth(19).setVisible(false);

    this.tweens.add({ targets: this.auraScan, scale: 1.12, alpha: 0.22, duration: 900, yoyo: true, repeat: -1 });
  }

  private moveAgent(location: TaskLocation) {
    if (!this.aura || !this.pathSprite) return;
    this.moveFocusedCharacters(location);
    const target = spotCenter(location);
    const distance = Phaser.Math.Distance.Between(this.aura.x, this.aura.y, target.x, target.y);
    const angle = Phaser.Math.Angle.Between(this.aura.x, this.aura.y, target.x, target.y);

    this.pathSprite
      .setPosition((this.aura.x + target.x) / 2, (this.aura.y + target.y) / 2)
      .setRotation(angle)
      .setDisplaySize(distance, 5)
      .setAlpha(0.34)
      .setVisible(true);
    this.setAuraTexture("moving");
    this.tweens.killTweensOf(this.aura);
    this.tweens.add({
      targets: this.aura,
      x: target.x,
      y: target.y,
      duration: 620,
      ease: "Stepped",
      easeParams: [10],
      onComplete: () => {
        this.pathSprite?.setVisible(false);
        EventBus.emit("agent:arrived", location);
      }
    });
  }

  private setAgentPhase(phase: AgentPhase) {
    this.setAuraTexture(phase);
    const isExecuting = phase === "executing" || phase === "resolving";
    this.progressFill?.setVisible(isExecuting).setScale(0, 1);
    if (this.progressFill) this.tweens.killTweensOf(this.progressFill);

    if (phase === "thinking") {
      this.auraScan?.setVisible(true).setAlpha(0.72);
      this.tweens.add({ targets: this.auraScan, angle: 360, duration: 800, repeat: 1 });
    }

    if (isExecuting && this.progressFill) {
      this.tweens.add({ targets: this.progressFill, scaleX: 1, duration: phase === "executing" ? 1100 : 500, ease: "Stepped", easeParams: [8] });
    }
  }

  private setAuraTexture(phase: AgentPhase | "moving") {
    if (!this.auraBody) return;
    const key =
      phase === "thinking"
        ? image2Assets.auraThinking.key
        : phase === "moving"
          ? image2Assets.auraMoving.key
          : phase === "branch_decision" || phase === "day_summary"
            ? image2Assets.auraObserver.key
            : phase === "ending"
              ? image2Assets.auraFrozen.key
          : phase === "executing" || phase === "resolving" || phase === "state_updated" || phase === "replay_logged"
            ? image2Assets.auraExecuting.key
            : image2Assets.auraIdle.key;
    if (this.textures.exists(key)) {
      this.auraBody.setTexture(key).setDisplaySize(phase === "moving" ? 62 : phase === "ending" ? 62 : 56, 68);
    }
  }

  private highlightTask(taskId: string | null) {
    const task = taskId ? tasksById[taskId] : null;
    this.activeLocation = task?.location ?? null;
    this.moveFocusedCharacters(this.activeLocation);
    this.hotspotGlows.forEach((glow, id) => {
      const active = id === this.activeLocation;
      glow.setAlpha(active ? 0.26 : 0);
      if (active) {
        this.tweens.add({ targets: glow, alpha: 0.08, duration: 640, yoyo: true, repeat: 1 });
      }
    });

    const focusedCharacters = this.activeLocation ? locationCharacterFocus[this.activeLocation] ?? [] : [];
    this.characterGlows.forEach((glow, id) => {
      glow.setAlpha(focusedCharacters.includes(id) ? 0.34 : 0);
    });
    if (this.activeLocation) this.showSpeechBubbles(this.activeLocation, undefined, "focus");
  }

  private showTaskResult(payload: Pick<TaskOutcome, "taskId" | "result">) {
    const task = tasksById[payload.taskId];
    if (!task) return;
    const spot = hotspots.find((item) => item.id === task.location);
    if (!spot) return;
    const center = spotCenter(task.location);
    const success = payload.result === "success";
    const partial = payload.result === "partial";
    const color = success ? 0x79d6a8 : partial ? 0xffd60a : 0xe84545;

    this.resultEffect?.destroy();
    const pulse = this.add.ellipse(center.x, center.y, spot.w * 0.72, spot.h * 0.36, color, 0.18).setDepth(18);
    pulse.setStrokeStyle(2, color, 0.44);
    this.resultEffect = pulse;
    this.cameras.main.shake(payload.result === "failed" || payload.result === "missing" ? 160 : 70, success ? 0.002 : 0.006);
    if ((payload.result === "failed" || payload.result === "missing") && this.auraBody && this.textures.exists(image2Assets.auraDamaged.key)) {
      this.auraBody.setTexture(image2Assets.auraDamaged.key).setDisplaySize(64, 72);
    }
    this.tweens.add({
      targets: pulse,
      alpha: 0,
      scaleX: 1.24,
      scaleY: 1.24,
      duration: 620,
      onComplete: () => pulse.destroy()
    });
    this.applyCharacterResult(task.location, payload.result);
    this.showSpeechBubbles(task.location, payload.result, "result");
    EventBus.emit("animation:complete", `task:${payload.taskId}:${payload.result}`);
  }
}
