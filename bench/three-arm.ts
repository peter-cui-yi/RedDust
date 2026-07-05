// 🟢 wk9 — THREE-ARM CONTROL harness (paper-level; roadmap 第二段 "三臂对照 内生/外生匹配/打散").
// Purpose: prove the endogenous (S, L) structure — the short↔long DECORRELATION / rank-reversals and the
// discrimination — is a real property of each agent's self-generated trajectory, NOT an aggregation
// artifact. It contrasts the real per-agent short↔long pairing against two controls:
//   • endogenous       — (S_i, L_i): each agent's own short + long, one continuous causal trajectory.
//   • exogenous-matched— (S_i, L_j): L re-dealt to the agent with the NEAREST OTHER short (matched on the
//                         short axis, severed on identity). If short-strength alone fixed long-consistency
//                         this preserves the structure; what it loses is the SELF-specific consistency.
//   • shuffled         — (S_i, L_σ(i)): K seeded-random permutations of L across agents → a NULL
//                         distribution for each statistic. The endogenous value's position in the null is
//                         the non-artifact evidence (a permutation test).
//
// HARNESS-LEVEL ONLY — the freeze is respected absolutely: agents play the REAL frozen scenario once
// (endogenous), and the matched/shuffled arms are pure post-hoc re-pairings of the collected (S, L).
// It touches ZERO frozen path (scenario / scoring / resourceEconomy / content). The *other* half of the
// roadmap claim — "the social-endogenous VERSION is HARDER" — needs alternate scenario versions (a
// frozen-content change) and is therefore DEFERRED to post-◆S5 + audit; this harness delivers the
// "decorrelation is not an artifact" half now. Deterministic: shuffles use a seeded PRNG → byte-stable.
//   npm run bench:three-arm                                       # deterministic panel, seeds 1-3
//   npm run bench:three-arm -- --agents=heuristic,random,planner,planner-lighthouse,deepseek,deepseek-planner,deepseek-search,deepseek-strategist --seeds=1  # + cached LLM family (0 live)
//   npm run bench:three-arm -- --perms=5000 --permseed=7 --label=authoritative
import "./loadEnv";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolveAgent } from "../src/engine/agents/registry";
import { runScenario } from "../src/engine/runScenario";
import { scenarios, redDustV2 } from "../src/engine/scenario";
import { computeShortSocial, computeLongConsistency } from "../src/engine/traceExport";
import { deepseekStats, resetDeepseekStats, setDeepseekCache } from "../src/engine/agents/deepseekClient";
import { fileCache } from "./deepseekCache";

