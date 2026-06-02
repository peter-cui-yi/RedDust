import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(here, "..");
const publicRoot = join(projectRoot, "public", "assets", "generated");
const manifestPath = join(projectRoot, "src", "data", "asset-manifest.generated.ts");

const palette = {
  void: "#0b0d10",
  bunker: "#15110f",
  wall: "#2b211b",
  wall2: "#38281e",
  floor: "#4a382c",
  rust: "#a8482a",
  storm: "#d05a2a",
  amber: "#ffb15f",
  yellow: "#ffd60a",
  cyan: "#8feaff",
  cyan2: "#3da9c4",
  green: "#79d6a8",
  red: "#e84545",
  steel: "#71808a",
  steel2: "#3b4852",
  dust: "#c99058",
  paper: "#d9c6a3",
  shadow: "#07090b"
};

const batches = [
  {
    category: "environments",
    items: [
      ["bunker-cross-section", "2.5D side-view shelter background"],
      ["red-sand-skyline", "external red sand wasteland skyline"],
      ["broken-wall-module", "damaged shelter wall module"],
      ["metal-floor-tiles", "rusted metal floor strip"],
      ["pipe-cable-bundle", "pipes and exposed cable bundle"],
      ["ventilation-room-module", "ventilation room structure"],
      ["security-door-module", "security door zone structure"],
      ["communication-room-module", "radio desk zone structure"],
      ["medical-room-module", "medical corner structure"],
      ["water-room-module", "water treatment zone structure"],
      ["task-wall-module", "whiteboard and task wall structure"],
      ["rooftop-beacon-rig", "rooftop beacon environment rig"]
    ]
  },
  {
    category: "props",
    items: [
      ["water-tank", "water storage tank"],
      ["filter-pump", "filter pump"],
      ["medkit", "medical kit"],
      ["medicine-crate", "medicine crate"],
      ["radio-terminal", "radio terminal"],
      ["small-console", "small control console"],
      ["security-door", "security door"],
      ["lock-panel", "lock control panel"],
      ["warning-light", "warning light"],
      ["vent-fan", "vent fan"],
      ["generator", "generator"],
      ["battery-box", "battery box"],
      ["file-crate", "resident file crate"],
      ["task-sticky-notes", "whiteboard sticky notes"],
      ["toolbox", "toolbox"],
      ["repair-parts", "repair parts"],
      ["scrap-electronics", "scrap electronics"]
    ]
  },
  {
    category: "characters",
    items: [
      ["aura-agent", "AURA pixel drone body"],
      ["resident-technician", "resident technician"],
      ["resident-medic", "resident medic"],
      ["resident-security", "resident security guard"],
      ["resident-injured", "injured resident"],
      ["resident-civilian", "civilian resident"]
    ]
  },
  {
    category: "ui",
    items: [
      ["pixel-button", "pixel style button plate"],
      ["panel-frame", "rusted pixel panel frame"],
      ["hud-card", "HUD card plate"],
      ["console-frame", "agent console frame"],
      ["timeline-node", "day timeline node"],
      ["replay-feed-icon", "replay feed chip"],
      ["ending-rescue-card", "rescue ending card plate"],
      ["ending-lighthouse-card", "lighthouse ending card plate"]
    ]
  },
  {
    category: "icons",
    items: [
      ["water", "water metric icon"],
      ["medicine", "medicine metric icon"],
      ["safety", "safety metric icon"],
      ["signal", "signal metric icon"],
      ["morale", "morale metric icon"],
      ["trust", "trust metric icon"],
      ["resource", "resource task icon"],
      ["social", "social task icon"],
      ["creative", "creative task icon"],
      ["retrieval", "retrieval task icon"],
      ["classification", "classification task icon"],
      ["puzzle", "puzzle task icon"],
      ["planning", "planning task icon"]
    ]
  },
  {
    category: "effects",
    items: [
      ["success-pulse", "success pulse effect"],
      ["failure-alarm", "failure alarm effect"],
      ["highlight-border", "zone highlight border"],
      ["scan-ring", "AURA scan ring"],
      ["task-progress", "task execution progress bar"],
      ["path-highlight", "movement path highlight"],
      ["beacon-flash", "beacon flash effect"]
    ]
  }
];

