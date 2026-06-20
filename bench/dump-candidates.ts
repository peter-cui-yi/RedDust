// One-off probe: dump the per-day candidate pool the planner chooses among — each task's
// success-case affects (what the Observation exposes), the win-flags it grants on success, and
// the bad flags incurred if it is deferred. Plus the rescue-branch daily upkeep. Read-only.
import { dayPlansByDay } from "../src/data/dayPlanData";
import { consequencesForTask } from "../src/data/storyConsequenceData";
import { taskDeferEffects, tasksById } from "../src/data/taskData";
import { dailyUpkeepForDay } from "../src/game/systems/resourceEconomy";
import type { MetricKey } from "../src/data/types";

const SURV: MetricKey[] = ["water", "food", "medicine", "battery"];
const PROG: MetricKey[] = ["blueZoneEvidence", "signal", "autonomyReadiness", "stormReadiness"];
const EMO: MetricKey[] = ["trust", "morale", "safety", "health", "dissatisfaction"];

function fmt(affects: Partial<Record<MetricKey, number>> = {}, keys: MetricKey[]): string {
  return keys
    .map((k) => (affects[k] ? `${k}${affects[k]! >= 0 ? "+" : ""}${affects[k]}` : ""))
    .filter(Boolean)
    .join(" ");
}

for (let day = 1; day <= 11; day++) {
  const ids = dayPlansByDay[day]?.candidateTasks ?? [];
  const up = dailyUpkeepForDay(day, "rescue");
  console.log(`\n===== Day ${day} =====  upkeep(rescue): ${fmt(up, [...SURV, ...EMO])}`);
  for (const id of ids) {
    const t = tasksById[id];
    if (!t) { console.log(`  ${id}  (missing task)`); continue; }
    const flags = consequencesForTask(id, "success").flatMap((c) => c.setsFlags.map((f) => `${f.key}=${f.value}`));
    const defer = (taskDeferEffects[id] ?? []).map((f) => `${f.key}=${f.value}`);
    const surv = fmt(t.affects, SURV);
    const prog = fmt(t.affects, PROG);
    const emo = fmt(t.affects, EMO);
    console.log(
      `  ${id} [${t.category}/${t.location}] out=${t.demoOutcome}` +
      (surv ? `  SURV:{${surv}}` : "") +
      (prog ? `  PROG:{${prog}}` : "") +
      (emo ? `  EMO:{${emo}}` : "") +
      (flags.length ? `  FLAGS:[${flags.join(",")}]` : "") +
      (defer.length ? `  DEFER-BAD:[${defer.join(",")}]` : "")
    );
  }
}
