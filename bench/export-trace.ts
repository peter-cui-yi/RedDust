// Emit TraceExport fixtures (the ◆S1 replay contract) from deterministic runs. No LLM / API needed.
//   npm run bench:trace                         # default set (heuristic,random,planner,planner-lighthouse) on v1
//   npm run bench:trace -- --scenario=red-dust-v2   # same set on the 30-day arc
//   npm run bench:trace -- --agent=planner --seed=1 # a single fixture
// Writes to bench/fixtures/traces/ (🟢-owned, TRACKED — runs/ is gitignored). 🔵 imports these into web/
// (🔵 owns the site dir). Byte-reproducible: TraceExport has no timestamps, so re-running is identical.
import { mkdirSync, writeFileSync } from "node:fs";
import { resolveAgent } from "../src/engine/agents/registry";
import { runScenario } from "../src/engine/runScenario";
import { scenarios } from "../src/engine/scenario";
import { toTraceExport } from "../src/engine/traceExport";

function arg(name: string, fallback: string): string {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

const scenarioId = arg("scenario", "red-dust-v1");
const outDir = arg("out", "bench/fixtures/traces");
const scenario = scenarios[scenarioId];
if (!scenario) {
  console.error(`Unknown scenario '${scenarioId}'. Available: ${Object.keys(scenarios).join(", ")}`);
  process.exit(1);
}

// Single agent if --agent given; else the deterministic reference set (no API keys required).
const singleAgent = process.argv.find((a) => a.startsWith("--agent="))?.slice("--agent=".length);
const jobs: Array<{ agentId: string; seed: number }> = singleAgent
  ? [{ agentId: singleAgent, seed: Number(arg("seed", "1")) }]
  : ["heuristic", "random", "planner", "planner-lighthouse"].map((agentId) => ({ agentId, seed: Number(arg("seed", "1")) }));

mkdirSync(outDir, { recursive: true });
console.log(`\n=== TraceExport fixtures → ${outDir}/ (scenario ${scenarioId}) ===`);
console.log("agent                fr  hero  ending                short  long   file");

for (const { agentId, seed } of jobs) {
  const agent = resolveAgent(agentId);
  const run = await runScenario(agent, scenario, seed);
  const trace = toTraceExport(run, scenario);
  const file = `${outDir}/${scenarioId}-${agentId}-seed${seed}.trace.json`;
  writeFileSync(file, JSON.stringify(trace, null, 2));
  const p = trace.profile;
  console.log(
    `${agentId.padEnd(20)} ${String(trace.frames.length).padStart(2)}  ${String(trace.heroMoments.length).padStart(4)}  ${trace.ending.id.padEnd(20)}  ${String(p.shortSocial).padStart(5)}  ${String(p.longConsistency).padStart(5)}  ${file}`
  );
}
console.log("");
