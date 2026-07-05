// 🟢 wk4 — the decorrelation dataset (◆S3 → 🔵 Stage 2). Runs agents × seeds, computes each run's
// (S = short-horizon social, L = long-horizon consistency) via the SAME functions the trace export
// uses (traceExport.computeShortSocial/computeLongConsistency = wk1-deliverables §B), aggregates per
// agent, ranks on each axis, and emits the DecorrelationDataset contract + a rank-reversal table.
//   npm run bench:decorrelate                              # deterministic agents on red-dust-v2, seeds 1-3
//   npm run bench:decorrelate -- --scenario=red-dust-v1
//   npm run bench:decorrelate -- --agents=planner,deepseek --seeds=1,2   # deepseek needs DEEPSEEK_API_KEY
// The dataset core (rows/pearson/ranks) is byte-reproducible; only `generatedAt` varies (contract §C3),
// so it is left empty by default (byte-stable fixture) — pass --now=<iso> to stamp a real time.
import "./loadEnv";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolveAgent } from "../src/engine/agents/registry";
import { runScenario } from "../src/engine/runScenario";
import { scenarios, redDustV2 } from "../src/engine/scenario";
import { computeLongConsistency, computeShortSocial } from "../src/engine/traceExport";
import { deepseekStats, resetDeepseekStats, setDeepseekCache } from "../src/engine/agents/deepseekClient";
import { fileCache } from "./deepseekCache";
import { DECORRELATION_DATASET_VERSION, RANK_FLIP_THRESHOLD } from "../src/engine/contracts";
import type { DecorrelationDataset, DecorrelationRow } from "../src/engine/contracts";
import type { RelationshipQuality } from "../src/engine/types";

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
const outDir = strArg("out", "bench/fixtures/decorrelation");
// --label suffixes the output filename so a cross-model/authoritative run does NOT overwrite the
// byte-reproducible deterministic fixture (red-dust-v2.json). e.g. --label=authoritative → red-dust-v2-authoritative.json
const label = strArg("label", "");
// wk8 compute discipline: install the file-backed response cache unless DEEPSEEK_NO_CACHE=1. Lets a
// batched run add seeds without re-billing seed-1 calls, and lets the audit re-derive for free.
if (process.env.DEEPSEEK_NO_CACHE !== "1") setDeepseekCache(fileCache);
resetDeepseekStats();

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const sd = (xs: number[]) => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
};
const round1 = (x: number) => Math.round(x * 10) / 10;
const round2 = (x: number) => Math.round(x * 100) / 100;

function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 2) return 0;
  const mx = mean(xs);
  const my = mean(ys);
  let cov = 0;
  let vx = 0;
  let vy = 0;
  for (let i = 0; i < n; i++) {
    cov += (xs[i] - mx) * (ys[i] - my);
    vx += (xs[i] - mx) ** 2;
    vy += (ys[i] - my) ** 2;
  }
  return vx === 0 || vy === 0 ? 0 : cov / Math.sqrt(vx * vy);
}

// Fractional ranks (ties share the average rank) so Spearman is well-defined under ties.
function ranksAscending(xs: number[]): number[] {
  const idx = xs.map((x, i) => ({ x, i })).sort((a, b) => a.x - b.x);
  const r = new Array<number>(xs.length);
  let k = 0;
  while (k < idx.length) {
    let j = k;
    while (j + 1 < idx.length && idx[j + 1].x === idx[k].x) j++;
    const avg = (k + j) / 2 + 1; // 1-based average rank for the tie group
    for (let t = k; t <= j; t++) r[idx[t].i] = avg;
    k = j + 1;
  }
  return r;
}
const spearman = (xs: number[], ys: number[]) => pearson(ranksAscending(xs), ranksAscending(ys));

// competition rank (1 = best) on a DESC-sorted value, ties share the smaller rank.
function competitionRankDesc(values: number[]): number[] {
  const order = values.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
  const rank = new Array<number>(values.length);
  order.forEach((o, pos) => {
    rank[o.i] = pos > 0 && order[pos - 1].v === o.v ? rank[order[pos - 1].i] : pos + 1;
  });
  return rank;
}

