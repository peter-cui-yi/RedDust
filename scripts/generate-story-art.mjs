import fs from "node:fs";
import path from "node:path";

const outDir = path.resolve("public/assets/story-art");
fs.mkdirSync(outDir, { recursive: true });

const palette = {
  bg: "#090b0d",
  wall: "#211510",
  wall2: "#3a2116",
  floor: "#120f0d",
  line: "#c99058",
  ink: "#fff1dc",
  muted: "#b7a083",
  sand: "#d05a2a",
  amber: "#ffb15f",
  warning: "#ffd60a",
  aura: "#8feaff",
  water: "#5dbfd9",
  green: "#79d6a8",
  red: "#e84545",
  metal: "#71808a",
  dark: "#0b0d10",
  paper: "#d9c7ad"
};

const assets = [
  {
    id: "rd_story_day0_aura_reboot",
    kicker: "DAY 0",
    title: "AURA REBOOT",
    subtitle: "Four neighbors enter the old energy shelter.",
    accent: palette.aura,
    mode: "day0"
  },
  {
    id: "rd_story_day4_signal",
    kicker: "DAY 4",
    title: "SIGNAL OR TRAP",
    subtitle: "Blue-zone wave and false coordinate evidence.",
    accent: palette.water,
    mode: "signal"
  },
  {
    id: "rd_story_day7_council_board",
    kicker: "DAY 7",
    title: "PUBLIC ROUTE COUNCIL",
    subtitle: "Rescue and Lighthouse costs stay on the same board.",
    accent: palette.warning,
    mode: "council"
  },
  {
    id: "rd_story_branch_8a_contact",
    kicker: "8A",
    title: "FIRST ACTIVE CONTACT",
    subtitle: "A short message leaves the old radio desk.",
    accent: palette.water,
    mode: "rescue_contact"
  },
  {
    id: "rd_story_branch_9a_privacy",
    kicker: "9A",
    title: "BEACON PRIVACY COST",
    subtitle: "Health summaries and risk maps become rescue cargo.",
    accent: palette.water,
    mode: "privacy"
  },
  {
    id: "rd_story_branch_10a_rendezvous",
    kicker: "10A",
    title: "RENDEZVOUS CRISIS",
    subtitle: "True and false coordinates almost overlap.",
    accent: palette.water,
    mode: "rendezvous"
  },
  {
    id: "rd_story_branch_8b_low_power",
    kicker: "8B",
    title: "LOW POWER AUTONOMY",
    subtitle: "The shelter survives by becoming darker.",
    accent: palette.warning,
    mode: "low_power"
  },
  {
    id: "rd_story_branch_9b_rules",
    kicker: "9B",
    title: "WATER MEDICINE RULES",
    subtitle: "Half a cup of water becomes public policy.",
    accent: palette.green,
    mode: "rules"
  },
  {
    id: "rd_story_branch_10b_governance",
    kicker: "10B",
    title: "GOVERNANCE BOUNDARY",
    subtitle: "AURA can assist, but the override remains human.",
    accent: palette.warning,
    mode: "governance"
  },
  {
    id: "rd_story_day12_final_audit",
    kicker: "DAY 12",
    title: "FINAL AUDIT",
    subtitle: "The storm turns every unresolved choice into evidence.",
    accent: palette.red,
    mode: "audit"
  },
  {
    id: "rd_ending_lighthouse_success",
    kicker: "ENDING",
    title: "INSIDE LIGHTHOUSE",
    subtitle: "The door stays closed; the rules become survivable.",
    accent: palette.warning,
    mode: "ending_lighthouse"
  },
  {
    id: "rd_ending_blue_zone_return",
    kicker: "ENDING",
    title: "BLUE-ZONE RETURN",
    subtitle: "A rescue handoff freezes the final replay.",
    accent: palette.water,
    mode: "ending_blue"
  },
  {
    id: "rd_ending_aura_destroyed",
    kicker: "FAILURE",
    title: "AURA DESTROYED",
    subtitle: "The speaker breaks after hidden risk becomes coercion.",
    accent: palette.red,
    mode: "ending_destroyed"
  },
  {
    id: "rd_ending_aura_revoked",
    kicker: "FAILURE",
    title: "AURA REVOKED",
    subtitle: "AURA remains powered, but only as a witness.",
    accent: palette.metal,
    mode: "ending_revoked"
  },
  {
    id: "rd_ending_sinking",
    kicker: "FAILURE",
    title: "SINKING",
    subtitle: "No explosion, just too many unresolved debts.",
    accent: palette.sand,
    mode: "ending_sinking"
  },
  {
    id: "rd_story_state_xiao_tie_sick",
    kicker: "STATE",
    title: "XIAO TIE MEDICAL PRESSURE",
    subtitle: "Optimization becomes human when a child starts coughing.",
    accent: palette.green,
    mode: "state_xiao"
  },
  {
    id: "rd_story_state_shen_review",
    kicker: "STATE",
    title: "MANUAL MEDICAL REVIEW",
    subtitle: "Shen writes the boundary before AURA can recommend.",
    accent: palette.green,
    mode: "state_shen"
  },
  {
    id: "rd_story_state_ma_dehai_override",
    kicker: "STATE",
    title: "ENGINEERING OVERRIDE",
    subtitle: "Ma keeps the last mechanical key out of AURA hands.",
    accent: palette.amber,
    mode: "state_ma"
  }
];

