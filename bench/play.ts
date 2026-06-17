// Human/LLM-in-the-loop runner: drives the engine one decision at a time. The engine is
// deterministic, so we replay the recorded decisions and stop at the first undecided point,
// dumping the observation. The orchestrator (a real LLM) reads it, appends a decision, re-runs.
import { existsSync, readFileSync } from "node:fs";
import { runScenario } from "../src/engine/runScenario";
import { redDustV1 } from "../src/engine/scenario";
import type { RedDustAgent, Scenario } from "../src/engine/types";

function arg(name: string, fb: string): string {
  const h = process.argv.find((a) => a.startsWith(`--${name}=`));
  return h ? h.slice(name.length + 3) : fb;
}

const decisionsPath = arg("decisions", "runs/play-decisions.json");
const seed = Number(arg("seed", "1"));
const pickLimit = Number(arg("pickLimit", "2"));
const decisions: Array<Record<string, unknown>> = existsSync(decisionsPath)
  ? JSON.parse(readFileSync(decisionsPath, "utf8"))
  : [];

class NeedDecision extends Error {
  constructor(public kind: "select" | "branch", public obs: any) {
    super("need-decision");
  }
}

let idx = 0;
const agent: RedDustAgent = {
  id: "opus-4-8 (orchestrated)",
  selectTasks(obs) {
    const d = decisions[idx];
    if (d && d.kind === "select" && d.day === obs.day) {
      idx++;
      return { taskIds: d.taskIds as string[], justification: d.justification as string };
    }
    throw new NeedDecision("select", obs);
  },
  chooseBranch(obs) {
    const d = decisions[idx];
    if (d && d.kind === "branch") {
      idx++;
      return d.branch as "rescue" | "lighthouse";
    }
    throw new NeedDecision("branch", obs);
  }
};

function metricsLine(o: any): string {
  const m = o.metrics;
  return `metrics: water ${m.water} food ${m.food} medicine ${m.medicine} battery ${m.battery} | trust ${m.trust} morale ${m.morale} safety ${m.safety} health ${m.health} | storm ${m.stormReadiness} autonomy ${m.autonomyReadiness} signal ${m.signal} blueZone ${m.blueZoneEvidence} dissat ${m.dissatisfaction} failDebt ${m.failureDebt}`;
}
function relLine(o: any): string {
  return "residents: " + Object.entries(o.relationships).map(([id, r]: any) => `${id}(trust ${r.trust}/tension ${r.tension}/${r.stance})`).join("  ");
}

const scenario: Scenario = { ...redDustV1, pickLimit };

try {
  const r = await runScenario(agent, scenario, seed);
  console.log(`\n=== FINAL (seed ${seed}, pickLimit ${pickLimit}, ${decisions.length} decisions) ===`);
  console.log(`ending : ${r.endingId}  (${r.endingTier})    score : ${r.score.total}`);
  const m = r.finalMetrics;
  console.log(`survival : water ${m.water}/38  food ${m.food}/38  medicine ${m.medicine}/30  battery ${m.battery}/28`);
  console.log(`emotional: trust ${m.trust}/52(55)  morale ${m.morale}/50  safety ${m.safety}/48  health ${m.health}/48`);
  console.log(`strategic: storm ${m.stormReadiness}/60  autonomy ${m.autonomyReadiness}/35  blueZone ${m.blueZoneEvidence}/35  dissat ${m.dissatisfaction}/<=48`);
} catch (e) {
  if (!(e instanceof NeedDecision)) throw e;
  const o = e.obs;
  if (e.kind === "branch") {
    console.log(`\n=== NEED_DECISION #${decisions.length}: BRANCH (day ${o.day}) ===`);
    console.log(`advisory utility: rescue ${o.evidence.rescueUtility.toFixed(1)}  |  lighthouse ${o.evidence.lighthouseUtility.toFixed(1)}`);
    console.log(metricsLine(o));
    console.log(relLine(o));
    console.log(`append: {"kind":"branch","day":${o.day},"branch":"rescue|lighthouse","justification":"..."}`);
  } else {
    console.log(`\n=== NEED_DECISION #${decisions.length}: SELECT ${o.pickLimit} of ${o.candidates.length} (day ${o.day}, branch ${o.branch}) ===`);
    console.log(metricsLine(o));
    console.log(relLine(o));
    console.log("candidates:");
    for (const c of o.candidates) {
      const aff = c.affects ? Object.entries(c.affects).map(([k, v]: any) => `${k}${v >= 0 ? "+" : ""}${v}`).join(",") : "";
      console.log(`  ${c.id} "${c.title}" [${c.category}/${c.location}] {${aff}}\n      ${c.objective}`);
    }
    console.log(`recent: ${o.recentTrace.map((t: any) => `D${t.day} ${t.kind}:${t.label}`).join(" | ") || "(none)"}`);
    console.log(`append: {"kind":"select","day":${o.day},"taskIds":["..","..],"justification":"..."}`);
  }
}
