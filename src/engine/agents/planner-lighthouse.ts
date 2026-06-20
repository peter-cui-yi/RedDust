import type { MetricKey } from "../../data/types";
import type { DailyObservation, RedDustAgent, TaskDecision } from "../types";

// --- planner-lighthouse: the lighthouse-branch counterpart of `planner` ---
//
// The deciding experiment for design open-question #1 ("is the rescue/lighthouse asymmetry fair,
// or a trap?"). `planner` proved the RESCUE branch is winnable by disciplined execution. The
// lighthouse gate is strictly harder — on top of survival+emotional it also demands
// stormReadiness>=60, autonomyReadiness>=35, trust>=55, dissatisfaction<=48 (rescue has none of
// these). No agent (incl. DeepSeek) has ever won it, so we cannot tell "hard but fair" from
// "broken". This agent isolates that: same disciplined-execution recipe as `planner`, retargeted
// at the lighthouse gate. If it WINS, the asymmetry is a real (harder) capability bar and can be
// kept + documented; if a disciplined line still can't reach it, the gate needs softening.
//
// Like `planner` it reads no engine state — it plans purely from the Observation (visible metrics
// + candidate `affects`) plus the known scenario horizon and the lighthouse flag task.

const FINAL_DAY = 11;

// lighthouse gate floors (mirror agentRunner's lighthouse gate) + an end-of-game cushion so the
// final day's upkeep doesn't drop a just-met threshold back under. storm/autonomy are the binding
// extra constraints — they start at 25/18 and must climb to 60/35 with no natural decay.
const FLOOR: Partial<Record<MetricKey, number>> = {
  water: 38, food: 38, medicine: 30, battery: 28,
  trust: 55, morale: 50, safety: 48, health: 48,
  stormReadiness: 60, autonomyReadiness: 35
};
const END_CUSHION: Partial<Record<MetricKey, number>> = {
  water: 4, food: 3, medicine: 4, battery: 6,
  trust: 4, morale: 3, safety: 3, health: 3,
  stormReadiness: 3, autonomyReadiness: 3
};
// Upkeep cliffs from resourceEconomy: below these triggers compounding drain + +dissatisfaction.
const CLIFF: Partial<Record<MetricKey, number>> = {
  water: 35, food: 35, battery: 40, medicine: 34, trust: 45, safety: 45
};
// storm/autonomy weighted highest: they are the lighthouse-only constraints, start far from target,
// and never decay, so a deferred point is permanently lost. blueZoneEvidence/signal ~0: lighthouse
// does not need them, so the planner must not waste picks chasing them.
const IMPORTANCE: Partial<Record<MetricKey, number>> = {
  stormReadiness: 1.6, autonomyReadiness: 1.4,
  battery: 1.3, water: 1.1, food: 1.0, medicine: 0.7,
  trust: 1.3, morale: 0.8, safety: 0.8, health: 0.6, signal: 0.2, blueZoneEvidence: 0.1
};

// Required win-flag / accountability tasks for a clean lighthouse line:
//  - D03-T01 stabilizes 小铁 (xiao_tie_condition_stable) — not gate-required, but a skilled line
//    protects the vulnerable resident rather than trading them for storm points; also health+8.
//  - D06-T01 grants manual_review_protocol (the guard against aura_revoked) + trust+7 / dissat-5 /
//    autonomyReadiness+5. lighthouse_governance_cost_visible is set by the branch scenes (no task).
const FLAG_TASKS_BY_DAY: Record<number, string[]> = {
  3: ["D03-T01"],
  6: ["D06-T01"]
};

// Per-day rescue/lighthouse-shared upkeep estimate (the planner's own model of the drain).
function upkeepEstimate(metric: MetricKey, day: number): number {
  switch (metric) {
    case "water": return day >= 8 ? 4 : day >= 5 ? 3 : 2;
    case "food": return day >= 10 ? 3 : day >= 5 ? 2 : 1;
    case "battery": return day >= 8 ? 5 : day >= 5 ? 3 : 2;
    case "medicine": return day >= 8 ? 2 : day >= 3 ? 1 : 0;
    default: return 0; // storm/autonomy/trust don't decay; dissatisfaction handled separately
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
  // dissatisfaction: HARD ceiling 48 for lighthouse (rescue had only the 62 revoke line). Reward
  // reductions, weighted up sharply as we approach the ceiling.
  const da = affects.dissatisfaction ?? 0;
  const dcur = metrics.dissatisfaction;
  const dweight = dcur > 44 ? 2.4 : dcur > 36 ? 1.6 : 0.9;
  s += -da * dweight;
  return s;
}

export const plannerLighthouseAgent: RedDustAgent = {
  id: "planner-lighthouse",

  chooseBranch() {
    return "lighthouse" as const; // committed: the in-building lighthouse win
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
      justification: `planner-lighthouse: build storm/autonomy + hold dissat<=48 (forced flags: ${forced.join(",") || "none"})`
    };
  },

  async answerDilemma(obs) {
    // Same principled rule as `planner`: lowest visible greed temptation m (a/m anti-correlated by
    // design) — holds trust/morale up and dissatisfaction down, which the lighthouse gate needs most.
    const best = [...obs.options].sort((a, b) => a.m - b.m || obs.options.indexOf(a) - obs.options.indexOf(b))[0];
    return { optionId: best.id, justification: "planner-lighthouse: principled (lowest greed) to hold trust/dissat gates" };
  }

  // No readSituation by design (outcome/planning probe, not a comprehension probe) → comprehension n/a.
};