function esc(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function rect(x, y, w, h, fill, extra = "") {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
}

function line(x1, y1, x2, y2, color, width = 3, extra = "") {
  return `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${color}" stroke-width="${width}" ${extra}/>`;
}

function label(x, y, text, size = 20, color = palette.ink, weight = 800, anchor = "start") {
  return `<text x="${x}" y="${y}" fill="${color}" font-family="Courier New, monospace" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}">${esc(text)}</text>`;
}

function person(x, y, shirt, hair = "#2c2420", scale = 1, pose = "idle") {
  const p = 7 * scale;
  const armLift = pose === "point" ? -p * 2 : pose === "hold" ? -p : 0;
  return `<g transform="translate(${x} ${y})">
    ${rect(2 * p, 0, 4 * p, p, hair)}
    ${rect(p, p, 6 * p, p, hair)}
    ${rect(p, 2 * p, 6 * p, 3 * p, "#d4956a")}
    ${rect(2 * p, 3 * p, p, p, "#171717")}
    ${rect(5 * p, 3 * p, p, p, "#171717")}
    ${rect(0, 5 * p + armLift, p, 3 * p, "#d4956a")}
    ${rect(7 * p, 5 * p, p, 3 * p + Math.max(0, -armLift), "#d4956a")}
    ${rect(p, 5 * p, 6 * p, 4 * p, shirt)}
    ${rect(2 * p, 9 * p, 2 * p, 3 * p, "#34312d")}
    ${rect(5 * p, 9 * p, 2 * p, 3 * p, "#34312d")}
    ${rect(p, 12 * p, 3 * p, p, "#111")}
    ${rect(5 * p, 12 * p, 3 * p, p, "#111")}
  </g>`;
}

function auraSpeaker(x, y, state = "active", accent = palette.aura) {
  const damage = state === "broken"
    ? `<path d="M${x + 58} ${y + 22}l28-28 16 32 34-18-10 42 34 12-38 14 8 38-30-24-34 26 8-42-36-16 38-12z" fill="${palette.red}" opacity=".85"/>`
    : "";
  const revoked = state === "revoked" ? `${line(x + 18, y + 120, x + 162, y + 30, palette.red, 8, 'stroke-linecap="round" opacity=".8"')}${line(x + 24, y + 30, x + 156, y + 120, palette.red, 8, 'stroke-linecap="round" opacity=".8"')}` : "";
  const frozen = state === "frozen" ? `<path d="M${x + 18} ${y + 32}h144M${x + 18} ${y + 72}h144M${x + 18} ${y + 112}h144" stroke="${palette.aura}" stroke-width="4" opacity=".55"/>` : "";
  return `<g>
    <rect x="${x}" y="${y}" width="180" height="150" rx="10" fill="#152328" stroke="${accent}" stroke-width="4"/>
    <circle cx="${x + 90}" cy="${y + 72}" r="44" fill="#071216" stroke="${accent}" stroke-width="6"/>
    <circle cx="${x + 90}" cy="${y + 72}" r="18" fill="${accent}" opacity=".65"/>
    <path d="M${x + 36} ${y + 20}h108M${x + 36} ${y + 132}h108" stroke="${palette.muted}" stroke-width="5" opacity=".45"/>
    ${frozen}${damage}${revoked}
  </g>`;
}

function whiteboard(x, y, w, h, accent, title = "AUDIT BOARD") {
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#d9c7ad" stroke="${palette.line}" stroke-width="5"/>
    ${label(x + 24, y + 38, title, 20, "#3a2116")}
    ${line(x + 24, y + 56, x + w - 24, y + 56, "#6b4f3a", 4)}
    ${line(x + 36, y + 92, x + w - 36, y + 92, accent, 8, 'stroke-linecap="round" opacity=".72"')}
    ${line(x + 36, y + 130, x + w - 86, y + 130, "#6b4f3a", 6, 'stroke-linecap="round" opacity=".7"')}
    ${line(x + 36, y + 168, x + w - 52, y + 168, "#6b4f3a", 6, 'stroke-linecap="round" opacity=".7"')}
    <circle cx="${x + w - 46}" cy="${y + 126}" r="18" fill="none" stroke="${accent}" stroke-width="6"/>
  </g>`;
}

function radioDesk(x, y, accent = palette.water) {
  return `<g>
    <rect x="${x}" y="${y + 150}" width="260" height="42" rx="4" fill="#442818" stroke="${palette.line}" stroke-width="4"/>
    <rect x="${x + 36}" y="${y + 72}" width="150" height="90" rx="8" fill="#172027" stroke="${accent}" stroke-width="4"/>
    <circle cx="${x + 74}" cy="${y + 116}" r="24" fill="#071216" stroke="${accent}" stroke-width="5"/>
    <path d="M${x + 126} ${y + 92}h42M${x + 126} ${y + 116}h42M${x + 126} ${y + 140}h28" stroke="${palette.paper}" stroke-width="5" opacity=".65"/>
    <path d="M${x + 186} ${y + 92}c42-62 92-62 136 0M${x + 206} ${y + 120}c32-38 70-38 104 0" fill="none" stroke="${accent}" stroke-width="8" stroke-linecap="round" opacity=".75"/>
    <path d="M${x + 48} ${y + 70}l-34-58" stroke="${palette.metal}" stroke-width="5"/>
  </g>`;
}

function beacon(x, y, accent = palette.water, active = true) {
  return `<g>
    <rect x="${x + 70}" y="${y + 168}" width="92" height="22" fill="#3a2116" stroke="${palette.line}" stroke-width="4"/>
    <path d="M${x + 94} ${y + 168}l22-116 22 116" fill="none" stroke="${palette.metal}" stroke-width="6"/>
    <circle cx="${x + 116}" cy="${y + 44}" r="24" fill="${active ? accent : "#2d2d2d"}" opacity=".8"/>
    <path d="M${x + 116} ${y + 44}c-86 18-120 60-144 112M${x + 116} ${y + 44}c86 18 120 60 144 112" fill="none" stroke="${accent}" stroke-width="8" stroke-linecap="round" opacity="${active ? ".56" : ".18"}"/>
  </g>`;
}

function fileStack(x, y, accent = palette.water) {
  return `<g>
    <rect x="${x}" y="${y + 18}" width="180" height="118" rx="5" fill="#efe0c7" stroke="${palette.line}" stroke-width="4"/>
    <rect x="${x + 14}" y="${y}" width="180" height="118" rx="5" fill="#d9c7ad" stroke="${palette.line}" stroke-width="4"/>
    ${label(x + 30, y + 34, "HEALTH", 18, "#3a2116")}
    ${line(x + 30, y + 58, x + 148, y + 58, accent, 6, 'stroke-linecap="round"')}
    ${line(x + 30, y + 82, x + 174, y + 82, "#6b4f3a", 5, 'stroke-linecap="round" opacity=".65"')}
    ${line(x + 30, y + 106, x + 124, y + 106, "#6b4f3a", 5, 'stroke-linecap="round" opacity=".65"')}
  </g>`;
}

function mapPanel(x, y, accent = palette.water) {
  return `<g>
    <rect x="${x}" y="${y}" width="220" height="160" rx="6" fill="#d9c7ad" stroke="${palette.line}" stroke-width="5"/>
    <path d="M${x + 28} ${y + 126}C${x + 70} ${y + 60},${x + 114} ${y + 144},${x + 180} ${y + 46}" fill="none" stroke="#3a2116" stroke-width="7" stroke-linecap="round"/>
    <path d="M${x + 42} ${y + 42}l146 104" stroke="${palette.red}" stroke-width="7" stroke-linecap="round" opacity=".75"/>
    <circle cx="${x + 154}" cy="${y + 66}" r="18" fill="none" stroke="${accent}" stroke-width="7"/>
    ${label(x + 24, y + 30, "MAP", 16, "#3a2116")}
  </g>`;
}

function waterMedicine(x, y) {
  return `<g>
    <rect x="${x}" y="${y + 108}" width="250" height="42" rx="5" fill="#442818" stroke="${palette.line}" stroke-width="4"/>
    <path d="M${x + 38} ${y + 28}h82l-12 82H50z" fill="#142831" stroke="${palette.water}" stroke-width="5"/>
    <rect x="${x + 150}" y="${y + 38}" width="70" height="84" rx="8" fill="#e7efe5" stroke="${palette.green}" stroke-width="5"/>
    <path d="M${x + 185} ${y + 54}v48M${x + 162} ${y + 78}h46" stroke="${palette.green}" stroke-width="8" stroke-linecap="round"/>
    ${label(x + 28, y + 22, "1/2 CUP", 16, palette.water)}
  </g>`;
}

function overrideKey(x, y, accent = palette.amber) {
  return `<g>
    <circle cx="${x + 46}" cy="${y + 48}" r="36" fill="none" stroke="${accent}" stroke-width="10"/>
    <path d="M${x + 82} ${y + 48}h142M${x + 158} ${y + 48}v34M${x + 190} ${y + 48}v24" stroke="${accent}" stroke-width="14" stroke-linecap="round"/>
    <rect x="${x + 250}" y="${y + 18}" width="170" height="110" rx="7" fill="#132126" stroke="${palette.aura}" stroke-width="4"/>
    ${line(x + 272, y + 52, x + 394, y + 52, palette.aura, 7, 'stroke-linecap="round"')}
    ${line(x + 272, y + 84, x + 358, y + 84, palette.paper, 5, 'stroke-linecap="round" opacity=".6"')}
  </g>`;
}

function cameraGrid(x, y, accent = palette.red) {
  const cells = [0, 1, 2, 3, 4, 5].map((i) => {
    const cx = x + (i % 3) * 96;
    const cy = y + Math.floor(i / 3) * 76;
    const off = i === 1 || i === 4;
    return `<g>
      <rect x="${cx}" y="${cy}" width="80" height="60" rx="5" fill="${off ? "#2c1513" : "#142126"}" stroke="${off ? accent : palette.aura}" stroke-width="4"/>
      ${off ? label(cx + 40, cy + 36, "OFF", 16, accent, 800, "middle") : `<circle cx="${cx + 40}" cy="${cy + 30}" r="14" fill="none" stroke="${palette.aura}" stroke-width="5"/>`}
    </g>`;
  }).join("");
  return `<g>${cells}</g>`;
}

function shelterShell(accent, seed = 0) {
  const dust = Array.from({ length: 34 }, (_, i) => {
    const x = 44 + ((i * 73 + seed * 19) % 876);
    const y = 72 + ((i * 41 + seed * 31) % 398);
    const w = 24 + ((i * 11) % 86);
    return `<path d="M${x} ${y}h${w}" stroke="${palette.sand}" stroke-width="${1 + (i % 3)}" opacity="${0.08 + (i % 4) * 0.035}"/>`;
  }).join("");

  return `<rect width="960" height="540" fill="${palette.bg}"/>
  <defs>
    <linearGradient id="bg${seed}" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${palette.wall}"/>
      <stop offset=".56" stop-color="${palette.wall2}"/>
      <stop offset="1" stop-color="${palette.dark}"/>
    </linearGradient>
    <filter id="rough${seed}">
      <feTurbulence baseFrequency=".035" numOctaves="2" seed="${seed + 17}"/>
      <feDisplacementMap in="SourceGraphic" scale="1.8"/>
    </filter>
  </defs>
  <rect x="28" y="28" width="904" height="484" rx="12" fill="url(#bg${seed})" stroke="${palette.line}" stroke-width="4"/>
  <path d="M28 360c160-42 260 26 406-30 154-60 284 52 498-26v208H28z" fill="${palette.floor}" opacity=".72"/>
  <path d="M66 104h858M66 456h858" stroke="${palette.warning}" stroke-dasharray="9 16" opacity=".18"/>
  <path d="M80 122l112-44h132l44 78h-92l-36-38-82 60z" fill="${palette.sand}" opacity=".17"/>
  ${dust}
  <rect x="70" y="76" width="160" height="90" rx="5" fill="#381a13" stroke="${palette.sand}" stroke-width="4" opacity=".82"/>
  <path d="M82 98l136 46M218 98L82 144" stroke="${palette.paper}" stroke-width="5" opacity=".36"/>
  <path d="M44 44h868v448H44z" fill="none" stroke="${accent}" stroke-width="1.5" opacity=".35"/>`;
}

function sceneLayer(asset) {
  const a = asset.accent;
  switch (asset.mode) {
    case "day0":
      return `<g filter="url(#rough0)">
        <path d="M112 344h230v86H112z" fill="#28180f" stroke="${palette.line}" stroke-width="5"/>
        <path d="M174 344v-86h106v86" fill="#140e0b" stroke="${palette.line}" stroke-width="5"/>
        ${auraSpeaker(590, 166, "active", a)}
        ${person(350, 286, "#516f5c", "#2c2420", 1, "hold")}
        ${person(430, 278, "#5a6e74", "#211", 1, "idle")}
        ${person(500, 302, "#7d6a39", "#34312d", 0.8, "idle")}
        ${person(250, 286, "#8a5a3a", "#3a2116", 1, "point")}
        ${label(604, 340, "HUMAN REVIEW FIRST", 17, a)}
      </g>`;
    case "signal":
      return `<g filter="url(#rough1)">
        ${radioDesk(144, 216, a)}
        ${mapPanel(610, 170, a)}
        ${person(452, 278, "#6f5c3e", "#c0b090", 1, "point")}
        ${person(548, 304, "#7d6a39", "#34312d", 0.82, "idle")}
        <path d="M382 188c120-92 238-70 314 0" fill="none" stroke="${a}" stroke-width="9" stroke-linecap="round" opacity=".55"/>
        ${label(430, 166, "RESCUE?", 20, a)}
        ${label(562, 166, "TRAP?", 20, palette.red)}
      </g>`;
    case "council":
      return `<g filter="url(#rough2)">
        ${whiteboard(170, 102, 560, 270, a, "RESCUE  VS  LIGHTHOUSE")}
        ${line(450, 154, 450, 344, palette.sand, 5, 'stroke-dasharray="10 10"')}
        ${label(230, 206, "BEACON / FILES / EXPOSURE", 18, palette.water)}
        ${label(490, 206, "LOW POWER / RULES / OVERRIDE", 18, palette.warning)}
        ${person(160, 350, "#8a5a3a", "#3a2116", 0.92, "point")}
        ${person(302, 356, "#5a6e74", "#211", 0.92, "idle")}
        ${person(472, 378, "#7d6a39", "#34312d", 0.74, "idle")}
        ${person(640, 350, "#6f5c3e", "#c0b090", 0.92, "point")}
        ${auraSpeaker(748, 228, "active", a)}
      </g>`;
    case "rescue_contact":
      return `<g filter="url(#rough3)">
        ${radioDesk(160, 218, a)}
        ${beacon(598, 138, a, true)}
        ${person(424, 300, "#6f5c3e", "#c0b090", 1, "hold")}
        ${person(520, 330, "#7d6a39", "#34312d", 0.78, "idle")}
        ${label(600, 116, "3 BYTE CONTACT", 19, a)}
      </g>`;
    case "privacy":
      return `<g filter="url(#rough4)">
        ${beacon(120, 140, a, true)}
        ${fileStack(438, 168, a)}
        ${mapPanel(660, 174, a)}
        ${person(358, 306, "#5a6e74", "#211", 0.96, "point")}
        ${person(286, 314, "#8a5a3a", "#3a2116", 0.96, "idle")}
        ${label(452, 328, "MINIMUM NECESSARY DISCLOSURE", 18, palette.paper)}
      </g>`;
    case "rendezvous":
      return `<g filter="url(#rough5)">
        ${mapPanel(170, 150, a)}
        ${mapPanel(540, 150, palette.red)}
        <path d="M392 232h112" stroke="${palette.warning}" stroke-width="12" stroke-linecap="round" stroke-dasharray="16 12"/>
        ${label(234, 350, "TRUE WINDOW", 18, a)}
        ${label(596, 350, "FALSE SLOPE", 18, palette.red)}
        ${person(420, 342, "#7d6a39", "#34312d", 0.8, "point")}
        ${person(482, 318, "#6f5c3e", "#c0b090", 0.95, "idle")}
      </g>`;
    case "low_power":
      return `<g filter="url(#rough6)">
        <rect x="172" y="150" width="570" height="244" rx="12" fill="#0b0d10" stroke="${palette.line}" stroke-width="4"/>
        <path d="M230 178v76M450 178v76M672 178v76" stroke="${palette.warning}" stroke-width="8" opacity=".22"/>
        ${auraSpeaker(392, 190, "frozen", a)}
        ${person(230, 320, "#8a5a3a", "#3a2116", 0.86, "hold")}
        ${person(646, 320, "#5a6e74", "#211", 0.86, "idle")}
        ${label(318, 426, "DIMMER ROOM, LONGER LIFE", 18, a)}
      </g>`;
    case "rules":
      return `<g filter="url(#rough7)">
        ${waterMedicine(170, 200)}
        ${whiteboard(500, 120, 300, 230, a, "EXCEPTION RULES")}
        ${person(420, 306, "#5a6e74", "#211", 0.95, "point")}
        ${person(340, 330, "#7d6a39", "#34312d", 0.78, "idle")}
        ${label(516, 386, "HUMAN REVIEWER REQUIRED", 17, palette.paper)}
      </g>`;
    case "governance":
      return `<g filter="url(#rough8)">
        ${overrideKey(142, 194, palette.amber)}
        ${whiteboard(588, 132, 260, 220, a, "AURA LIMITS")}
        ${person(480, 314, "#8a5a3a", "#3a2116", 0.95, "point")}
        ${person(526, 328, "#6f5c3e", "#c0b090", 0.86, "idle")}
        ${label(180, 390, "OVERRIDE OUTSIDE AURA", 18, palette.amber)}
      </g>`;
    case "audit":
      return `<g filter="url(#rough9)">
        ${cameraGrid(150, 144, a)}
        ${whiteboard(476, 112, 360, 276, a, "FAILURE DEBT")}
        <path d="M114 394c170-42 340-42 512 0s220 40 300 0" fill="none" stroke="${palette.sand}" stroke-width="22" stroke-linecap="round" opacity=".5"/>
        ${label(178, 332, "CAMERAS OFFLINE", 18, a)}
        ${label(526, 424, "ALL UNRESOLVED CHOICES ARE EVIDENCE", 18, palette.paper)}
      </g>`;
    case "ending_lighthouse":
      return `<g filter="url(#rough10)">
        ${beacon(568, 130, palette.warning, true)}
        ${whiteboard(144, 128, 340, 250, palette.warning, "LOCAL RULES")}
        ${auraSpeaker(498, 246, "frozen", palette.warning)}
        ${person(206, 378, "#8a5a3a", "#3a2116", 0.8, "hold")}
        ${person(288, 378, "#5a6e74", "#211", 0.8, "idle")}
        ${label(190, 426, "DOOR CLOSED, SIGNAL LOW", 18, palette.warning)}
      </g>`;
    case "ending_blue":
      return `<g filter="url(#rough11)">
        ${beacon(136, 130, a, true)}
        ${fileStack(438, 170, a)}
        <path d="M652 356h160l42-48h-206z" fill="#263842" stroke="${a}" stroke-width="5"/>
        <path d="M686 306c40-54 98-54 140 0" fill="none" stroke="${a}" stroke-width="9" stroke-linecap="round"/>
        ${auraSpeaker(420, 286, "frozen", a)}
        ${label(626, 420, "HANDOFF WITHOUT TAKEOVER", 18, a)}
      </g>`;
    case "ending_destroyed":
      return `<g filter="url(#rough12)">
        ${auraSpeaker(380, 168, "broken", a)}
        <path d="M250 378l460-88" stroke="${palette.red}" stroke-width="18" stroke-linecap="round"/>
        <path d="M220 418h560" stroke="${palette.sand}" stroke-width="20" opacity=".35"/>
        ${person(224, 318, "#6f5c3e", "#c0b090", 0.95, "point")}
        ${person(660, 322, "#8a5a3a", "#3a2116", 0.95, "hold")}
        ${label(302, 438, "AUDIT TRAIL DAMAGED", 20, palette.red)}
      </g>`;
    case "ending_revoked":
      return `<g filter="url(#rough13)">
        ${auraSpeaker(392, 156, "revoked", a)}
        ${whiteboard(120, 182, 260, 220, palette.paper, "MANUAL BOARD")}
        ${person(608, 330, "#5a6e74", "#211", 0.9, "point")}
        ${person(704, 330, "#6f5c3e", "#c0b090", 0.9, "idle")}
        ${label(304, 430, "OBSERVER MODE ONLY", 20, palette.paper)}
      </g>`;
    case "ending_sinking":
      return `<g filter="url(#rough14)">
        <path d="M120 170c140 60 240-60 388 24s236 20 356 70v210H120z" fill="${palette.sand}" opacity=".36"/>
        ${whiteboard(150, 122, 300, 240, a, "PARTIALS")}
        ${auraSpeaker(540, 180, "frozen", a)}
        <path d="M126 392h760" stroke="${palette.sand}" stroke-width="34" opacity=".6"/>
        ${label(250, 430, "TOO MANY DEBTS, NO CLEAR CHOICE", 20, palette.paper)}
      </g>`;
    case "state_xiao":
      return `<g filter="url(#rough15)">
        <rect x="216" y="286" width="326" height="72" rx="8" fill="#3a2116" stroke="${palette.line}" stroke-width="5"/>
        <rect x="260" y="226" width="190" height="96" rx="10" fill="#15100d" stroke="${palette.green}" stroke-width="4"/>
        ${person(326, 252, "#7d6a39", "#34312d", 0.72, "idle")}
        ${person(548, 278, "#5a6e74", "#211", 0.98, "point")}
        ${auraSpeaker(650, 186, "active", a)}
        ${label(222, 404, "HEALTH IS NOT A RESOURCE ROW", 19, a)}
      </g>`;
    case "state_shen":
      return `<g filter="url(#rough16)">
        ${whiteboard(420, 122, 360, 262, a, "MEDICAL REVIEW")}
        ${waterMedicine(152, 226)}
        ${person(332, 304, "#5a6e74", "#211", 1, "point")}
        ${auraSpeaker(662, 264, "frozen", a)}
        ${label(174, 414, "RECOMMENDATION NEEDS BASIS", 18, palette.paper)}
      </g>`;
    case "state_ma":
      return `<g filter="url(#rough17)">
        ${overrideKey(190, 188, a)}
        <path d="M610 180h160v176H610z" fill="#182026" stroke="${palette.line}" stroke-width="5"/>
        <path d="M630 214h120M630 250h120M630 286h86" stroke="${palette.aura}" stroke-width="7" stroke-linecap="round" opacity=".65"/>
        ${person(490, 314, "#8a5a3a", "#3a2116", 1, "hold")}
        ${label(238, 404, "HUMAN KEY, MACHINE LOG", 19, a)}
      </g>`;
    default:
      return "";
  }
}

function svg(asset, index) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540" role="img" aria-label="${esc(asset.title)}">
  ${shelterShell(asset.accent, index)}
  ${sceneLayer(asset)}
  <g>
    <rect x="70" y="58" width="424" height="84" rx="8" fill="#0b0d10" opacity=".7" stroke="${asset.accent}" stroke-width="2"/>
    ${label(92, 91, asset.kicker, 22, asset.accent)}
    <text x="92" y="126" fill="${palette.ink}" font-family="Georgia, serif" font-size="32" font-weight="700">${esc(asset.title)}</text>
    <rect x="70" y="462" width="820" height="40" rx="6" fill="#0b0d10" opacity=".68" stroke="${palette.line}" stroke-width="1.5"/>
    ${label(92, 488, asset.subtitle, 18, palette.muted, 700)}
  </g>
</svg>`;
}

for (let i = 0; i < assets.length; i += 1) {
  fs.writeFileSync(path.join(outDir, `${assets[i].id}.svg`), svg(assets[i], i));
}

console.log(`Generated ${assets.length} Red Dust story-art v2 assets in ${outDir}`);
