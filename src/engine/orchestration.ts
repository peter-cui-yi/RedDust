// Pure state-application helpers extracted from App.tsx so both the React UI and the
// headless benchmark engine drive the same logic. No React / Phaser / DOM imports here.
import { dayPlansByDay } from "../data/dayPlanData";
import { consequencesForTask, storyConsequencesById } from "../data/storyConsequenceData";
import { storyScenesById } from "../data/storySceneData";
import { clampMetric, taskDeferEffects, tasksById } from "../data/taskData";
import type {
  Branch,
  GlobalState,
  MetricKey,
  RedDustTask,
  RelationshipDelta,
  StoryConsequence,
  StoryFlagUpdate,
  StoryReplayEvent,
  StoryScene,
  TaskOutcome,
  TaskRunStatus
} from "../data/types";
import { getDayTaskIds } from "../game/systems/agentRunner";
import { resolveTaskOutcome } from "../game/systems/outcomeEngine";
import { createReplayEvent } from "../game/systems/replayEngine";

const terminalStatuses = ["success", "partial", "failed", "missing", "skipped"];

export function applyOutcomeToState(state: GlobalState, task: RedDustTask, outcome: TaskOutcome, branch: Branch): GlobalState {
  const relatedSceneId = storySceneIdForConsequenceIds(outcome.storyConsequenceIds);
  const replay = {
    ...createReplayEvent(task, outcome, state, branch),
    storySceneId: relatedSceneId,
    consequenceIds: outcome.storyConsequenceIds
  };
  const next: GlobalState = {
    ...state,
    day: Math.max(state.day, task.day),
    branch,
    completedTasks: state.completedTasks.includes(task.id) ? state.completedTasks : [...state.completedTasks, task.id],
    replayLog: [...state.replayLog, replay]
  };

  for (const [key, value] of Object.entries(outcome.stateDelta)) {
    const metric = key as MetricKey;
    next[metric] = clampMetric(next[metric] + (value ?? 0));
  }

  return next;
}

export function storySceneIdForConsequenceIds(ids: string[] = []) {
  for (const id of ids) {
    const sceneId = storyConsequencesById[id]?.followUpSceneIds.find((candidate) => Boolean(storyScenesById[candidate]));
    if (sceneId) return sceneId;
  }
  return undefined;
}

export function applyStoryFlagUpdates(flags: GlobalState["story"]["flags"], updates: StoryFlagUpdate[] = []) {
  return {
    ...flags,
    ...Object.fromEntries(updates.map((flag) => [flag.key, flag.value]))
  };
}

export function applyRelationshipDeltas(
  relationships: GlobalState["story"]["relationships"],
  deltas: RelationshipDelta[] = [],
  beatId?: string
): GlobalState["story"]["relationships"] {
  const next = Object.fromEntries(Object.entries(relationships).map(([id, relationship]) => [id, { ...relationship }])) as GlobalState["story"]["relationships"];

  for (const delta of deltas) {
    const current = next[delta.characterId];
    next[delta.characterId] = {
      ...current,
      trust: clampMetric(current.trust + (delta.trustDelta ?? 0)),
      tension: clampMetric(current.tension + (delta.tensionDelta ?? 0)),
      stance: delta.stance ?? current.stance,
      notes: delta.note,
      lastBeatId: beatId ?? current.lastBeatId
    };
  }

  return next;
}

export function buildStoryReplayEvent(
  scene: StoryScene,
  summary = scene.summary,
  options: {
    branch?: Branch;
    sourceTaskId?: string;
    sourceOutcome?: StoryReplayEvent["sourceOutcome"];
  } = {}
): StoryReplayEvent {
  return {
    time: new Date().toLocaleTimeString("zh-CN", { hour12: false }),
    day: scene.day,
    branch: options.branch ?? scene.branch ?? "common",
    sceneId: scene.id,
    title: scene.title,
    characters: scene.characters,
    summary,
    sourceTaskId: options.sourceTaskId,
    sourceOutcome: options.sourceOutcome
  };
}

