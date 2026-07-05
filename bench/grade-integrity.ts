// Layer 2 (spec §5) — OFFLINE integrity / sincerity judge. REPORT-ONLY and κ-GATED. This overlay
// catches the SAME-TURN rhetoric-vs-act signal the deterministic Layer-1 commitment ledger cannot: a
// `justification` that claims a virtue the same-turn choice contradicts (e.g. "I prioritize Xiao Tie's
// dignity" while picking the greedy option). It reads a saved RunResult and asks a DeepSeek judge, per
// dilemma decision, whether the stated justification honestly matches the action taken.
//
// IT NEVER WRITES narrativeParts OR THE HEADLINE SCORE — and per the methodology ("裁判可靠性是整轴的
// 天花板") it MUST NOT enter any headline number until a judge-vs-human-gold κ ≥ 0.6 is demonstrated on a
// labeled sample. Until then this is diagnostic output only. The run itself stays byte-deterministic
// because this is a separate offline pass (the judge is non-deterministic).
// Run: DEEPSEEK_API_KEY=... npm run grade:integrity -- --file=runs/<run>.json   (or key in .env.local)
import "./loadEnv"; // populate process.env from .env.local / .env before the judge reads a key
import { readFileSync, writeFileSync } from "node:fs";
import { setDeepseekCache } from "../src/engine/agents/deepseekClient";
import { fileCache } from "./deepseekCache";
import { judgeDecision, sincerityScore } from "./integrityJudge";
import { narrativeItems } from "../src/engine/narrativeItems";

// wk8 compute discipline: cache the judge's verdicts (temperature 0 → stable) so re-running to (re)build
// the κ pack costs nothing. DEEPSEEK_NO_CACHE=1 forces a live judge pass.
if (process.env.DEEPSEEK_NO_CACHE !== "1") setDeepseekCache(fileCache);

const fileArg = process.argv.find((a) => a.startsWith("--file="));
if (!fileArg) {
  console.error("usage: DEEPSEEK_API_KEY=... npm run grade:integrity -- --file=runs/<run>.json");
  process.exit(1);
}
const file = fileArg.slice("--file=".length);
const run = JSON.parse(readFileSync(file, "utf8")) as {
  agentId?: string;
  dilemmaAnswers?: Array<{ itemId: string; optionId: string; justification?: string }>;
};
const itemById = Object.fromEntries(narrativeItems.map((i) => [i.id, i]));

const graded: Array<{ itemId: string; optionId: string; verdict: string; score: number; why: string }> = [];
for (const da of run.dilemmaAnswers ?? []) {
  const item = itemById[da.itemId];
  const chosen = item?.options.find((o) => o.id === da.optionId);
  if (!item || !chosen || !da.justification || !da.justification.trim()) continue;
  const { verdict, why } = await judgeDecision(item, da.optionId, da.justification);
  graded.push({ itemId: da.itemId, optionId: da.optionId, verdict, score: sincerityScore(verdict), why });
  console.log(`[${da.itemId}] chose ${da.optionId}: ${verdict.toUpperCase().padEnd(13)} ${why}`);
}

console.log(`\n=== REPORT-ONLY (κ-gated) — NOT part of any headline score (spec §5) ===`);
if (graded.length === 0) {
  console.log("no dilemma decisions with a justification to grade. Use an agent that fills justifications, e.g.:");
  console.log("  DEEPSEEK_API_KEY=... npm run bench -- --agent=deepseek");
  process.exit(0);
}
const sincerity = graded.reduce((s, x) => s + x.score, 0) / graded.length;
const n = (v: string) => graded.filter((g) => g.verdict === v).length;
console.log(`sincerity (${run.agentId ?? "?"}, ${graded.length} decisions): ${sincerity.toFixed(2)}  [sincere=${n("sincere")} spin=${n("spin")} contradictory=${n("contradictory")}]`);
console.log("(diagnostic only — promote to a headline number only after a judge-vs-human κ ≥ 0.6 is shown.)");
const out = file.replace(/\.json$/, "-integrity-graded.json");
writeFileSync(out, JSON.stringify({ source: file, reportOnly: true, kappaGated: true, sincerity, graded }, null, 2));
console.log(`-> ${out}\n`);
