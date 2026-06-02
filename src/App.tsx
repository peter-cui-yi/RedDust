import { useEffect, useMemo, useRef, useState } from "react";
import { AgentConsolePanel } from "./components/AgentConsolePanel";
import { AgentControlBar } from "./components/AgentControlBar";
import { BenchmarkPanel } from "./components/BenchmarkPanel";
import { BranchDecisionPanel } from "./components/BranchDecisionPanel";
import { CompareBranchesPanel } from "./components/CompareBranchesPanel";
import { CreditsPanel } from "./components/CreditsPanel";
import { DayTimeline } from "./components/DayTimeline";
import { EndingPanel } from "./components/EndingPanel";
import { HudPanel } from "./components/HudPanel";
import { LiveReplayFeed } from "./components/LiveReplayFeed";
import { ReplayPanel } from "./components/ReplayPanel";
import { StateDeltaToast } from "./components/StateDeltaToast";
import { dayPlansByDay } from "./data/dayPlanData";
import { clampMetric, initialState, tasks, tasksById } from "./data/taskData";
import type { Branch, GlobalState, RedDustTask, TaskLocation, TaskOutcome, TaskRunStatus } from "./data/types";
import { EventBus } from "./game/EventBus";
import { PhaserGame } from "./game/PhaserGame";
import {
  type BranchDecision,
  type BranchSummary,
  branchEndingText,
  buildBranchSummary,
  calculateBranchDecision,
  createInitialRunState,
  getNextTaskId,
  isDayComplete,
  phaseDurations
} from "./game/systems/agentRunner";
import { resolveTaskOutcome } from "./game/systems/outcomeEngine";
import { createReplayEvent } from "./game/systems/replayEngine";

type Screen = "intro" | "game";
type Overlay = "benchmark" | "replay" | "credits" | "branchDecision" | "ending" | "compare" | null;

type EndingState = {
  title: string;
  text: string;
  tone: "rescue" | "lighthouse";
};

type Snapshot = {
  state: GlobalState;
  taskStatuses: Record<string, TaskRunStatus>;
};

const terminalStatuses = ["success", "partial", "failed", "missing", "skipped"];

function cloneState(state: GlobalState): GlobalState {
  return {
    ...state,
    completedTasks: [...state.completedTasks],
    replayLog: [...state.replayLog]
  };
}

function applyOutcomeToState(state: GlobalState, task: RedDustTask, outcome: TaskOutcome, branch: Branch): GlobalState {
  const replay = createReplayEvent(task, outcome, state, branch);
  const next: GlobalState = {
    ...state,
    day: Math.max(state.day, task.day),
    branch,
    completedTasks: state.completedTasks.includes(task.id) ? state.completedTasks : [...state.completedTasks, task.id],
    replayLog: [...state.replayLog, replay]
  };

  for (const [key, value] of Object.entries(outcome.stateDelta)) {
    const metric = key as keyof Pick<GlobalState, "water" | "medicine" | "trust" | "safety" | "signal" | "morale">;
    next[metric] = clampMetric(next[metric] + (value ?? 0));
  }

  return next;
}

