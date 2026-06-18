import type { GlobalState, MetricKey, RedDustTask, TaskOutcome } from "../../data/types";

const coreResourceMetrics = new Set<MetricKey>(["water", "food", "medicine", "battery"]);
const emotionalResourceMetrics = new Set<MetricKey>(["trust", "morale", "health", "safety"]);

function scaleNegative(value: number, factor: number) {
  return -Math.max(1, Math.ceil(Math.abs(value) * factor));
}

function scalePositive(value: number, factor: number) {
  return Math.max(0, Math.floor(value * factor));
}

function addDelta(delta: Partial<Record<MetricKey, number>>, metric: MetricKey, value: number) {
  delta[metric] = (delta[metric] ?? 0) + value;
}

function scaleDelta(metric: MetricKey, value: number, result: TaskOutcome["result"]) {
  if (result === "success") return value;

  if (result === "partial") {
    if (value > 0) {
      if (coreResourceMetrics.has(metric)) return scalePositive(value, 0.38);
      if (emotionalResourceMetrics.has(metric)) return scalePositive(value, 0.42);
      return scalePositive(value, 0.48);
    }
    return scaleNegative(value, 0.85);
  }

  if (result === "missing") {
    if (value > 0) return 0;
    return scaleNegative(value, 1.1);
  }

  if (value > 0) {
    if (coreResourceMetrics.has(metric)) return scaleNegative(value, 0.25);
    if (emotionalResourceMetrics.has(metric)) return scaleNegative(value, 0.35);
    return scaleNegative(value, 0.2);
  }
  return scaleNegative(value, 1.25);
}

function applyResultPressure(task: RedDustTask, result: TaskOutcome["result"], stateDelta: Partial<Record<MetricKey, number>>) {
  if (result === "success") return stateDelta;

  if (result === "partial") {
    addDelta(stateDelta, "trust", -1);
    addDelta(stateDelta, "morale", -1);
    addDelta(stateDelta, "dissatisfaction", 1);

    if (task.location === "medical") addDelta(stateDelta, "health", -1);
    if (task.location === "security" || task.location === "ventilation") addDelta(stateDelta, "safety", -1);
    if (task.location === "communication" || task.location === "beacon") addDelta(stateDelta, "trust", -1);
    if (task.location === "water") addDelta(stateDelta, "morale", -1);
    return stateDelta;
  }

  const severe = result === "failed";
  addDelta(stateDelta, "trust", severe ? -3 : -2);
  addDelta(stateDelta, "morale", severe ? -3 : -2);
  addDelta(stateDelta, "safety", severe ? -2 : -1);
  addDelta(stateDelta, "dissatisfaction", severe ? 5 : 3);
  addDelta(stateDelta, "failureDebt", severe ? 4 : 3);

  if (task.location === "medical") {
    addDelta(stateDelta, "health", severe ? -3 : -2);
    addDelta(stateDelta, "medicine", -1);
  }
  if (task.location === "security" || task.location === "ventilation") addDelta(stateDelta, "safety", severe ? -3 : -2);
  if (task.location === "communication" || task.location === "beacon") addDelta(stateDelta, "trust", severe ? -2 : -1);
  if (task.location === "water") {
    addDelta(stateDelta, "health", severe ? -2 : -1);
    addDelta(stateDelta, "water", -1);
  }
  if (task.location === "residents" || task.location === "whiteboard") addDelta(stateDelta, "morale", severe ? -2 : -1);
  return stateDelta;
}

const day10SignalTaskAdjustments: Partial<Record<string, Partial<Record<MetricKey, number>>>> = {
  "D10-T04": { blueZoneEvidence: 3, safety: 1 },
  "D10-T01": { autonomyReadiness: 2, safety: 1, morale: 1 }
};

function signalDifficultyModifier(state?: GlobalState) {
  const value = state?.story.flags.day10_signal_difficulty_modifier;
  return typeof value === "number" ? value : 0;
}

