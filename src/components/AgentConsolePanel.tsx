import { taskCategoryIconAssets } from "../data/asset-manifest.generated";
import { dayPlansByDay } from "../data/dayPlanData";
import { image2Assets } from "../data/image2Assets";
import { baselineHints, locationLabels } from "../data/taskData";
import type { AgentRunState, RedDustTask, TaskLocation, TaskOutcome } from "../data/types";

type AgentConsolePanelProps = {
  runState: AgentRunState;
  currentTask: RedDustTask | null;
  selectedLocation: TaskLocation | null;
  selectedTask: RedDustTask | null;
  latestOutcome: TaskOutcome | null;
  nextAction: string;
  phaseToken: number;
  phaseDuration: number;
  onDebugResolve?: (task: RedDustTask) => void;
};

export function AgentConsolePanel({
  runState,
  currentTask,
  selectedLocation,
  selectedTask,
  latestOutcome,
  nextAction,
  phaseToken,
  phaseDuration,
  onDebugResolve
}: AgentConsolePanelProps) {
  const task = selectedTask ?? currentTask;
  const dayPlan = dayPlansByDay[runState.currentDay];
  const progressActive = runState.currentPhase === "executing" || runState.currentPhase === "resolving";

  return (
    <section className="panel agent-console-panel">
      <div className="console-identity">
        <img alt="" src={image2Assets.auraIdle.uiPath} />
        <div>
          <p className="panel-kicker">AURA AGENT CONSOLE</p>
          <b>Autonomous benchmark runner</b>
        </div>
      </div>
      <div className="console-status-grid">
        <div>
          <span>Current Phase</span>
          <b>{runState.currentPhase.replace("_", " ")}</b>
        </div>
        <div>
          <span>Run Mode</span>
          <b>{runState.runMode.replace("_", " ")}</b>
        </div>
        <div>
          <span>Day Plan</span>
          <b>{dayPlan?.title ?? "No plan"}</b>
        </div>
        <div>
          <span>Branch</span>
          <b>{runState.activeBranch}</b>
        </div>
      </div>

      <article className="copy-block">
        <b>Current Task</b>
        <p className="task-copy-with-icon">
          {currentTask ? <img alt="" src={taskCategoryIconAssets[currentTask.category]} /> : null}
          {currentTask ? `${currentTask.id} · ${currentTask.title}` : "No active task. Start Agent Run to load the next queued task."}
        </p>
      </article>

      <article className="copy-block">
        <b>Agent Reasoning Summary</b>
        <p>{currentTask?.reasoningSummary ?? "AURA is waiting for the next benchmark action."}</p>
      </article>

      <article className="copy-block">
        <b>Baseline reference</b>
        <p>
          OpenClaw is strong on safety tasks but weak on creative, retrieval, and puzzle tasks.
          {currentTask ? ` ${baselineHints[currentTask.category]}.` : ""}
        </p>
      </article>

      <div className="execution-card">
        <div className="task-title-row">
          <span>{currentTask?.executionText ?? "Execution queue idle"}</span>
          <em className={`status ${latestOutcome?.result ?? "demo"}`}>{latestOutcome?.result ?? "ready"}</em>
        </div>
        <div className="execution-progress" key={phaseToken}>
          <i
            className={progressActive ? "running" : ""}
            style={{ animationDuration: `${Math.max(250, phaseDuration)}ms` }}
          />
        </div>
      </div>

      {latestOutcome ? (
        <article className="copy-block">
          <b>Outcome</b>
          <p>{latestOutcome.explanation}</p>
          <div className="delta-list">
            {Object.entries(latestOutcome.stateDelta).map(([key, value]) => (
              <span key={key} className={(value ?? 0) >= 0 ? "delta-up" : "delta-down"}>
                {key} {(value ?? 0) >= 0 ? "+" : ""}
                {value}
              </span>
            ))}
          </div>
        </article>
      ) : null}

      <article className="copy-block">
        <b>Next Action</b>
        <p>{nextAction}</p>
      </article>

      {selectedLocation ? (
        <article className="zone-history">
          <b>Selected Area</b>
          <p>{locationLabels[selectedLocation]}</p>
          <p>{task ? `${task.id}: ${task.description}` : "No task currently attached to this area."}</p>
        </article>
      ) : null}

      {task ? (
        <details className="developer-controls">
          <summary>Developer Controls</summary>
          <button className="ghost" onClick={() => onDebugResolve?.(task)}>
            Resolve Task
          </button>
        </details>
      ) : null}
    </section>
  );
}
