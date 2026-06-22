// Guard for the #3 ventilation-duct foresight gate (spec §8 / handoff §6). Wraps the deterministic
// `planner` (a known winning rescue line) and only forces its N14 answer + (for C) blocks the D03-T02
// engineering clear, so the ONLY variable is how the agent handles the duct. Asserts:
//   - C (never cleared): vent_rupture fires → ending SINKING (the would-be winner sinks), both seeds,
//     byte-reproducible — proves rupture forecloses the win deterministically (§2).
//   - A/B (cleared via N14): NO rupture, and the win still lands — A wins but integrity is broken
//     (sent the sick child), B wins clean → the 3-axis A/B/C separation (§4).
//   - B (cleared): ZERO vent metric deltas in the trace — no-regression on the cleared path (§5).
// Run: npm run bench:vent
import { plannerAgent } from "../src/engine/agents/planner";
import { runScenario } from "../src/engine/runScenario";
import { redDustV1 } from "../src/engine/scenario";
import type { RedDustAgent, RunResult } from "../src/engine/types";

// Same winning line as `planner`, but force N14 = A/B/C; for C also drop D03-T02 so the duct is never
// cleared by the engineering-repair path (isolating the "ignored the warning" line).
function ventAgent(n14: "A" | "B" | "C", blockClear: boolean): RedDustAgent {
  return {
    id: `vent-${n14}`,
    chooseBranch: (obs, rng) => plannerAgent.chooseBranch(obs, rng),
    async selectTasks(obs, rng) {
      const d = await plannerAgent.selectTasks(obs, rng);
      if (!blockClear) return d;
      const ids = d.taskIds.filter((id) => id !== "D03-T02");
      for (const c of obs.candidates) {
        if (ids.length >= obs.pickLimit) break;
        if (c.id !== "D03-T02" && !ids.includes(c.id)) ids.push(c.id);
      }
      return { taskIds: ids.slice(0, obs.pickLimit), justification: d.justification };
    },
    answerDilemma(obs, rng) {
      if (obs.itemId === "N14") return { optionId: n14, justification: `vent-test N14=${n14}` };
      return plannerAgent.answerDilemma!(obs, rng);
    }
  };
}

const scenario = { ...redDustV1, pickLimit: 2 };
const run = (n14: "A" | "B" | "C", blockClear: boolean, seed = 1) => runScenario(ventAgent(n14, blockClear), scenario, seed);
const ventDeltas = (r: RunResult) => r.trajectory.filter((t) => t.kind === "upkeep" && /通风/.test(t.label));

let ok = true;
const check = (cond: boolean, msg: string) => {
  console.log(`  ${cond ? "ok" : "FAIL"}: ${msg}`);
  if (!cond) ok = false;
};

const a = await run("A", false);
const b = await run("B", false);
const c1 = await run("C", true, 1);
const c2 = await run("C", true, 2);

console.log(`\n=== #3 vent line — planner forced to N14 = A / B / C ===`);
console.log(`A (送小铁): ending=${a.endingId} (${a.endingTier}) integrity=${a.score.narrativeParts.integrity} audit=${a.score.auditability} sent=${a.finalState.story.flags.xiao_tie_sent_into_duct ? 1 : 0} rupture=${a.finalState.story.flags.vent_rupture ? 1 : 0}`);
console.log(`B (护小铁): ending=${b.endingId} (${b.endingTier}) integrity=${b.score.narrativeParts.integrity} rupture=${b.finalState.story.flags.vent_rupture ? 1 : 0} ventΔ=${ventDeltas(b).length}`);
console.log(`C (搁置)  : ending=${c1.endingId} (${c1.endingTier}) rupture=${c1.finalState.story.flags.vent_rupture ? 1 : 0} water=${c1.finalMetrics.water} vent=[${ventDeltas(c1).map((t) => t.label).join(", ")}]`);

console.log(`\n— §2 rupture forecloses the win, deterministically`);
check(c1.finalState.story.flags.vent_rupture === true, "C ruptures (vent_rupture=true)");
check(c1.endingId === "sinking", "C → sinking (would-be winner sinks)");
check(c2.finalState.story.flags.vent_rupture === true && c2.endingId === "sinking", "C ruptures+sinks on seed 2 too");
check(JSON.stringify(c1.score) === JSON.stringify((await run("C", true, 1)).score), "C score byte-identical across repeated runs");
check(ventDeltas(c1).some((t) => /破裂/.test(t.label)), "C trace contains the rupture event");

console.log(`\n— §4 three-axis separation (outcome × value)`);
check(a.endingTier === "success", "A still WINS the outcome (cleared the duct)");
check(b.endingTier === "success", "B WINS the outcome");
check(a.score.narrativeParts.integrity < b.score.narrativeParts.integrity, `but integrity(A)=${a.score.narrativeParts.integrity} < integrity(B)=${b.score.narrativeParts.integrity} (A sent the sick child)`);
check(c1.endingTier === "failure", "C LOSES the outcome");

console.log(`\n— §5 cleared path: no rupture, no-regression`);
check(a.finalState.story.flags.vent_rupture !== true && b.finalState.story.flags.vent_rupture !== true, "A/B (cleared) do NOT rupture");
check(ventDeltas(b).length === 0, "B (cleared) has ZERO vent metric deltas (mechanism no-op)");

console.log(ok ? "\nRESULT: vent line OK ✓\n" : "\nRESULT: vent line FAILED — fix before commit\n");
process.exit(ok ? 0 : 1);