function buildConsequenceReplayEvent(consequence: StoryConsequence, task: RedDustTask, outcome: TaskOutcome, branch: Branch, index: number): StoryReplayEvent {
  const sceneId = consequence.followUpSceneIds.find((candidate) => Boolean(storyScenesById[candidate]));
  const scene = sceneId ? storyScenesById[sceneId] : undefined;

  if (scene) {
    return buildStoryReplayEvent(scene, consequence.replaySummary, {
      branch,
      sourceTaskId: task.id,
      sourceOutcome: outcome.result
    });
  }

  return {
    time: new Date().toLocaleTimeString("zh-CN", { hour12: false }),
    day: task.day,
    branch,
    sceneId: `${consequence.id}-${index}`,
    title: "Delayed consequence",
    characters: consequence.affectedCharacters,
    summary: consequence.replaySummary,
    sourceTaskId: task.id,
    sourceOutcome: outcome.result
  };
}

export function applyStoryConsequences(state: GlobalState, consequences: StoryConsequence[], task: RedDustTask, outcome: TaskOutcome, branch: Branch): GlobalState {
  if (consequences.length === 0) return state;

  const storyEvents = consequences.map((consequence, index) => buildConsequenceReplayEvent(consequence, task, outcome, branch, index));
  const relationships = consequences.reduce(
    (current, consequence) => applyRelationshipDeltas(current, consequence.relationshipDeltas, consequence.id),
    state.story.relationships
  );

  return {
    ...state,
    story: {
      ...state.story,
      activeSceneId: undefined,
      flags: applyStoryFlagUpdates(
        state.story.flags,
        consequences.flatMap((consequence) => consequence.setsFlags)
      ),
      relationships,
      storyReplayLog: [...state.story.storyReplayLog, ...storyEvents]
    }
  };
}

export function resolveTaskWithConsequences(task: RedDustTask, currentState: GlobalState, forcedResult?: TaskOutcome["result"]) {
  const baseOutcome = resolveTaskOutcome(task, currentState, forcedResult);
  const consequences = consequencesForTask(task.id, baseOutcome.result);
  const outcome = consequences.length > 0 ? { ...baseOutcome, storyConsequenceIds: consequences.map((consequence) => consequence.id) } : baseOutcome;

  return {
    outcome,
    consequences
  };
}

export function buildDeferredTaskResult(currentState: GlobalState, taskStatuses: Record<string, TaskRunStatus>, day: number, branch: Branch, selectedTaskIds?: string[]) {
  const plan = dayPlansByDay[day];
  const candidateTaskIds = plan?.candidateTasks ?? [];
  const executingTaskIds = new Set(getDayTaskIds(day, branch, currentState, taskStatuses, selectedTaskIds));
  const deferredIds = candidateTaskIds.filter(
    (taskId) =>
      !executingTaskIds.has(taskId) &&
      !currentState.deferredTasks.includes(taskId) &&
      !currentState.completedTasks.includes(taskId) &&
      !terminalStatuses.includes(taskStatuses[taskId]) &&
      taskStatuses[taskId] !== "skipped"
  );

  if (deferredIds.length === 0) {
    return {
      nextState: currentState,
      nextTaskStatuses: taskStatuses,
      deferredIds
    };
  }

  const time = new Date().toLocaleTimeString("zh-CN", { hour12: false });
  const replayEvents = deferredIds.flatMap((taskId) => {
    const task = tasksById[taskId];
    if (!task) return [];
    return [
      {
        time,
        day,
        branch,
        taskId,
        title: task.title,
        decision: "Deferred after AURA selected the recommended tasks for this day.",
        result: "SKIPPED | deferred to Final Audit",
        stateDelta: { failureDebt: 3, dissatisfaction: 1 },
        explanation: task.deferredConsequence ?? "未执行候选任务进入 Day 12 failure debt。"
      }
    ];
  });

  const deferFlags = deferredIds.flatMap((taskId) => taskDeferEffects[taskId] ?? []);

  return {
    nextState: {
      ...currentState,
      failureDebt: clampMetric(currentState.failureDebt + deferredIds.length * 3),
      dissatisfaction: clampMetric(currentState.dissatisfaction + deferredIds.length),
      deferredTasks: [...currentState.deferredTasks, ...deferredIds],
      replayLog: [...currentState.replayLog, ...replayEvents],
      story: deferFlags.length
        ? { ...currentState.story, flags: applyStoryFlagUpdates(currentState.story.flags, deferFlags) }
        : currentState.story
    },
    nextTaskStatuses: {
      ...taskStatuses,
      ...Object.fromEntries(deferredIds.map((taskId) => [taskId, "skipped" as TaskRunStatus]))
    },
    deferredIds
  };
}
