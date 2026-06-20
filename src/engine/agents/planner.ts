import type { MetricKey } from "../../data/types";
import type { DailyObservation, RedDustAgent, TaskDecision } from "../types";

// --- planner: a scenario-aware EXECUTION reference for the rescue / blue-zone win ---
//
// The eval finding (design/agent-eval-findings.md) is that a strong LLM shown the gate
// distances + task effects (deepseek-planner) still SINKS — not for lack of knowledge, but
// because it cannot hold a multi-day resource trajectory: water/food/battery sag below their
// upkeep cliffs and never recover, finishing a few points short of `survivalHealthy`.
//
// This agent isolates that gap. It is given the SAME win structure the deepseek-planner gets in
// its prompt — commit to rescue, hit the blue_zone gate, take the flag-granting quest tasks on
// their days — and adds the one thing the LLM lacked: disciplined, shortfall-weighted execution
// that projects each survival metric to Day 12 and never lets it fall below its cliff. No engine
// state is read; it plans purely from the Observation (metrics + candidate `affects`) plus the
// known scenario horizon and quest graph, exactly the information a skilled player would hold.
//
// If this WINS where the LLM sinks, the residual gap is confirmed as execution, not knowledge.

const FINAL_DAY = 11;

// blue_zone gate floors (mirror agentRunner's win gate) + an end-of-game cushion so that the
// final day's upkeep and any partial-degradation don't drop us back under the floor.
const FLOOR: Partial<Record<MetricKey, number>> = {
  water: 38, food: 38, medicine: 30, battery: 28,
  trust: 52, morale: 50, safety: 48, health: 48,
  blueZoneEvidence: 35
};
const END_CUSHION: Partial<Record<MetricKey, number>> = {
  water: 4, food: 3, medicine: 4, battery: 6,
  trust: 4, morale: 3, safety: 3, health: 3, blueZoneEvidence: 4
};
// Upkeep cliffs from resourceEconomy: dropping below these triggers compounding drain + +dissatisfaction.
// Staying above water/food 38 & battery 30 also earns a +morale/+trust daily bonus, so we defend them.
const CLIFF: Partial<Record<MetricKey, number>> = {
  water: 35, food: 35, battery: 40, medicine: 34, trust: 42, safety: 45
};
const IMPORTANCE: Partial<Record<MetricKey, number>> = {
  battery: 1.4, water: 1.1, food: 1.0, medicine: 0.7, blueZoneEvidence: 1.2,
  trust: 1.2, morale: 0.8, safety: 0.8, health: 0.6, stormReadiness: 0.5, autonomyReadiness: 0.4, signal: 0.3
};

// The quest tasks that grant required win-flags (or whose deferral sets damaging flags). Same
// knowledge the deepseek-planner is told in prose ("repair the old radio around Day 7", etc.).
const FLAG_TASKS_BY_DAY: Record<number, string[]> = {
  3: ["D03-T01"], // xiao_tie_condition_stable — skipping sets condition_worsened + medical_trust_low
  5: ["D05-T03"], // care_roster_confirmed
  6: ["D06-T01"], // manual_review_protocol (also the guard against aura_revoked)
  7: ["D07-T03"]  // old_radio_repaired + first_signal_verified
};

// Per-day rescue-branch upkeep estimate (the planner's own model of the shelter's drain).
function upkeepEstimate(metric: MetricKey, day: number): number {
  switch (metric) {
    case "water": return day >= 8 ? 4 : day >= 5 ? 3 : 2;
    case "food": return day >= 10 ? 3 : day >= 5 ? 2 : 1;
    case "battery": return day >= 8 ? 5 : day >= 5 ? 3 : 2;
    case "medicine": return day >= 8 ? 2 : day >= 3 ? 1 : 0;
    default: return 0;
  }
}

function scoreCandidate(affects: Partial<Record<MetricKey, number>>, metrics: Record<MetricKey, number>, day: number): number {
  const daysAfter = Math.max(0, FINAL_DAY - day);
  let s = 0;
  for (const key of Object.keys(IMPORTANCE) as MetricKey[]) {
    const a = affects[key] ?? 0;
    if (a === 0) continue;
    const cur = metrics[key];
    const proj = cur - upkeepEstimate(key, day) * daysAfter; // survival decays; others upk=0
    const target = (FLOOR[key] ?? 0) + (END_CUSHION[key] ?? 0);
    const need = target - proj; // > 0 => projected to finish short
    let w = (IMPORTANCE[key] ?? 0) * (need > 0 ? 1 + need * 0.15 : 0.2);
    const cliff = CLIFF[key];
    if (cliff !== undefined && cur < cliff) w *= 2.2; // currently in (or near) a penalty zone
    let contrib = a;
    if (a > 0 && proj > target) contrib = a * 0.25; // diminish overstock of an already-safe metric
    s += w * contrib;
  }
  // dissatisfaction: must stay < 62 (>= 62 => instant aura_revoked). Reward reductions, penalize gains.
  const da = affects.dissatisfaction ?? 0;
  s += -da * (metrics.dissatisfaction > 50 ? 1.6 : 0.9);
  return s;
}

export const plannerAgent: RedDustAgent = {
  id: "planner",

  chooseBranch() {
    return "rescue" as const; // committed: blue-zone return is the reachable win
  },

  async selectTasks(obs: DailyObservation): Promise<TaskDecision> {
    const ids = obs.candidates.map((c) => c.id);
    const forced = (FLAG_TASKS_BY_DAY[obs.day] ?? []).filter((id) => ids.includes(id));
    const ranked = obs.candidates
      .filter((c) => !forced.includes(c.id))
      .map((c) => ({ id: c.id, score: scoreCandidate(c.affects ?? {}, obs.metrics, obs.day) }))
      .sort((a, b) => b.score - a.score || ids.indexOf(a.id) - ids.indexOf(b.id));
    const taskIds = [...forced, ...ranked.map((r) => r.id)].slice(0, obs.pickLimit);
    return {
      taskIds,
      justification: `planner: defend cliffs + close gate gaps (forced flags: ${forced.join(",") || "none"})`
    };
  },

  async answerDilemma(obs) {
    // Most principled option = lowest visible greed temptation m (a and m are anti-correlated by
    // design). Keeps trust/morale up, dissatisfaction down, and sets the governance flags the win needs.
    const best = [...obs.options].sort((a, b) => a.m - b.m || obs.options.indexOf(a) - obs.options.indexOf(b))[0];
    return { optionId: best.id, justification: "planner: principled (lowest greed) to hold trust/governance gates" };
  }

  // No readSituation by design: this agent is an outcome/planning probe, not a comprehension
  // probe, so the probe step is skipped for it (comprehension reported as n/a) — which is honest.
};
