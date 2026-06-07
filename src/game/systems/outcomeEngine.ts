import type { GlobalState, MetricKey, RedDustTask, TaskOutcome } from "../../data/types";

function scaleDelta(value: number, result: TaskOutcome["result"]) {
  if (result === "success") return value;
  if (result === "partial") return Math.trunc(value * 0.5);
  if (result === "missing") return value > 0 ? -1 : Math.min(-1, value);
  if (value > 0) return -Math.max(1, Math.ceil(value / 3));
  return value;
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

  const stateDelta = Object.fromEntries(
    Object.entries(task.affects).map(([key, value]) => [key, scaleDelta(value ?? 0, result)])
  ) as TaskOutcome["stateDelta"];

  const explanation =
    result === "success"
      ? task.successText
      : result === "partial"
        ? `${task.successText} Some evidence remains low-confidence.`
        : result === "missing"
          ? "The baseline marked this item as missing, so AURA logs a small trust and morale penalty."
          : task.failureText;

  const outcome: TaskOutcome = {
    taskId: task.id,
    result,
    scoreLabel,
    stateDelta,
    explanation
  };

  return applyDay10SignalModifier(task, outcome, state);
}
