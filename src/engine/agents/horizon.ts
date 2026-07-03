// Shared horizon-relative drain model for the reference agents (🟢 wk3, per 🟣 engine-30day-handoff §C).
// The agents' internal upkeep estimate used hard-coded 12-day anchors (day>=3/5/8/10) — correct on
// red-dust-v1 but hoarding too early/late on a 30-day arc, which would distort the baselines.
//
// This derives the same anchors from the PUBLIC horizon in the Observation (fair game — findings §7:
// agents are handed a generic upkeep model + the public rules, not engine internals):
//   - branch pressure lands the day AFTER the fork (v1: 7+1=8 ✓; v2: 15+1=16 ✓)
//   - the rest scale by finalDay/12 (v1 reproduces 3/5/10 exactly; v2 → med 8 / mid 13 / storm 25)
// It is an ESTIMATE of the engine's UpkeepPhases, not a mirror — close enough to plan a trajectory;
// re-tune alongside the v2 economy rebalance if bench:win shows the planner systematically off.
import type { MetricKey } from "../../data/types";

export type AssumedPhases = { med: number; mid: number; branch: number; storm: number };

export function assumedPhases(obs: { branchDay: number; finalDay: number }): AssumedPhases {
  const s = obs.finalDay / 12;
  return {
    med: Math.round(3 * s),
    mid: Math.round(5 * s),
    branch: obs.branchDay + 1,
    storm: Math.round(10 * s)
  };
}

// Per-day drain estimate for the survival metrics (the planner/deepseek "generic upkeep model",
// previously triplicated with literal day>=5/8/10/3 breakpoints in each agent).
export function assumedDailyUpkeep(metric: MetricKey, day: number, p: AssumedPhases): number {
  switch (metric) {
    case "water": return day >= p.branch ? 4 : day >= p.mid ? 3 : 2;
    case "food": return day >= p.storm ? 3 : day >= p.mid ? 2 : 1;
    case "battery": return day >= p.branch ? 5 : day >= p.mid ? 3 : 2;
    case "medicine": return day >= p.branch ? 2 : day >= p.med ? 1 : 0;
    default: return 0;
  }
}
