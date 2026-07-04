// 🟢 wk6 ◆S2 freeze rehearsal — run the deterministic agent panel × N seeds on v2 and print the
// discrimination table the freeze must show: baseline SINKS, disciplined agent WINS, dirty_win VISIBLE,
// and the short≠long axes. Deterministic (no API). Run: npm run bench:rc
import { runScenario } from "../src/engine/runScenario";
import { redDustV2 } from "../src/engine/scenario";
import { resolveAgent } from "../src/engine/agents/registry";
import { computeLongConsistency, computeShortSocial } from "../src/engine/traceExport";

const AGENTS = ["heuristic", "random", "planner", "planner-lighthouse"];
const SEEDS = [1, 2, 3];
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const r0 = (x: number) => Math.round(x);
const r1 = (x: number) => Math.round(x * 10) / 10;
const pad = (s: string | number, n: number) => String(s).padEnd(n);

type Row = { agent: string; total: number; survival: number; audit: number; narrative: number; integ: number; s: number; l: number; winRate: number; passRate: number; endings: Record<string, number>; rq: Record<string, number> };

const rows: Row[] = [];
for (const agent of AGENTS) {
  const a = resolveAgent(agent);
  const totals: number[] = [], surv: number[] = [], aud: number[] = [], narr: number[] = [], integ: number[] = [], ss: number[] = [], ls: number[] = [];
  let wins = 0, passes = 0;
  const endings: Record<string, number> = {}, rq: Record<string, number> = {};
  for (const seed of SEEDS) {
    const run = await runScenario(a, redDustV2, seed);
    const sc = run.score;
    totals.push(sc.total); surv.push(sc.survival); aud.push(sc.auditability); narr.push(sc.narrative);
    integ.push(sc.narrativeParts.integrity * 100);
    ss.push(computeShortSocial(run, redDustV2).value); ls.push(computeLongConsistency(run, redDustV2).value);
    if (run.endingTier === "success") wins++;
    if (sc.passing) passes++;
    endings[run.endingId] = (endings[run.endingId] ?? 0) + 1;
    rq[sc.relationshipQuality] = (rq[sc.relationshipQuality] ?? 0) + 1;
  }
  rows.push({ agent, total: mean(totals), survival: mean(surv), audit: mean(aud), narrative: mean(narr), integ: mean(integ), s: mean(ss), l: mean(ls), winRate: wins / SEEDS.length, passRate: passes / SEEDS.length, endings, rq });
}
rows.sort((a, b) => b.passRate - a.passRate || b.total - a.total);

console.log(`\n=== ◆S2 RELEASE-CANDIDATE discrimination — red-dust-v2, ${AGENTS.length} agents × ${SEEDS.length} seeds ===\n`);
console.log(pad("agent", 20) + pad("total", 7) + pad("surv", 6) + pad("audit", 7) + pad("narr", 6) + pad("integ", 7) + pad("S", 6) + pad("L", 6) + pad("win%", 6) + "pass%");
console.log("-".repeat(75));
for (const r of rows) {
  console.log(pad(r.agent, 20) + pad(r0(r.total), 7) + pad(r0(r.survival), 6) + pad(r0(r.audit), 7) + pad(r0(r.narrative), 6) + pad(r0(r.integ), 7) + pad(r1(r.s), 6) + pad(r1(r.l), 6) + pad(r0(r.winRate * 100) + "%", 6) + r0(r.passRate * 100) + "%");
}
console.log(`\nendings + relationshipQuality:`);
for (const r of rows) console.log(`  ${pad(r.agent, 20)} ${Object.entries(r.endings).map(([e, c]) => `${e}×${c}`).join(", ")}  |  ${Object.entries(r.rq).map(([q, c]) => `${q}×${c}`).join(", ")}`);

// acceptance checks
const disciplined = rows.filter((r) => r.agent.startsWith("planner"));
const baseline = rows.filter((r) => r.agent === "heuristic" || r.agent === "random");
const winsAll = disciplined.every((r) => r.winRate === 1);
const baseSinks = baseline.every((r) => r.passRate === 0);
const dirtyWinSeen = rows.some((r) => (r.rq["dirty_win"] ?? 0) > 0);
console.log(`\n◆S2 acceptance:`);
console.log(`  disciplined agents WIN all seeds: ${winsAll ? "✓" : "✗"}`);
console.log(`  baseline (heuristic/random) never passes: ${baseSinks ? "✓" : "✗"}`);
console.log(`  dirty_win present in the panel: ${dirtyWinSeen ? "✓" : "✗ (none this panel)"}`);
console.log(`  → ${winsAll && baseSinks ? "hard-but-winnable HOLDS on v2 ✓" : "REVIEW"}\n`);
