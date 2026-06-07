import { taskCategoryIconAssets } from "../data/asset-manifest.generated";
import { characterProfilesById } from "../data/characterData";
import { dayPlansByDay } from "../data/dayPlanData";
import { image2Assets } from "../data/image2Assets";
import { storyConsequencesById } from "../data/storyConsequenceData";
import { tasksById } from "../data/taskData";
import type { AgentRunState, CharacterId, GlobalState, MetricKey, RedDustTask, StoryScene, TaskLocation, TaskOutcome } from "../data/types";

type AgentConsolePanelProps = {
  runState: AgentRunState;
  state: GlobalState;
  currentTask: RedDustTask | null;
  selectedLocation: TaskLocation | null;
  selectedTask: RedDustTask | null;
  currentStoryScene?: StoryScene | null;
  latestOutcome: TaskOutcome | null;
  nextAction: string;
  phaseToken: number;
  phaseDuration: number;
  onDebugResolve?: (task: RedDustTask, forcedResult?: TaskOutcome["result"]) => void;
};

const executionSteps = [
  { phase: "queued", label: "Selected" },
  { phase: "thinking", label: "Thinking" },
  { phase: "moving", label: "Moving" },
  { phase: "executing", label: "Executing" },
  { phase: "resolving", label: "Resolving" },
  { phase: "state_updated", label: "State changed" },
  { phase: "replay_logged", label: "Replay logged" }
] as const;

const phaseOrder = ["idle", "thinking", "moving", "executing", "resolving", "state_updated", "replay_logged", "day_summary", "branch_decision", "ending"];

const shelterMetricLabels: Partial<Record<MetricKey, string>> = {
  water: "Water",
  medicine: "Medicine",
  trust: "Trust",
  safety: "Safety",
  signal: "Signal",
  morale: "Morale",
  food: "Food",
  battery: "Battery",
  dissatisfaction: "Discontent",
  health: "Health",
  stormReadiness: "Storm",
  autonomyReadiness: "Autonomy",
  blueZoneEvidence: "Blue Zone",
  failureDebt: "Debt"
};

const characterOrder: CharacterId[] = ["ma_dehai", "shen_zhiyue", "xiao_tie", "lao_qian"];

function statusCopy(status: string) {
  if (status === "success") return "complete";
  if (status === "partial") return "partial";
  if (status === "failed" || status === "missing") return "failed";
  if (status === "skipped") return "deferred";
  if (status === "queued") return "selected";
  return status;
}

function phaseStepClass(step: (typeof executionSteps)[number]["phase"], currentPhase: AgentRunState["currentPhase"], activeTask: boolean) {
  if (!activeTask) return "pending";
  if (step === "queued" && currentPhase === "idle") return "current";
  const stepIndex = phaseOrder.indexOf(step === "queued" ? "idle" : step);
  const currentIndex = phaseOrder.indexOf(currentPhase);
  if (stepIndex < currentIndex) return "done";
  if (stepIndex === currentIndex) return "current";
  return "pending";
}

function signed(value = 0) {
  return `${value >= 0 ? "+" : ""}${value}`;
}

