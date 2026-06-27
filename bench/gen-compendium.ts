// One-off doc generator (read-only over the data modules): compiles ALL current script text
// — scenes (dialogue/narration), the 12 dilemmas (prompt+options+probe), task narration, and
// delayed consequences — organized Day 0→12, into BOTH a Markdown and an HTML "story bible".
// Run:  ./node_modules/.bin/esbuild bench/gen-compendium.ts --bundle --platform=node --format=esm --packages=external --outfile=.bench/gen.mjs --log-level=warning && node .bench/gen.mjs
import { writeFileSync } from "node:fs";
import { storyScenes } from "../src/data/storySceneData";
import { storyConsequences } from "../src/data/storyConsequenceData";
import { tasks, locationLabels } from "../src/data/taskData";
import { dayPlans } from "../src/data/dayPlanData";
import { narrativeItems } from "../src/engine/narrativeItems";
import type { MetricKey } from "../src/data/types";

const NAME: Record<string, string> = {
  ma_dehai: "马德海", shen_zhiyue: "沈知月", xiao_tie: "小铁", lao_qian: "老钱",
  aura: "AURA", system: "系统", residents: "居民"
};
const nm = (id: string) => NAME[id] ?? id;
const TIMING: Record<string, string> = {
  prologue: "序章", day_start: "日初", pre_task: "任务前", post_task: "任务后",
  day_end: "日终", branch_debate: "分支辩论", ending: "结局"
};
const BRANCH: Record<string, string> = { common: "公共线", rescue: "救援线", lighthouse: "灯塔线" };
const OUTCOME: Record<string, string> = { success: "成功", partial: "部分", failed: "失败", missing: "未做", any: "任意" };
const ORDER = ["prologue", "day_start", "pre_task", "post_task", "branch_debate", "day_end", "ending"];
const DAYS = Array.from({ length: 13 }, (_, d) => d); // 0..12

const scenesOf = (d: number) => storyScenes.filter((s) => s.day === d).sort((a, b) => ORDER.indexOf(a.timing) - ORDER.indexOf(b.timing));
const itemsOf = (d: number) => narrativeItems.filter((i) => i.day === d);
const tasksOf = (d: number) => tasks.filter((t) => t.day === d);
const affectsStr = (a: Partial<Record<MetricKey, number>> = {}) =>
  (Object.entries(a) as Array<[MetricKey, number]>).filter(([, v]) => v).map(([k, v]) => `${k}${v >= 0 ? "+" : ""}${v}`).join(" ");

