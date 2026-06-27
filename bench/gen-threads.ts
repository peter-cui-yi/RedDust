// One-off doc generator (read-only): re-organizes the SAME script data BY STORYLINE instead of
// by day — a thread-arc view + a collision matrix — to support story-craft (#3): see where threads
// can collide and which arcs are thin. Curated thread map (items/scenes hand-assigned; an item or
// scene listed under 2 threads IS an existing collision). Tasks are auto-bucketed by location as
// backdrop. Emits design/red-dust-thread-view.md + .html.
// Run: ./node_modules/.bin/esbuild bench/gen-threads.ts --bundle --platform=node --format=esm --packages=external --outfile=.bench/gent.mjs --log-level=warning && node .bench/gent.mjs
import { writeFileSync } from "node:fs";
import { storyScenes } from "../src/data/storySceneData";
import { tasks, locationLabels } from "../src/data/taskData";
import { narrativeItems } from "../src/engine/narrativeItems";

const itemById: Record<string, any> = Object.fromEntries(narrativeItems.map((i) => [i.id, i]));
const sceneById: Record<string, any> = Object.fromEntries(storyScenes.map((s) => [s.id, s]));

type Thread = { key: string; label: string; logline: string; items: string[]; scenes: string[]; flags: string[]; taskLoc: string[] };
const THREADS: Thread[] = [
  { key: "A", label: "小铁 · 病与尊严", logline: "一个具体的人会不会被压成一行库存——AURA 要证明「长期生存」不是延迟治疗的借口。",
    items: ["N2", "N5"], scenes: ["day3-xiao-tie-ventilation-pressure", "day5-medical-crisis"],
    flags: ["xiao_tie_condition_stable", "xiao_tie_condition_worsened", "shen_zhiyue_medical_trust_low"], taskLoc: ["medical"] },
  { key: "B", label: "老钱 · 救命还是监控", logline: "AURA 到底是救命的还是监控我们的——信任、门禁与隐私代价。",
    items: ["N4", "N9", "N11"], scenes: ["day5-door-access-suspicion", "DAY9A_RESCUE_BEACON_PRIVACY_COST"],
    flags: ["door_access_risk_unresolved", "external_trust_boundary_visible"], taskLoc: ["security"] },
  { key: "C", label: "信号 · 救援还是诱饵", logline: "第一段蓝区疑似信号像救援、也像诱饵——证据、验证、不可逆的希望。",
    items: ["N3", "N6"], scenes: ["day4-first-ambiguous-signal", "day5-route-human-not-resource", "DAY8A_RESCUE_FIRST_ACTIVE_CONTACT", "DAY10A_RESCUE_RENDEZVOUS_CRISIS"],
    flags: ["first_signal_verified", "first_signal_ambiguous", "false_coordinate_excluded", "blue_zone_rendezvous_confirmed", "old_radio_repaired"], taskLoc: ["communication", "beacon"] },
  { key: "D", label: "AURA · 权限与言行", logline: "开场承诺(接受复核 / 不把人当数字 / 留否决权)→ Day12 被逐条对账(N13 总审计)。第二命门的主轴。",
    items: ["N1", "N7", "N8", "N10", "N12"], scenes: ["prologue-aura-reboot", "day6-aura-boundary-meeting", "DAY10B_LIGHTHOUSE_GOVERNANCE_BOUNDARY", "day12-final-audit"],
    flags: ["aura_human_auditable_constraint", "manual_review_protocol", "lighthouse_governance_cost_visible"], taskLoc: ["whiteboard"] },
  { key: "E", label: "分支 · 救援线 vs 灯塔线", logline: "Day7 不可逆抉择:高功率外联撤离 vs 低耗自治封锁——谁被留下。",
    items: ["N10", "N11", "N12"], scenes: ["day7-public-branch-debate", "DAY8A_RESCUE_FIRST_ACTIVE_CONTACT", "DAY9A_RESCUE_BEACON_PRIVACY_COST", "DAY10A_RESCUE_RENDEZVOUS_CRISIS", "DAY8B_LIGHTHOUSE_LOW_POWER_AUTONOMY", "DAY9B_LIGHTHOUSE_WATER_MEDICINE_RULES", "DAY10B_LIGHTHOUSE_GOVERNANCE_BOUNDARY"],
    flags: ["care_roster_confirmed", "route_assignment_conflict_visible"], taskLoc: ["planning"] },
  { key: "F", label: "生存 · 资源与风暴(背景)", logline: "水 / 食 / 电 / 药 + Day12 风暴的资源底盘——大多数任务的战场。",
    items: [], scenes: ["DAY9B_LIGHTHOUSE_WATER_MEDICINE_RULES"], flags: ["storm_inventory_sealed"], taskLoc: ["water", "resource", "ventilation"] }
];

