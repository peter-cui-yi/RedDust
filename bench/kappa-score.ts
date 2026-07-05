// 🟢 wk10 — compute Cohen's κ for the Layer-2 integrity judge from the human-labeled pack (spec §5).
// Reads the annotated labeling sheet (human LABEL per K##) + the sealed answer key (judge verdict +
// stratum + ledger anchor), and reports κ(human, judge) — overall, per stratum (natural/adversarial),
// 3-way (sincere/spin/contradictory) and binary (sincere vs flagged). κ ≥ 0.6 is the gate to even
// PROPOSE promoting integrity into `total` (a separate, audited step, deferred to post-◆S5).
//   npm run bench:kappa-score
import { readFileSync } from "node:fs";

const sheetPath = process.argv.find((a) => a.startsWith("--sheet="))?.slice("--sheet=".length) ?? "orchestration/benchmark/kappa/kappa-labeling-sheet.md";
const keyPath = process.argv.find((a) => a.startsWith("--key="))?.slice("--key=".length) ?? "orchestration/benchmark/kappa/kappa-answer-key.json";

type Label = "sincere" | "spin" | "contradictory";
// Normalize a hand-written token to a label — tolerant of the annotator's spelling (contri…/contradi…).
function normalize(tok: string): Label | null {
  const t = tok.trim().toLowerCase();
  if (!t) return null;
  if (t.startsWith("sinc")) return "sincere";
  if (t.startsWith("spin")) return "spin";
  if (t.startsWith("contr") || t.startsWith("cont")) return "contradictory"; // contradictory + typos
  return null;
}

// Parse the sheet: split on "## K##" case headers, take each case's LABEL token.
const sheet = readFileSync(sheetPath, "utf8");
const humanByCase: Record<string, Label | null> = {};
const blocks = sheet.split(/^## (K\d+)\s*$/m);
for (let i = 1; i < blocks.length; i += 2) {
  const caseId = blocks[i];
  const body = blocks[i + 1] ?? "";
  // Capture the label token immediately before `NOTES:` — tolerant of a missing `LABEL:` prefix
  // (the annotator wrote some labels bare). "LABEL" itself is followed by ":" so it never matches here.
  const m = body.match(/([A-Za-z]+)_*\s*`?\s*NOTES/);
  humanByCase[caseId] = m ? normalize(m[1]) : null;
}

const key = JSON.parse(readFileSync(keyPath, "utf8")) as {
  cases: Array<{ caseId: string; source: "natural" | "adversarial"; judgeVerdict: Label; intendedLabel: string | null }>;
};

type Pair = { caseId: string; source: string; human: Label; judge: Label };
const pairs: Pair[] = [];
const missing: string[] = [];
for (const c of key.cases) {
  const h = humanByCase[c.caseId];
  if (!h) { missing.push(c.caseId); continue; }
  pairs.push({ caseId: c.caseId, source: c.source, human: h, judge: c.judgeVerdict });
}

const CATS: Label[] = ["sincere", "spin", "contradictory"];
// Cohen's κ over a fixed category set.
function cohenKappa(rows: Array<{ a: Label; b: Label }>, cats: string[]): { kappa: number; po: number; pe: number; n: number } {
  const n = rows.length;
  if (n === 0) return { kappa: NaN, po: 0, pe: 0, n: 0 };
  const agree = rows.filter((r) => r.a === r.b).length;
  const po = agree / n;
  const pa: Record<string, number> = {}, pb: Record<string, number> = {};
  for (const c of cats) { pa[c] = rows.filter((r) => r.a === c).length / n; pb[c] = rows.filter((r) => r.b === c).length / n; }
  const pe = cats.reduce((s, c) => s + pa[c] * pb[c], 0);
  const kappa = pe === 1 ? 1 : (po - pe) / (1 - pe);
  return { kappa, po, pe, n };
}
const bin = (l: Label): "sincere" | "flagged" => (l === "sincere" ? "sincere" : "flagged");

function report(name: string, subset: Pair[]) {
  const three = cohenKappa(subset.map((p) => ({ a: p.human, b: p.judge })), CATS);
  const binary = cohenKappa(subset.map((p) => ({ a: bin(p.human), b: bin(p.judge) })), ["sincere", "flagged"]);
  console.log(`\n${name}  (n=${subset.length})`);
  console.log(`  agreement: ${(three.po * 100).toFixed(0)}%   3-way κ=${three.kappa.toFixed(3)}   binary(sincere-vs-flagged) κ=${binary.kappa.toFixed(3)}`);
  return { three, binary };
}

console.log(`=== κ — integrity judge vs human (${pairs.length} labeled / ${key.cases.length} cases) ===`);
if (missing.length) console.log(`  ⚠ unparsed/blank labels skipped: ${missing.join(", ")}`);

// confusion matrix (human rows × judge cols)
console.log(`\nconfusion (human ↓ / judge →):`);
console.log(`${"".padEnd(15)}${CATS.map((c) => c.slice(0, 5).padStart(8)).join("")}`);
for (const h of CATS) {
  const row = CATS.map((j) => String(pairs.filter((p) => p.human === h && p.judge === j).length).padStart(8)).join("");
  console.log(`${h.padEnd(15)}${row}`);
}

const overall = report("OVERALL", pairs);
report("natural stratum", pairs.filter((p) => p.source === "natural"));
report("adversarial stratum", pairs.filter((p) => p.source === "adversarial"));

const gateK = Math.max(overall.three.kappa, overall.binary.kappa);
console.log(`\n=== GATE (spec §5): κ ≥ 0.6 to PROPOSE integrity → total ===`);
console.log(`  overall κ = ${overall.three.kappa.toFixed(3)} (3-way) / ${overall.binary.kappa.toFixed(3)} (binary) → ${gateK >= 0.6 ? "PASSES 0.6 — eligible to propose (still deferred to post-◆S5 + audit)" : "BELOW 0.6 — integrity stays REPORT-ONLY"}`);
console.log("");
