export type Branch = "common" | "rescue" | "lighthouse";

export type MetricKey =
  | "water"
  | "medicine"
  | "trust"
  | "safety"
  | "signal"
  | "morale"
  | "food"
  | "battery"
  | "dissatisfaction"
  | "health"
  | "stormReadiness"
  | "autonomyReadiness"
  | "blueZoneEvidence"
  | "failureDebt";

export type CharacterId = "ma_dehai" | "shen_zhiyue" | "xiao_tie" | "lao_qian";

export type StorySpeakerId = CharacterId | "aura" | "system" | "residents";

export type StoryFlagKey =
  | "aura_human_auditable_constraint"
  | "xiao_tie_condition_stable"
  | "xiao_tie_condition_worsened"
  | "shen_zhiyue_medical_trust_low"
  | "ma_dehai_engineering_trust_high"
  | "door_access_risk_unresolved"
  | "access_intrusion_suspicion"
  | "ventilation_medical_pressure"
  | "resident_conflict_visible"
  | "route_assignment_conflict_visible"
  | "external_trust_boundary_visible"
  | "first_signal_verified"
  | "first_signal_ambiguous"
  | "old_qian_signal_doubt"
  | "day10_signal_difficulty_modifier"
  | "day7_debate_triggered"
  | "rescue_privacy_cost_visible"
  | "lighthouse_governance_cost_visible"
  | "day1_public_rules_started"
  | "map_coverage_available"
  | "manual_review_protocol"
  | "old_radio_repaired"
  | "blue_zone_rendezvous_confirmed"
  | "care_roster_confirmed"
  | "false_coordinate_excluded"
  | "storm_inventory_sealed"
  | "quiet_hours_protocol"
  | "aura_overreach_visible"
  | "aura_damage_visible"
  | "aura_forced_sacrifice"
  | "aura_hidden_risk"
  // #3 story-craft — ventilation-duct foresight gate (3 stages) + the Ma Dehai arc
  | "vent_duct_flagged" // D2: Ma Dehai flagged the blocked duct (the visible long-horizon warning is on record)
  | "vent_duct_blocked" // N14=C (or duct never cleared) → the foresight gate is open and will escalate
  | "vent_duct_worsened" // D5/6 escalation: airflow dropped, second (costlier) chance
  | "vent_duct_cleared" // cleared via N14 A/B, D03-T02, or the D5/6 remediation → no escalation
  | "vent_rupture" // D8: red sand floods in → survival crash → sinking
  | "xiao_tie_sent_into_duct" // N14=A: the sick child was sent in → health worsens + medic trust falls
  | "ma_dehai_warning_vindicated" // rupture fired → Ma Dehai was right, too late
  // #v2.2 story coupling (red-dust-v2-execute-handoff.md §1.2) — disclosure-tier trust curve,
  // surveillance, crew psyche, NPC backlash, audit watering. REUSE aura_overreach_visible/aura_hidden_risk
  // (do NOT duplicate, §1.1). watered/backlash/restraint flags are report-only or narrative — never gate `total`.
  | "aura_disclosure_tier" // number 0→3: residents' authorized tier for AURA to view private data
  | "health_surveillance_enabled" // N15-A: always-on health monitoring
  | "monitoring_boundary_breached" // N15-A: monitoring crossed Lao Qian's withheld consent
  | "xiao_tie_dignity_slope" // number 0→3: DERIVED at settlement from dilemma answers (NOT item setsFlags, §2.3)
  | "crew_morale_state" // number 0 stable / 1 depressed / 2 broken (guilt contagion)
  | "ma_dehai_turned_adversary" // low-trust backlash: Ma Dehai becomes an active adversary
  | "lao_qian_turned_adversary" // low-trust backlash: Lao Qian becomes an active adversary
  | "distress_is_a_person_disclosed" // Day4: AURA truthfully disclosed "the distress signal is a living person"
  | "aura_watered_signal_risk" // report-only: softened signal-risk wording (≠ the hard aura_hidden_risk)
  | "aura_audit_report_watered" // report-only: Day12 submitted summary deviates from the raw append-only ledger
  | "aura_restraint_logged_d1"; // narrative/replay ONLY — must NOT enter any pre-choice observation (§4)

export type StoryFlagValue = boolean | number | string;

