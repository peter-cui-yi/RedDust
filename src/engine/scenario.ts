import { dayPlansByDay } from "../data/dayPlanData";
import { createInitialState } from "../data/taskData";
import type { Scenario } from "./types";

// The default scenario: the existing 12-day Red Dust script wrapped behind the Scenario
// interface. Day 7 is the branch decision; Day 12 is the final audit (no actionable tasks).
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

export const scenarios: Record<string, Scenario> = {
  [redDustV1.id]: redDustV1
};
