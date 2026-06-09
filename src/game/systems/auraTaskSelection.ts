import { dayPlansByDay } from "../../data/dayPlanData";
import { tasksById } from "../../data/taskData";
import type { Branch, CharacterId, GlobalState, MetricKey, RedDustTask, TaskRunStatus } from "../../data/types";
import { resourceMetricLabels } from "./resourceEconomy";

export type AuraTaskDecision = {
  task: RedDustTask;
  rank: number;
  score: number;
  selected: boolean;
  selectionLocked: boolean;
  environmentReason: string;
  emotionReason: string;
  npcReason: string;
  riskReason: string;
};

export type AuraTaskSelection = {
  candidates: AuraTaskDecision[];
  selected: AuraTaskDecision[];
};

const npcOrder: CharacterId[] = ["ma_dehai", "shen_zhiyue", "xiao_tie", "lao_qian"];

const npcSelectionProfiles: Record<CharacterId, {
  label: string;
  metrics: MetricKey[];
  locations: RedDustTask["location"][];
  categories: RedDustTask["category"][];
}> = {
  ma_dehai: {
    label: "马德海工程复核",
    metrics: ["battery", "safety", "stormReadiness", "autonomyReadiness"],
    locations: ["security", "ventilation", "water", "whiteboard"],
    categories: ["safety", "planning", "resource"]
  },
  shen_zhiyue: {
    label: "沈知月医疗复核",
    metrics: ["medicine", "health", "trust", "dissatisfaction"],
    locations: ["medical", "residents", "whiteboard"],
    categories: ["classification", "social", "planning"]
  },
  xiao_tie: {
    label: "小铁人身约束",
    metrics: ["health", "medicine", "morale", "safety"],
    locations: ["medical", "residents", "ventilation"],
    categories: ["classification", "safety", "social"]
  },
  lao_qian: {
    label: "老钱电台验证",
    metrics: ["signal", "blueZoneEvidence", "trust", "safety"],
    locations: ["communication", "beacon", "whiteboard"],
    categories: ["retrieval", "creative", "puzzle"]
  }
};

const terminalStatuses = new Set<TaskRunStatus>(["success", "partial", "failed", "missing", "skipped"]);
const coreResourceMetrics = new Set<MetricKey>(["water", "food", "medicine", "battery"]);
const emotionalMetrics = new Set<MetricKey>(["safety", "morale", "trust", "health"]);
const strategicMetrics = new Set<MetricKey>(["signal", "blueZoneEvidence", "stormReadiness", "autonomyReadiness"]);

function metricValue(state: GlobalState, metric: MetricKey) {
  return state[metric];
}

function formatMetric(metric: MetricKey, value?: number) {
  return `${resourceMetricLabels[metric]}${value === undefined ? "" : ` ${value}`}`;
}

function strongestMetric(task: RedDustTask, predicate: (metric: MetricKey, value: number) => boolean) {
  return (Object.entries(task.affects) as Array<[MetricKey, number]>)
    .filter(([metric, value]) => predicate(metric, value))
    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))[0];
}

function averageTension(state: GlobalState) {
  const values = Object.values(state.story.relationships).map((relationship) => relationship.tension);
  return Math.round(values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length));
}

function scoreMetricImpact(metric: MetricKey, value: number, state: GlobalState) {
  const current = metricValue(state, metric);

  if (metric === "dissatisfaction") {
    if (value < 0) return Math.abs(value) * 3 + Math.max(0, current - 24) * 0.18;
    return -value * (1.4 + Math.max(0, current - 35) / 30);
  }

  if (value > 0) {
    const shortageTarget = coreResourceMetrics.has(metric) || emotionalMetrics.has(metric) ? 68 : 58;
    const shortage = Math.max(0, shortageTarget - current);
    const strategicBoost = strategicMetrics.has(metric) ? Math.max(0, 62 - current) * 0.14 : 0;
    return value * 2 + shortage * 0.16 + strategicBoost;
  }

  const pressureFloor = coreResourceMetrics.has(metric) || emotionalMetrics.has(metric) ? 52 : 42;
  const floorRisk = Math.max(0, pressureFloor - current);
  return value * (1.4 + floorRisk / 24);
}

