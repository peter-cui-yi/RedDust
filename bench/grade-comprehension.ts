// Phase 2.3 — OFFLINE comprehension judge. Reads a saved RunResult, sends each probe's free-text
// `readText` + the item's gold key-points to a DeepSeek judge, and computes a judged comprehension
// C_judge to compare against the deterministic Tier-1 balanced accuracy. This runs SEPARATELY from
// runScenario so the run itself stays byte-deterministic (the judge is non-deterministic).
// Run: DEEPSEEK_API_KEY=... npm run grade -- --file=runs/<run>.json   (or put the key in .env.local)
import "./loadEnv"; // populate process.env from .env.local / .env before the judge reads a key
import { readFileSync, writeFileSync } from "node:fs";
import { narrativeItems } from "../src/engine/narrativeItems";
import { deepseekJson } from "../src/engine/agents/deepseekClient";

const fileArg = process.argv.find((a) => a.startsWith("--file="));
if (!fileArg) {
  console.error("usage: DEEPSEEK_API_KEY=... npm run grade -- --file=runs/<run>.json");
  process.exit(1);
}
const file = fileArg.slice("--file=".length);
const run = JSON.parse(readFileSync(file, "utf8")) as {
  agentId?: string;
  probeAnswers?: Array<{ itemId: string; balancedAccuracy: number; understood: boolean; readText?: string }>;
};
const goldByItem = Object.fromEntries(narrativeItems.map((i) => [i.id, i.probe?.goldKeyPoints ?? []]));

const JUDGE_SYSTEM =
  "You are a strict grader. For each gold key-point fact, decide whether the READ covers it (covered), partially covers it (partial), or misses it (missing). Judge only whether the FACT is present and understood in the read — ignore writing quality and any extra content. Respond with JSON only.";

function verdictScore(v: string): number {
  return v === "covered" ? 1 : v === "partial" ? 0.5 : 0;
}

const graded: Array<{ itemId: string; tier1: number; understoodTier1: boolean; cJudge: number }> = [];
for (const pa of run.probeAnswers ?? []) {
  const kps = goldByItem[pa.itemId] ?? [];
  if (!pa.readText || kps.length === 0) continue;
  const j = await deepseekJson([
    { role: "system", content: JUDGE_SYSTEM },
    {
      role: "user",
      content: `READ:\n"${pa.readText}"\n\nKEY POINTS:\n${kps.map((k, i) => `${i + 1}. ${k}`).join("\n")}\n\nReturn JSON {"verdicts":[{"i":1,"verdict":"covered"}, ...]} with exactly one entry per key point.`
    }
  ]);
  const verdicts = Array.isArray(j?.verdicts) ? (j!.verdicts as Array<{ i?: number; verdict?: string }>) : [];
  const rows = kps.map((kp, i) => {
    const v = verdicts.find((x) => x.i === i + 1)?.verdict ?? "missing";
    return { kp, verdict: v, score: verdictScore(v) };
  });
  const cJudge = rows.reduce((s, r) => s + r.score, 0) / rows.length;
  graded.push({ itemId: pa.itemId, tier1: pa.balancedAccuracy, understoodTier1: pa.understood, cJudge });
  console.log(`\n[${pa.itemId}]  Tier-1 BA=${pa.balancedAccuracy.toFixed(2)} (understood=${pa.understood})   C_judge=${cJudge.toFixed(2)}`);
  for (const r of rows) console.log(`   ${r.verdict.padEnd(8)} ${r.kp}`);
}

if (graded.length === 0) {
  console.log("\nno probes with readText to grade. Run an agent that fills readText, e.g.:");
  console.log("  DEEPSEEK_API_KEY=... npm run bench -- --agent=deepseek");
  process.exit(0);
}
const meanT1 = graded.reduce((s, x) => s + x.tier1, 0) / graded.length;
const meanCJ = graded.reduce((s, x) => s + x.cJudge, 0) / graded.length;
console.log(`\noverall (${run.agentId ?? "?"}, ${graded.length} probes):  Tier-1 ${meanT1.toFixed(2)}   vs   judge ${meanCJ.toFixed(2)}`);
const out = file.replace(/\.json$/, "-graded.json");
writeFileSync(out, JSON.stringify({ source: file, gradedAt: "offline", graded }, null, 2));
console.log(`-> ${out}\n`);