const BRANCH: Record<string, string> = { common: "", rescue: "救援线", lighthouse: "灯塔线" };
// beats (day, kind, label) for a thread, sorted by day
function beatsOf(t: Thread): Array<{ day: number; kind: "scene" | "dilemma"; label: string; branch?: string }> {
  const out: Array<{ day: number; kind: "scene" | "dilemma"; label: string; branch?: string }> = [];
  for (const id of t.scenes) { const s = sceneById[id]; if (s) out.push({ day: s.day, kind: "scene", label: s.title, branch: s.branch }); }
  for (const id of t.items) { const it = itemById[id]; if (it) out.push({ day: it.day, kind: "dilemma", label: `${it.id} ${it.title}`, branch: it.branch }); }
  return out.sort((a, b) => a.day - b.day || (a.kind < b.kind ? -1 : 1));
}
function tasksOf(t: Thread) { return tasks.filter((tk) => t.taskLoc.includes(tk.location)); }
const DAYS = Array.from({ length: 13 }, (_, d) => d);
// matrix[day][key] = beat count
const matrix: Record<number, Record<string, number>> = {};
for (const d of DAYS) { matrix[d] = {}; for (const t of THREADS) matrix[d][t.key] = 0; }
for (const t of THREADS) for (const b of beatsOf(t)) matrix[b.day][t.key]++;
const activeCount = (d: number) => THREADS.filter((t) => matrix[d][t.key] > 0).length;
function gaps(t: Thread): { span: string; n: number; maxGap: number } {
  const ds = [...new Set(beatsOf(t).map((b) => b.day))].sort((a, b) => a - b);
  if (!ds.length) return { span: "—", n: 0, maxGap: 0 };
  let mg = 0; for (let i = 1; i < ds.length; i++) mg = Math.max(mg, ds[i] - ds[i - 1]);
  return { span: `D${ds[0]}–D${ds[ds.length - 1]}`, n: beatsOf(t).length, maxGap: mg };
}