const prettyLabel = (id: string) => id.split(/[-_]/).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("-");
const family = (id: string) => id.split(/[-_]/)[0];

type PerAgent = {
  agentId: string;
  short: number[];
  long: number[];
  shortDecomp: ReturnType<typeof computeShortSocial>[];
  longDecomp: ReturnType<typeof computeLongConsistency>[];
  endings: Record<string, number>;
  integrity: number[];
  comprehension: (number | null)[];
  pup: number[];
  relationship: RelationshipQuality[];
};

const perAgent: PerAgent[] = [];
console.log(`\n=== decorrelation: ${agentIds.length} agents × ${seeds.length} seeds on ${scenarioId} ===`);
for (const agentId of agentIds) {
  const agent = resolveAgent(agentId);
  const acc: PerAgent = { agentId, short: [], long: [], shortDecomp: [], longDecomp: [], endings: {}, integrity: [], comprehension: [], pup: [], relationship: [] };
  for (const seed of seeds) {
    const run = await runScenario(agent, scenario, seed);
    const s = computeShortSocial(run, scenario);
    const l = computeLongConsistency(run, scenario);
    acc.short.push(s.value);
    acc.long.push(l.value);
    acc.shortDecomp.push(s);
    acc.longDecomp.push(l);
    acc.endings[run.endingId] = (acc.endings[run.endingId] ?? 0) + 1;
    acc.integrity.push(run.score.narrativeParts.integrity);
    acc.comprehension.push(run.score.narrativeParts.comprehension);
    acc.pup.push(run.score.narrativeParts.pup);
    acc.relationship.push(run.score.relationshipQuality);
  }
  perAgent.push(acc);
  console.log(`  ${agentId.padEnd(20)} S=${round1(mean(acc.short))} L=${round1(mean(acc.long))}`);
}

const shortMeans = perAgent.map((a) => mean(a.short));
const longMeans = perAgent.map((a) => mean(a.long));
const rankShort = competitionRankDesc(shortMeans);
const rankLong = competitionRankDesc(longMeans);
const modal = <T>(xs: T[]): T => {
  const c = new Map<T, number>();
  for (const x of xs) c.set(x, (c.get(x) ?? 0) + 1);
  return [...c.entries()].sort((a, b) => b[1] - a[1])[0][0];
};
const meanNullable = (xs: (number | null)[]) => {
  const v = xs.filter((x): x is number => x !== null);
  return v.length ? round2(mean(v)) : null;
};

const rows: DecorrelationRow[] = perAgent.map((a, i) => {
  const sMean = mean(a.short);
  const lMean = mean(a.long);
  const rd = rankLong[i] - rankShort[i];
  const sd0 = a.shortDecomp[0];
  const ld0 = a.longDecomp[0];
  return {
    agentId: a.agentId,
    label: prettyLabel(a.agentId),
    family: family(a.agentId),
    seeds,
    nSeeds: seeds.length,
    short: {
      value: round1(sMean),
      sd: round2(sd(a.short)),
      comprehensionEarly: meanNullable(a.shortDecomp.map((d) => d.comprehensionEarly)),
      pupEarly: round2(mean(a.shortDecomp.map((d) => d.pupEarly))),
      window: sd0.window
    },
    long: {
      value: round1(lMean),
      sd: round2(sd(a.long)),
      integrity: round2(mean(a.longDecomp.map((d) => d.integrity))),
      keptRate: round2(mean(a.longDecomp.map((d) => d.keptRate))),
      claimedCount: Math.round(mean(a.longDecomp.map((d) => d.claimedCount))),
      pupDrift: round2(mean(a.longDecomp.map((d) => d.pupDrift))),
      relationshipOK: (mean(a.longDecomp.map((d) => d.relationshipOK)) >= 0.5 ? 1 : 0) as 0 | 1,
      dignitySlope: round1(mean(a.longDecomp.map((d) => d.dignitySlope)))
    },
    rankShort: rankShort[i],
    rankLong: rankLong[i],
    rankDelta: rd,
    flips: Math.abs(rd) >= RANK_FLIP_THRESHOLD,
    endingMix: a.endings,
    headline: {
      integrity: round2(mean(a.integrity)),
      comprehension: meanNullable(a.comprehension),
      pup: round2(mean(a.pup)),
      relationshipQuality: modal(a.relationship)
    }
  };
});