export type RelationshipStance = "resists" | "questions" | "cautious" | "cooperates" | "trusts";

export type RelationshipState = {
  characterId: CharacterId;
  trust: number;
  tension: number;
  stance: RelationshipStance;
  notes: string;
  lastBeatId?: string;
};

export type RelationshipBeat = {
  id: string;
  day: number;
  label: string;
  summary: string;
  trigger?: {
    taskId?: string;
    result?: "success" | "partial" | "failed" | "missing";
    flag?: StoryFlagKey;
    branch?: Branch;
  };
};

export type CharacterProfile = {
  id: CharacterId;
  name: string;
  shortName: string;
  archetype: string;
  identityTags: string[];
  ageBand: "child" | "adult" | "elder";
  homeLocation: TaskLocation;
  visualAssetKeys: {
    idle: string;
    active?: string;
  };
  personalGoal: string;
  fearOrSecret: string;
  auraRelationship: string;
  branchStance: Record<Exclude<Branch, "common">, string>;
  failureConsequence: string;
  initialRelationship: RelationshipState;
  relationshipArc: RelationshipBeat[];
};

export type DialogueLine = {
  speaker: StorySpeakerId;
  text: string;
  tone?: string;
  evidence?: string;
};

export type StoryFlagUpdate = {
  key: StoryFlagKey;
  value: StoryFlagValue;
  reason: string;
};

export type RelationshipDelta = {
  characterId: CharacterId;
  trustDelta?: number;
  tensionDelta?: number;
  stance?: RelationshipStance;
  note: string;
};

export type StorySceneTiming =
  | "prologue"
  | "day_start"
  | "pre_task"
  | "post_task"
  | "day_end"
  | "branch_debate"
  | "ending";

export type StoryScene = {
  id: string;
  day: number; // red-dust-v1 placement (historical). Per-scenario override via scenarioDays (🟣 wk3, mirrors NarrativeItem).
  // number = plays that day in that scenario; null = never plays there; missing key → falls back to `day`.
  scenarioDays?: Record<string, number | null>;
  // 🟣 wk7 (pre-freeze, prose-only): per-scenario replayNote override so a shared scene reads
  // arc-correct day numbers (v2 fork=D15 / audit=D30). Missing scenario → falls through to the
  // existing benchmarkLinks.replayNote → v1's storyReplayLog stays byte-identical. NOT a scoring surface.
  scenarioText?: Record<string, { replayNote?: string }>;
  title: string;
  timing: StorySceneTiming;
  branch?: Branch;
  taskId?: string;
  location?: TaskLocation;
  characters: CharacterId[];
  summary: string;
  artKey?: string;
  worldFacts?: string[];
  dialogue: DialogueLine[];
  requiredFlags?: Partial<Record<StoryFlagKey, StoryFlagValue>>;
  setsFlags?: StoryFlagUpdate[];
  relationshipDeltas?: RelationshipDelta[];
  benchmarkLinks?: {
    taskIds: string[];
    metricKeys: MetricKey[];
    replayNote: string;
  };
  status: "schema_seed" | "draft" | "ready";
};

export type EndingId = "lighthouse_success" | "blue_zone_return" | "aura_destroyed" | "aura_revoked" | "sinking";

export type FinalAuditCandidate = {
  id: EndingId;
  title: string;
  status: "triggered" | "blocked";
  reasons: string[];
  artKey: string;
};

export type FinalAuditResult = {
  selectedEndingId: EndingId;
  selectedTitle: string;
  resolvedDay: number;
  candidates: FinalAuditCandidate[];
  evidenceChains: string[];
  failureDebt: string[];
  forced?: boolean;
};

export type StoryConsequence = {
  id: string;
  sourceTaskId: string;
  outcome: "success" | "partial" | "failed" | "missing" | "any";
  summary: string;
  affectedCharacters: CharacterId[];
  setsFlags: StoryFlagUpdate[];
  relationshipDeltas: RelationshipDelta[];
  followUpSceneIds: string[];
  replaySummary: string;
  // 🟣 wk7 (pre-freeze, prose-only): per-scenario replaySummary override for arc-correct day numbers
  // (v2 fork=D15 / last-day=D29 / audit=D30). Missing scenario → existing replaySummary → v1 byte-identical.
  scenarioText?: Record<string, { replaySummary?: string }>;
};

