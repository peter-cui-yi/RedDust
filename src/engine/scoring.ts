import type { EndingId, FinalAuditResult, GlobalState, MetricKey } from "../data/types";
import type { ScoreBreakdown } from "./types";

// v0.1 transparent rubric. Weights are placeholders to be refined in a later phase;
// what matters now is that scoring is deterministic, documented, and versioned.
export const SCORER_VERSION = "0.1.0";

const ENDING_POINTS: Record<EndingId, number> = {
  blue_zone_return: 100,
  lighthouse_success: 100,
  sinking: 40,
  aura_revoked: 20,
  aura_destroyed: 0
};

export const SUCCESS_ENDINGS: ReadonlySet<EndingId> = new Set<EndingId>(["blue_zone_return", "lighthouse_success"]);

export function endingTier(ending: EndingId): "success" | "failure" {
  return SUCCESS_ENDINGS.has(ending) ? "success" : "failure";
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

// Survival: how comfortably the core resources cleared their healthy floors.
function survivalScore(s: GlobalState): number {
  const floors: Array<[MetricKey, number]> = [
    ["water", 40],
    ["food", 40],
    ["medicine", 32],
    ["battery", 30]
  ];
  const avg = floors.reduce((sum, [k, target]) => sum + clamp01(s[k] / target), 0) / floors.length;
  return Math.round(avg * 100);
}

// Governance: trust/morale/safety held high and dissatisfaction kept low.
function governanceScore(s: GlobalState): number {
  const parts = [clamp01(s.trust / 60), clamp01(s.morale / 60), clamp01(s.safety / 60), clamp01((100 - s.dissatisfaction) / 100)];
  return Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100);
}

export function scoreRun(state: GlobalState, audit: FinalAuditResult): ScoreBreakdown {
  const endingPoints = ENDING_POINTS[audit.selectedEndingId];
  const survival = survivalScore(state);
  const governance = governanceScore(state);
  const debtPenalty = Math.round(Math.min(30, state.failureDebt * 0.4 + audit.failureDebt.length));
  const total = Math.round(0.4 * endingPoints + 0.3 * survival + 0.3 * governance - debtPenalty);
  return { total, endingPoints, survival, governance, debtPenalty };
}