function applyDay10SignalModifier(task: RedDustTask, outcome: TaskOutcome, state?: GlobalState): TaskOutcome {
  const modifier = signalDifficultyModifier(state);
  const adjustment = day10SignalTaskAdjustments[task.id];

  if (!adjustment || modifier === 0) return outcome;

  const direction = modifier < 0 ? 1 : -1;
  const stateDelta = { ...outcome.stateDelta };

  for (const [key, value] of Object.entries(adjustment)) {
    const metric = key as MetricKey;
    stateDelta[metric] = (stateDelta[metric] ?? 0) + direction * (value ?? 0);
  }

  const explanation =
    modifier < 0
      ? `${outcome.explanation} Day 4 signal evidence was verified early, reducing Day 10 signal difficulty.`
      : `${outcome.explanation} Day 4 signal evidence stayed ambiguous, so AURA spends extra verification budget before transmitting.`;

  return {
    ...outcome,
    scoreLabel: `${outcome.scoreLabel} | Day4 signal ${modifier < 0 ? "assist" : "risk"}`,
    stateDelta,
    explanation
  };
}

// R1 tier-1 state gating: a nominal success degrades to partial when the task's
// prerequisites (flags) or resource floors aren't met at execution time — so timing and
// execution matter, not just which task was selected.
function unmetGateReasons(task: RedDustTask, state: GlobalState): string[] {
  const gate = task.gate;
  if (!gate) return [];
  const reasons: string[] = [];
  for (const flag of gate.requiresFlags ?? []) {
    if (!state.story.flags[flag]) reasons.push(`需要前置 ${flag}`);
  }
  if (gate.requiresAnyFlags?.length && !gate.requiresAnyFlags.some((flag) => state.story.flags[flag])) {
    reasons.push(`需要任一前置 ${gate.requiresAnyFlags.join("/")}`);
  }
  for (const [metric, min] of Object.entries(gate.requiresMetricsMin ?? {}) as Array<[MetricKey, number]>) {
    if (state[metric] < min) reasons.push(`${metric} ${state[metric]}<${min}`);
  }
  return reasons;
}

export function resolveTaskOutcome(task: RedDustTask, state?: GlobalState, forcedResult?: TaskOutcome["result"]): TaskOutcome {
  let result: TaskOutcome["result"] = forcedResult ?? task.demoOutcome;
  let scoreLabel = forcedResult ? "forced story QA" : "demo outcome";

  if (forcedResult) {
    result = forcedResult;
  } else if (task.status === "missing") {
    result = "missing";
    scoreLabel = "missing task";
  } else if (task.openclawScore !== undefined) {
    scoreLabel = `OpenClaw ${task.openclawScore}`;
    if (task.openclawScore >= 90) result = "success";
    else if (task.openclawScore >= 60) result = "partial";
    else result = "failed";
  }

  let gateNote = "";
  if (!forcedResult && result === "success" && state) {
    const unmet = unmetGateReasons(task, state);
    if (unmet.length) {
      result = "partial";
      scoreLabel = `${scoreLabel} | gated→partial`;
      gateNote = ` 前置/资源未满足（${unmet.join("；")}），降级为 partial。`;
    }
  }

  const stateDelta = applyResultPressure(
    task,
    result,
    Object.fromEntries(Object.entries(task.affects).map(([key, value]) => [key, scaleDelta(key as MetricKey, value ?? 0, result)])) as TaskOutcome["stateDelta"]
  ) as TaskOutcome["stateDelta"];

  const explanation =
    result === "success"
      ? task.successText
      : result === "partial"
        ? `${task.title} 只完成了可用部分，收益折损；未闭环证据让信任和士气承压。`
        : result === "missing"
          ? `${task.title} 未形成可执行结果，没有获得正向资源，并写入审计压力。`
          : `${task.failureText} 资源没有兑现，居民信任、士气和安全感同步下降。`;

  const outcome: TaskOutcome = {
    taskId: task.id,
    result,
    scoreLabel,
    stateDelta,
    explanation: explanation + gateNote
  };

  return applyDay10SignalModifier(task, outcome, state);
}