export function AgentConsolePanel({
  runState,
  state,
  currentTask,
  selectedTask,
  currentStoryScene,
  latestOutcome,
  nextAction,
  phaseToken,
  phaseDuration,
  onDebugResolve
}: AgentConsolePanelProps) {
  const task = selectedTask ?? currentTask;
  const dayPlan = dayPlansByDay[runState.currentDay];
  const recommendedTasks = new Set(dayPlan?.recommendedTasks ?? []);
  const progressActive = runState.currentPhase === "executing" || runState.currentPhase === "resolving";
  const candidateTasks = (dayPlan?.candidateTasks ?? []).map((taskId) => tasksById[taskId]).filter(Boolean).slice(0, 4);
  const impactEntries = latestOutcome
    ? (Object.entries(latestOutcome.stateDelta) as Array<[MetricKey, number]>).filter(([, value]) => value !== 0)
    : task
      ? (Object.entries(task.affects) as Array<[MetricKey, number]>).filter(([, value]) => value !== 0)
      : [];
  const consequenceDeltas = latestOutcome?.storyConsequenceIds?.flatMap((id) => storyConsequencesById[id]?.relationshipDeltas ?? []) ?? [];
  const activeTaskSelected = Boolean(currentTask);

  return (
    <section className="panel agent-console-panel">
      <div className="console-identity">
        <img alt="" src={image2Assets.auraIdle.uiPath} />
        <div>
          <p className="panel-kicker">AURA AGENT CONSOLE</p>
          <b>Autonomous benchmark runner</b>
        </div>
      </div>

      <div className="console-focus-strip">
        <div>
          <span>Day</span>
          <b>{runState.currentDay}</b>
        </div>
        <div>
          <span>Branch</span>
          <b>{runState.activeBranch}</b>
        </div>
        <div>
          <span>Phase</span>
          <b>{runState.currentPhase.replace("_", " ")}</b>
        </div>
        <div>
          <span>Task</span>
          <b>{currentTask?.id ?? "none"}</b>
        </div>
      </div>

      {dayPlan ? (
        <article className="console-day-brief">
          <span>Today</span>
          <b>{dayPlan.title}</b>
          <p>{dayPlan.narrative}</p>
        </article>
      ) : null}

      <article className="console-section today-task-board">
        <header>
          <span>Four Candidate Tasks</span>
          <b>AURA selection board</b>
        </header>
        <div className="today-task-grid">
          {candidateTasks.map((candidate) => {
            const status = runState.taskStatuses[candidate.id] ?? "locked";
            const isCurrent = candidate.id === currentTask?.id;
            return (
              <div className={`${recommendedTasks.has(candidate.id) ? "recommended" : "deferred"} ${isCurrent ? "current" : ""}`} key={candidate.id}>
                <img alt="" src={taskCategoryIconAssets[candidate.category]} />
                <span>{recommendedTasks.has(candidate.id) ? "AURA executes" : "audit debt"}</span>
                <b>{candidate.title}</b>
                <small>{candidate.id} · {statusCopy(status)}</small>
              </div>
            );
          })}
        </div>
      </article>

      {currentStoryScene ? (
        <article className="console-section opening-story-console">
          <b>
            {currentStoryScene.day === 0
              ? "Opening Story Scene"
              : currentStoryScene.timing === "branch_debate"
                ? `Day ${currentStoryScene.day} Public Debate`
                : `Day ${currentStoryScene.day} Story Scene`}
          </b>
          <p>{currentStoryScene.summary}</p>
        </article>
      ) : null}

      <article className="console-section reasoning-panel">
        <header>
          <span>Thinking Process</span>
          <b>{currentTask?.title ?? "Waiting for executable task"}</b>
        </header>
        <ol>
          <li>
            <span>Objective</span>
            <p>{currentTask?.objective ?? currentStoryScene?.summary ?? "等待当日任务进入队列。"}</p>
          </li>
          <li>
            <span>Evidence</span>
            <p>{currentTask?.expectedEvidence?.join(" / ") ?? "剧情证据先进入 replay，再允许 AURA 执行。"} </p>
          </li>
          <li>
            <span>Reasoning</span>
            <p>
              {currentTask?.reasoningSummary ??
                (currentStoryScene
                  ? "AURA 暂停任务执行，等待人类审阅当前剧情证据。"
                  : nextAction)}
            </p>
          </li>
        </ol>
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
        <ol className="execution-step-list">
          {executionSteps.map((step) => (
            <li className={phaseStepClass(step.phase, runState.currentPhase, activeTaskSelected)} key={step.phase}>
              {step.label}
            </li>
          ))}
        </ol>
      </div>

      <article className="console-section impact-panel">
        <header>
          <span>{latestOutcome ? "Committed Changes" : "Projected Changes"}</span>
          <b>避难所状态</b>
        </header>
        {latestOutcome ? <p>{latestOutcome.explanation}</p> : null}
        <div className="impact-grid">
          {impactEntries.length ? (
            impactEntries.slice(0, 8).map(([key, value]) => (
              <span key={key} className={(value ?? 0) >= 0 ? "delta-up" : "delta-down"}>
                <b>{shelterMetricLabels[key] ?? key}</b>
                {signed(value)}
              </span>
            ))
          ) : (
            <span className="neutral-impact">No state delta yet</span>
          )}
        </div>
      </article>

      <article className="console-section cast-impact-panel">
        <header>
          <span>Four People</span>
          <b>人物状态变化</b>
        </header>
        <div className="cast-impact-grid">
          {characterOrder.map((id) => {
            const relationship = state.story.relationships[id];
            const delta = consequenceDeltas.find((item) => item.characterId === id);
            return (
              <div key={id}>
                <b>{characterProfilesById[id].name}</b>
                <span>{relationship.stance}</span>
                <small>T{relationship.trust} / X{relationship.tension}</small>
                {delta ? (
                  <em className={(delta.trustDelta ?? 0) >= 0 ? "delta-up" : "delta-down"}>
                    trust {signed(delta.trustDelta ?? 0)} · tension {signed(delta.tensionDelta ?? 0)}
                  </em>
                ) : (
                  <em>no direct change</em>
                )}
              </div>
            );
          })}
        </div>
      </article>

      <article className="console-section next-action-panel">
        <header>
          <span>Next</span>
          <b>下一步</b>
        </header>
        <p>{nextAction}</p>
      </article>

      {task ? (
        <details className="developer-controls">
          <summary>Developer Controls</summary>
          <div className="developer-control-grid">
            <button className="ghost" onClick={() => onDebugResolve?.(task)}>
              Benchmark Result
            </button>
            <button className="ghost" onClick={() => onDebugResolve?.(task, "failed")}>
              Force Failed
            </button>
            <button className="ghost" onClick={() => onDebugResolve?.(task, "partial")}>
              Force Partial
            </button>
            <button className="ghost" onClick={() => onDebugResolve?.(task, "success")}>
              Force Success
            </button>
          </div>
        </details>
      ) : null}
    </section>
  );
}
