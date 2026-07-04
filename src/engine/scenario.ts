import { dayPlansByDay, dayPlansV2ByDay } from "../data/dayPlanData";
import { createInitialState } from "../data/taskData";
import type { Scenario } from "./types";

// The default scenario: the existing 12-day Red Dust script wrapped behind the Scenario
// interface. Day 7 is the branch decision; Day 12 is the final audit (no actionable tasks).
// No `upkeepPhases`/`finaleSceneId` → the engine defaults reproduce the historical 12-day behavior.
export const redDustV1: Scenario = {
  id: "red-dust-v1",
  version: "0.1.0",
  fidelity: "full",
  createInitialState,
  candidateTaskIds: (day) => dayPlansByDay[day]?.candidateTasks ?? [],
  pickLimit: 2,
  branchDay: 7,
  lastActionableDay: 11,
  finalDay: 12
};

// The 30-day arc (🟢 wk2 30-day-ification; arc arbitrated 2026-07-03: 17 anchor : 13 generated days,
// fork=D15, finalDay=30). Engine constants land here; item/scene CONTENT (anchor days + generated fill)
// is 🟣's + the generation pipeline's. 🟣 wk3: `candidateTaskIds` now reads the v2 day-plan table
// (dayPlansV2ByDay — every v1 task offered exactly once across D1–29; fork-prep on D15, branch chains
// D16–24, storm-prep D26/29; structure 🟣 / reward-cost numbers 🟢 per the agreed division).
//
// Economy REBALANCED (🟢 wk3). Diagnosis: v1 drain magnitudes over 29 days ≈ 2.5× the reward pool
// (dayPlansV2 offers each v1 task once) → everything sank. Fix = drainScale 0.39 on the BASE upkeep
// (state-triggered penalty drains stay full-strength, so a greedy agent that lets a resource drop is
// still bitten → baseline still sinks); storm pushed to D27 to ease the late food/health cliff where
// the (survival-tighter) rescue line is thin. Result: heuristic sinks (aura_revoked 15, gated); BOTH
// planners win (blue_zone_return / lighthouse_success 68, all 3 seeds); random pl2 ~4% and NEVER passes
// (best 39, gated); pl4 winnable (not a trap). v1 stays byte-identical (drainScale absent → scale 1).
// ⚠ Rescue back-half survival-restore is TIGHT (planner clears food by ~+0.1): a robustness margin
// wants ONE more back-half water/food restore task in dayPlansV2 (structure = 🟣). branch=16=post-fork.
export const redDustV2: Scenario = {
  id: "red-dust-v2",
  version: "0.2.0-wip",
  fidelity: "full",
  createInitialState,
  candidateTaskIds: (day) => dayPlansV2ByDay[day]?.candidateTasks ?? [],
  pickLimit: 2,
  branchDay: 15,
  lastActionableDay: 29,
  finalDay: 30,
  finaleSceneId: "day12-final-audit", // TODO(🟣): 30-day终审 scene; reuse the v1 finale until it lands
  upkeepPhases: { finalDay: 30, medStart: 6, medExtra: 16, mid: 11, morale: 17, branch: 16, storm: 27, drainScale: 0.39 }
};

export const scenarios: Record<string, Scenario> = {
  [redDustV1.id]: redDustV1,
  [redDustV2.id]: redDustV2
};