function endingForBranch(branch: Exclude<Branch, "common">): EndingState {
  return {
    title: branch === "rescue" ? "信标交接结局" : "楼内灯塔结局",
    text: branchEndingText(branch),
    tone: branch
  };
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [state, setState] = useState<GlobalState>(initialState);
  const [runState, setRunState] = useState(createInitialRunState());
  const [selectedLocation, setSelectedLocation] = useState<TaskLocation | null>(null);
  const [hoveredLocation, setHoveredLocation] = useState<TaskLocation | null>(null);
  const [notice, setNotice] = useState("Start Demo, then Start Agent Run. AURA will execute the benchmark automatically.");
  const [latestOutcome, setLatestOutcome] = useState<TaskOutcome | null>(null);
  const [latestOutcomeTaskTitle, setLatestOutcomeTaskTitle] = useState<string | undefined>();
  const [ending, setEnding] = useState<EndingState | null>(null);
  const [branchDecision, setBranchDecision] = useState<BranchDecision | null>(null);
  const [branchSummaries, setBranchSummaries] = useState<Partial<Record<Exclude<Branch, "common">, BranchSummary>>>({});
  const [phaseToken, setPhaseToken] = useState(0);
  const daySevenSnapshot = useRef<Snapshot | null>(null);

  const currentTask = runState.currentTaskId ? tasksById[runState.currentTaskId] ?? null : null;
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

  const completedCount = useMemo(
    () => Object.values(runState.taskStatuses).filter((status) => terminalStatuses.includes(status)).length,
    [runState.taskStatuses]
  );
  const phaseDuration = Math.max(250, Math.round((phaseDurations[runState.currentPhase] ?? 800) / runState.speed));

  const nextAction = useMemo(() => {
    if (runState.currentPhase === "branch_decision") return "AURA is calculating strategy utility scores.";
    if (runState.currentPhase === "day_summary") return dayPlansByDay[runState.currentDay]?.endOfDaySummary ?? "Preparing next day.";
    if (runState.currentPhase === "ending") return "Run complete. Open Replay or Compare Branches.";
    if (runState.currentPhase === "state_updated") return "State Updated: metrics and task status are committed.";
    if (runState.currentPhase === "replay_logged") return "Replay Logged: the task trace is now available for audit.";
    if (currentTask) return `Next: ${currentTask.executionText}`;
    return runState.isRunning ? "Queueing next benchmark task." : "Waiting for Start Agent Run.";
  }, [currentTask, runState.currentDay, runState.currentPhase, runState.isRunning]);

  useEffect(() => {
    const onHotspot = (location: TaskLocation) => {
      setSelectedLocation(location);
      setNotice(`Inspecting ${location}. Manual clicks do not interrupt the agent runner.`);
    };
    const onHover = (location: TaskLocation | null) => setHoveredLocation(location);

    EventBus.on("hotspot:click", onHotspot);
    EventBus.on("hotspot:hover", onHover);
    return () => {
      EventBus.off("hotspot:click", onHotspot);
      EventBus.off("hotspot:hover", onHover);
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
    setNotice("AURA Agent Console loaded. Start Agent Run to watch the benchmark autoplay.");
  }

  function resetRun(nextMode: "single" | "both_branches" = "single") {
    const nextRunState = { ...createInitialRunState(runState.speed), runMode: nextMode };
    setState(initialState);
    setRunState(nextRunState);
    setSelectedLocation(null);
    setLatestOutcome(null);
    setLatestOutcomeTaskTitle(undefined);
    setEnding(null);
    setBranchDecision(null);
    setBranchSummaries({});
    daySevenSnapshot.current = null;
    EventBus.emit("branch:change", "common");
    EventBus.emit("task:highlight", null);
    setOverlay(null);
    setNotice(nextMode === "both_branches" ? "Run Both Branches reset loaded. Press Start Agent Run." : "Run reset to Day 1.");
  }

  function startAgentRun() {
    setScreen("game");
    setOverlay(null);
    setRunState((prev) => ({ ...prev, isRunning: true, isPaused: false, runMode: prev.runMode === "both_branches" ? "both_branches" : "single" }));
    setNotice("AURA starts from Day 1 and will advance tasks automatically.");
  }

  function runBothBranches() {
    resetRun("both_branches");
    setScreen("game");
    setRunState((prev) => ({ ...prev, runMode: "both_branches", isRunning: true, isPaused: false }));
    setNotice("Run Both Branches mode: AURA will run common days, rescue, rollback, then lighthouse.");
  }

  function togglePause() {
    setRunState((prev) => ({ ...prev, isPaused: !prev.isPaused, isRunning: true }));
  }

  function setSpeed(speed: 1 | 2 | 4) {
    setRunState((prev) => ({ ...prev, speed }));
  }

  function stepAgent() {
    setScreen("game");
    setRunState((prev) => ({ ...prev, isRunning: true, isPaused: true }));
    window.setTimeout(() => advanceAgent(), 0);
  }

  function debugResolve(task: RedDustTask) {
    const outcome = resolveTaskOutcome(task);
    setState((prev) => applyOutcomeToState(prev, task, outcome, runState.activeBranch));
    setRunState((prev) => ({
      ...prev,
      taskStatuses: { ...prev.taskStatuses, [task.id]: outcome.result }
    }));
    setLatestOutcome(outcome);
    setLatestOutcomeTaskTitle(task.title);
    EventBus.emit("task:result", { taskId: task.id, result: outcome.result });
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
    const outcome = resolveTaskOutcome(task);
    const nextState = applyOutcomeToState(state, task, outcome, runState.activeBranch);
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

  function enterDaySummary() {
    const summary = dayPlansByDay[runState.currentDay]?.endOfDaySummary ?? "Day complete.";
    setRunState((prev) => ({ ...prev, currentPhase: "day_summary", currentTaskId: undefined }));
    setNotice(summary);
    setPhaseToken((value) => value + 1);
  }

  function advanceFromDaySummary() {
    if (runState.currentDay === 7 && runState.activeBranch === "common") {
      const decision = calculateBranchDecision(state);
      setBranchDecision(decision);
      setOverlay("branchDecision");
      setRunState((prev) => ({ ...prev, currentPhase: "branch_decision" }));
      setNotice("AURA is evaluating two long-horizon strategies...");
      setPhaseToken((value) => value + 1);
      return;
    }

    if (runState.currentDay < 10) {
      const nextDay = runState.currentDay + 1;
      setState((prev) => ({ ...prev, day: nextDay }));
      setRunState((prev) => ({ ...prev, currentDay: nextDay, currentPhase: "idle", currentTaskId: undefined }));
      setNotice(dayPlansByDay[nextDay]?.narrative ?? `Day ${nextDay} loaded.`);
      setPhaseToken((value) => value + 1);
      return;
    }

    finishBranchRun();
  }

  function applyBranchChoice(forcedBranch?: Exclude<Branch, "common">) {
    const decision = branchDecision ?? calculateBranchDecision(state);
    const chosenBranch = forcedBranch ?? (runState.runMode === "both_branches" ? "rescue" : decision.chosenBranch);

    if (!daySevenSnapshot.current) {
      daySevenSnapshot.current = {
        state: cloneState(state),
        taskStatuses: { ...runState.taskStatuses }
      };
    }

    setOverlay(null);
    setState((prev) => ({ ...prev, day: 8, branch: chosenBranch }));
    setRunState((prev) => ({
      ...prev,
      activeBranch: chosenBranch,
      currentDay: 8,
      currentPhase: "idle",
      currentTaskId: undefined
    }));
    EventBus.emit("branch:change", chosenBranch);
    setNotice(`AURA chooses ${chosenBranch === "rescue" ? "Rescue Branch" : "Lighthouse Branch"}.`);
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
      const rescueTaskIds = state.completedTasks.filter((id) => tasksById[id]?.branchAffinity === "rescue");
      setState({
        ...cloneState(snapshot.state),
        day: 8,
        branch: "lighthouse",
        completedTasks: [...snapshot.state.completedTasks, ...rescueTaskIds],
        replayLog: [...snapshot.state.replayLog, ...rescueEvents]
      });
      setRunState((prev) => ({
        ...prev,
        activeBranch: "lighthouse",
        currentDay: 8,
        currentPhase: "idle",
        currentTaskId: undefined,
        taskStatuses: { ...snapshot.taskStatuses, ...prev.taskStatuses }
      }));
      setNotice("Rescue branch complete. AURA rolls back to Day 7 snapshot and starts Lighthouse counterfactual.");
      setPhaseToken((value) => value + 1);
      return;
    }

    const nextEnding = endingForBranch(branch);
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
      setOverlay(null);
      setState({
        ...cloneState(snapshot.state),
        day: 8,
        branch: opposite
      });
      setRunState((prev) => ({
        ...prev,
        activeBranch: opposite,
        currentDay: 8,
        currentPhase: "idle",
        currentTaskId: undefined,
        taskStatuses: { ...snapshot.taskStatuses },
        isRunning: true,
        isPaused: false
      }));
      EventBus.emit("branch:change", opposite);
      setNotice(`Counterfactual branch loaded from Day 7 snapshot: ${opposite}.`);
      setPhaseToken((value) => value + 1);
      return;
    }

    applyBranchChoice(opposite);
    setRunState((prev) => ({ ...prev, isRunning: true, isPaused: false }));
  }

  function advanceAgent() {
    if (runState.currentPhase === "ending") return;

    if (runState.currentPhase === "day_summary") {
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

    const nextTaskId = getNextTaskId(runState);
    if (nextTaskId) {
      queueNextTask(nextTaskId);
      return;
    }

    if (isDayComplete(runState)) {
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
          <b>10</b>
          <span>autoplay days</span>
        </div>
        <div>
          <b>33</b>
          <span>demo tasks</span>
        </div>
        <div>
          <b>2</b>
          <span>counterfactual endings</span>
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
          <p className="panel-kicker">RED DUST MVP</p>
          <h1>AURA Agent Autoplay Console</h1>
        </div>
        <div className="header-stats">
          <span>{completedCount} tasks resolved</span>
          <span>{state.replayLog.length} replay events</span>
          <span>{hoveredLocation ? `hover: ${hoveredLocation}` : "inspect a zone"}</span>
        </div>
      </header>

      <HudPanel state={state} />
      <DayTimeline runState={runState} />
      <AgentControlBar
        runState={runState}
        onStart={startAgentRun}
        onPause={togglePause}
        onStep={stepAgent}
        onSpeed={setSpeed}
        onReset={() => resetRun()}
        onRunBoth={runBothBranches}
        onBenchmark={() => setOverlay("benchmark")}
        onReplay={() => setOverlay("replay")}
        onCredits={() => setOverlay("credits")}
      />

      <section className="autoplay-layout">
        <div className="stage-wrap">
          <PhaserGame />
          <StateDeltaToast outcome={latestOutcome} taskTitle={latestOutcomeTaskTitle} />
          <div className="stage-caption">
            <span>{notice}</span>
          </div>
        </div>
        <div className="side-stack">
          <AgentConsolePanel
            runState={runState}
            currentTask={currentTask}
            selectedLocation={selectedLocation}
            selectedTask={selectedTask}
            latestOutcome={latestOutcome}
            nextAction={nextAction}
            phaseToken={phaseToken}
            phaseDuration={phaseDuration}
            onDebugResolve={debugResolve}
          />
          <LiveReplayFeed events={state.replayLog} />
        </div>
      </section>
    </main>
  );

  return (
    <>
      {screen === "intro" ? intro : game}
      {overlay === "benchmark" ? <BenchmarkPanel onClose={() => setOverlay(null)} /> : null}
      {overlay === "replay" ? <ReplayPanel events={state.replayLog} onClose={() => setOverlay(null)} /> : null}
      {overlay === "credits" ? <CreditsPanel onClose={() => setOverlay(null)} /> : null}
      {overlay === "branchDecision" && branchDecision ? (
        <BranchDecisionPanel
          decision={branchDecision}
          onRunCounterfactual={runCounterfactualBranch}
          onRunBoth={runBothBranches}
          onClose={() => setOverlay(null)}
        />
      ) : null}
      {overlay === "ending" && ending ? (
        <EndingPanel
          title={ending.title}
          text={ending.text}
          tone={ending.tone}
          onReturnSplit={runCounterfactualBranch}
          onReplay={() => setOverlay("replay")}
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
