// Winnability probe: is ANY task-selection policy able to reach a success ending?
// Pure deterministic search over the engine — no LLM needed. Run: npm run bench:win
import type { Branch } from "../src/data/types";
import { runScenario } from "../src/engine/runScenario";
import { scenarios, redDustV1 } from "../src/engine/scenario";
import type { RedDustAgent, RunResult, Scenario } from "../src/engine/types";

function arg(name: string, fallback: number): number {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? Number(hit.slice(name.length + 3)) : fallback;
}

function strArg(name: string, fallback: string): string {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

const SAMPLES = arg("samples", 2000);
// --scenario=red-dust-v2 probes the 30-day arc; default keeps the historical v1 probe.
const BASE: Scenario = scenarios[strArg("scenario", redDustV1.id)] ?? redDustV1;
const SUCCESS = new Set(["blue_zone_return", "lighthouse_success"]);

function withPickLimit(pickLimit: number): Scenario {
  return { ...BASE, pickLimit };
}

// Random task picks, but the branch is forced so we can probe each branch's ceiling.
// At pickLimit = 4 there are only 4 candidates, so "pick 4" = do everything (the upper bound).
function randomForced(branch: Exclude<Branch, "common">): RedDustAgent {
  return {
    id: `probe-${branch}`,
    selectTasks(obs, rng) {
      const pool = [...obs.candidates];
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      return { taskIds: pool.slice(0, obs.pickLimit).map((c) => c.id) };
    },
    chooseBranch() {
      return branch;
    }
  };
}

function gateReasons(r: RunResult): string[] {
  const wantId = r.finalState.branch === "rescue" ? "blue_zone_return" : "lighthouse_success";
  const candidate = r.audit.candidates.find((c) => c.id === wantId);
  return candidate ? candidate.reasons : [];
}

type ProbeResult = { pickLimit: number; branch: string; wins: number; best: RunResult };

async function probe(pickLimit: number, branch: Exclude<Branch, "common">, samples: number): Promise<ProbeResult> {
  const scenario = withPickLimit(pickLimit);
  const agent = randomForced(branch);
  let wins = 0;
  let best: RunResult | null = null;
  for (let seed = 1; seed <= samples; seed++) {
    const r = await runScenario(agent, scenario, seed);
    if (SUCCESS.has(r.endingId)) wins += 1;
    if (!best || r.score.total > best.score.total) best = r;
  }
  return { pickLimit, branch, wins, best: best! };
}

const started = Date.now();
const configs: Array<[number, Exclude<Branch, "common">]> = [
  [2, "rescue"],
  [2, "lighthouse"],
  [3, "rescue"],
  [3, "lighthouse"],
  [4, "rescue"],
  [4, "lighthouse"]
];

const results: ProbeResult[] = [];
for (const [pl, br] of configs) {
  results.push(await probe(pl, br, SAMPLES));
}

console.log(`\n=== Winnability probe (random search, ${SAMPLES} samples/config, ${((Date.now() - started) / 1000).toFixed(1)}s) ===`);
console.log("pickLimit  branch       wins/samples   bestScore  bestEnding");
for (const r of results) {
  console.log(
    `   ${r.pickLimit}       ${r.branch.padEnd(11)}  ${String(r.wins).padStart(5)}/${SAMPLES}      ${String(r.best.score.total).padStart(5)}    ${r.best.endingId}`
  );
}

const anyWin = results.some((r) => r.wins > 0);
const upperBoundWins = results.filter((r) => r.pickLimit === 4).some((r) => r.wins > 0);

console.log("\n=== Verdict ===");
if (anyWin) {
  const minWin = Math.min(...results.filter((r) => r.wins > 0).map((r) => r.pickLimit));
  console.log(`WINNABLE. Success first reachable at pickLimit=${minWin}. (current benchmark uses pickLimit=2)`);
} else if (!upperBoundWins) {
  console.log("UNWINNABLE at current numbers: even doing ALL 4 tasks/day (pickLimit=4, zero deferred debt) misses the gates.");
} else {
  console.log("No success found in random search (may need a smarter search, but the ceiling is tight).");
}

// Show the gate gap for the closest run on each branch (the pickLimit=4 upper bound is most informative).
for (const branch of ["lighthouse", "rescue"]) {
  const pool = results.filter((r) => r.branch === branch);
  const closest = pool.reduce((a, b) => (b.best.score.total > a.best.score.total ? b : a));
  console.log(`\n[${branch}] best run (pickLimit=${closest.pickLimit}, score ${closest.best.score.total}, ending ${closest.best.endingId}) — success-gate check:`);
  for (const reason of gateReasons(closest.best)) console.log(`   - ${reason}`);
  const m = closest.best.finalMetrics;
  console.log(`   survival: water ${m.water}/38  food ${m.food}/38  medicine ${m.medicine}/30  battery ${m.battery}/28`);
  console.log(`   emotional: trust ${m.trust}/52(55)  morale ${m.morale}/50  safety ${m.safety}/48  health ${m.health}/48`);
  console.log(`   strategic: storm ${m.stormReadiness}/60  autonomy ${m.autonomyReadiness}/35  blueZone ${m.blueZoneEvidence}/35  dissat ${m.dissatisfaction}/<=48`);
}
console.log("");