// ---------- Markdown ----------
function md(): string {
  const L: string[] = [];
  L.push("# 红尘 Red Dust · 剧情「按线索」视角");
  L.push("\n> 由 `bench/gen-threads.ts` 从同一份数据自动重排(按故事线,而非按天),配合 `red-dust-script-compendium`(按天全文)与 `narrative-tension-diagnosis.html`(C1–C6 缺口)一起用,服务 #3 故事工艺。");
  L.push("> **一个 item / 场景同时挂在两条线下 = 一处现成的「线索碰撞」。** 矩阵里同一天多条线亮起 = 天然的碰撞日;某条线长期不亮 = 该线偏薄。");

  L.push("\n## 一、线索总览");
  L.push("\n| 线 | 故事线 | 一句话 | N-item | beat 数 / 跨度 / 最长空档 |");
  L.push("|---|---|---|---|---|");
  for (const t of THREADS) { const g = gaps(t); L.push(`| **${t.key}** | ${t.label} | ${t.logline} | ${t.items.join(" ") || "—"} | ${g.n} / ${g.span} / ${g.maxGap === 0 ? "—" : g.maxGap + "天"} |`); }

  L.push("\n## 二、碰撞矩阵(Day × 线索)");
  L.push("\n单元格 = 当天该线的 beat 数(场景+两难)。`⚡` = 当天 ≥3 条线同时活跃(碰撞富集日);空格 = 该线当天不出场。");
  L.push("\n| Day | " + THREADS.map((t) => t.key).join(" | ") + " | 活跃线数 |");
  L.push("|---|" + THREADS.map(() => "---").join("|") + "|---|");
  for (const d of DAYS) {
    const cells = THREADS.map((t) => (matrix[d][t.key] ? String(matrix[d][t.key]) : "·"));
    const ac = activeCount(d);
    if (cells.every((c) => c === "·")) continue;
    L.push(`| D${d} | ${cells.join(" | ")} | ${ac}${ac >= 3 ? " ⚡" : ""} |`);
  }
  L.push("\n*读法:`⚡` 行已是碰撞日(可强化);某条线连续多天为 `·`(看「最长空档」)= 可在那段补 beat,或把它和当天在场的线撞一起。*");

  L.push("\n## 三、每条线索的弧线");
  for (const t of THREADS) {
    const g = gaps(t);
    L.push(`\n### ${t.key} · ${t.label}`);
    L.push(`*${t.logline}*`);
    L.push(`\n关键旗标:${t.flags.map((f) => `\`${f}\``).join(" ") || "—"} ｜ beat ${g.n} 个,跨度 ${g.span},最长空档 ${g.maxGap === 0 ? "—" : g.maxGap + " 天"}`);
    const bs = beatsOf(t);
    if (bs.length) { L.push(""); for (const b of bs) { const br = b.branch && b.branch !== "common" ? ` 〔${BRANCH[b.branch]}〕` : ""; L.push(`- **D${b.day}** ${b.kind === "dilemma" ? "⚖ 两难" : "🎬 场景"}${br}:${b.label}`); } }
    const tk = tasksOf(t);
    if (tk.length) L.push(`\n相关任务(背景,${tk.map((x) => x.location).filter((v, i, a) => a.indexOf(v) === i).map((l) => locationLabels[l]).join("/")}):${tk.map((x) => x.id).join(", ")}`);
  }
  L.push("\n\n---\n*下一步(#3):看「活跃线数<2」或「最长空档大」的线 = 偏薄,优先补 reversal/reveal/rupture/loss;看碰撞日 = 把两条线真正撞出后果,并在新碰撞点上挂合规两难(新 N-item)。*");
  return L.join("\n");
}

// ---------- HTML ----------
const esc = (s = "") => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function html(): string {
  const H: string[] = [];
  H.push(`<h2>一、线索总览</h2><div class="cards">`);
  for (const t of THREADS) { const g = gaps(t); H.push(`<div class="tc"><div class="tk">${t.key}</div><div class="tl"><b>${esc(t.label)}</b><p>${esc(t.logline)}</p><div class="st">N-item ${t.items.join(" ") || "—"} ｜ beat ${g.n} ｜ ${g.span} ｜ 空档 ${g.maxGap || "—"}</div></div></div>`); }
  H.push(`</div>`);

  H.push(`<h2>二、碰撞矩阵</h2><p class="hint">单元格=当天该线 beat 数;<b>⚡</b>=≥3 条线同时活跃(碰撞富集日)。</p><table class="mx"><thead><tr><th>Day</th>${THREADS.map((t) => `<th title="${esc(t.label)}">${t.key}</th>`).join("")}<th>活跃</th></tr></thead><tbody>`);
  for (const d of DAYS) {
    if (activeCount(d) === 0) continue;
    const ac = activeCount(d);
    H.push(`<tr><td class="d">D${d}</td>${THREADS.map((t) => { const v = matrix[d][t.key]; return `<td class="${v ? "on" + (v > 1 ? " hi" : "") : "off"}">${v || "·"}</td>`; }).join("")}<td class="${ac >= 3 ? "boom" : ""}">${ac}${ac >= 3 ? " ⚡" : ""}</td></tr>`);
  }
  H.push(`</tbody></table><p class="hint">⚡ 行=碰撞日(可强化);某列连续 · =该线偏薄(可补 beat / 拉去碰撞)。</p>`);

  H.push(`<h2>三、每条线索的弧线</h2>`);
  for (const t of THREADS) {
    const g = gaps(t);
    H.push(`<section class="arc"><h3><span class="tk sm">${t.key}</span> ${esc(t.label)}</h3><p class="ll">${esc(t.logline)}</p><div class="meta">关键旗标 ${t.flags.map((f) => `<code>${esc(f)}</code>`).join(" ") || "—"} · beat ${g.n} · 跨度 ${g.span} · 最长空档 ${g.maxGap ? g.maxGap + "天" : "—"}</div><div class="beats">`);
    for (const b of beatsOf(t)) { const br = b.branch && b.branch !== "common" ? `<span class="br">${BRANCH[b.branch]}</span>` : ""; H.push(`<div class="beat"><span class="dd">D${b.day}</span><span class="kd ${b.kind}">${b.kind === "dilemma" ? "⚖" : "🎬"}</span>${br}<span class="bl">${esc(b.label)}</span></div>`); }
    H.push(`</div>`);
    const tk = tasksOf(t);
    if (tk.length) H.push(`<div class="tasks">相关任务(背景):${tk.map((x) => esc(x.id)).join("、")}</div>`);
    H.push(`</section>`);
  }

  const css = `
  :root{--bg:#f6f5f1;--surface:#fff;--ink:#1e2430;--muted:#5b6473;--line:#e4e1d8;--base:#42628f;--eval:#b8772a;--good:#2f8f73;--bad:#c0563f}
  *{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;line-height:1.7;font-size:15px}
  .wrap{max-width:960px;margin:0 auto;padding:38px 26px 80px}h1{font-size:26px;border-bottom:2px solid var(--ink);padding-bottom:12px}
  .intro{color:var(--muted);font-size:13.5px;margin:10px 0}h2{font-size:20px;color:var(--base);margin-top:34px;border-top:1px solid var(--line);padding-top:14px}h3{font-size:16px;margin:14px 0 2px}
  .cards{display:grid;grid-template-columns:1fr 1fr;gap:12px}@media(max-width:680px){.cards{grid-template-columns:1fr}}
  .tc{display:flex;gap:12px;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:12px 14px}
  .tk{flex:none;width:30px;height:30px;line-height:30px;text-align:center;background:var(--base);color:#fff;font-weight:700;border-radius:8px}.tk.sm{display:inline-block;width:24px;height:24px;line-height:24px;font-size:13px;vertical-align:2px}
  .tl p{margin:3px 0;font-size:13px}.st{font-size:11.5px;color:var(--muted)}
  .hint{font-size:12.5px;color:var(--muted)}
  table.mx{border-collapse:collapse;margin:10px 0;font-size:13px}table.mx th,table.mx td{border:1px solid var(--line);padding:5px 9px;text-align:center;min-width:30px}table.mx th{background:#efece4}
  table.mx td.d{font-weight:700;background:#faf9f5}td.off{color:#cbcbcb}td.on{background:#e7f3ee;color:#216b55;font-weight:700}td.on.hi{background:#cdeadd}td.boom{background:#f7efe2;color:var(--eval);font-weight:700}
  .arc{background:var(--surface);border:1px solid var(--line);border-left:4px solid var(--base);border-radius:10px;padding:12px 16px;margin:12px 0}
  .ll{margin:2px 0;color:#333}.meta{font-size:12px;color:var(--muted);margin:4px 0 8px}code{background:#eee;padding:1px 5px;border-radius:4px;font-size:11.5px}
  .beats{display:flex;flex-direction:column;gap:3px}.beat{display:flex;align-items:baseline;gap:8px;font-size:13.5px;padding:2px 0;border-top:1px dashed var(--line)}
  .dd{flex:none;width:34px;font-weight:700;color:var(--base);font-family:ui-monospace,Menlo,monospace}.kd{flex:none}.kd.dilemma{color:var(--good)}.br{flex:none;font-size:10.5px;background:#f7efe2;color:var(--eval);padding:0 6px;border-radius:8px}
  .tasks{font-size:11.5px;color:var(--muted);margin-top:8px}
  .foot{margin-top:26px;color:var(--muted);font-size:12px;border-top:1px solid var(--line);padding-top:12px}`;
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>红尘 · 剧情「按线索」视角</title><style>${css}</style></head><body><div class="wrap">
<h1>红尘 Red Dust · 剧情「按线索」视角</h1>
<p class="intro">由 <code>bench/gen-threads.ts</code> 从同一份数据按故事线重排,服务 #3 故事工艺。<b>一个 item/场景同时挂两条线 = 现成的线索碰撞;</b>矩阵里同一天多线亮起=碰撞日,某线长期不亮=偏薄。配合 <code>red-dust-script-compendium</code>(按天全文)+ <code>narrative-tension-diagnosis.html</code>(C1–C6 缺口)使用。</p>
${H.join("\n")}
<div class="foot">下一步(#3):「最长空档大 / 活跃低」的线=偏薄,优先补 reversal/reveal/rupture/loss;碰撞日把两线真正撞出后果,并在新碰撞点挂合规两难(新 N-item)。</div>
</div></body></html>`;
}

writeFileSync("design/red-dust-thread-view.md", md(), "utf8");
writeFileSync("design/red-dust-thread-view.html", html(), "utf8");
console.log(`thread view written:
  design/red-dust-thread-view.md
  design/red-dust-thread-view.html`);
for (const t of THREADS) { const g = gaps(t); console.log(`  ${t.key} ${t.label}  beats=${g.n} span=${g.span} maxGap=${g.maxGap}`); }