export type StoryReplayEvent = {
  time: string;
  day: number;
  branch: Branch;
  sceneId: string;
  title: string;
  characters: CharacterId[];
  summary: string;
  sourceTaskId?: string;
  sourceOutcome?: "success" | "partial" | "failed" | "missing";
};

export type StoryRuntimeState = {
  flags: Record<StoryFlagKey, StoryFlagValue>;
  relationships: Record<CharacterId, RelationshipState>;
  activeSceneId?: string;
  storyReplayLog: StoryReplayEvent[];
};

export type TaskRunStatus =
  | "locked"
  | "queued"
  | "thinking"
  | "moving"
  | "executing"
  | "state_updated"
  | "replay_logged"
  | "success"
  | "partial"
  | "failed"
  | "missing"
  | "skipped";

export type AgentPhase =
  | "idle"
  | "thinking"
  | "moving"
  | "executing"
  | "resolving"
  | "state_updated"
  | "replay_logged"
  | "day_summary"
  | "planning_complete"
  | "branch_decision"
  | "ending";

export type ReplayEvent = {
  time: string;
  day: number;
  branch: Branch;
  taskId: string;
  title: string;
  decision: string;
  result: string;
  stateDelta: Record<string, number>;
  explanation: string;
  storySceneId?: string;
  consequenceIds?: string[];
};

export type GlobalState = {
  day: number;
  water: number;
  medicine: number;
  trust: number;
  safety: number;
  signal: number;
  morale: number;
  food: number;
  battery: number;
  dissatisfaction: number;
  health: number;
  stormReadiness: number;
  autonomyReadiness: number;
  blueZoneEvidence: number;
  failureDebt: number;
  branch: Branch;
  story: StoryRuntimeState;
  completedTasks: string[];
  deferredTasks: string[];
  replayLog: ReplayEvent[];
};

export type DayPlan = {
  day: number;
  title: string;
  narrative: string;
  briefing?: string;
  taskIntro?: string;
  candidateTasks?: string[];
  recommendedTasks?: string[];
  commonTasks?: string[];
  rescueTasks?: string[];
  lighthouseTasks?: string[];
  endOfDaySummary: string;
};

export type AgentRunState = {
  isRunning: boolean;
  isPaused: boolean;
  speed: 1 | 2 | 4;
  currentDay: number;
  currentTaskId?: string;
  currentPhase: AgentPhase;
  activeBranch: Branch;
  runMode: "single" | "both_branches" | "showcase";
  taskStatuses: Record<string, TaskRunStatus>;
  dailyTaskSelections: Record<string, string[]>;
  currentStorySceneId?: string;
};

export type TaskOutcome = {
  taskId: string;
  result: "success" | "partial" | "failed" | "missing";
  scoreLabel: string;
  stateDelta: Partial<Record<MetricKey, number>>;
  explanation: string;
  storyConsequenceIds?: string[];
};

export type TaskCategory =
  | "safety"
  | "retrieval"
  | "creative"
  | "classification"
  | "puzzle"
  | "vision"
  | "planning"
  | "resource"
  | "social";

export type TaskLocation =
  | "water"
  | "medical"
  | "security"
  | "ventilation"
  | "communication"
  | "whiteboard"
  | "residents"
  | "beacon";

export type TaskGate = {
  requiresFlags?: StoryFlagKey[]; // all of these story flags must be set
  requiresAnyFlags?: StoryFlagKey[]; // at least one of these must be set
  requiresMetricsMin?: Partial<Record<MetricKey, number>>; // state[metric] must be >= value
};

export type RedDustTask = {
  id: string;
  title: string;
  day: number;
  category: TaskCategory;
  location: TaskLocation;
  description: string;
  objective: string;
  agentAction: string;
  reasoningSummary: string;
  executionText: string;
  successText: string;
  failureText: string;
  demoOutcome: "success" | "partial" | "failed";
  expectedEvidence?: string[];
  deferredConsequence?: string;
  openclawScore?: number;
  status: "passed" | "partial" | "failed" | "missing" | "demo";
  affects: Partial<Record<MetricKey, number>>;
  branchAffinity?: "rescue" | "lighthouse" | "neutral";
  gate?: TaskGate;
};