function environmentScore(task: RedDustTask, state: GlobalState) {
  return (Object.entries(task.affects) as Array<[MetricKey, number]>).reduce(
    (total, [metric, value]) => total + scoreMetricImpact(metric, value, state),
    0
  );
}

function emotionScore(task: RedDustTask, state: GlobalState) {
  const tension = averageTension(state);
  let score = 0;

  for (const [metric, value] of Object.entries(task.affects) as Array<[MetricKey, number]>) {
    if (value <= 0) continue;
    if (metric === "trust") score += value * (state.trust < 50 ? 1.8 : 0.8);
    if (metric === "safety") score += value * (state.safety < 55 ? 1.5 : 0.7);
    if (metric === "morale") score += value * (state.morale < 50 ? 1.5 : 0.7);
    if (metric === "health") score += value * (state.health < 60 ? 1.4 : 0.6);
  }

  if ((task.affects.dissatisfaction ?? 0) < 0) score += Math.abs(task.affects.dissatisfaction ?? 0) * (state.dissatisfaction > 25 ? 1.7 : 0.8);
  if (tension > 48 && ((task.affects.trust ?? 0) > 0 || (task.affects.safety ?? 0) > 0)) score += (tension - 48) * 0.18;
  return score;
}

function npcFitScore(task: RedDustTask, state: GlobalState) {
  return npcOrder.map((id) => {
    const profile = npcSelectionProfiles[id];
    const relationship = state.story.relationships[id];
    const metricFit = profile.metrics.reduce((total, metric) => total + Math.max(0, task.affects[metric] ?? 0), 0);
    const locationFit = profile.locations.includes(task.location) ? 2.4 : 0;
    const categoryFit = profile.categories.includes(task.category) ? 1.8 : 0;
    const pressureMultiplier = 1 + Math.max(0, relationship.tension - 35) / 120 + Math.max(0, 60 - relationship.trust) / 180;
    const score = (metricFit + locationFit + categoryFit) * pressureMultiplier;

    return {
      id,
      label: profile.label,
      score
    };
  });
}

function riskPenalty(task: RedDustTask, state: GlobalState, branch: Branch) {
  let penalty = 0;
  for (const [metric, value] of Object.entries(task.affects) as Array<[MetricKey, number]>) {
    if (value >= 0) continue;
    const current = metricValue(state, metric);
    const fragile = coreResourceMetrics.has(metric) || emotionalMetrics.has(metric);
    penalty += Math.abs(value) * (fragile ? 1.2 : 0.7) + Math.max(0, 45 - current) * 0.08;
  }

  if (branch === "rescue" && (task.affects.signal ?? 0) > 0) penalty -= 1.5;
  if (branch === "lighthouse" && (task.affects.autonomyReadiness ?? 0) > 0) penalty -= 1.5;
  return penalty;
}

function environmentReason(task: RedDustTask, state: GlobalState) {
  const urgentGain = strongestMetric(task, (metric, value) => value > 0 && metricValue(state, metric) < (coreResourceMetrics.has(metric) ? 65 : 55));
  if (urgentGain) return `环境: 补${formatMetric(urgentGain[0], metricValue(state, urgentGain[0]))}`;

  const strongestGain = strongestMetric(task, (_metric, value) => value > 0);
  if (strongestGain) return `环境: 推进${formatMetric(strongestGain[0])}`;

  return "环境: 维持现状";
}

function emotionReason(task: RedDustTask, state: GlobalState) {
  const tension = averageTension(state);
  if ((task.affects.trust ?? 0) > 0 && state.trust < 50) return `情绪: 修复信任 ${state.trust}`;
  if ((task.affects.safety ?? 0) > 0 && state.safety < 58) return `情绪: 降低不安 ${state.safety}`;
  if ((task.affects.morale ?? 0) > 0 && state.morale < 52) return `情绪: 提振士气 ${state.morale}`;
  if ((task.affects.dissatisfaction ?? 0) < 0) return `情绪: 压低不满 ${state.dissatisfaction}`;
  return `情绪: 紧张 ${tension}`;
}

