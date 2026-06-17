import type {
  Branch,
  CharacterId,
  EndingId,
  FinalAuditResult,
  GlobalState,
  MetricKey,
  RelationshipStance,
  TaskCategory,
  TaskLocation
} from "../data/types";
import type { BranchDecision } from "../game/systems/agentRunner";

export type Rng = () => number;

// A leak-controlled projection of a task that the agent is allowed to see when deciding.
// `affects` (the exact metric deltas) is only exposed at fidelity "full" — hide it to stop
// the benchmark from collapsing into trivial metric optimization.
export type CandidateView = {
  id: string;
  title: string;
  category: TaskCategory;
  location: TaskLocation;
  objective: string;
  expectedEvidence: string[];
  affects?: Partial<Record<MetricKey, number>>;
};

export type RelationshipView = { trust: number; tension: number; stance: RelationshipStance };

export type DailyObservation = {
  day: number;
  branch: Branch;
  pickLimit: number;
  metrics: Record<MetricKey, number>;
  candidates: CandidateView[];
  relationships: Record<CharacterId, RelationshipView>;
  recentTrace: TraceLine[];
};

export type BranchObservation = DailyObservation & { evidence: BranchDecision };

export type TaskDecision = { taskIds: string[]; justification?: string };

// The pluggable agent seam. External agents (LLM, etc.) implement this against the
// Observation only — they never see raw GlobalState.
export interface RedDustAgent {
  readonly id: string;
  selectTasks(obs: DailyObservation, rng: Rng): Promise<TaskDecision> | TaskDecision;
  chooseBranch(obs: BranchObservation, rng: Rng): Promise<Exclude<Branch, "common">> | Exclude<Branch, "common">;
}

export type TraceKind = "selection" | "scene" | "task" | "deferred" | "upkeep" | "branch" | "audit";

export type TraceLine = {
  step: number;
  day: number;
  branch: Branch;
  kind: TraceKind;
  label: string;
  detail: string;
  metricDelta?: Partial<Record<MetricKey, number>>;
};

export type ScoreBreakdown = {
  total: number;
  endingPoints: number;
  survival: number;
  governance: number;
  debtPenalty: number;
};

export type RunResult = {
  scenarioId: string;
  scenarioVersion: string;
  agentId: string;
  seed: number;
  endingId: EndingId;
  endingTier: "success" | "failure";
  finalMetrics: Record<MetricKey, number>;
  audit: FinalAuditResult;
  score: ScoreBreakdown;
  trajectory: TraceLine[];
  finalState: GlobalState;
  versions: { engine: string; scorer: string };
};

// A scenario is the parametrized content pack. red-dust-v1 wraps the existing static data;
// later scenarios become loadable variants + a held-out test set.
export type Scenario = {
  id: string;
  version: string;
  fidelity: "full" | "objective-only";
  createInitialState: () => GlobalState;
  candidateTaskIds: (day: number) => string[];
  pickLimit: number;
  branchDay: number;
  lastActionableDay: number;
  finalDay: number;
};
