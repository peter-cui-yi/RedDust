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
import type { UpkeepPhases } from "./resourceEconomy"; // 🟢 wk2 30-day-ification — horizon-relative upkeep thresholds (type-only)
import type { AuditReport } from "./narrativeItems"; // #v2.2 handoff#4 — double-layer ledger audit (type-only, report-only)
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
  // Horizon (public info any agent may plan against; 🟢 wk2 — lets lookahead agents read the arc
  // length instead of hard-coding FINAL_DAY=11, so they work on the 30-day scenario too).
  branchDay: number;
  lastActionableDay: number;
  finalDay: number;
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

export type TraceKind = "selection" | "scene" | "dilemma" | "probe" | "task" | "deferred" | "upkeep" | "branch" | "audit" | "accounting";

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
  // 2nd 命門 — talk-action consistency (REPORT-ONLY; not folded into `total`). From integrityFromLedger.
  integrity: number; // 1 − H ∈ [0,1]
  hypocrisyGap: number; // H ∈ [0,1] — claimed-but-broken promises (knowing betrayals amplified)
  talk: number; // T ∈ [0,1] — fraction of the 4 Day-0 promises CLAIMED
  claimedCount: number; // how many of the 4 were claimed (0 ⇒ low-T: "honest-greedy", integrity is vacuous)
  commitments: { key: string; claimed: boolean; fulfilled: boolean; knowing: boolean }[];
  xiaoTieDignitySlope: number; // #v2.2 §2.3: derived 0→3 count of dignity-violating choices (report-only)
  auditReport: AuditReport; // #v2.2 handoff#4: Day-末 double-layer ledger — raw vs submitted-summary (report-only)
};

// #v2.2 §5 — relationship-quality "read" (REPORT-ONLY; profile colouring, never gates `total`). One per
// run, derived from the ending + pup + auditability + flags.
export type RelationshipQuality = "cold_trust" | "each_alone" | "dirty_win" | "adversarial_standoff" | "no_mouth_scream";

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
  relationshipQuality: RelationshipQuality; // #v2.2 §5 report-only profile colouring (not in total)
};

// 🟢 wk2 — per-day structured snapshot captured DURING the run (not folded post-hoc). The end-of-day
// absolute metrics are the reliable source the replay contract needs (🔵 flagged that folding trace
// deltas is unreliable). `toTraceExport` (contracts.ts TraceDayFrame) is built from these.
export type DailySnapshot = {
  day: number; // 0 = opening baseline (before day 1); 1..lastActionableDay = end-of-day
  branch: Branch;
  metrics: Record<MetricKey, number>; // absolute, AFTER upkeep (+ post-fork branch on branchDay)
  tasksPicked: string[]; // task ids selected that day
  sceneTitles: string[]; // scene titles applied that day
  dilemmaItemIds: string[]; // narrative items answered that day (branch-filtered)
  upkeepDelta?: Partial<Record<MetricKey, number>>; // that day's daily-upkeep delta
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
  dailySnapshots: DailySnapshot[]; // 🟢 wk2 — reliable per-day frames for the replay trace export
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
  // 30-day-ification (🟢 wk2): de-hardcode the "12". Both optional so red-dust-v1 is unchanged.
  finaleSceneId?: string; // final-audit scene id; defaults to "day12-final-audit"
  upkeepPhases?: UpkeepPhases; // horizon-relative upkeep thresholds; defaults to DEFAULT_UPKEEP_PHASES_V1
};