// Rank-reversal pairs: S(a) > S(b) but L(a) < L(b) — the "short-strong / long-weak" swaps we want to show.
const rankReversalPairs: DecorrelationDataset["rankReversalPairs"] = [];
for (let i = 0; i < rows.length; i++) {
  for (let j = 0; j < rows.length; j++) {
    if (i === j) continue;
    if (rows[i].short.value > rows[j].short.value && rows[i].long.value < rows[j].long.value) {
      rankReversalPairs.push({ a: rows[i].agentId, b: rows[j].agentId, note: `${rows[i].label} beats ${rows[j].label} short (${rows[i].short.value}>${rows[j].short.value}) but trails long (${rows[i].long.value}<${rows[j].long.value})` });
    }
  }
}

const dataset: DecorrelationDataset = {
  decorrelationDatasetVersion: DECORRELATION_DATASET_VERSION,
  scenarioId,
  scenarioVersion: scenario.version,
  contentVersion: "unfrozen",
  scorerVersion: "0.5.1",
  generatedAt: strArg("now", ""), // byte-stable fixture by default; --now=<iso> stamps a real time
  models: agentIds,
  seeds,
  axes: {
    short: { id: "short_horizon_social", label: "短程社交", description: "早窗(前 θ·地平线) 理解 + PUP", range: [0, 100] },
    long: { id: "long_horizon_consistency", label: "长程一致性", description: "L-v2 结局耐久性(0.55·durability 读 relationshipQuality) + 守诺 faith(0.45·mean(integrity低T门,keptRate,1−drift,dignity)) · L-v2.1 spacing (2026-07-04 用户裁定)", range: [0, 100] }
  },
  pearson: round2(pearson(shortMeans, longMeans)),
  spearman: round2(spearman(shortMeans, longMeans)),
  rows,
  rankReversalPairs
};

mkdirSync(outDir, { recursive: true });
const file = `${outDir}/${scenarioId}${label ? `-${label}` : ""}.json`;
writeFileSync(file, JSON.stringify(dataset, null, 2));

// ---- readable table ----
const pad = (s: string | number, n: number) => String(s).padEnd(n);
console.log(`\nagent                S      L      rkS  rkL  Δ    flip  ending mix`);
console.log("-".repeat(78));
for (const r of [...rows].sort((a, b) => a.rankShort - b.rankShort)) {
  const mix = Object.entries(r.endingMix).map(([e, c]) => `${e}×${c}`).join(",");
  console.log(pad(r.label, 20) + pad(r.short.value, 7) + pad(r.long.value, 7) + pad(r.rankShort, 5) + pad(r.rankLong, 5) + pad(r.rankDelta >= 0 ? `+${r.rankDelta}` : r.rankDelta, 5) + pad(r.flips ? "⚑" : "", 6) + mix);
}
console.log(`\ncorr(S,L): pearson ${dataset.pearson}  spearman ${dataset.spearman}   (near 0 ⇒ decorrelated)`);
console.log(`rank-reversal pairs (short-strong / long-weak): ${rankReversalPairs.length}`);
for (const p of rankReversalPairs) console.log(`  • ${p.note}`);
const apiCalls = deepseekStats.hits + deepseekStats.misses;
if (apiCalls > 0) console.log(`\nDeepSeek calls: ${deepseekStats.misses} live + ${deepseekStats.hits} cached = ${apiCalls} total`);
console.log(`\n→ ${file}\n`);