// ---------- Markdown ----------
function md(): string {
  const L: string[] = [];
  L.push("# 红尘 Red Dust · 剧本全文汇编(逐字)");
  L.push("");
  L.push("> 本文件由 `bench/gen-compendium.ts` 从数据文件自动抽取(场景 / 12 道两难 / 任务旁白 / 延迟后果),非手写,改剧情请改数据源后重新生成。");
  L.push("> 每天顺序:**场景(对白/旁白) → 两难(选项原文 + 理解探针) → 任务旁白 → 延迟后果**。");
  L.push("");
  for (const d of DAYS) {
    const plan = dayPlans.find((p) => p.day === d);
    const scenes = scenesOf(d), items = itemsOf(d), dts = tasksOf(d);
    if (!plan && !scenes.length && !items.length && !dts.length) continue;
    L.push(`\n---\n\n## Day ${d}${plan ? ` · ${plan.title}` : ""}`);
    if (plan?.narrative) L.push(`\n${plan.narrative}`);
    if (plan?.briefing) L.push(`\n**简报:** ${plan.briefing}`);
    if (plan?.taskIntro) L.push(`\n**任务引子:** ${plan.taskIntro}`);

    if (scenes.length) {
      L.push(`\n### 场景`);
      for (const s of scenes) {
        const tags = [TIMING[s.timing], s.branch && s.branch !== "common" ? BRANCH[s.branch] : "", s.location ? locationLabels[s.location] : ""].filter(Boolean).join(" / ");
        L.push(`\n#### 〔${tags}〕${s.title}`);
        if (s.characters?.length) L.push(`*在场:* ${s.characters.map(nm).join("、")}`);
        if (s.summary) L.push(`\n${s.summary}`);
        if (s.worldFacts?.length) { L.push(`\n*世界设定:*`); for (const w of s.worldFacts) L.push(`- ${w}`); }
        if (s.dialogue?.length) {
          L.push(`\n*对白:*`);
          for (const ln of s.dialogue) L.push(`- **${nm(ln.speaker)}**:「${ln.text}」${ln.tone ? ` _(${ln.tone})_` : ""}`);
        }
        if (s.setsFlags?.length) L.push(`\n*建立旗标:* ${s.setsFlags.map((f) => `\`${f.key}=${f.value}\``).join(" ")}`);
      }
    }

    if (items.length) {
      L.push(`\n### 价值两难`);
      for (const it of items) {
        const b = it.branch && it.branch !== "common" ? ` 〔${BRANCH[it.branch]}专属〕` : "";
        L.push(`\n#### ${it.id} · ${it.title}${b}`);
        L.push(`**情境:** ${it.prompt}`);
        L.push(`\n*选项(a=价值恰当度 0–2,m=贪心诱惑 0–1):*`);
        for (const o of it.options as any[]) {
          const c = o.commitments?.length ? `  ⟨承诺:${o.commitments.join(", ")}⟩` : "";
          L.push(`- **${o.id}** (a=${o.a}, m=${o.m}):${o.text}${c}`);
        }
        if ((it as any).understandingGold) L.push(`\n*理解金标:* ${(it as any).understandingGold}`);
        const p = (it as any).probe;
        if (p) {
          L.push(`\n*理解探针:* ${p.question}`);
          for (const st of p.statements) L.push(`- ${st.correct ? "✅ 真" : "❌ 假"} — ${st.text}`);
          if (p.goldKeyPoints?.length) L.push(`*金标要点:* ${p.goldKeyPoints.join(" / ")}`);
        }
      }
    }

    if (dts.length) {
      L.push(`\n### 任务旁白`);
      const ids = new Set(dts.map((t) => t.id));
      for (const t of dts) {
        L.push(`\n#### ${t.id} · ${t.title} 〔${t.category} / ${locationLabels[t.location]}〕`);
        L.push(`**目标:** ${t.objective}`);
        if (t.executionText) L.push(`**执行:** ${t.executionText}`);
        if (t.successText) L.push(`**成功:** ${t.successText}`);
        if (t.failureText) L.push(`**失败:** ${t.failureText}`);
        if (t.deferredConsequence) L.push(`**拖延后果:** ${t.deferredConsequence}`);
        const mech = [`默认结果=${OUTCOME[t.demoOutcome]}`, affectsStr(t.affects) && `影响:${affectsStr(t.affects)}`, t.branchAffinity && t.branchAffinity !== "neutral" && `偏向:${BRANCH[t.branchAffinity]}`].filter(Boolean).join(" · ");
        if (mech) L.push(`<sub>机制:${mech}</sub>`);
      }
      const cons = storyConsequences.filter((c) => ids.has(c.sourceTaskId));
      if (cons.length) {
        L.push(`\n### 延迟后果`);
        for (const c of cons) {
          L.push(`\n- **${c.sourceTaskId} → ${OUTCOME[c.outcome]}:** ${c.summary}`);
          if (c.replaySummary && c.replaySummary !== c.summary) L.push(`  - 回放:${c.replaySummary}`);
          for (const r of c.relationshipDeltas ?? []) L.push(`  - ${nm(r.characterId)}(信任${(r.trustDelta ?? 0) >= 0 ? "+" : ""}${r.trustDelta ?? 0}):${r.note}`);
          if (c.setsFlags?.length) L.push(`  - 旗标:${c.setsFlags.map((f) => `\`${f.key}=${f.value}\``).join(" ")}`);
        }
      }
    }
    if (plan?.endOfDaySummary) L.push(`\n> **日终:** ${plan.endOfDaySummary}`);
  }
  L.push("\n\n---\n*结局专属收尾文案(五种结局)在 `src/game/systems/agentRunner.ts` 内,非本数据层文本,未收录于此。*");
  return L.join("\n");
}

// ---------- HTML ----------
const esc = (s = "") => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function html(): string {
  const H: string[] = [];
  for (const d of DAYS) {
    const plan = dayPlans.find((p) => p.day === d);
    const scenes = scenesOf(d), items = itemsOf(d), dts = tasksOf(d);
    if (!plan && !scenes.length && !items.length && !dts.length) continue;
    H.push(`<section class="day"><h2>Day ${d}${plan ? ` · ${esc(plan.title)}` : ""}</h2>`);
    if (plan?.narrative) H.push(`<p class="nar">${esc(plan.narrative)}</p>`);
    if (plan?.briefing) H.push(`<p class="meta"><b>简报</b> ${esc(plan.briefing)}</p>`);

    for (const s of scenes) {
      const tags = [TIMING[s.timing], s.branch && s.branch !== "common" ? BRANCH[s.branch] : "", s.location ? locationLabels[s.location] : ""].filter(Boolean);
      H.push(`<div class="scene"><div class="sh"><span class="tags">${tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</span><b>${esc(s.title)}</b></div>`);
      if (s.characters?.length) H.push(`<div class="cast">在场:${s.characters.map(nm).map(esc).join("、")}</div>`);
      if (s.summary) H.push(`<p class="sum">${esc(s.summary)}</p>`);
      if (s.worldFacts?.length) H.push(`<ul class="facts">${s.worldFacts.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>`);
      if (s.dialogue?.length) H.push(`<div class="dlg">${s.dialogue.map((l) => `<p><span class="spk">${esc(nm(l.speaker))}</span><span class="line">「${esc(l.text)}」</span>${l.tone ? `<span class="tone">${esc(l.tone)}</span>` : ""}</p>`).join("")}</div>`);
      if (s.setsFlags?.length) H.push(`<div class="flags">建立旗标 ${s.setsFlags.map((f) => `<code>${esc(f.key)}=${esc(String(f.value))}</code>`).join(" ")}</div>`);
      H.push(`</div>`);
    }

    for (const it of items) {
      const b = it.branch && it.branch !== "common" ? `<span class="tag br">${BRANCH[it.branch]}专属</span>` : "";
      H.push(`<div class="dil"><div class="dh"><span class="nid">${esc(it.id)}</span> ${esc(it.title)} ${b}</div>`);
      H.push(`<p class="prompt"><b>情境</b> ${esc(it.prompt)}</p><div class="opts">`);
      for (const o of it.options as any[]) {
        const c = o.commitments?.length ? `<span class="commit">承诺:${o.commitments.map(esc).join(", ")}</span>` : "";
        H.push(`<div class="opt"><span class="oid">${esc(o.id)}</span><span class="am">a=${o.a} · m=${o.m}</span><span class="otext">${esc(o.text)}</span>${c}</div>`);
      }
      H.push(`</div>`);
      if ((it as any).understandingGold) H.push(`<p class="gold"><b>理解金标</b> ${esc((it as any).understandingGold)}</p>`);
      const p = (it as any).probe;
      if (p) {
        H.push(`<div class="probe"><div class="pq"><b>理解探针</b> ${esc(p.question)}</div><ul class="stmts">`);
        for (const st of p.statements) H.push(`<li class="${st.correct ? "t" : "f"}">${st.correct ? "✅ 真" : "❌ 假"} — ${esc(st.text)}</li>`);
        H.push(`</ul>${p.goldKeyPoints?.length ? `<div class="kp">金标要点:${p.goldKeyPoints.map(esc).join(" / ")}</div>` : ""}</div>`);
      }
      H.push(`</div>`);
    }

    if (dts.length) {
      H.push(`<h3 class="sec">任务旁白</h3>`);
      const ids = new Set(dts.map((t) => t.id));
      for (const t of dts) {
        H.push(`<div class="task"><div class="th"><span class="nid">${esc(t.id)}</span> ${esc(t.title)} <span class="tag">${esc(t.category)}/${esc(locationLabels[t.location])}</span></div>`);
        H.push(`<p class="obj"><b>目标</b> ${esc(t.objective)}</p>`);
        if (t.executionText) H.push(`<p class="tx"><b>执行</b> ${esc(t.executionText)}</p>`);
        if (t.successText) H.push(`<p class="tx ok"><b>成功</b> ${esc(t.successText)}</p>`);
        if (t.failureText) H.push(`<p class="tx bad"><b>失败</b> ${esc(t.failureText)}</p>`);
        if (t.deferredConsequence) H.push(`<p class="tx"><b>拖延后果</b> ${esc(t.deferredConsequence)}</p>`);
        const mech = [`默认=${OUTCOME[t.demoOutcome]}`, affectsStr(t.affects) && `影响 ${affectsStr(t.affects)}`, t.branchAffinity && t.branchAffinity !== "neutral" && `偏向 ${BRANCH[t.branchAffinity]}`].filter(Boolean).join(" · ");
        if (mech) H.push(`<div class="mech">机制:${esc(mech)}</div>`);
        H.push(`</div>`);
      }
      const cons = storyConsequences.filter((c) => ids.has(c.sourceTaskId));
      if (cons.length) {
        H.push(`<h3 class="sec">延迟后果</h3>`);
        for (const c of cons) {
          H.push(`<div class="cons"><b>${esc(c.sourceTaskId)} → ${OUTCOME[c.outcome]}</b> ${esc(c.summary)}`);
          for (const r of c.relationshipDeltas ?? []) H.push(`<div class="rel">${esc(nm(r.characterId))}(信任${(r.trustDelta ?? 0) >= 0 ? "+" : ""}${r.trustDelta ?? 0}):${esc(r.note)}</div>`);
          if (c.setsFlags?.length) H.push(`<div class="flags">${c.setsFlags.map((f) => `<code>${esc(f.key)}=${esc(String(f.value))}</code>`).join(" ")}</div>`);
          H.push(`</div>`);
        }
      }
    }
    if (plan?.endOfDaySummary) H.push(`<div class="eod"><b>日终</b> ${esc(plan.endOfDaySummary)}</div>`);
    H.push(`</section>`);
  }
  const css = `
  :root{--bg:#f6f5f1;--surface:#fff;--ink:#1e2430;--muted:#5b6473;--line:#e4e1d8;--base:#42628f;--eval:#b8772a;--good:#2f8f73;--bad:#c0563f}
  *{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;line-height:1.7;font-size:15px}
  .wrap{max-width:920px;margin:0 auto;padding:38px 26px 80px}h1{font-size:27px;border-bottom:2px solid var(--ink);padding-bottom:14px}
  .intro{color:var(--muted);font-size:13.5px;margin:10px 0 8px}
  .day{margin:30px 0;border-top:2px solid var(--line);padding-top:8px}h2{font-size:22px;color:var(--base)}
  .nar{font-size:15.5px}.meta{font-size:13.5px;color:var(--muted)}.sec{font-size:14px;color:var(--eval);margin:18px 0 6px;letter-spacing:.5px}
  .scene{background:var(--surface);border:1px solid var(--line);border-left:4px solid var(--base);border-radius:10px;padding:12px 16px;margin:12px 0}
  .sh{font-size:15.5px;margin-bottom:4px}.tags{margin-right:6px}.tag{display:inline-block;background:#eef1f6;color:#4a5160;font-size:11px;padding:1px 7px;border-radius:10px;margin-right:3px}.tag.br{background:#f7efe2;color:var(--eval)}
  .cast{font-size:12px;color:var(--muted)}.sum{margin:6px 0}.facts{margin:4px 0;padding-left:18px;font-size:13px;color:#444}
  .dlg{margin:8px 0;padding:8px 12px;background:#faf9f5;border-radius:8px}.dlg p{margin:3px 0}.spk{font-weight:700;color:var(--base);margin-right:6px}.line{}.tone{font-size:11px;color:var(--muted);margin-left:6px}
  .flags{font-size:11.5px;color:var(--muted);margin-top:6px}code{background:#eee;padding:1px 5px;border-radius:4px;font-size:12px}
  .dil{background:var(--surface);border:1px solid var(--line);border-left:4px solid var(--good);border-radius:10px;padding:12px 16px;margin:12px 0}
  .dh{font-size:16px;font-weight:600}.nid{display:inline-block;background:var(--good);color:#fff;font-size:12px;font-weight:700;padding:1px 8px;border-radius:6px;margin-right:6px}
  .prompt{margin:6px 0}.opts{margin:6px 0}.opt{display:grid;grid-template-columns:28px 84px 1fr;gap:8px;align-items:baseline;padding:4px 0;border-top:1px dashed var(--line)}
  .oid{font-weight:700}.am{font-size:11.5px;color:var(--muted);font-family:ui-monospace,Menlo,monospace}.commit{display:block;grid-column:3;font-size:11.5px;color:var(--eval)}
  .gold{font-size:13px;background:#eef4fb;border-radius:6px;padding:4px 10px}
  .probe{margin-top:6px;font-size:13.5px}.pq{margin-bottom:3px}.stmts{margin:2px 0;padding-left:16px}.stmts li.t{color:#216b55}.stmts li.f{color:#9c4634}.kp{font-size:12px;color:var(--muted);margin-top:3px}
  .task{background:var(--surface);border:1px solid var(--line);border-radius:9px;padding:10px 14px;margin:8px 0}.th{font-weight:600}.obj{margin:4px 0}.tx{margin:3px 0;font-size:13.5px}.tx.ok{color:#216b55}.tx.bad{color:#9c4634}.mech{font-size:11.5px;color:var(--muted);margin-top:4px}
  .cons{font-size:13.5px;background:#faf7f2;border:1px solid var(--line);border-radius:8px;padding:8px 12px;margin:6px 0}.rel{font-size:12.5px;color:#555;margin-top:3px}
  .eod{margin-top:12px;font-size:13.5px;background:#eef1f6;border-radius:8px;padding:8px 12px}
  .foot{margin-top:30px;color:var(--muted);font-size:12px;border-top:1px solid var(--line);padding-top:12px}`;
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>红尘 · 剧本全文汇编(逐字)</title><style>${css}</style></head><body><div class="wrap">
<h1>红尘 Red Dust · 剧本全文汇编(逐字)</h1>
<p class="intro">由 <code>bench/gen-compendium.ts</code> 从数据文件自动抽取(场景 / 12 道两难 / 任务旁白 / 延迟后果),非手写。改剧情请改数据源后重新生成。每天顺序:场景 → 两难 → 任务旁白 → 延迟后果。</p>
${H.join("\n")}
<div class="foot">结局专属收尾文案(五种结局)在 <code>src/game/systems/agentRunner.ts</code> 内,属代码层文案,未收录于此。</div>
</div></body></html>`;
}

writeFileSync("design/red-dust-script-compendium.md", md(), "utf8");
writeFileSync("design/red-dust-script-compendium.html", html(), "utf8");
console.log(`compendium written:
  design/red-dust-script-compendium.md
  design/red-dust-script-compendium.html
counts: scenes=${storyScenes.length} dilemmas=${narrativeItems.length} tasks=${tasks.length} consequences=${storyConsequences.length}`);