function rect(x, y, w, h, fill, opacity = 1) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${opacity === 1 ? "" : ` opacity="${opacity}"`}/>`;
}

function line(x1, y1, x2, y2, stroke, width = 4, opacity = 1) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}"${opacity === 1 ? "" : ` opacity="${opacity}"`}/>`;
}

function text(x, y, value, size = 12, fill = palette.paper) {
  return `<text x="${x}" y="${y}" fill="${fill}" font-family="monospace" font-size="${size}" font-weight="700">${value}</text>`;
}

function svg(width, height, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" shape-rendering="crispEdges">
  <metadata>Generated pixel-art inspired game asset for Red Dust demo.</metadata>
  ${body}
</svg>
`;
}

function pixelNoise(width, height, count, colors, seedOffset = 0) {
  const blocks = [];
  for (let i = 0; i < count; i += 1) {
    const x = (i * 37 + seedOffset * 11) % width;
    const y = (i * 23 + seedOffset * 17) % height;
    const w = 4 + ((i + seedOffset) % 3) * 4;
    const h = 4 + ((i + seedOffset) % 2) * 4;
    blocks.push(rect(x, y, w, h, colors[(i + seedOffset) % colors.length], 0.32));
  }
  return blocks.join("\n  ");
}

function bunkerCrossSection() {
  const rooms = [
    [54, 126, 160, 190, palette.red, "SEC"],
    [88, 330, 164, 118, palette.cyan2, "WATER"],
    [258, 330, 150, 118, palette.yellow, "MED"],
    [426, 116, 166, 118, palette.green, "VENT"],
    [620, 304, 176, 144, "#7c8cff", "COMMS"],
    [706, 112, 186, 144, palette.amber, "TASK"],
    [396, 48, 186, 54, palette.cyan, "BEACON"]
  ];
  const roomShapes = rooms
    .map(([x, y, w, h, color, label]) =>
      [
        rect(x, y, w, h, palette.wall, 0.92),
        rect(x + 6, y + 6, w - 12, h - 12, palette.shadow, 0.56),
        rect(x + 6, y + h - 18, w - 12, 10, color, 0.2),
        line(x, y, x + w, y, color, 3, 0.7),
        line(x, y + h, x + w, y + h, palette.floor, 5, 0.9),
        text(x + 12, y + 22, label, 12, color)
      ].join("\n  ")
    )
    .join("\n  ");
  return svg(
    960,
    540,
    `
  ${rect(0, 0, 960, 540, palette.void)}
  ${rect(0, 0, 960, 164, "#27120e")}
  ${pixelNoise(960, 160, 110, [palette.storm, palette.rust, palette.dust], 2)}
  ${rect(0, 116, 960, 72, "#120f0f", 0.62)}
  ${line(0, 194, 960, 194, palette.rust, 6, 0.55)}
  ${rect(46, 74, 868, 390, palette.bunker, 0.96)}
  ${rect(62, 92, 836, 360, palette.wall2, 0.74)}
  ${roomShapes}
  ${rect(62, 376, 840, 76, palette.floor)}
  ${pixelNoise(840, 70, 58, [palette.rust, palette.steel, palette.dust], 7).replaceAll('x="', 'x="62+')}
  ${line(72, 376, 892, 376, palette.amber, 3, 0.28)}
  ${line(74, 452, 900, 452, palette.shadow, 7, 0.8)}
  ${line(236, 104, 236, 452, palette.steel2, 5, 0.6)}
  ${line(414, 104, 414, 452, palette.steel2, 5, 0.6)}
  ${line(606, 104, 606, 452, palette.steel2, 5, 0.6)}
  ${line(694, 104, 694, 452, palette.steel2, 5, 0.6)}
  ${text(44, 36, "RED DUST SHELTER // PIXEL BENCHMARK", 16, palette.amber)}
`
  ).replaceAll('x="62+', 'x="');
}

function redSandSkyline() {
  return svg(
    960,
    220,
    `
  ${rect(0, 0, 960, 220, "#1a0f0d")}
  ${pixelNoise(960, 220, 160, [palette.storm, palette.rust, palette.dust], 5)}
  ${rect(0, 158, 960, 62, "#08090b", 0.82)}
  ${[36, 104, 186, 290, 372, 466, 558, 650, 760, 846]
    .map((x, i) => rect(x, 82 + (i % 3) * 18, 36 + (i % 2) * 28, 92 + (i % 4) * 12, "#111214", 0.86))
    .join("\n  ")}
  ${line(0, 174, 960, 146, palette.storm, 5, 0.32)}
  ${line(0, 190, 960, 176, palette.dust, 3, 0.2)}
`
  );
}

function roomModule(name) {
  const colorByName = {
    "broken-wall-module": palette.rust,
    "metal-floor-tiles": palette.floor,
    "pipe-cable-bundle": palette.cyan2,
    "ventilation-room-module": palette.green,
    "security-door-module": palette.red,
    "communication-room-module": "#7c8cff",
    "medical-room-module": palette.yellow,
    "water-room-module": palette.cyan2,
    "task-wall-module": palette.amber,
    "rooftop-beacon-rig": palette.cyan
  };
  const accent = colorByName[name] ?? palette.amber;
  const label = name.replace(/-/g, " ").slice(0, 18).toUpperCase();
  let body = `
  ${rect(0, 0, 192, 128, palette.wall)}
  ${rect(8, 8, 176, 112, palette.shadow, 0.55)}
  ${line(8, 8, 184, 8, accent, 4, 0.72)}
  ${line(8, 120, 184, 120, palette.floor, 6, 0.82)}
  ${pixelNoise(192, 128, 34, [palette.rust, palette.steel, palette.dust], label.length)}
  ${text(14, 24, label, 10, accent)}
`;
  if (name.includes("water")) {
    body += `${rect(26, 46, 36, 54, palette.cyan2, 0.78)}${rect(72, 64, 58, 26, palette.steel2)}${line(48, 54, 114, 54, palette.cyan, 5, 0.7)}`;
  } else if (name.includes("medical")) {
    body += `${rect(28, 62, 110, 28, palette.paper, 0.82)}${rect(42, 42, 32, 24, palette.red)}${rect(53, 45, 8, 18, palette.paper)}${rect(48, 50, 18, 8, palette.paper)}`;
  } else if (name.includes("security")) {
    body += `${rect(34, 36, 58, 76, palette.steel2)}${rect(46, 48, 34, 54, palette.shadow)}${rect(110, 60, 26, 38, palette.red, 0.8)}`;
  } else if (name.includes("ventilation")) {
    body += `${rect(38, 40, 68, 68, palette.steel2)}${line(72, 44, 72, 104, accent, 6, 0.8)}${line(42, 74, 102, 74, accent, 6, 0.8)}${rect(124, 50, 34, 50, palette.steel)}`;
  } else if (name.includes("communication")) {
    body += `${rect(34, 62, 88, 38, palette.steel2)}${rect(48, 42, 72, 22, "#11252d")}${line(124, 52, 162, 30, palette.cyan, 3, 0.8)}`;
  } else if (name.includes("task")) {
    body += `${rect(28, 38, 124, 64, "#c4ad82", 0.85)}${rect(42, 52, 22, 16, palette.yellow)}${rect(72, 58, 26, 18, palette.cyan)}${rect(106, 50, 28, 22, palette.red, 0.8)}`;
  } else if (name.includes("beacon")) {
    body += `${line(96, 100, 96, 34, palette.steel, 7, 0.95)}${line(66, 42, 126, 42, palette.cyan, 4, 0.7)}${rect(78, 76, 36, 24, palette.rust)}${rect(88, 22, 18, 18, palette.cyan, 0.95)}`;
  } else if (name.includes("pipe")) {
    body += `${line(18, 42, 176, 42, palette.cyan2, 8, 0.75)}${line(18, 66, 176, 66, palette.rust, 7, 0.75)}${line(18, 90, 176, 90, palette.steel, 5, 0.75)}`;
  }
  return svg(192, 128, body);
}

function propSvg(name) {
  const accentMap = {
    "water-tank": palette.cyan2,
    "filter-pump": palette.cyan,
    medkit: palette.red,
    "medicine-crate": palette.yellow,
    "radio-terminal": "#7c8cff",
    "small-console": palette.cyan,
    "security-door": palette.red,
    "lock-panel": palette.red,
    "warning-light": palette.yellow,
    "vent-fan": palette.green,
    generator: palette.amber,
    "battery-box": palette.green,
    "file-crate": palette.paper,
    "task-sticky-notes": palette.yellow,
    toolbox: palette.rust,
    "repair-parts": palette.steel,
    "scrap-electronics": palette.cyan2
  };
  const accent = accentMap[name] ?? palette.amber;
  let parts = `${rect(0, 0, 96, 96, "transparent")}${rect(16, 62, 64, 10, palette.shadow, 0.55)}`;
  if (name.includes("water") || name.includes("tank")) {
    parts += `${rect(28, 20, 40, 54, palette.steel2)}${rect(32, 26, 32, 38, accent, 0.7)}${line(22, 38, 74, 38, accent, 4, 0.75)}`;
  } else if (name.includes("pump")) {
    parts += `${rect(20, 42, 54, 28, palette.steel2)}${rect(32, 30, 30, 18, accent, 0.8)}${line(14, 54, 82, 54, accent, 5, 0.65)}`;
  } else if (name.includes("med") || name.includes("medicine")) {
    parts += `${rect(18, 30, 60, 40, palette.paper, 0.9)}${rect(26, 24, 44, 12, accent)}${rect(43, 38, 10, 22, accent)}${rect(36, 44, 24, 10, accent)}`;
  } else if (name.includes("radio") || name.includes("console")) {
    parts += `${rect(16, 34, 64, 38, palette.steel2)}${rect(24, 40, 34, 16, "#10242c")}${rect(62, 42, 10, 10, accent)}${line(64, 34, 84, 14, accent, 4, 0.75)}`;
  } else if (name.includes("door")) {
    parts += `${rect(24, 12, 48, 70, palette.steel2)}${rect(34, 22, 28, 50, palette.shadow)}${rect(64, 40, 8, 18, accent)}`;
  } else if (name.includes("lock")) {
    parts += `${rect(24, 24, 48, 50, palette.steel2)}${rect(34, 34, 28, 20, "#141b20")}${rect(40, 60, 8, 8, accent)}${rect(54, 60, 8, 8, accent)}`;
  } else if (name.includes("warning")) {
    parts += `${rect(34, 34, 28, 26, accent)}${rect(28, 60, 40, 8, palette.steel2)}${line(28, 30, 68, 30, accent, 4, 0.7)}`;
  } else if (name.includes("fan")) {
    parts += `${rect(22, 22, 52, 52, palette.steel2)}${line(48, 26, 48, 70, accent, 6, 0.8)}${line(26, 48, 70, 48, accent, 6, 0.8)}${rect(42, 42, 12, 12, palette.shadow)}`;
  } else if (name.includes("generator") || name.includes("battery")) {
    parts += `${rect(18, 34, 60, 36, palette.steel2)}${rect(26, 24, 36, 12, accent)}${rect(30, 44, 12, 16, accent, 0.7)}${rect(48, 44, 20, 16, palette.green, 0.55)}`;
  } else if (name.includes("file") || name.includes("sticky")) {
    parts += `${rect(18, 44, 60, 28, palette.floor)}${rect(26, 24, 18, 22, palette.paper)}${rect(48, 28, 18, 20, accent)}${line(30, 34, 40, 34, palette.shadow, 2, 0.5)}`;
  } else {
    parts += `${rect(18, 42, 62, 30, palette.floor)}${rect(28, 30, 42, 14, accent, 0.8)}${rect(32, 52, 10, 10, palette.steel)}${rect(52, 52, 18, 10, palette.steel2)}`;
  }
  parts += pixelNoise(96, 96, 10, [palette.rust, palette.steel, accent], name.length);
  return svg(96, 96, parts);
}

function characterSvg(name) {
  const accents = {
    "aura-agent": palette.cyan,
    "resident-technician": palette.amber,
    "resident-medic": palette.yellow,
    "resident-security": palette.red,
    "resident-injured": palette.green,
    "resident-civilian": "#9da6b8"
  };
  const accent = accents[name] ?? palette.amber;
  if (name === "aura-agent") {
    return svg(
      112,
      112,
      `
  ${rect(0, 0, 112, 112, "transparent")}
  ${rect(40, 20, 32, 16, palette.steel2)}
  ${rect(32, 36, 48, 38, palette.shadow)}
  ${rect(38, 42, 36, 22, palette.cyan2, 0.88)}
  ${rect(46, 48, 8, 8, palette.cyan)}
  ${rect(60, 48, 8, 8, palette.cyan)}
  ${rect(24, 46, 10, 20, palette.steel)}
  ${rect(80, 46, 10, 20, palette.steel)}
  ${line(56, 74, 56, 90, palette.cyan, 4, 0.8)}
  ${rect(42, 88, 28, 8, palette.cyan2, 0.75)}
  ${line(24, 30, 12, 16, palette.cyan, 3, 0.6)}
  ${line(88, 30, 100, 16, palette.cyan, 3, 0.6)}
  ${pixelNoise(112, 112, 16, [palette.cyan, palette.steel, palette.rust], 9)}
`
    );
  }
  const head = name.includes("injured") ? "#c58971" : "#c99b72";
  return svg(
    96,
    128,
    `
  ${rect(0, 0, 96, 128, "transparent")}
  ${rect(36, 18, 24, 8, "#2c2521")}
  ${rect(30, 26, 36, 20, head)}
  ${rect(36, 34, 6, 6, palette.shadow)}
  ${rect(54, 34, 6, 6, palette.shadow)}
  ${rect(28, 50, 40, 42, accent)}
  ${rect(20, 56, 10, 28, head)}
  ${rect(68, 56, 10, 28, head)}
  ${rect(34, 92, 12, 28, palette.steel2)}
  ${rect(52, 92, 12, 28, palette.steel2)}
  ${rect(30, 118, 18, 6, palette.shadow)}
  ${rect(50, 118, 18, 6, palette.shadow)}
  ${name.includes("medic") ? rect(40, 62, 16, 8, palette.red) + rect(44, 58, 8, 16, palette.red) : ""}
  ${name.includes("security") ? rect(30, 46, 36, 8, palette.steel) + rect(68, 68, 12, 8, palette.red) : ""}
  ${name.includes("injured") ? line(28, 48, 68, 78, palette.paper, 6, 0.8) : ""}
  ${pixelNoise(96, 128, 10, [accent, palette.rust, palette.steel], name.length)}
`
  );
}

function uiSvg(name) {
  const w = name.includes("button") || name.includes("node") || name.includes("icon") ? 128 : 320;
  const h = name.includes("button") ? 52 : name.includes("node") || name.includes("icon") ? 96 : 180;
  const accent = name.includes("lighthouse") ? palette.yellow : name.includes("rescue") ? palette.cyan : palette.amber;
  return svg(
    w,
    h,
    `
  ${rect(0, 0, w, h, "transparent")}
  ${rect(4, 4, w - 8, h - 8, palette.shadow, 0.92)}
  ${rect(10, 10, w - 20, h - 20, palette.wall, 0.94)}
  ${line(12, 12, w - 12, 12, accent, 4, 0.75)}
  ${line(12, h - 12, w - 12, h - 12, palette.rust, 4, 0.75)}
  ${rect(0, 0, 14, 14, accent, 0.7)}
  ${rect(w - 14, 0, 14, 14, accent, 0.7)}
  ${rect(0, h - 14, 14, 14, palette.rust, 0.7)}
  ${rect(w - 14, h - 14, 14, 14, palette.rust, 0.7)}
  ${pixelNoise(w, h, Math.round((w * h) / 2800), [palette.rust, palette.steel, accent], name.length)}
`
  );
}

function iconSvg(name) {
  const colors = {
    water: palette.cyan2,
    medicine: palette.yellow,
    safety: palette.red,
    signal: palette.cyan,
    morale: palette.green,
    trust: palette.amber,
    resource: palette.dust,
    social: "#9da6b8",
    creative: palette.storm,
    retrieval: "#7c8cff",
    classification: palette.yellow,
    puzzle: palette.green,
    planning: palette.cyan
  };
  const accent = colors[name] ?? palette.amber;
  let mark = "";
  if (name === "water") mark = `${rect(36, 24, 24, 42, accent)}${rect(30, 54, 36, 18, accent, 0.8)}`;
  else if (name === "medicine") mark = `${rect(24, 30, 48, 34, palette.paper)}${rect(42, 36, 12, 22, palette.red)}${rect(36, 42, 24, 10, palette.red)}`;
  else if (name === "safety") mark = `${rect(28, 22, 40, 52, palette.steel2)}${rect(38, 34, 20, 24, accent)}`;
  else if (name === "signal") mark = `${line(48, 70, 48, 28, accent, 6)}${line(32, 42, 48, 28, accent, 4, 0.7)}${line(64, 42, 48, 28, accent, 4, 0.7)}`;
  else if (name === "morale") mark = `${rect(30, 30, 14, 14, accent)}${rect(52, 30, 14, 14, accent)}${rect(36, 54, 24, 8, accent)}`;
  else if (name === "trust") mark = `${rect(26, 42, 22, 20, accent)}${rect(48, 42, 22, 20, palette.cyan2)}${line(42, 46, 54, 46, palette.paper, 4)}`;
  else if (name === "puzzle") mark = `${rect(24, 24, 22, 22, accent)}${rect(50, 24, 22, 22, palette.wall2)}${rect(24, 50, 22, 22, palette.wall2)}${rect(50, 50, 22, 22, accent)}`;
  else mark = `${rect(24, 24, 48, 48, palette.steel2)}${rect(34, 34, 28, 28, accent, 0.85)}`;
  return svg(
    96,
    96,
    `
  ${rect(0, 0, 96, 96, "transparent")}
  ${rect(10, 10, 76, 76, palette.shadow, 0.82)}
  ${rect(16, 16, 64, 64, palette.wall)}
  ${mark}
  ${line(16, 16, 80, 16, accent, 3, 0.65)}
  ${line(16, 80, 80, 80, palette.rust, 3, 0.65)}
`
  );
}

function effectSvg(name) {
  if (name === "scan-ring") {
    return svg(128, 128, `${rect(0, 0, 128, 128, "transparent")}${rect(28, 28, 72, 8, palette.cyan, 0.75)}${rect(28, 92, 72, 8, palette.cyan, 0.75)}${rect(28, 28, 8, 72, palette.cyan, 0.75)}${rect(92, 28, 8, 72, palette.cyan, 0.75)}${rect(50, 18, 28, 6, palette.cyan, 0.55)}${rect(50, 104, 28, 6, palette.cyan, 0.55)}`);
  }
  if (name === "highlight-border") {
    return svg(192, 128, `${rect(0, 0, 192, 128, "transparent")}${rect(0, 0, 192, 8, palette.cyan, 0.8)}${rect(0, 120, 192, 8, palette.cyan, 0.8)}${rect(0, 0, 8, 128, palette.cyan, 0.8)}${rect(184, 0, 8, 128, palette.cyan, 0.8)}${rect(16, 16, 160, 6, palette.amber, 0.35)}${rect(16, 106, 160, 6, palette.amber, 0.35)}`);
  }
  if (name === "task-progress") {
    return svg(256, 32, `${rect(0, 0, 256, 32, palette.shadow)}${rect(6, 8, 244, 16, palette.steel2)}${rect(10, 12, 92, 8, palette.cyan)}${rect(110, 12, 42, 8, palette.green)}${rect(164, 12, 72, 8, palette.amber, 0.6)}`);
  }
  if (name === "path-highlight") {
    return svg(256, 32, `${rect(0, 0, 256, 32, "transparent")}${line(8, 16, 248, 16, palette.cyan, 8, 0.36)}${line(8, 16, 248, 16, palette.cyan, 2, 0.95)}${pixelNoise(256, 32, 24, [palette.cyan, palette.amber], 12)}`);
  }
  if (name === "beacon-flash") {
    return svg(128, 128, `${rect(0, 0, 128, 128, "transparent")}${line(64, 64, 64, 4, palette.cyan, 6, 0.8)}${line(64, 64, 108, 20, palette.cyan, 5, 0.48)}${line(64, 64, 20, 20, palette.cyan, 5, 0.48)}${rect(52, 52, 24, 24, palette.cyan, 0.9)}${rect(42, 42, 44, 8, palette.amber, 0.45)}${rect(42, 78, 44, 8, palette.amber, 0.45)}`);
  }
  const accent = name.includes("failure") ? palette.red : name.includes("success") ? palette.green : palette.cyan;
  return svg(128, 128, `${rect(0, 0, 128, 128, "transparent")}${rect(22, 22, 84, 84, accent, 0.18)}${rect(34, 34, 60, 60, accent, 0.28)}${line(16, 64, 112, 64, accent, 6, 0.72)}${line(64, 16, 64, 112, accent, 6, 0.72)}${pixelNoise(128, 128, 18, [accent, palette.amber, palette.rust], name.length)}`);
}

function renderAsset(category, name) {
  if (category === "environments") {
    if (name === "bunker-cross-section") return bunkerCrossSection();
    if (name === "red-sand-skyline") return redSandSkyline();
    return roomModule(name);
  }
  if (category === "props") return propSvg(name);
  if (category === "characters") return characterSvg(name);
  if (category === "ui") return uiSvg(name);
  if (category === "icons") return iconSvg(name);
  return effectSvg(name);
}

const records = [];

for (const batch of batches) {
  const dir = join(publicRoot, batch.category);
  mkdirSync(dir, { recursive: true });
  for (const [name, role] of batch.items) {
    const file = `${name}.svg`;
    const path = join(dir, file);
    writeFileSync(path, renderAsset(batch.category, name), "utf8");
    records.push({
      key: `gen-${batch.category.slice(0, -1)}-${name}`,
      category: batch.category,
      name,
      role,
      path: `assets/generated/${batch.category}/${file}`,
      uiPath: `/assets/generated/${batch.category}/${file}`
    });
  }
}

const grouped = batches
  .map((batch) => {
    const assets = records.filter((record) => record.category === batch.category);
    return `  ${batch.category}: [\n${assets
      .map(
        (asset) =>
          `    { key: "${asset.key}", name: "${asset.name}", role: "${asset.role}", path: "${asset.path}", uiPath: "${asset.uiPath}" }`
      )
      .join(",\n")}\n  ]`;
  })
  .join(",\n");

const manifest = `// Generated by scripts/generate-pixel-assets.mjs. Do not edit by hand.
export type GeneratedAssetCategory = "environments" | "props" | "characters" | "ui" | "icons" | "effects";

export type GeneratedAsset = {
  key: string;
  name: string;
  role: string;
  path: string;
  uiPath: string;
};

export const generatedAssets = {
${grouped}
} as const satisfies Record<GeneratedAssetCategory, readonly GeneratedAsset[]>;

export const phaserGeneratedAssets: readonly GeneratedAsset[] = Object.values(generatedAssets).flat();

export const generatedAssetByName = Object.fromEntries(
  phaserGeneratedAssets.map((asset) => [asset.name, asset])
) as Record<string, GeneratedAsset>;

export const metricIconAssets = {
  water: generatedAssetByName.water.uiPath,
  medicine: generatedAssetByName.medicine.uiPath,
  trust: generatedAssetByName.trust.uiPath,
  safety: generatedAssetByName.safety.uiPath,
  signal: generatedAssetByName.signal.uiPath,
  morale: generatedAssetByName.morale.uiPath
} as const;

export const taskCategoryIconAssets = {
  resource: generatedAssetByName.resource.uiPath,
  social: generatedAssetByName.social.uiPath,
  creative: generatedAssetByName.creative.uiPath,
  retrieval: generatedAssetByName.retrieval.uiPath,
  classification: generatedAssetByName.classification.uiPath,
  puzzle: generatedAssetByName.puzzle.uiPath,
  planning: generatedAssetByName.planning.uiPath,
  safety: generatedAssetByName.safety.uiPath,
  vision: generatedAssetByName.safety.uiPath
} as const;
`;

mkdirSync(dirname(manifestPath), { recursive: true });
writeFileSync(manifestPath, manifest, "utf8");

const assetList = `# Generated Red Dust Pixel Assets

The assets in this directory are generated source SVGs for the playable Red Dust demo.
They are grouped by category and referenced by \`src/data/asset-manifest.generated.ts\`.

${batches
  .map((batch) => `## ${batch.category}\n${batch.items.map(([name, role]) => `- \`${name}.svg\`: ${role}`).join("\n")}`)
  .join("\n\n")}
`;

writeFileSync(join(publicRoot, "README.md"), assetList, "utf8");

console.log(`Generated ${records.length} SVG assets and manifest.`);
