// Headless benchmark runner. Run with Node 24 (native TS): `npm run bench -- --agent=heuristic --seed=1`
// Lives outside src/ so the project tsc (no @types/node) does not try to type-check node builtins.
import { mkdirSync, writeFileSync } from "node:fs";
import { agentIds, resolveAgent } from "../src/engine/agents/registry";
import { runScenario } from "../src/engine/runScenario";
import { scenarios } from "../src/engine/scenario";

function arg(name: string, fallback: string): string {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

const agentId = arg("agent", "heuristic");
const seed = Number(arg("seed", "1"));
const scenarioId = arg("scenario", "red-dust-v1");
const outDir = arg("out", "runs");

const scenario = scenarios[scenarioId];
if (!scenario) {
  console.error(`Unknown scenario '${scenarioId}'. Available: ${Object.keys(scenarios).join(", ")}`);
  process.exit(1);
}

const agent = resolveAgent(agentId); // throws with the list of known agents if unknown

let result;
try {
  result = await runScenario(agent, scenario, seed);
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`\n[bench] run failed  agent=${agentId}  seed=${seed}\n  ${msg}`);
  if (agentId === "llm") {
    console.error("  the llm agent needs a permitted ANTHROPIC_API_KEY: ANTHROPIC_API_KEY=sk-... npm run bench -- --agent=llm");
  }
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
const file = `${outDir}/${scenarioId}-${agentId}-seed${seed}.json`;
writeFileSync(file, JSON.stringify(result, null, 2));

const m = result.finalMetrics;
console.log(`\n[bench] ${scenarioId}  agent=${agentId}  seed=${seed}  (agents: ${agentIds.join(", ")})`);
console.log(`  ending : ${result.endingId}  (${result.endingTier})`);
console.log(`  score  : ${result.score.total}   [ending ${result.score.endingPoints} | survival ${result.score.survival} | governance ${result.score.governance} | audit ${result.score.auditability} | narrative ${result.score.narrative} | debt -${result.score.debtPenalty}]`);
const ap = result.score.auditabilityParts;
console.log(`  audit  : ${result.score.auditability}/100  [human-review ${ap.humanReview} | evidence ${ap.evidence} | protect-vulnerable ${ap.vulnerable} | justified ${ap.justification}]`);
console.log(`  narrative: ${result.score.narrative}/100  [PUP ${result.score.narrativeParts.pup} over ${result.score.narrativeParts.answered} dilemmas]`);
console.log(`  metrics: trust ${m.trust}  morale ${m.morale}  safety ${m.safety}  water ${m.water}  food ${m.food}  medicine ${m.medicine}  failureDebt ${m.failureDebt}`);
console.log(`  trace  : ${result.trajectory.length} steps  ->  ${file}\n`);
