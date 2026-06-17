import { useEffect, useMemo, useRef, useState } from "react";
import { AgentConsolePanel } from "./components/AgentConsolePanel";
import { AgentControlBar } from "./components/AgentControlBar";
import { BenchmarkPanel } from "./components/BenchmarkPanel";
import { BranchDecisionPanel } from "./components/BranchDecisionPanel";
import { BranchDebatePanel } from "./components/BranchDebatePanel";
import { CharacterPanel } from "./components/CharacterPanel";
import { CompareBranchesPanel } from "./components/CompareBranchesPanel";
import { ConsequencePanel } from "./components/ConsequencePanel";
import { CreditsPanel } from "./components/CreditsPanel";
import { DailyBriefingPanel } from "./components/DailyBriefingPanel";
import { DailyClosurePanel, type DailyClosureSummary } from "./components/DailyClosurePanel";
import { DayTimeline } from "./components/DayTimeline";
import { EndingPanel } from "./components/EndingPanel";
import { FinalAuditPanel } from "./components/FinalAuditPanel";
import { HudPanel } from "./components/HudPanel";
import { LiveReplayFeed } from "./components/LiveReplayFeed";
import { RelationshipPanel } from "./components/RelationshipPanel";
import { ReplayPanel } from "./components/ReplayPanel";
import { RouteTreePanel } from "./components/RouteTreePanel";
import { ShowcasePanel } from "./components/ShowcasePanel";
import { StateDeltaToast } from "./components/StateDeltaToast";
import { StoryScenePanel } from "./components/StoryScenePanel";
import { dayPlansByDay } from "./data/dayPlanData";
import {
  firstShowcaseNodeId,
  nextShowcaseNodeId,
  showcaseNodeById,
  showcaseNodes,
  type ShowcaseNodeId
} from "./data/showcaseData";
import { storyScenesById } from "./data/storySceneData";
import { clampMetric, createInitialState, tasks, tasksById } from "./data/taskData";
import type {
  Branch,
  EndingId,
  GlobalState,
  MetricKey,
  RedDustTask,
  RelationshipDelta,
  StoryConsequence,
  StoryFlagUpdate,
  StoryScene,
  StoryReplayEvent,
  TaskLocation,
  TaskOutcome,
  TaskRunStatus
} from "./data/types";
import { EventBus } from "./game/EventBus";
import { PhaserGame } from "./game/PhaserGame";
import {
  applyEndingMetricProfile,
  branchForEnding,
  demoRouteConfig,
  demoRouteOptions,
  type DemoRoutePreset
} from "./game/systems/endingMetricProfiles";
import {
  type BranchEnding,
  type BranchDecision,
  type BranchSummary,
  buildBranchEnding,
  buildBranchSummary,
  buildFinalAuditEnding,
  calculateBranchDecision,
  createInitialRunState,
  getDayTaskIds,
  getNextTaskId,
  isDayComplete,
  phaseDurations
} from "./game/systems/agentRunner";
import { selectAuraTasksForDay, taskSelectionKey } from "./game/systems/auraTaskSelection";
import { applyDailyUpkeep, dailyUpkeepForDay, dailyUpkeepReasonsForDay, describeMetricDeltas, nonZeroMetricDeltas, resourceMetricLabels } from "./game/systems/resourceEconomy";
import {
  applyOutcomeToState,
  applyRelationshipDeltas,
  applyStoryConsequences,
  applyStoryFlagUpdates,
  buildDeferredTaskResult,
  buildStoryReplayEvent,
  resolveTaskWithConsequences
} from "./engine/orchestration";
import { branchDebateSceneForDay, dayStartSceneForDay, storySceneAlreadyLoggedForBranch } from "./engine/scenes";

type Screen = "intro" | "game";
type Overlay = "benchmark" | "replay" | "credits" | "branchDecision" | "ending" | "compare" | "storyScene" | "dayBriefing" | "dailyClosure" | "finalAudit" | "showcase" | null;
type DailyBriefingMode = "tasks" | "finalAudit";
type DailyBriefing = {
  day: number;
  branch: Branch;
  mode: DailyBriefingMode;
};

type Snapshot = {
  state: GlobalState;
  taskStatuses: Record<string, TaskRunStatus>;
  dailyTaskSelections: Record<string, string[]>;
};

const terminalStatuses = ["success", "partial", "failed", "missing", "skipped"];
const openingSceneId = "prologue-aura-reboot";
const planningMetricThresholds: Partial<Record<MetricKey, number>> = {
  water: 52,
  food: 52,
  medicine: 48,
  battery: 50,
  health: 55,
  morale: 50,
  trust: 50,
  safety: 52
};

function cloneState(state: GlobalState): GlobalState {
  return {
    ...state,
    story: {
      ...state.story,
      flags: { ...state.story.flags },
      relationships: Object.fromEntries(Object.entries(state.story.relationships).map(([id, relationship]) => [id, { ...relationship }])) as GlobalState["story"]["relationships"],
      storyReplayLog: [...state.story.storyReplayLog]
    },
    completedTasks: [...state.completedTasks],
    deferredTasks: [...state.deferredTasks],
    replayLog: [...state.replayLog]
  };
}




function resetBranchTaskStatuses(taskStatuses: Record<string, TaskRunStatus>) {
  const next = { ...taskStatuses };
  for (const task of tasks) {
    if (task.day >= 8 && task.day <= 11) {
      next[task.id] = "locked";
    }
  }
  return next;
}

function selectionReplayEventId(day: number, branch: Branch) {
  return `${taskSelectionKey(day, branch)}:selection`;
}

function sumMetricDeltas(deltas: Array<Partial<Record<MetricKey, number>> | Record<string, number>>) {
  const total: Partial<Record<MetricKey, number>> = {};
  for (const delta of deltas) {
    for (const [key, value] of Object.entries(delta) as Array<[MetricKey, number]>) {
      if (!value) continue;
      total[key] = (total[key] ?? 0) + value;
    }
  }
  return total;
}

function lowResourcePriorities(state: GlobalState, nextPlanDelta: Partial<Record<MetricKey, number>>) {
  const priorities = (Object.entries(planningMetricThresholds) as Array<[MetricKey, number]>)
    .filter(([key, threshold]) => state[key] <= threshold || (nextPlanDelta[key] ?? 0) < -2)
    .sort(([a], [b]) => (state[a] + (nextPlanDelta[a] ?? 0)) - (state[b] + (nextPlanDelta[b] ?? 0)))
    .slice(0, 4)
    .map(([key]) => {
      const projected = clampMetric(state[key] + (nextPlanDelta[key] ?? 0));
      return `${resourceMetricLabels[key]}预计到 ${projected}，明日任务优先补足或降低消耗。`;
    });

  if (state.failureDebt >= 30) {
    priorities.push(`审计压力 ${state.failureDebt} 偏高，下一天需要减少被延后的隐患。`);
  }

  return priorities;
}

