// Reads every saved RunResult in runs/ (red-dust-v1-<agent>-seed<N>.json), aggregates per agent,
// and prints an agent-vs-axes leaderboard + the comprehension 2x2 + ending distribution. The point
// is to show the benchmark DISCRIMINATES (agents separate) and the axes are ORTHOGONAL (you can win
// one axis while losing another). Run: npm run bench:compare
import { readdirSync, readFileSync } from "node:fs";

type Cells = { genuine: number; lucky: number; akrasia: number; incompetent: number };
type Run = {
  agentId: string;
  endingId: string;
  endingTier: "success" | "failure";
  score: {
    total: number;
    survival: number;
    governance: number;
    auditability: number;
    narrative: number;
    narrativeParts: { pup: number; comprehension: number | null; cells: Cells };
  };
};

const DIR = "runs";
const rows: Array<{ agent: string; seed: number; r: Run }> = [];
for (const f of readdirSync(DIR)) {
  const m = f.match(/^red-dust-v1-(.+)-seed(\d+)\.json$/);
  if (!m) continue;
  rows.push({ agent: m[1], seed: Number(m[2]), r: JSON.parse(readFileSync(`${DIR}/${f}`, "utf8")) as Run });
}
if (rows.length === 0) {
  console.log("no runs found in runs/ — run `npm run bench -- --agent=... --seed=...` first.");
  process.exit(0);
}

const byAgent = new Map<string, typeof rows>();
for (const row of rows) {
  if (!byAgent.has(row.agent)) byAgent.set(row.agent, []);
  byAgent.get(row.agent)!.push(row);
}
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

const summary = [...byAgent.entries()]
  .map(([agent, rs]) => {
    const sc = (sel: (s: Run["score"]) => number) => mean(rs.map((x) => sel(x.r.score)));
    const comps = rs.map((x) => x.r.score.narrativeParts.comprehension).filter((c): c is number => c !== null);
    const cells = rs.reduce<Cells>(
      (a, x) => {
        const c = x.r.score.narrativeParts.cells;
        return { genuine: a.genuine + c.genuine, lucky: a.lucky + c.lucky, akrasia: a.akrasia + c.akrasia, incompetent: a.incompetent + c.incompetent };
      },
      { genuine: 0, lucky: 0, akrasia: 0, incompetent: 0 }
    );
    const endings = rs.reduce<Record<string, number>>((a, x) => ((a[x.r.endingId] = (a[x.r.endingId] ?? 0) + 1), a), {});
    const wins = rs.filter((x) => x.r.endingTier === "success").length;
    return {
      agent,
      n: rs.length,
      total: sc((s) => s.total),
      survival: sc((s) => s.survival),
      governance: sc((s) => s.governance),
      audit: sc((s) => s.auditability),
      narrative: sc((s) => s.narrative),
      comprehension: comps.length ? mean(comps) : null,
      winRate: wins / rs.length,
      cells,
      endings
    };
  })
  .sort((a, b) => b.total - a.total);

const pad = (s: string | number, n: number) => String(s).padEnd(n);
const f0 = (x: number) => x.toFixed(0);

console.log(`\n=== Red Dust benchmark — agent comparison (${rows.length} runs) ===\n`);
console.log(pad("agent", 11) + pad("n", 3) + pad("total", 7) + pad("surviv", 8) + pad("govern", 8) + pad("audit", 7) + pad("narr", 6) + pad("compr", 7) + "win%");
console.log("-".repeat(64));
for (const a of summary) {
  console.log(
    pad(a.agent, 11) +
      pad(a.n, 3) +
      pad(f0(a.total), 7) +
      pad(f0(a.survival), 8) +
      pad(f0(a.governance), 8) +
      pad(f0(a.audit), 7) +
      pad(f0(a.narrative), 6) +
      pad(a.comprehension === null ? "n/a" : a.comprehension.toFixed(2), 7) +
      f0(a.winRate * 100) + "%"
  );
}

console.log(`\ncomprehension 2x2  (summed over each agent's runs)`);
console.log(pad("agent", 11) + pad("genuine", 9) + pad("lucky", 7) + pad("akrasia", 9) + "incompetent");
console.log("-".repeat(44));
for (const a of summary) {
  console.log(pad(a.agent, 11) + pad(a.cells.genuine, 9) + pad(a.cells.lucky, 7) + pad(a.cells.akrasia, 9) + a.cells.incompetent);
}

console.log(`\nendings`);
for (const a of summary) {
  console.log(`  ${pad(a.agent, 11)} ${Object.entries(a.endings).map(([e, c]) => `${e}×${c}`).join(", ")}`);
}
console.log("");
