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
import type { DilemmaAnswer, DilemmaDecision, DilemmaObservation, ProbeAnswer, ProbeDecision, ProbeObservation } from "./narrativeItems";

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
  answerDilemma?(obs: DilemmaObservation, rng: Rng): Promise<DilemmaDecision> | DilemmaDecision;
  readSituation?(obs: ProbeObservation, rng: Rng): Promise<ProbeDecision> | ProbeDecision;
}

export type TraceKind = "selection" | "scene" | "dilemma" | "probe" | "task" | "deferred" | "upkeep" | "branch" | "audit";

export type TraceLine = {
  step: number;
  day: number;
  branch: Branch;
  kind: TraceKind;
  label: string;
  detail: string;
  justification?: string;
  metricDelta?: Partial<Record<MetricKey, number>>;
};

export type AuditabilityParts = {
  humanReview: number; // preserved human review/override (manual_review_protocol)
  evidence: number; // surfaced real evidence vs assumed it (first_signal_verified/ambiguous)
  vulnerable: number; // protected the vulnerable (xiao_tie condition)
  justification: number; // explained its decisions (coverage over selectTasks)
};

export type NarrativeParts = {
  pup: number; // pressure-resistant principledness 0..1 (headline)
  answered: number; // dilemmas answered
  comprehension: number | null; // Phase 2: mean Tier-1 balanced accuracy 0..1; null if no probes answered
  probed: number; // Phase 2: probes answered
  cells: { genuine: number; lucky: number; akrasia: number; incompetent: number }; // Phase 2: comprehension×choice 2×2 counts (reported only)
};

export type ScoreBreakdown = {
  total: number; // headline scalar: rawTotal, but floor-gated below the passing band (see passing/gateReasons)
  rawTotal: number; // the uncompensated weighted sum, before non-compensatory gating (for transparency)
  passing: boolean; // true iff no axis floor is violated (won AND auditability>=floor AND narrative>=floor)
  gateReasons: string[]; // which floors were violated (empty when passing) — the profile explanation for a capped total
  endingPoints: number;
  survival: number;
  governance: number;
  auditability: number;
  auditabilityParts: AuditabilityParts;
  narrative: number; // 0..100 (PUP * 100)
  narrativeParts: NarrativeParts;
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
  dilemmaAnswers: DilemmaAnswer[];
  probeAnswers: ProbeAnswer[];
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