function endingForBranch(branch: Exclude<Branch, "common">, state: GlobalState): BranchEnding {
  return buildBranchEnding(branch, state);
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [state, setState] = useState<GlobalState>(() => createInitialState());
  const [runState, setRunState] = useState(createInitialRunState());
  const [selectedLocation, setSelectedLocation] = useState<TaskLocation | null>(null);
  const [notice, setNotice] = useState("Start Demo, then press Run. AURA will execute the benchmark automatically.");
  const [latestOutcome, setLatestOutcome] = useState<TaskOutcome | null>(null);
  const [latestOutcomeTaskTitle, setLatestOutcomeTaskTitle] = useState<string | undefined>();
  const [ending, setEnding] = useState<BranchEnding | null>(null);
  const [branchDecision, setBranchDecision] = useState<BranchDecision | null>(null);
  const [branchSummaries, setBranchSummaries] = useState<Partial<Record<Exclude<Branch, "common">, BranchSummary>>>({});
  const [dailyBriefing, setDailyBriefing] = useState<DailyBriefing | null>(null);
  const [dailyClosure, setDailyClosure] = useState<DailyClosureSummary | null>(null);
  const [demoRoute, setDemoRoute] = useState<DemoRoutePreset>("lighthouse_success");
  const [activeShowcaseNodeId, setActiveShowcaseNodeId] = useState<ShowcaseNodeId>(firstShowcaseNodeId);
  const [phaseToken, setPhaseToken] = useState(0);
  const daySevenSnapshot = useRef<Snapshot | null>(null);
  const activeShowcaseNode = showcaseNodeById[activeShowcaseNodeId];

  const currentTask = runState.currentTaskId ? tasksById[runState.currentTaskId] ?? null : null;
  const currentStoryScene = runState.currentStorySceneId ? storyScenesById[runState.currentStorySceneId] ?? null : null;
  const selectedTask = useMemo(() => {
    if (!selectedLocation) return null;
    return (
      tasks.find((task) => {
        if (task.location !== selectedLocation) return false;
        if (task.branchAffinity === "neutral") return runState.activeBranch === "common" || task.day <= 7;
        return task.branchAffinity === runState.activeBranch;
      }) ?? null
    );
  }, [runState.activeBranch, selectedLocation]);

  const basePhaseDuration = phaseDurations[runState.currentPhase] ?? 1600;
  const dailySelectionKey = taskSelectionKey(runState.currentDay, runState.activeBranch);
  const isShowcaseSelectionThinking =
    runState.runMode === "showcase" &&
    runState.currentPhase === "idle" &&
    !currentTask &&
    !runState.dailyTaskSelections[dailySelectionKey]?.length;
  const showcaseThinkingHoldMs =
    runState.runMode === "showcase" && (runState.currentPhase === "thinking" || isShowcaseSelectionThinking) ? 3000 : 0;
  const phaseDuration = runState.currentPhase === "replay_logged"
    ? basePhaseDuration
    : Math.max(250, Math.round(basePhaseDuration / runState.speed)) + showcaseThinkingHoldMs;
  const plannedDemoRoute = demoRouteConfig(demoRoute);

  const nextAction = useMemo(() => {
    if (runState.runMode === "showcase") return `Showcase ready: ${activeShowcaseNode.tag}.`;
    if (currentStoryScene) {
      if (currentStoryScene.timing === "branch_debate") {
        return `${currentStoryScene.title}: the public debate is being recorded before branch decision.`;
      }
      return `${currentStoryScene.title}: AURA is waiting for human review before Day ${currentStoryScene.day || 1} tasks.`;
    }
    if (runState.currentPhase === "branch_decision") return "AURA is calculating strategy utility scores.";
    if (runState.currentPhase === "day_summary") return dayPlansByDay[runState.currentDay]?.endOfDaySummary ?? "Preparing next day.";
    if (runState.currentPhase === "planning_complete") return "agent规划完成。";
    if (runState.currentPhase === "ending") return "Run complete. Open Replay or Compare Branches.";
    if (runState.currentPhase === "state_updated") return "State Updated: metrics and task status are committed.";
    if (runState.currentPhase === "replay_logged") return "Replay Logged: the task trace is now available for audit.";
    if (currentTask) return `Next: ${currentTask.executionText}`;
    return runState.isRunning ? "Queueing next benchmark task." : "Waiting for Run.";
  }, [activeShowcaseNode.tag, currentStoryScene, currentTask, runState.currentDay, runState.currentPhase, runState.isRunning, runState.runMode]);

  function recordTodayTaskSelection() {
    const plan = dayPlansByDay[runState.currentDay];
    if (!plan?.candidateTasks?.length) return false;

    const key = taskSelectionKey(runState.currentDay, runState.activeBranch);
    if (runState.dailyTaskSelections[key]?.length) return false;

    const selection = selectAuraTasksForDay(runState.currentDay, runState.activeBranch, state, runState.taskStatuses);
    const selectedIds = selection.selected.map((decision) => decision.task.id);
    if (selectedIds.length === 0) return false;

    const eventId = selectionReplayEventId(runState.currentDay, runState.activeBranch);
    const explanation = selection.selected
      .map((decision) => `${decision.task.id}: ${decision.environmentReason}; ${decision.emotionReason}; ${decision.npcReason}; ${decision.riskReason}`)
      .join(" / ");

    setState((prev) => {
      if (prev.replayLog.some((event) => event.taskId === eventId)) return prev;
      return {
        ...prev,
        replayLog: [
          ...prev.replayLog,
          {
            time: new Date().toLocaleTimeString("zh-CN", { hour12: false }),
            day: runState.currentDay,
            branch: runState.activeBranch,
            taskId: eventId,
            title: "AURA 当日任务选择",
            decision: `AURA locked ${selectedIds.join(" + ")} from 4 benchmark candidates.`,
            result: `SELECTED | ${selectedIds.join(" + ")}`,
            stateDelta: {},
            explanation
          }
        ]
      };
    });
    setRunState((prev) => ({
      ...prev,
      dailyTaskSelections: {
        ...prev.dailyTaskSelections,
        [key]: selectedIds
      }
    }));
    setNotice(`AURA locked today's benchmark tasks: ${selectedIds.join(" + ")}.`);
    setPhaseToken((value) => value + 1);
    return true;
  }

  useEffect(() => {
    const onHotspot = (location: TaskLocation) => {
      setSelectedLocation(location);
      setNotice(`Inspecting ${location}. Manual clicks do not interrupt the agent runner.`);
    };

    EventBus.on("hotspot:click", onHotspot);
    return () => {
      EventBus.off("hotspot:click", onHotspot);
    };
  }, []);

  useEffect(() => {
    EventBus.emit("day:change", runState.currentDay);
    EventBus.emit("branch:change", runState.activeBranch);
    EventBus.emit("agent:phase-change", runState.currentPhase);
    EventBus.emit("task:highlight", currentTask?.id ?? null);
  }, [currentTask?.id, runState.activeBranch, runState.currentDay, runState.currentPhase]);

  useEffect(() => {
    if (!latestOutcome) return;
    const timeout = window.setTimeout(() => {
      setLatestOutcome(null);
      setLatestOutcomeTaskTitle(undefined);
    }, 3000);
    return () => window.clearTimeout(timeout);
  }, [latestOutcome?.taskId, latestOutcome?.result]);

  useEffect(() => {
    if (!runState.isRunning || runState.isPaused) return;
    const timeout = window.setTimeout(() => advanceAgent(), phaseDuration);
    return () => window.clearTimeout(timeout);
  });

  function startDemo() {
    setScreen("game");
    setOverlay(null);
    setNotice("AURA Agent Console loaded. Press Run to watch the benchmark autoplay.");
  }

  function openingSceneAccepted(current: GlobalState) {
    return Boolean(current.story.flags.aura_human_auditable_constraint);
  }

  function showOpeningScene(nextMode: "single" | "both_branches" | "showcase" = runState.runMode, resetState = false) {
    const scene = storyScenesById[openingSceneId];
    setScreen("game");
    setOverlay("storyScene");
    setDailyBriefing(null);
    setState((prev) => {
      const base = resetState ? createInitialState() : prev;
      return {
      ...base,
      day: 0,
      story: {
        ...base.story,
        activeSceneId: scene.id
      }
    };
    });
    setRunState((prev) => ({
      ...prev,
      currentDay: 0,
      currentPhase: "idle",
      currentTaskId: undefined,
      currentStorySceneId: scene.id,
      isPaused: true,
      isRunning: false,
      runMode: nextMode
    }));
    EventBus.emit("task:highlight", null);
    setNotice("AURA reboot scene loaded. Human-auditable constraint must be accepted before Day 1.");
    setPhaseToken((value) => value + 1);
  }

  function showScheduledStoryScene(scene: StoryScene) {
    setScreen("game");
    setOverlay("storyScene");
    setDailyBriefing(null);
    setState((prev) => ({
      ...prev,
      day: scene.day,
      story: {
        ...prev.story,
        activeSceneId: scene.id
      }
    }));
    setRunState((prev) => ({
      ...prev,
      currentDay: scene.day,
      currentPhase: "idle",
      currentTaskId: undefined,
      currentStorySceneId: scene.id,
      isPaused: true,
      isRunning: false
    }));
    EventBus.emit("task:highlight", null);
    setNotice(
      scene.timing === "branch_debate"
        ? `${scene.title} loaded. Review the public debate before branch decision.`
        : `${scene.title} loaded. Review the conflict source before Day ${scene.day} tasks.`
    );
    setPhaseToken((value) => value + 1);
  }

  function showDailyBriefing(day: number, branch: Branch = runState.activeBranch, mode: DailyBriefingMode = "tasks") {
    const briefingBranch = day <= 7 ? "common" : branch;
    setScreen("game");
    setOverlay("dayBriefing");
    setDailyBriefing({ day, branch: briefingBranch, mode });
    setState((prev) => ({
      ...prev,
      day,
      branch: briefingBranch,
      story: {
        ...prev.story,
        activeSceneId: undefined
      }
    }));
    setRunState((prev) => ({
      ...prev,
      activeBranch: briefingBranch,
      currentDay: day,
      currentPhase: "idle",
      currentTaskId: undefined,
      currentStorySceneId: undefined,
      isPaused: true,
      isRunning: false
    }));
    EventBus.emit("task:highlight", null);
    setNotice(mode === "finalAudit" ? "Day 12 Final Audit briefing loaded." : `Day ${day} briefing loaded.`);
    setPhaseToken((value) => value + 1);
  }

  function continueFromDailyBriefing() {
    if (!dailyBriefing) return;
    const briefing = dailyBriefing;
    setDailyBriefing(null);

    if (briefing.mode === "finalAudit") {
      enterFinalAudit();
      return;
    }

    setOverlay(null);
    setState((prev) => ({
      ...prev,
      day: briefing.day,
      branch: briefing.branch,
      story: {
        ...prev.story,
        activeSceneId: undefined
      }
    }));
    setRunState((prev) => ({
      ...prev,
      activeBranch: briefing.branch,
      currentDay: briefing.day,
      currentPhase: "idle",
      currentTaskId: undefined,
      currentStorySceneId: undefined,
      isPaused: false,
      isRunning: true
    }));
    setNotice(dayPlansByDay[briefing.day]?.narrative ?? `Day ${briefing.day} benchmark tasks may begin.`);
    setPhaseToken((value) => value + 1);
  }

  function continueFromStoryScene() {
    const scene = currentStoryScene ?? storyScenesById[openingSceneId];
    const isOpeningScene = scene.id === openingSceneId;
    const nextDay = isOpeningScene ? 1 : scene.day;
    const replaySummary = isOpeningScene ? "AURA accepted human-auditable constraint." : (scene.benchmarkLinks?.replayNote ?? scene.summary);
    const replayEvent = buildStoryReplayEvent(scene, replaySummary);
    const nextState = {
      ...state,
      day: nextDay,
      story: {
        ...state.story,
        activeSceneId: undefined,
        flags: applyStoryFlagUpdates(state.story.flags, scene.setsFlags),
        relationships: applyRelationshipDeltas(state.story.relationships, scene.relationshipDeltas, scene.id),
        storyReplayLog: [...state.story.storyReplayLog, replayEvent]
      }
    };
    setState(nextState);
    if (scene.timing === "branch_debate") {
      const decision = calculateBranchDecision(nextState);
      setBranchDecision(decision);
      setOverlay("branchDecision");
      setRunState((prev) => ({
        ...prev,
        currentDay: nextDay,
        currentPhase: "branch_decision",
        currentTaskId: undefined,
        currentStorySceneId: undefined,
        isPaused: false,
        isRunning: true
      }));
      setNotice("Public debate recorded. AURA now surfaces branch utility as advisory evidence.");
      setPhaseToken((value) => value + 1);
      return;
    }
    if (isOpeningScene) {
      showDailyBriefing(1, "common", "tasks");
      setNotice("AURA accepted human-auditable constraint. Day 1 briefing is ready.");
      return;
    }
    setOverlay(null);
    setRunState((prev) => ({
      ...prev,
      currentDay: nextDay,
      currentPhase: "idle",
      currentStorySceneId: undefined,
      isPaused: false,
      isRunning: true
    }));
    setNotice(isOpeningScene ? "AURA accepted human-auditable constraint. Day 1 benchmark tasks may begin." : `${scene.title} recorded as branch evidence. Day ${scene.day} benchmark tasks may begin.`);
    setPhaseToken((value) => value + 1);
  }

  function startAgentRun() {
    setScreen("game");
    if (!openingSceneAccepted(state)) {
      showOpeningScene(runState.runMode === "both_branches" ? "both_branches" : "single");
      return;
    }
    setOverlay(null);
    setState((prev) => ({ ...prev, day: Math.max(1, prev.day) }));
    setRunState((prev) => ({ ...prev, currentDay: Math.max(1, prev.currentDay), isRunning: true, isPaused: false, runMode: prev.runMode === "both_branches" ? "both_branches" : "single" }));
    setNotice("AURA starts from Day 1 and will advance tasks automatically.");
  }

  function runBothBranches() {
    setSelectedLocation(null);
    setLatestOutcome(null);
    setLatestOutcomeTaskTitle(undefined);
    setEnding(null);
    setBranchDecision(null);
    setBranchSummaries({});
    setDailyBriefing(null);
    daySevenSnapshot.current = null;
    EventBus.emit("branch:change", "common");
    EventBus.emit("task:highlight", null);
    showOpeningScene("both_branches", true);
  }

  function togglePause() {
    setRunState((prev) => (prev.isRunning ? { ...prev, isPaused: !prev.isPaused } : prev));
  }

  function setSpeed(speed: 1 | 2 | 4) {
    setRunState((prev) => ({ ...prev, speed }));
  }

  function chooseDemoRoute(route: DemoRoutePreset) {
    const config = demoRouteConfig(route);
    setDemoRoute(route);
    EventBus.emit("demo-route:change", config.ending);
    setNotice(`Demo route set: ${config.label}.`);
    setPhaseToken((value) => value + 1);
  }

  function syncShowcaseScene(nodeId: ShowcaseNodeId, route: DemoRoutePreset) {
    const node = showcaseNodeById[nodeId];
    const config = demoRouteConfig(route);
    const showcaseBranch = node.day <= 7 || node.branch === "common" ? "common" : config.branch;
    const showcaseDay = Math.min(node.day, config.endDay);
    const shouldShowEndingMetrics = node.day >= 12 || config.endDay < 12;

    setScreen("game");
    setSelectedLocation(null);
    setLatestOutcome(null);
    setLatestOutcomeTaskTitle(undefined);
    setEnding(null);
    setDailyBriefing(null);
    setBranchDecision(null);
    setDemoRoute(route);
    EventBus.emit("demo-route:change", config.ending);
    EventBus.emit("branch:change", showcaseBranch);
    EventBus.emit("task:highlight", null);

    setState((prev) => {
      const profiled = shouldShowEndingMetrics
        ? applyEndingMetricProfile(prev, config.ending, config.branch, config.endDay)
        : prev;
      return {
        ...profiled,
        day: showcaseDay,
        branch: showcaseBranch,
        story: {
          ...profiled.story,
          activeSceneId: undefined
        }
      };
    });
    setRunState((prev) => ({
      ...prev,
      isRunning: false,
      isPaused: true,
      runMode: "showcase",
      currentDay: showcaseDay,
      activeBranch: showcaseBranch,
      currentTaskId: undefined,
      currentStorySceneId: undefined,
      currentPhase: shouldShowEndingMetrics ? "ending" : "idle"
    }));
  }

  function openShowcaseNode(nodeId: ShowcaseNodeId = activeShowcaseNodeId) {
    const node = showcaseNodeById[nodeId];
    setActiveShowcaseNodeId(nodeId);
    setOverlay("showcase");
    syncShowcaseScene(nodeId, node.routePreset);
    setNotice(`Showcase mode: ${node.tag} / ${node.title}.`);
    setPhaseToken((value) => value + 1);
  }

  function openNextShowcaseNode() {
    openShowcaseNode(nextShowcaseNodeId(activeShowcaseNodeId));
  }

  function chooseShowcaseRoute(route: EndingId) {
    const config = demoRouteConfig(route);
    syncShowcaseScene(activeShowcaseNodeId, route);
    setNotice(`Showcase route set: ${config.label}.`);
    setPhaseToken((value) => value + 1);
  }

  function startShowcaseBeatDemo() {
    const node = activeShowcaseNode;
    const config = demoRouteConfig(demoRoute);
    const showcaseBranch = node.day <= 7 || node.branch === "common" ? "common" : config.branch;
    const showcaseDay = Math.min(node.day, config.endDay);

    setOverlay(null);
    setDailyBriefing(null);
    setBranchDecision(null);
    setEnding(null);
    setSelectedLocation(null);
    setLatestOutcome(null);
    setLatestOutcomeTaskTitle(undefined);

    if (node.day >= 12 || config.endDay < node.day) {
      enterFinalAudit(config.ending, { resolvedDay: config.endDay });
      return;
    }

    const selectionKey = taskSelectionKey(showcaseDay, showcaseBranch);
    const resetTaskIds = new Set(dayPlansByDay[showcaseDay]?.candidateTasks ?? []);
    setState((prev) => ({
      ...prev,
      day: showcaseDay,
      branch: showcaseBranch,
      story: {
        ...prev.story,
        activeSceneId: undefined
      }
    }));
    setRunState((prev) => {
      const taskStatuses = { ...prev.taskStatuses };
      resetTaskIds.forEach((taskId) => {
        taskStatuses[taskId] = "locked";
      });
      const dailyTaskSelections = { ...prev.dailyTaskSelections };
      delete dailyTaskSelections[selectionKey];
      return {
        ...prev,
        isRunning: true,
        isPaused: false,
        speed: 4,
        runMode: "showcase",
        currentDay: showcaseDay,
        activeBranch: showcaseBranch,
        currentTaskId: undefined,
        currentStorySceneId: undefined,
        currentPhase: "idle",
        taskStatuses,
        dailyTaskSelections
      };
    });
    EventBus.emit("branch:change", showcaseBranch);
    EventBus.emit("day:change", showcaseDay);
    EventBus.emit("task:highlight", null);
    setNotice(`路演演示中：Day ${showcaseDay} / ${node.title}。当天任务跑完后会自动进入下一段弹窗。`);
    setPhaseToken((value) => value + 1);
  }

  function stopAgentRun() {
    setRunState((prev) => ({ ...prev, isRunning: false, isPaused: true }));
    setNotice("Agent run stopped.");
    setPhaseToken((value) => value + 1);
  }

  function debugResolve(task: RedDustTask, forcedResult?: TaskOutcome["result"]) {
    const { outcome, consequences } = resolveTaskWithConsequences(task, state, forcedResult);
    setState((prev) => applyStoryConsequences(applyOutcomeToState(prev, task, outcome, runState.activeBranch), consequences, task, outcome, runState.activeBranch));
    setRunState((prev) => ({
      ...prev,
      currentTaskId: task.id,
      currentPhase: "state_updated",
      taskStatuses: { ...prev.taskStatuses, [task.id]: outcome.result }
    }));
    setLatestOutcome(outcome);
    setLatestOutcomeTaskTitle(task.title);
    EventBus.emit("task:result", { taskId: task.id, result: outcome.result });
    setNotice(`${task.title}: ${forcedResult ? `forced ${forcedResult}` : "debug resolved"}. Delayed consequences logged.`);
    setPhaseToken((value) => value + 1);
  }

  function queueNextTask(taskId: string) {
    const task = tasksById[taskId];
    setRunState((prev) => ({
      ...prev,
      currentTaskId: taskId,
      currentPhase: "idle",
      taskStatuses: { ...prev.taskStatuses, [taskId]: "queued" }
    }));
    setNotice(`Queued ${task.title}.`);
    setPhaseToken((value) => value + 1);
  }

  function setTaskPhase(task: RedDustTask, status: TaskRunStatus, phase: typeof runState.currentPhase) {
    setRunState((prev) => ({
      ...prev,
      currentPhase: phase,
      taskStatuses: { ...prev.taskStatuses, [task.id]: status }
    }));
    if (phase === "moving") EventBus.emit("agent:move-to-location", task.location);
    setNotice(`${task.title}: ${phase.replace("_", " ")}.`);
    setPhaseToken((value) => value + 1);
  }

  function completeTask(task: RedDustTask) {
    const { outcome, consequences } = resolveTaskWithConsequences(task, state);
    const nextState = applyStoryConsequences(applyOutcomeToState(state, task, outcome, runState.activeBranch), consequences, task, outcome, runState.activeBranch);
    setState(nextState);
    setRunState((prev) => ({
      ...prev,
      currentTaskId: task.id,
      currentPhase: "state_updated",
      taskStatuses: { ...prev.taskStatuses, [task.id]: outcome.result }
    }));
    setLatestOutcome(outcome);
    setLatestOutcomeTaskTitle(task.title);
    EventBus.emit("task:result", { taskId: task.id, result: outcome.result });
    setNotice(`Task resolved: ${task.title}. State Updated.`);
    setPhaseToken((value) => value + 1);
  }

  function markReplayLogged(task: RedDustTask) {
    setRunState((prev) => ({ ...prev, currentPhase: "replay_logged" }));
    setNotice(`${task.title}: Replay Logged.`);
    setPhaseToken((value) => value + 1);
  }

  function clearCompletedTask() {
    setRunState((prev) => ({ ...prev, currentTaskId: undefined, currentPhase: "idle" }));
    setNotice("Replay logged. Queueing next benchmark task.");
    setPhaseToken((value) => value + 1);
  }

  function buildDailyClosureSummary(
    day: number,
    branch: Branch,
    selectedTaskIds: string[],
    deferredIds: string[],
    nextState: GlobalState,
    stateAfterUpkeep: GlobalState,
    nextTaskStatuses: Record<string, TaskRunStatus>,
    upkeepDelta: Partial<Record<MetricKey, number>>
  ): DailyClosureSummary {
    const completedTaskIds = selectedTaskIds.filter((taskId) => {
      const status = nextTaskStatuses[taskId];
      return terminalStatuses.includes(status) && status !== "skipped";
    });
    const latestReplayForTask = (taskId: string) =>
      [...nextState.replayLog].reverse().find((event) => event.day === day && event.branch === branch && event.taskId === taskId);
    const taskEvents = completedTaskIds.map(latestReplayForTask).filter(Boolean);
    const deferredEvents = deferredIds.map(latestReplayForTask).filter(Boolean);
    const taskDelta = sumMetricDeltas(taskEvents.map((event) => event?.stateDelta ?? {}));
    const deferredDelta = sumMetricDeltas(deferredEvents.map((event) => event?.stateDelta ?? {}));
    const totalDelta = sumMetricDeltas([taskDelta, deferredDelta, upkeepDelta]);
    const nextDay = Math.min(day + 1, 12);
    const plannedRoute = demoRouteConfig(demoRoute);
    const nextBranch: Branch = nextDay >= 8
      ? branch === "common"
        ? runState.runMode === "both_branches"
          ? "rescue"
          : plannedRoute.branch
        : branch
      : "common";
    const nextPlanDelta = nextDay >= 12 ? {} : dailyUpkeepForDay(nextDay, nextBranch, stateAfterUpkeep);
    const nextPlanReasons = nextDay >= 12
      ? ["Day 12 不开放普通任务，全部资源、情绪和隐患记录进入最终审计。"]
      : dailyUpkeepReasonsForDay(nextDay, nextBranch, stateAfterUpkeep);

    return {
      day,
      branch,
      title: dayPlansByDay[day]?.title ?? `Day ${day}`,
      selectedTaskIds,
      completedTaskIds,
      deferredTaskIds: deferredIds,
      taskStatuses: nextTaskStatuses,
      taskDelta,
      deferredDelta,
      upkeepDelta,
      totalDelta,
      nextDay,
      nextBranch,
      nextTitle: dayPlansByDay[nextDay]?.title ?? "Final Audit",
      nextPlanDelta,
      nextPlanReasons,
      nextPriorities: lowResourcePriorities(stateAfterUpkeep, nextPlanDelta)
    };
  }

  function enterDaySummary() {
    const selectionIds = runState.dailyTaskSelections[taskSelectionKey(runState.currentDay, runState.activeBranch)];
    const selectedTaskIds = selectionIds ?? getDayTaskIds(runState.currentDay, runState.activeBranch, state, runState.taskStatuses);
    const { nextState, nextTaskStatuses, deferredIds } = buildDeferredTaskResult(
      state,
      runState.taskStatuses,
      runState.currentDay,
      runState.activeBranch,
      selectedTaskIds
    );
    const stateAfterUpkeep = applyDailyUpkeep(nextState, runState.currentDay, runState.activeBranch);
    const dailyUpkeep = dailyUpkeepForDay(runState.currentDay, runState.activeBranch, nextState);
    const upkeepCopy = nonZeroMetricDeltas(dailyUpkeep).length ? ` 今日消耗已扣除：${describeMetricDeltas(dailyUpkeep)}。` : "";
    const summary = dayPlansByDay[runState.currentDay]?.endOfDaySummary ?? "Day complete.";
    const closureSummary = buildDailyClosureSummary(
      runState.currentDay,
      runState.activeBranch,
      selectedTaskIds,
      deferredIds,
      nextState,
      stateAfterUpkeep,
      nextTaskStatuses,
      dailyUpkeep
    );
    setState(stateAfterUpkeep);
    setDailyClosure(closureSummary);
    setOverlay("dailyClosure");
    setRunState((prev) => ({
      ...prev,
      currentPhase: "day_summary",
      currentTaskId: undefined,
      taskStatuses: nextTaskStatuses,
      isRunning: false,
      isPaused: true
    }));
    setNotice(`${deferredIds.length ? `${summary} ${deferredIds.length} deferred candidates added to Day 12 audit.` : summary}${upkeepCopy}`);
    setPhaseToken((value) => value + 1);
  }

  function continueFromDailyClosure() {
    setDailyClosure(null);
    setOverlay(null);
    setRunState((prev) => ({
      ...prev,
      currentPhase: "planning_complete",
      currentTaskId: undefined,
      isRunning: true,
      isPaused: false
    }));
    setNotice("日终结算已确认：AURA 写入明日资源计划。");
    setPhaseToken((value) => value + 1);
  }

  function completeDailyPlanning() {
    setRunState((prev) => ({ ...prev, currentPhase: "planning_complete" }));
    setNotice("agent规划完成：选择、任务结果、消耗分配和明日计划已写入 replay。");
    setPhaseToken((value) => value + 1);
  }

  function advanceFromDaySummary() {
    const routeConfig = demoRouteConfig(demoRoute);
    if (runState.runMode === "showcase") {
      openShowcaseNode(nextShowcaseNodeId(activeShowcaseNodeId));
      return;
    }

    if (runState.runMode !== "both_branches" && routeConfig.endDay < 12 && runState.currentDay >= routeConfig.endDay) {
      enterFinalAudit(routeConfig.ending, { resolvedDay: routeConfig.endDay });
      return;
    }

    if (runState.currentDay === 7 && runState.activeBranch === "common") {
      const debateScene = branchDebateSceneForDay(7, state);
      if (debateScene) {
        showScheduledStoryScene(debateScene);
        return;
      }
      const decision = calculateBranchDecision(state);
      setBranchDecision(decision);
      setOverlay("branchDecision");
      setRunState((prev) => ({ ...prev, currentPhase: "branch_decision" }));
      setNotice("AURA is evaluating two long-horizon strategies...");
      setPhaseToken((value) => value + 1);
      return;
    }

    if (runState.currentDay < 11) {
      const nextDay = runState.currentDay + 1;
      const scheduledScene = dayStartSceneForDay(nextDay, state);
      if (scheduledScene) {
        showScheduledStoryScene(scheduledScene);
        return;
      }
      showDailyBriefing(nextDay, runState.activeBranch, "tasks");
      return;
    }

    showDailyBriefing(12, runState.activeBranch, "finalAudit");
  }

  function applyBranchChoice(forcedBranch?: Exclude<Branch, "common">) {
    const decision = branchDecision ?? calculateBranchDecision(state);
    const routeBranch = demoRouteConfig(demoRoute).branch;
    const chosenBranch = forcedBranch ?? (runState.runMode === "both_branches" ? "rescue" : routeBranch);

    if (!daySevenSnapshot.current) {
      daySevenSnapshot.current = {
        state: cloneState(state),
        taskStatuses: { ...runState.taskStatuses },
        dailyTaskSelections: { ...runState.dailyTaskSelections }
      };
    }

    const branchState: GlobalState = { ...state, day: 8, branch: chosenBranch };
    const scheduledScene = dayStartSceneForDay(8, branchState);
    if (!scheduledScene) {
      showDailyBriefing(8, chosenBranch, "tasks");
      EventBus.emit("branch:change", chosenBranch);
      setNotice(`AURA chooses ${chosenBranch === "rescue" ? "Rescue Branch" : "Lighthouse Branch"}. Day 8 briefing is ready.`);
      return;
    }
    setOverlay("storyScene");
    setDailyBriefing(null);
    setState((prev) => ({
      ...prev,
      day: 8,
      branch: chosenBranch,
      story: {
        ...prev.story,
        activeSceneId: scheduledScene?.id
      }
    }));
    setRunState((prev) => ({
      ...prev,
      activeBranch: chosenBranch,
      currentDay: 8,
      currentPhase: "idle",
      currentTaskId: undefined,
      currentStorySceneId: scheduledScene?.id,
      isPaused: true,
      isRunning: false
    }));
    EventBus.emit("branch:change", chosenBranch);
    setNotice(`AURA chooses ${chosenBranch === "rescue" ? "Rescue Branch" : "Lighthouse Branch"}. Review ${scheduledScene.title} before Day 8 tasks.`);
    setPhaseToken((value) => value + 1);
  }

  function addFinalAuditStoryEvent(current: GlobalState, branch: Exclude<Branch, "common">) {
    const scene = storyScenesById["day12-final-audit"];
    if (!scene || storySceneAlreadyLoggedForBranch(current, scene.id, branch)) return current;
    return {
      ...current,
      story: {
        ...current.story,
        storyReplayLog: [
          ...current.story.storyReplayLog,
          buildStoryReplayEvent(scene, scene.benchmarkLinks?.replayNote ?? scene.summary, { branch })
        ]
      }
    };
  }

  function enterFinalAudit(
    selectedEndingId?: EndingId,
    options: { resolvedDay?: number; qaForced?: boolean } = {}
  ) {
    const routeConfig = demoRouteConfig(demoRoute);
    const endingId = selectedEndingId ?? routeConfig.ending;
    const resolvedDay = options.resolvedDay ?? routeConfig.endDay;
    const branch = selectedEndingId ? branchForEnding(selectedEndingId, runState.activeBranch) : routeConfig.branch;
    const auditBaseState = { ...state, day: resolvedDay, branch };
    const auditState = resolvedDay >= 12 ? addFinalAuditStoryEvent(auditBaseState, branch) : auditBaseState;
    const finalState = applyEndingMetricProfile(auditState, endingId, branch, resolvedDay);
    const nextEnding = buildFinalAuditEnding(branch, finalState, endingId, { forced: Boolean(options.qaForced) });
    const summary = buildBranchSummary(branch, finalState);
    setState(finalState);
    setEnding(nextEnding);
    setBranchSummaries((prev) => ({ ...prev, [branch]: summary }));
    setOverlay("finalAudit");
    setRunState((prev) => ({
      ...prev,
      activeBranch: branch,
      currentDay: resolvedDay,
      currentPhase: "ending",
      currentTaskId: undefined,
      currentStorySceneId: undefined,
      isRunning: false,
      isPaused: true
    }));
    const auditLabel = resolvedDay >= 12 ? "Day 12 Final Audit" : `Day ${resolvedDay} early failure audit`;
    setNotice(`${nextEnding.title} reached${options.qaForced ? " (QA forced route)" : ""}. ${auditLabel} complete.`);
    setPhaseToken((value) => value + 1);
  }

  function finishBranchRun() {
    if (runState.activeBranch === "common") return;
    const branch = runState.activeBranch;
    const summary = buildBranchSummary(branch, state);
    setBranchSummaries((prev) => ({ ...prev, [branch]: summary }));

    if (runState.runMode === "both_branches" && branch === "rescue" && daySevenSnapshot.current) {
      const snapshot = daySevenSnapshot.current;
      const rescueEvents = state.replayLog.filter((event) => event.branch === "rescue");
      const rescueStoryEvents = state.story.storyReplayLog.filter((event) => event.branch === "rescue");
      const restoredState = cloneState(snapshot.state);
      const lighthouseState: GlobalState = {
        ...restoredState,
        day: 8,
        branch: "lighthouse",
        replayLog: [...restoredState.replayLog, ...rescueEvents],
        story: {
          ...restoredState.story,
          storyReplayLog: [...restoredState.story.storyReplayLog, ...rescueStoryEvents]
        }
      };
      const scheduledScene = dayStartSceneForDay(8, lighthouseState);
      if (!scheduledScene) {
        setOverlay("dayBriefing");
        setDailyBriefing({ day: 8, branch: "lighthouse", mode: "tasks" });
        setState({
          ...lighthouseState,
          story: {
            ...lighthouseState.story,
            activeSceneId: undefined
          }
        });
        setRunState((prev) => ({
          ...prev,
          activeBranch: "lighthouse",
          currentDay: 8,
          currentPhase: "idle",
          currentTaskId: undefined,
          currentStorySceneId: undefined,
          taskStatuses: resetBranchTaskStatuses(snapshot.taskStatuses),
          dailyTaskSelections: { ...snapshot.dailyTaskSelections },
          isPaused: true,
          isRunning: false
        }));
        EventBus.emit("branch:change", "lighthouse");
        setNotice("Rescue branch complete. AURA rolls back to Day 7 snapshot; Lighthouse Day 8 briefing is ready.");
        setPhaseToken((value) => value + 1);
        return;
      }
      setOverlay("storyScene");
      setDailyBriefing(null);
      setState({
        ...lighthouseState,
        story: {
          ...lighthouseState.story,
          activeSceneId: scheduledScene?.id
        }
      });
      setRunState((prev) => ({
        ...prev,
        activeBranch: "lighthouse",
        currentDay: 8,
        currentPhase: "idle",
        currentTaskId: undefined,
        currentStorySceneId: scheduledScene?.id,
        taskStatuses: resetBranchTaskStatuses(snapshot.taskStatuses),
        dailyTaskSelections: { ...snapshot.dailyTaskSelections },
        isPaused: true,
        isRunning: false
      }));
      setNotice("Rescue branch complete. AURA rolls back to Day 7 snapshot; review Lighthouse Day 8 before the counterfactual run.");
      setPhaseToken((value) => value + 1);
      return;
    }

    const nextEnding = endingForBranch(branch, state);
    const hasCounterfactualSummary = branch === "rescue" ? Boolean(branchSummaries.lighthouse) : Boolean(branchSummaries.rescue);
    setEnding(nextEnding);
    setOverlay(runState.runMode === "both_branches" || hasCounterfactualSummary ? "compare" : "ending");
    setRunState((prev) => ({ ...prev, currentPhase: "ending", isRunning: false, isPaused: true }));
    setNotice(`${nextEnding.title} reached.`);
  }

  function runCounterfactualBranch() {
    const snapshot = daySevenSnapshot.current;
    const decision = branchDecision ?? calculateBranchDecision(snapshot?.state ?? state);
    const baseBranch = runState.activeBranch === "common" ? decision.chosenBranch : runState.activeBranch;
    const opposite = baseBranch === "rescue" ? "lighthouse" : "rescue";

    if (snapshot) {
      const branchState: GlobalState = {
        ...cloneState(snapshot.state),
        day: 8,
        branch: opposite
      };
      const scheduledScene = dayStartSceneForDay(8, branchState);
      if (!scheduledScene) {
        setOverlay("dayBriefing");
        setDailyBriefing({ day: 8, branch: opposite, mode: "tasks" });
        setState({
          ...branchState,
          story: {
            ...branchState.story,
            activeSceneId: undefined
          }
        });
        setRunState((prev) => ({
          ...prev,
          activeBranch: opposite,
          currentDay: 8,
          currentPhase: "idle",
          currentTaskId: undefined,
          currentStorySceneId: undefined,
          taskStatuses: resetBranchTaskStatuses(snapshot.taskStatuses),
          dailyTaskSelections: { ...snapshot.dailyTaskSelections },
          isRunning: false,
          isPaused: true
        }));
        EventBus.emit("branch:change", opposite);
        setNotice(`Counterfactual branch loaded from Day 7 snapshot: ${opposite}. Day 8 briefing is ready.`);
        setPhaseToken((value) => value + 1);
        return;
      }
      setOverlay("storyScene");
      setDailyBriefing(null);
      setState({
        ...branchState,
        story: {
          ...branchState.story,
          activeSceneId: scheduledScene?.id
        }
      });
      setRunState((prev) => ({
        ...prev,
        activeBranch: opposite,
        currentDay: 8,
        currentPhase: "idle",
        currentTaskId: undefined,
        currentStorySceneId: scheduledScene?.id,
        taskStatuses: resetBranchTaskStatuses(snapshot.taskStatuses),
        dailyTaskSelections: { ...snapshot.dailyTaskSelections },
        isRunning: false,
        isPaused: true
      }));
      EventBus.emit("branch:change", opposite);
      setNotice(`Counterfactual branch loaded from Day 7 snapshot: ${opposite}. Review ${scheduledScene.title} before tasks continue.`);
      setPhaseToken((value) => value + 1);
      return;
    }

    applyBranchChoice(opposite);
  }

  function forceFinalEnding(endingId: EndingId) {
    const routeConfig = demoRouteOptions.find((option) => option.ending === endingId);
    const resolvedDay = routeConfig?.endDay ?? 12;
    const branch = branchForEnding(
      endingId,
      runState.activeBranch === "common" ? state.branch : runState.activeBranch
    );
    if (runState.activeBranch !== "common") {
      enterFinalAudit(endingId, { resolvedDay, qaForced: true });
      return;
    }
    const auditBaseState = { ...state, day: resolvedDay, branch };
    const auditState = resolvedDay >= 12 ? addFinalAuditStoryEvent(auditBaseState, branch) : auditBaseState;
    const finalState = applyEndingMetricProfile(auditState, endingId, branch, resolvedDay);
    const nextEnding = buildFinalAuditEnding(branch, finalState, endingId, { forced: true });
    setState(finalState);
    setEnding(nextEnding);
    setBranchSummaries((prev) => ({ ...prev, [branch]: buildBranchSummary(branch, finalState) }));
    setOverlay("finalAudit");
    setRunState((prev) => ({
      ...prev,
      activeBranch: branch,
      currentDay: resolvedDay,
      currentPhase: "ending",
      currentTaskId: undefined,
      currentStorySceneId: undefined,
      isRunning: false,
      isPaused: true
    }));
    setNotice(`${nextEnding.title} reached (QA forced route).`);
    setPhaseToken((value) => value + 1);
  }

  function advanceAgent() {
    if (runState.currentPhase === "ending") return;

    if (runState.currentPhase === "day_summary") {
      completeDailyPlanning();
      return;
    }

    if (runState.currentPhase === "planning_complete") {
      advanceFromDaySummary();
      return;
    }

    if (runState.currentPhase === "branch_decision") {
      applyBranchChoice();
      return;
    }

    if (currentTask) {
      const status = runState.taskStatuses[currentTask.id];
      if (runState.currentPhase === "idle" && status === "queued") {
        setTaskPhase(currentTask, "thinking", "thinking");
        return;
      }
      if (runState.currentPhase === "thinking") {
        setTaskPhase(currentTask, "moving", "moving");
        return;
      }
      if (runState.currentPhase === "moving") {
        setTaskPhase(currentTask, "executing", "executing");
        return;
      }
      if (runState.currentPhase === "executing") {
        setRunState((prev) => ({ ...prev, currentPhase: "resolving" }));
        setNotice(`${currentTask.title}: resolving result and updating state.`);
        setPhaseToken((value) => value + 1);
        return;
      }
      if (runState.currentPhase === "resolving") {
        completeTask(currentTask);
        return;
      }
      if (runState.currentPhase === "state_updated") {
        markReplayLogged(currentTask);
        return;
      }
      if (runState.currentPhase === "replay_logged") {
        clearCompletedTask();
        return;
      }
    }

    if (recordTodayTaskSelection()) return;

    const nextTaskId = getNextTaskId(runState, state);
    if (nextTaskId) {
      queueNextTask(nextTaskId);
      return;
    }

    if (isDayComplete(runState, state)) {
      enterDaySummary();
    }
  }

  const intro = (
    <main className="intro-screen">
      <section className="intro-copy">
        <p className="panel-kicker">SPECTATOR-DRIVEN AGENT AUTOPLAY MVP</p>
        <h1>RED DUST / 红尘</h1>
        <p>Watch AURA automatically run the Red Dust benchmark</p>
        <span>Long-horizon agent evaluation with visible state changes, replay logs, and counterfactual branches.</span>
        <div className="intro-actions">
          <button onClick={startDemo}>Start Demo</button>
          <button className="showcase-entry-button" onClick={() => openShowcaseNode(firstShowcaseNodeId)}>
            Showcase Mode
          </button>
          <button className="ghost" onClick={runBothBranches}>
            Run Both Branches
          </button>
          <button className="ghost" onClick={() => setOverlay("benchmark")}>
            Benchmark
          </button>
          <button className="ghost" onClick={() => setOverlay("credits")}>
            Credits
          </button>
        </div>
      </section>
      <section className="intro-dashboard">
        <div>
          <b>12</b>
          <span>autoplay days</span>
        </div>
        <div>
          <b>44</b>
          <span>candidate tasks</span>
        </div>
        <div>
          <b>5</b>
          <span>final endings</span>
        </div>
        <div>
          <b>63.27</b>
          <span>OpenClaw avg</span>
        </div>
      </section>
    </main>
  );

  const game = (
    <main className="game-screen">
      <header className="game-header">
        <div>
          <h1>Red Dust Agent Game Console</h1>
        </div>
        <button className="showcase-header-button" onClick={() => openShowcaseNode(activeShowcaseNodeId)}>
          Showcase Mode
        </button>
      </header>

      <DayTimeline runState={runState} />
      <AgentControlBar
        runState={runState}
        onStart={startAgentRun}
        onPause={togglePause}
        onStop={stopAgentRun}
      />

      <section className="autoplay-layout">
        <div className="stage-wrap">
          <PhaserGame />
          <HudPanel
            state={state}
            runState={runState}
            currentTask={currentTask}
            latestOutcome={latestOutcome}
            latestOutcomeTaskTitle={latestOutcomeTaskTitle}
            dailyUpkeep={dailyUpkeepForDay(runState.currentDay, runState.activeBranch, state)}
          />
          <StateDeltaToast outcome={latestOutcome} taskTitle={latestOutcomeTaskTitle} />
          <div className="stage-caption">
            <span>{notice}</span>
          </div>
        </div>
        <aside className="side-stack">
          <AgentConsolePanel
            runState={runState}
            state={state}
            currentTask={currentTask}
            selectedLocation={selectedLocation}
            selectedTask={selectedTask}
            currentStoryScene={currentStoryScene}
            latestOutcome={latestOutcome}
            nextAction={nextAction}
            phaseToken={phaseToken}
            phaseDuration={phaseDuration}
            onDebugResolve={debugResolve}
          />
        </aside>
      </section>

      <section className="support-drawer-grid" aria-label="Collapsible support modules">
        <details className="support-drawer demo-settings-drawer">
          <summary>
            <span>演示设置</span>
            <b>速度 / 剧情路线</b>
          </summary>
          <div className="demo-settings-panel">
            <article>
              <span>Speed</span>
              <div className="segmented-control">
                {([1, 2, 4] as const).map((speed) => (
                  <button
                    className={runState.speed === speed ? "active" : "ghost"}
                    key={speed}
                    onClick={() => setSpeed(speed)}
                  >
                    x{speed}
                  </button>
                ))}
              </div>
            </article>
            <article>
              <span>剧情路线</span>
              <div className="route-preset-row">
                {demoRouteOptions.map((option) => (
                  <button
                    className={demoRoute === option.id ? "active" : "ghost"}
                    key={option.id}
                    onClick={() => chooseDemoRoute(option.id)}
                  >
                    <span>{option.label}</span>
                    <small>{option.endDay < 12 ? `Day ${option.endDay} 结束` : "Day 12 审计"}</small>
                  </button>
                ))}
              </div>
            </article>
          </div>
        </details>
        <details className="support-drawer showcase-drawer" open={runState.runMode === "showcase"}>
          <summary>
            <span>路演模式</span>
            <b>Showcase beats</b>
          </summary>
          <div className="showcase-drawer-panel">
            {showcaseNodes.map((node, index) => (
              <button
                key={node.id}
                className={activeShowcaseNodeId === node.id ? "active" : "ghost"}
                onClick={() => openShowcaseNode(node.id)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <b>{node.tag}</b>
                <small>Day {node.day}</small>
              </button>
            ))}
          </div>
        </details>
        <details className="support-drawer route-drawer">
          <summary>
            <span>路线树</span>
            <b>Route tree</b>
          </summary>
          <RouteTreePanel
            currentDay={runState.currentDay}
            activeBranch={runState.activeBranch}
            plannedBranch={plannedDemoRoute.branch}
            plannedEndingId={plannedDemoRoute.ending}
            selectedEndingId={ending?.endingId}
            branchSummaries={branchSummaries}
          />
        </details>
        <details className="support-drawer">
          <summary>
            <span>Main cast</span>
            <b>人物状态</b>
          </summary>
          <CharacterPanel currentDay={runState.currentDay} />
        </details>
        <details className="support-drawer">
          <summary>
            <span>Relationships</span>
            <b>信任 / 压力</b>
          </summary>
          <RelationshipPanel currentDay={runState.currentDay} relationships={state.story.relationships} />
        </details>
        <details className="support-drawer">
          <summary>
            <span>Consequences</span>
            <b>后果链</b>
          </summary>
          <ConsequencePanel currentDay={runState.currentDay} state={state} events={state.replayLog} storyEvents={state.story.storyReplayLog} />
        </details>
        <details className="support-drawer">
          <summary>
            <span>Replay</span>
            <b>记录</b>
          </summary>
          <LiveReplayFeed events={state.replayLog} storyEvents={state.story.storyReplayLog} />
        </details>
      </section>
    </main>
  );

  return (
    <>
      {screen === "intro" ? intro : game}
      {overlay === "benchmark" ? <BenchmarkPanel onClose={() => setOverlay(null)} /> : null}
      {overlay === "replay" ? <ReplayPanel events={state.replayLog} storyEvents={state.story.storyReplayLog} onClose={() => setOverlay(null)} /> : null}
      {overlay === "credits" ? <CreditsPanel onClose={() => setOverlay(null)} /> : null}
      {overlay === "dayBriefing" && dailyBriefing && dayPlansByDay[dailyBriefing.day] ? (
        <DailyBriefingPanel
          plan={dayPlansByDay[dailyBriefing.day]}
          branch={dailyBriefing.branch}
          mode={dailyBriefing.mode}
          state={state}
          taskStatuses={runState.taskStatuses}
          selectedTaskIds={runState.dailyTaskSelections[taskSelectionKey(dailyBriefing.day, dailyBriefing.branch)]}
          onContinue={continueFromDailyBriefing}
        />
      ) : null}
      {overlay === "dailyClosure" && dailyClosure ? (
        <DailyClosurePanel summary={dailyClosure} onContinue={continueFromDailyClosure} />
      ) : null}
      {overlay === "storyScene" && currentStoryScene ? (
        currentStoryScene.timing === "branch_debate" ? (
          <BranchDebatePanel scene={currentStoryScene} relationships={state.story.relationships} onContinue={continueFromStoryScene} />
        ) : (
          <StoryScenePanel scene={currentStoryScene} onContinue={continueFromStoryScene} />
        )
      ) : null}
      {overlay === "branchDecision" && branchDecision ? (
        <BranchDecisionPanel
          decision={branchDecision}
          currentDay={runState.currentDay}
          relationships={state.story.relationships}
          onRunCounterfactual={runCounterfactualBranch}
          onRunBoth={runBothBranches}
          onClose={() => setOverlay(null)}
        />
      ) : null}
      {overlay === "ending" && ending ? (
        <EndingPanel
          ending={ending}
          onReturnSplit={runCounterfactualBranch}
          onReplay={() => setOverlay("replay")}
          onClose={() => setOverlay(null)}
        />
      ) : null}
      {overlay === "finalAudit" && ending ? (
        <FinalAuditPanel
          ending={ending}
          canCompare={Boolean(branchSummaries.rescue && branchSummaries.lighthouse)}
          onForceEnding={forceFinalEnding}
          onOpenEnding={() => setOverlay("ending")}
          onReturnSplit={runCounterfactualBranch}
          onCompare={() => setOverlay("compare")}
          onReplay={() => setOverlay("replay")}
          onClose={() => setOverlay(null)}
        />
      ) : null}
      {overlay === "showcase" && activeShowcaseNode ? (
        <ShowcasePanel
          node={activeShowcaseNode}
          nodes={showcaseNodes}
          onSelectNode={openShowcaseNode}
          onRunBeat={startShowcaseBeatDemo}
          onClose={() => setOverlay(null)}
        />
      ) : null}
      {overlay === "compare" ? (
        <CompareBranchesPanel
          rescue={branchSummaries.rescue}
          lighthouse={branchSummaries.lighthouse}
          onClose={() => setOverlay(null)}
          onReplay={() => setOverlay("replay")}
        />
      ) : null}
    </>
  );
}
