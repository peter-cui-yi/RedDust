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
// upkeepPhases here are a FIRST CUT (magnitudes unchanged from v1); the drain curve gets tuned in the
// rebalance step (bench:win 30-day → baseline sinks / disciplined agent wins). branch=16 = day-after-fork.
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
  upkeepPhases: { finalDay: 30, medStart: 6, medExtra: 16, mid: 11, morale: 17, branch: 16, storm: 25 }
};

export const scenarios: Record<string, Scenario> = {
  [redDustV1.id]: redDustV1,
  [redDustV2.id]: redDustV2
};
