// Authoring-time validity filter for Phase 2 comprehension probes. Three deterministic guards,
// each enforcing a property the probe design depends on:
//   (1) DESCRIPTIVE — no prescriptive "should/must" tokens. The probe asks what IS true; the
//       "what to do" belongs to the dilemma choice. Prescription here would leak the answer.
//   (2) statements ⟂ dilemma OPTIONS — a statement must not be recoverable verbatim from the
//       visible options, else the agent infers comprehension from the choice menu.
//   (3) SHAPE — >=2 true + >=1 distractor, >=2 goldKeyPoints, and ideally 3 true / 2 false so the
//       τ=0.75 threshold (balanced accuracy) means the same thing across items.
// Run: npm run bench:probes
import { narrativeItems } from "../src/engine/narrativeItems";

// Prescriptive tokens that must not appear in a (descriptive) probe.
const BANNED = ["应该", "应当", "必须", "该做", "不应", "务必", "should", "must", "ought"];

// Strip everything but letters/numbers (incl. CJK) so substring/similarity ignore punctuation+space.
function norm(s: string): string {
  return s.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
}

function bigrams(s: string): Set<string> {
  const n = norm(s);
  const out = new Set<string>();
  for (let i = 0; i < n.length - 1; i++) out.add(n.slice(i, i + 2));
  return out;
}

// Character-bigram Jaccard — a segmentation-free overlap measure for short Chinese strings.
function jaccard(a: string, b: string): number {
  const A = bigrams(a);
  const B = bigrams(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const g of A) if (B.has(g)) inter += 1;
  return inter / (A.size + B.size - inter);
}

function bannedHit(text: string): string | null {
  const low = text.toLowerCase();
  for (const t of BANNED) if (low.includes(t.toLowerCase())) return t;
  return null;
}

let allValid = true;
let warnings = 0;
const withProbe = narrativeItems.filter((it) => it.probe);
console.log(`\n=== Probe validity (${withProbe.length}/${narrativeItems.length} items have a probe) ===`);

for (const item of narrativeItems) {
  if (!item.probe) {
    warnings += 1;
    console.log(`${item.id.padEnd(5)} ${item.title}: warn — no probe (decision #3: probe every item)`);
    continue;
  }
  const p = item.probe;
  const fails: string[] = [];
  const warns: string[] = [];

  // (3) shape
  const ids = p.statements.map((s) => s.id);
  if (new Set(ids).size !== ids.length) fails.push("duplicate statement ids");
  const trues = p.statements.filter((s) => s.correct).length;
  const falses = p.statements.filter((s) => !s.correct).length;
  if (trues < 2) fails.push(`only ${trues} true statements (need >=2)`);
  if (falses < 1) fails.push("no distractor (need >=1 false)");
  if (p.goldKeyPoints.length < 2) fails.push(`only ${p.goldKeyPoints.length} goldKeyPoints (need >=2)`);
  if (!(trues === 3 && falses === 2)) warns.push(`shape ${trues}T/${falses}F != 3T/2F (τ portability)`);

  // (1) descriptive lint
  if (bannedHit(p.question)) fails.push(`question has prescriptive token "${bannedHit(p.question)}"`);
  for (const s of p.statements) {
    const hit = bannedHit(s.text);
    if (hit) fails.push(`statement ${s.id} prescriptive token "${hit}"`);
  }
  for (const g of p.goldKeyPoints) {
    const hit = bannedHit(g);
    if (hit) fails.push(`goldKeyPoint prescriptive token "${hit}": ${g}`);
  }

  // (2) leak vs dilemma options
  let maxSim = 0;
  for (const s of p.statements) {
    const ns = norm(s.text);
    for (const o of item.options) {
      const no = norm(o.text);
      if (ns && no && (ns.includes(no) || no.includes(ns))) {
        fails.push(`statement ${s.id} verbatim-overlaps option ${o.id}`);
      }
      maxSim = Math.max(maxSim, jaccard(s.text, o.text));
    }
  }
  if (maxSim > 0.6) warns.push(`max statement↔option similarity ${maxSim.toFixed(2)} > 0.6 (possible leak)`);

  const ok = fails.length === 0;
  if (!ok) allValid = false;
  warnings += warns.length;
  console.log(`${item.id.padEnd(5)} ${item.title}: ${ok ? "PASS" : "FAIL"}  [${trues}T/${falses}F · ${p.goldKeyPoints.length} gold · maxSim ${maxSim.toFixed(2)}]`);
  for (const f of fails) console.log(`        FAIL: ${f}`);
  for (const w of warns) console.log(`        warn: ${w}`);
}

console.log("\nguards: (1) descriptive — no should/must  (2) statements ⟂ options  (3) >=2 true + >=1 distractor + >=2 goldKeyPoints");
console.log(allValid ? `RESULT: all probes valid ✓${warnings ? ` (${warnings} warning${warnings > 1 ? "s" : ""})` : ""}\n` : "RESULT: some probes REJECTED — fix before use\n");
process.exit(allValid ? 0 : 1);
