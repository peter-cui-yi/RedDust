// 🟢 wk5 charter workstream 1 — shared-item sensitivity (deterministic, zero API). Proves the
// decorrelation CONCLUSION (per-agent S/L ranking + the pearson) is robust, not an artifact of which
// items happen to be in the bank. Leave-one-out is EXACT here without re-runs: S/L are pure functions
// of the answered items, and generated items set no flags / don't change other answers — so dropping an
// item's answer from the set == that item never existing. Run: npm run bench:sensitivity
import { runScenario } from "../src/engine/runScenario";
import { redDustV2 } from "../src/engine/scenario";
import { resolveAgent } from "../src/engine/agents/registry";
import { computeLongConsistency, computeShortSocial } from "../src/engine/traceExport";
import { itemDayForScenario } from "../src/engine/narrativeItems";
import { allNarrativeItems } from "../src/engine/itemBank";
import type { RunResult } from "../src/engine/types";

const AGENTS = ["heuristic", "random", "planner", "planner-lighthouse"];
const SC = redDustV2;
const round1 = (x: number) => Math.round(x * 10) / 10;

// A RunResult with one item's answer/probe dropped — i.e. that item absent from the bank.
function withoutItem(run: RunResult, itemId: string): RunResult {
  return {
    ...run,
    dilemmaAnswers: run.dilemmaAnswers.filter((a) => a.itemId !== itemId),
    probeAnswers: run.probeAnswers.filter((p) => p.itemId !== itemId)
  };
}
const SL = (run: RunResult) => ({ s: computeShortSocial(run, SC).value, l: computeLongConsistency(run, SC).value });

// competition rank (1 = best) on desc value
function rankDesc(vals: Array<{ id: string; v: number }>): Map<string, number> {
  const order = [...vals].sort((a, b) => b.v - a.v);
  const r = new Map<string, number>();
  order.forEach((o, i) => r.set(o.id, i > 0 && order[i - 1].v === o.v ? r.get(order[i - 1].id)! : i + 1));
  return r;
}
function pearson(xs: number[], ys: number[]): number {
  const n = xs.length, mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let cov = 0, vx = 0, vy = 0;
  for (let i = 0; i < n; i++) { cov += (xs[i] - mx) * (ys[i] - my); vx += (xs[i] - mx) ** 2; vy += (ys[i] - my) ** 2; }
  return vx === 0 || vy === 0 ? 0 : Math.round((cov / Math.sqrt(vx * vy)) * 100) / 100;
}

// --- run every agent once, cache RunResult + base S/L ---
const runs = new Map<string, RunResult>();
for (const a of AGENTS) runs.set(a, await runScenario(resolveAgent(a), SC, 1));
const base = new Map(AGENTS.map((a) => [a, SL(runs.get(a)!)]));
const answeredIds = [...new Set(runs.get("planner")!.dilemmaAnswers.map((x) => x.itemId))];

const baseRankS = rankDesc(AGENTS.map((a) => ({ id: a, v: base.get(a)!.s })));
const baseRankL = rankDesc(AGENTS.map((a) => ({ id: a, v: base.get(a)!.l })));
const basePearson = pearson(AGENTS.map((a) => base.get(a)!.s), AGENTS.map((a) => base.get(a)!.l));

console.log(`\n=== shared-item sensitivity (v2, ${answeredIds.length} answered items, ${AGENTS.length} deterministic agents) ===`);
console.log("base (S,L):");
for (const a of AGENTS) console.log(`  ${a.padEnd(20)} S=${round1(base.get(a)!.s)} L=${round1(base.get(a)!.l)}  rankS=${baseRankS.get(a)} rankL=${baseRankL.get(a)}`);
console.log(`  pearson(S,L) = ${basePearson}`);

// --- leave-one-out: does ANY single item flip a ranking or move pearson materially? ---
let rankBreaks = 0;
let maxDS = 0, maxDL = 0, maxDP = 0;
let worstItem = "";
for (const id of answeredIds) {
  const looSL = new Map(AGENTS.map((a) => [a, SL(withoutItem(runs.get(a)!, id))]));
  const rS = rankDesc(AGENTS.map((a) => ({ id: a, v: looSL.get(a)!.s })));
  const rL = rankDesc(AGENTS.map((a) => ({ id: a, v: looSL.get(a)!.l })));
  const rankChanged = AGENTS.some((a) => rS.get(a) !== baseRankS.get(a) || rL.get(a) !== baseRankL.get(a));
  if (rankChanged) rankBreaks++;
  const dp = Math.abs(pearson(AGENTS.map((a) => looSL.get(a)!.s), AGENTS.map((a) => looSL.get(a)!.l)) - basePearson);
  for (const a of AGENTS) { maxDS = Math.max(maxDS, Math.abs(looSL.get(a)!.s - base.get(a)!.s)); const dl = Math.abs(looSL.get(a)!.l - base.get(a)!.l); if (dl > maxDL) { maxDL = dl; worstItem = id; } }
  maxDP = Math.max(maxDP, dp);
}
console.log(`\nleave-one-out (${answeredIds.length} items):`);
console.log(`  rankings changed by a single item: ${rankBreaks}/${answeredIds.length}  ${rankBreaks === 0 ? "→ ranking STABLE ✓" : "→ inspect"}`);
console.log(`  max |ΔS|=${round1(maxDS)}  max |ΔL|=${round1(maxDL)} (worst item ${worstItem})  max |Δpearson|=${maxDP}`);

// --- convergence: S/L trajectory as items accrue in day order (planner vs heuristic) ---
console.log(`\nconvergence (cumulative by v2-day; do S/L settle as the bank grows?):`);
const ordered = [...answeredIds].sort((a, b) => (itemDayForScenario(allNarrativeItems.find((i) => i.id === a)!, SC.id) ?? 0) - (itemDayForScenario(allNarrativeItems.find((i) => i.id === b)!, SC.id) ?? 0));
for (const a of ["planner", "heuristic"]) {
  const run = runs.get(a)!;
  const traj: string[] = [];
  for (const k of [Math.ceil(ordered.length / 3), Math.ceil((2 * ordered.length) / 3), ordered.length]) {
    const keep = new Set(ordered.slice(0, k));
    const sub = { ...run, dilemmaAnswers: run.dilemmaAnswers.filter((x) => keep.has(x.itemId)), probeAnswers: run.probeAnswers.filter((x) => keep.has(x.itemId)) };
    const v = SL(sub);
    traj.push(`k=${k}:(${round1(v.s)},${round1(v.l)})`);
  }
  console.log(`  ${a.padEnd(18)} ${traj.join("  →  ")}`);
}

// --- θ window coverage (does the late window have enough items for a stable drift signal?) ---
const eMax = Math.floor((1 / 3) * SC.finalDay), lMin = Math.floor((2 / 3) * SC.finalDay);
const days = answeredIds.map((id) => itemDayForScenario(allNarrativeItems.find((i) => i.id === id)!, SC.id) ?? 0);
console.log(`\nθ=1/3 window coverage (planner's answered set): early(day≤${eMax}) ${days.filter((d) => d <= eMax).length} items · late(day>${lMin}) ${days.filter((d) => d > lMin).length} items`);
console.log(`  (late window thickens as D21–27 generation fills; thin late window ⇒ noisier drift)\n`);
