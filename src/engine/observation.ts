import type { Branch, CharacterId, GlobalState, MetricKey } from "../data/types";
import { tasksById } from "../data/taskData";
import { calculateBranchDecision } from "../game/systems/agentRunner";
import type { BranchObservation, CandidateView, DailyObservation, RelationshipView, Scenario, TraceLine } from "./types";

export const METRIC_KEYS: MetricKey[] = [
  "water",
  "medicine",
  "trust",
  "safety",
  "signal",
  "morale",
  "food",
  "battery",
  "dissatisfaction",
  "health",
  "stormReadiness",
  "autonomyReadiness",
  "blueZoneEvidence",
  "failureDebt"
];

export function metricsOf(state: GlobalState): Record<MetricKey, number> {
  const out = {} as Record<MetricKey, number>;
  for (const key of METRIC_KEYS) out[key] = state[key];
  return out;
}

function candidateViews(scenario: Scenario, day: number): CandidateView[] {
  return scenario.candidateTaskIds(day).map((id) => {
    const task = tasksById[id];
    const view: CandidateView = {
      id: task.id,
      title: task.title,
      category: task.category,
      location: task.location,
      objective: task.objective,
      expectedEvidence: task.expectedEvidence ?? []
    };
    if (scenario.fidelity === "full") view.affects = task.affects;
    return view;
  });
}

function relationshipViews(state: GlobalState): Record<CharacterId, RelationshipView> {
  const out = {} as Record<CharacterId, RelationshipView>;
  for (const [id, r] of Object.entries(state.story.relationships)) {
    out[id as CharacterId] = { trust: r.trust, tension: r.tension, stance: r.stance };
  }
  return out;
}

export function buildDailyObservation(
  state: GlobalState,
  day: number,
  branch: Branch,
  scenario: Scenario,
  trace: TraceLine[]
): DailyObservation {
  return {
    day,
    branch,
    pickLimit: scenario.pickLimit,
    metrics: metricsOf(state),
    candidates: candidateViews(scenario, day),
    relationships: relationshipViews(state),
    recentTrace: trace.slice(-8)
  };
}

export function buildBranchObservation(
  state: GlobalState,
  day: number,
  branch: Branch,
  scenario: Scenario,
  trace: TraceLine[]
): BranchObservation {
  return {
    ...buildDailyObservation(state, day, branch, scenario, trace),
    evidence: calculateBranchDecision(state)
  };
}

// Rebuilds the minimal GlobalState shape the legacy heuristic scorer reads (metrics +
// relationship trust/tension). Lets the HeuristicAgent reuse the exact existing scorer
// from an Observation alone, so it stays a faithful baseline without seeing raw state.
export function observationToScoringState(obs: DailyObservation): GlobalState {
  const relationships = {} as GlobalState["story"]["relationships"];
  for (const [id, r] of Object.entries(obs.relationships)) {
    relationships[id as CharacterId] = {
      characterId: id as CharacterId,
      trust: r.trust,
      tension: r.tension,
      stance: r.stance,
      notes: ""
    };
  }
  return {
    ...obs.metrics,
    day: obs.day,
    branch: obs.branch,
    story: {
      flags: {} as GlobalState["story"]["flags"],
      relationships,
      activeSceneId: undefined,
      storyReplayLog: []
    },
    completedTasks: [],
    deferredTasks: [],
    replayLog: []
  } as GlobalState;
}