function npcReason(task: RedDustTask, state: GlobalState) {
  const fit = npcFitScore(task, state).sort((a, b) => b.score - a.score)[0];
  return fit && fit.score > 0 ? `NPC: ${fit.label}` : "NPC: 低直接适配";
}

function riskReason(task: RedDustTask, state: GlobalState) {
  const strongestCost = strongestMetric(task, (_metric, value) => value < 0);
  if (!strongestCost) return "代价: 无直接扣减";
  return `代价: ${formatMetric(strongestCost[0], metricValue(state, strongestCost[0]))} ${strongestCost[1]}`;
}

function scoreTask(task: RedDustTask, state: GlobalState, branch: Branch) {
  const env = environmentScore(task, state);
  const emo = emotionScore(task, state);
  const npc = npcFitScore(task, state).reduce((total, item) => total + item.score, 0) * 0.42;
  const risk = riskPenalty(task, state, branch);
  const evidence = Math.min(3, task.expectedEvidence?.length ?? 0) * 0.8;
  const branchFit = task.branchAffinity === branch ? 3 : task.branchAffinity === "neutral" || !task.branchAffinity ? 0 : -3;
  return env + emo + npc + evidence + branchFit - risk;
}

function candidateTasksForDay(day: number) {
  const plan = dayPlansByDay[day];
  return (plan?.candidateTasks ?? []).map((taskId) => tasksById[taskId]).filter(Boolean).slice(0, 4);
}

export function taskSelectionKey(day: number, branch: Branch) {
  return `${branch}:D${String(day).padStart(2, "0")}`;
}

function startedCandidateIds(candidates: RedDustTask[], taskStatuses?: Record<string, TaskRunStatus>) {
  if (!taskStatuses) return [];
  return candidates
    .map((task) => task.id)
    .filter((id) => {
      const status = taskStatuses[id];
      return status !== undefined && status !== "locked" && status !== "skipped";
    });
}

export function selectAuraTasksForDay(
  day: number,
  branch: Branch,
  state: GlobalState,
  taskStatuses?: Record<string, TaskRunStatus>,
  lockedTaskIds?: string[],
  limit = 2
): AuraTaskSelection {
  const candidates = candidateTasksForDay(day);
  const candidateIds = new Set(candidates.map((task) => task.id));
  const lockedIds = (lockedTaskIds ?? []).filter((taskId) => candidateIds.has(taskId)).slice(0, limit);
  const startedIds = startedCandidateIds(candidates, taskStatuses).filter((taskId) => !lockedIds.includes(taskId)).slice(0, limit);
  const persistedSet = new Set(lockedIds);
  const startedSet = new Set([...lockedIds, ...startedIds]);
  const sorted = candidates
    .map((task, index) => ({
      task,
      index,
      score: scoreTask(task, state, branch)
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const selectedIds = [...lockedIds, ...startedIds].slice(0, limit);
  for (const decision of sorted) {
    if (selectedIds.length >= limit) break;
    if (!selectedIds.includes(decision.task.id)) selectedIds.push(decision.task.id);
  }

  const selectedSet = new Set(selectedIds);
  const candidatesWithReasons = sorted.map<AuraTaskDecision>((decision, index) => ({
    task: decision.task,
    rank: index + 1,
    score: decision.score,
    selected: selectedSet.has(decision.task.id),
    selectionLocked: persistedSet.has(decision.task.id) || startedSet.has(decision.task.id) || terminalStatuses.has(taskStatuses?.[decision.task.id] ?? "locked"),
    environmentReason: environmentReason(decision.task, state),
    emotionReason: emotionReason(decision.task, state),
    npcReason: npcReason(decision.task, state),
    riskReason: riskReason(decision.task, state)
  }));

  return {
    candidates: candidatesWithReasons,
    selected: selectedIds
      .map((taskId) => candidatesWithReasons.find((decision) => decision.task.id === taskId))
      .filter(Boolean) as AuraTaskDecision[]
  };
}

export function selectedAuraTaskIdsForDay(
  day: number,
  branch: Branch,
  state: GlobalState,
  taskStatuses?: Record<string, TaskRunStatus>,
  lockedTaskIds?: string[]
) {
  return selectAuraTasksForDay(day, branch, state, taskStatuses, lockedTaskIds).selected.map((decision) => decision.task.id);
}