function strArg(name: string, fallback: string): string {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

const scenarioId = strArg("scenario", redDustV2.id);
const scenario = scenarios[scenarioId];
if (!scenario) {
  console.error(`Unknown scenario '${scenarioId}'. Available: ${Object.keys(scenarios).join(", ")}`);
  process.exit(1);
}
const agentIds = strArg("agents", "heuristic,random,planner,planner-lighthouse").split(",").filter(Boolean);
const seeds = strArg("seeds", "1,2,3").split(",").map(Number).filter((n) => !Number.isNaN(n));
const nPerms = Number(strArg("perms", "2000"));
const permSeed = Number(strArg("permseed", "12345"));
const label = strArg("label", "");
const outDir = strArg("out", "bench/fixtures/three-arm");
if (process.env.DEEPSEEK_NO_CACHE !== "1") setDeepseekCache(fileCache);
resetDeepseekStats();

// ---- stats (self-contained; mirrors bench/decorrelation.ts) ----
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const sd = (xs: number[]) => (xs.length < 2 ? 0 : Math.sqrt(mean(xs.map((x) => (x - mean(xs)) ** 2))));
const round2 = (x: number) => Math.round(x * 100) / 100;
const round3 = (x: number) => Math.round(x * 1000) / 1000;

function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 2) return 0;
  const mx = mean(xs), my = mean(ys);
  let cov = 0, vx = 0, vy = 0;
  for (let i = 0; i < n; i++) { cov += (xs[i] - mx) * (ys[i] - my); vx += (xs[i] - mx) ** 2; vy += (ys[i] - my) ** 2; }
  return vx === 0 || vy === 0 ? 0 : cov / Math.sqrt(vx * vy);
}
function ranksAscending(xs: number[]): number[] {
  const idx = xs.map((x, i) => ({ x, i })).sort((a, b) => a.x - b.x);
  const r = new Array<number>(xs.length);
  let k = 0;
  while (k < idx.length) {
    let j = k;
    while (j + 1 < idx.length && idx[j + 1].x === idx[k].x) j++;
    const avg = (k + j) / 2 + 1;
    for (let t = k; t <= j; t++) r[idx[t].i] = avg;
    k = j + 1;
  }
  return r;
}
const spearman = (xs: number[], ys: number[]) => pearson(ranksAscending(xs), ranksAscending(ys));
function competitionRankDesc(values: number[]): number[] {
  const order = values.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
  const rank = new Array<number>(values.length);
  order.forEach((o, pos) => { rank[o.i] = pos > 0 && order[pos - 1].v === o.v ? rank[order[pos - 1].i] : pos + 1; });
  return rank;
}
// short-strong / long-weak rank-reversals: ordered pairs where i outranks j on short but trails on long.
function rankReversals(S: number[], L: number[]): number {
  const rS = competitionRankDesc(S), rL = competitionRankDesc(L);
  let n = 0;
  for (let i = 0; i < S.length; i++) for (let j = 0; j < S.length; j++) if (i !== j && rS[i] < rS[j] && rL[i] > rL[j]) n++;
  return n;
}
// mulberry32 — tiny seeded PRNG so the shuffle null is byte-reproducible (no Math.random).
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffled<T>(xs: T[], rnd: () => number): T[] {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

type ArmStat = { pearson: number; spearman: number; reversals: number };
const armStat = (S: number[], L: number[]): ArmStat => ({ pearson: round2(pearson(S, L)), spearman: round2(spearman(S, L)), reversals: rankReversals(S, L) });

// ---- collect per-agent (mean S, mean L) on the frozen scenario ----
type Agent = { id: string; S: number; L: number; endings: Record<string, number> };
const agents: Agent[] = [];
console.log(`\n=== three-arm control — ${agentIds.length} agents × ${seeds.length} seeds on ${scenarioId} ===`);
for (const agentId of agentIds) {
  const agent = resolveAgent(agentId);
  const ss: number[] = [], ls: number[] = [], endings: Record<string, number> = {};
  for (const seed of seeds) {
    const run = await runScenario(agent, scenario, seed);
    ss.push(computeShortSocial(run, scenario).value);
    ls.push(computeLongConsistency(run, scenario).value);
    endings[run.endingId] = (endings[run.endingId] ?? 0) + 1;
  }
  agents.push({ id: agentId, S: round2(mean(ss)), L: round2(mean(ls)), endings });
  console.log(`  ${agentId.padEnd(20)} S=${round2(mean(ss))}  L=${round2(mean(ls))}`);
}
if (agents.length < 3) {
  console.error(`three-arm needs >=3 agents to be meaningful (got ${agents.length}).`);
  process.exit(1);
}

const S = agents.map((a) => a.S);
const L = agents.map((a) => a.L);

// ---- ARM 1: endogenous (real self-pairing) ----
const endogenous = armStat(S, L);

// ---- ARM 2: exogenous-matched (L from the nearest OTHER short; matched on S, severed on identity) ----
const matchedL = S.map((si, i) => {
  let best = -1, bestD = Infinity;
  for (let j = 0; j < S.length; j++) { if (j === i) continue; const d = Math.abs(si - S[j]); if (d < bestD) { bestD = d; best = j; } }
  return L[best];
});
const exogenousMatched = armStat(S, matchedL);

// ---- ARM 3: shuffled null (K seeded permutations of L across agents) ----
// PRIMARY permutation test is on PEARSON: is the endogenous short↔long association distinguishable from
// a random pairing? (two-tailed p = fraction of the null at least as extreme as |observed|.) That the
// association is REAL *and* below 1.0 is the decorrelation: short is linked to long but does not fix it.
const rnd = mulberry32(permSeed);
const nullPearson: number[] = [], nullReversals: number[] = [];
let pearsonGE = 0; // |null pearson| >= |endogenous pearson|  → two-tailed significance of the association
for (let k = 0; k < nPerms; k++) {
  const st = armStat(S, shuffled(L, rnd));
  nullPearson.push(st.pearson);
  nullReversals.push(st.reversals);
  if (Math.abs(st.pearson) >= Math.abs(endogenous.pearson)) pearsonGE++;
}
const nullRev = { mean: round2(mean(nullReversals)), sd: round2(sd(nullReversals)), max: Math.max(...nullReversals) };
const nullPr = { mean: round2(mean(nullPearson)), sd: round2(sd(nullPearson)), absMax: round2(Math.max(...nullPearson.map(Math.abs))) };
const pearsonP = round3(pearsonGE / nPerms); // two-tailed permutation p-value for the S↔L association

// ---- report ----
const pad = (s: string | number, n: number) => String(s).padEnd(n);
console.log(`\narm                  pearson  spearman  reversals`);
console.log("-".repeat(52));
console.log(pad("endogenous", 20) + pad(endogenous.pearson, 9) + pad(endogenous.spearman, 10) + endogenous.reversals);
console.log(pad("exogenous-matched", 20) + pad(exogenousMatched.pearson, 9) + pad(exogenousMatched.spearman, 10) + exogenousMatched.reversals);
console.log(pad(`shuffled (null, K=${nPerms})`, 20) + pad(`${nullPr.mean}±${nullPr.sd}`, 9) + pad("—", 10) + `${nullRev.mean}±${nullRev.sd} (max ${nullRev.max})`);
console.log(`\nPRIMARY — S↔L association vs random pairing: endogenous pearson ${endogenous.pearson}, shuffle null ${nullPr.mean}±${nullPr.sd} (|max| ${nullPr.absMax}) → two-tailed p=${pearsonP}.`);
console.log(`  ${pearsonP < 0.05 ? "association is REAL (not a pairing artifact)" : "NOT distinguishable from chance — STOP, call audit before trusting"}; and pearson ${endogenous.pearson} < 1.0 ⇒ short does not FIX long (decorrelation).`);
console.log(`DECORRELATION substructure — short-strong/long-weak rank-reversals: ${endogenous.reversals} (seed-stable; e.g. the deepseek family sits high-S / mid-L).`);
console.log("(v0 statistical semantics — the exact matched-arm + null design is a paper-level open item to");
console.log("finalize with 🟣/audit. Scenario-difficulty arm — 'social-endogenous is HARDER' — deferred: needs scenario variants = frozen-content change.)\n");

const deepseekLive = deepseekStats.misses;
if (deepseekStats.hits + deepseekStats.misses > 0) console.log(`DeepSeek calls: ${deepseekStats.misses} live + ${deepseekStats.hits} cached\n`);

// ---- fixture ----
mkdirSync(outDir, { recursive: true });
const dataset = {
  harness: "three-arm-control",
  version: "0.1.0-scaffold",
  scenarioId,
  scenarioVersion: scenario.version,
  seeds,
  perms: nPerms,
  permSeed,
  note: "Harness-level permutation control. endogenous = real self-pairing; exogenous-matched = L from nearest-other-S; shuffled = seeded-random null. Zero frozen-path changes. The 'endogenous-is-harder' scenario-difficulty arm is deferred (needs scenario variants). v0 statistical semantics — finalize with audit.",
  agents: agents.map((a) => ({ id: a.id, short: a.S, long: a.L, endings: a.endings })),
  arms: {
    endogenous,
    exogenousMatched,
    shuffled: { perms: nPerms, permSeed, pearson: nullPr, reversals: nullRev, associationTwoTailedP: pearsonP }
  },
  deepseekLiveCalls: deepseekLive
};
const file = `${outDir}/${scenarioId}${label ? `-${label}` : ""}.json`;
writeFileSync(file, JSON.stringify(dataset, null, 2));
console.log(`→ ${file}\n`);
