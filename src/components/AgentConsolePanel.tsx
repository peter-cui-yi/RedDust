import { useEffect, useMemo, useState } from "react";
import { taskCategoryIconAssets } from "../data/asset-manifest.generated";
import { characterProfilesById } from "../data/characterData";
import { dayPlansByDay } from "../data/dayPlanData";
import { image2Assets } from "../data/image2Assets";
import type { AgentRunState, CharacterId, GlobalState, MetricKey, RedDustTask, StoryScene, TaskLocation, TaskOutcome } from "../data/types";
import { selectAuraTasksForDay, taskSelectionKey } from "../game/systems/auraTaskSelection";
import { dailyUpkeepForDay, dailyUpkeepReasonsForDay, nonZeroMetricDeltas, resourceMetricLabels } from "../game/systems/resourceEconomy";

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

type ConsoleSectionId = "selection" | "execution" | "allocation";
type ConsoleStage = ConsoleSectionId | "complete";

const npcOrder: CharacterId[] = ["ma_dehai", "shen_zhiyue", "xiao_tie", "lao_qian"];

const npcAbilityLabels: Record<CharacterId, string> = {
  ma_dehai: "工程 / 门禁 override",
  shen_zhiyue: "医疗复核 / 伦理边界",
  xiao_tie: "病情压力 / 人身约束",
  lao_qian: "电台验证 / 外部信号"
};

const progressByStatus: Record<string, number> = {
  queued: 12,
  thinking: 28,
  moving: 44,
  executing: 70,
  resolving: 88,
  state_updated: 96,
  replay_logged: 100,
  success: 100,
  partial: 100,
  failed: 100,
  missing: 100,
  skipped: 100
};

function signed(value = 0) {
  return `${value > 0 ? "+" : ""}${value}`;
}

function resultLabel(status: string) {
  if (status === "success") return "finish";
  if (status === "partial") return "partial";
  if (status === "failed" || status === "missing") return "fail";
  if (status === "skipped") return "skipped";
  if (status === "locked") return "waiting";
  return "running";
}

function sectionForPhase(runState: AgentRunState): ConsoleStage {
  if (runState.currentPhase === "planning_complete") return "complete";
  if (runState.currentPhase === "day_summary") return "allocation";
  if (runState.currentTaskId || ["executing", "resolving", "state_updated", "replay_logged"].includes(runState.currentPhase)) return "execution";
  return "selection";
}

function taskStatus(runState: AgentRunState, taskId: string) {
  return runState.taskStatuses[taskId] ?? "locked";
}

function taskProgress(runState: AgentRunState, taskId: string) {
  const status = taskStatus(runState, taskId);
  if (runState.currentTaskId === taskId && progressByStatus[runState.currentPhase] !== undefined) return progressByStatus[runState.currentPhase];
  return progressByStatus[status] ?? 0;
}

function taskReplay(state: GlobalState, taskId: string) {
  return [...state.replayLog].reverse().find((event) => event.taskId === taskId);
}

function compactDeltas(delta: Partial<Record<MetricKey, number>> | Record<string, number>) {
  return (Object.entries(delta) as Array<[MetricKey, number]>).filter(([, value]) => value !== 0);
}

function strongestDeltas(delta: Partial<Record<MetricKey, number>> | Record<string, number>, count = 4) {
  return compactDeltas(delta)
    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
    .slice(0, count);
}

function emotionSnapshot(state: GlobalState) {
  const tensionValues = Object.values(state.story.relationships).map((relationship) => relationship.tension);
  const avgTension = Math.round(tensionValues.reduce((sum, value) => sum + value, 0) / Math.max(1, tensionValues.length));
  return [
    ["安全感", state.safety],
    ["士气", state.morale],
    ["信任", state.trust],
    ["紧张", avgTension]
  ];
}

function nextDayPlan(runState: AgentRunState) {
  const day = runState.currentDay >= 11 ? 12 : runState.currentDay + 1;
  return dayPlansByDay[day];
}

export function AgentConsolePanel({ runState, state, currentTask, latestOutcome }: AgentConsolePanelProps) {
  const selectionKey = taskSelectionKey(runState.currentDay, runState.activeBranch);
  const lockedTaskIds = runState.dailyTaskSelections[selectionKey];
  const selection = useMemo(
    () => selectAuraTasksForDay(runState.currentDay, runState.activeBranch, state, runState.taskStatuses, lockedTaskIds),
    [lockedTaskIds, runState.activeBranch, runState.currentDay, runState.taskStatuses, state]
  );
  const candidateDecisions = selection.candidates;
  const selectedTasks = selection.selected.map((decision) => decision.task);
  const selectedTaskIds = new Set(selectedTasks.map((task) => task.id));
  const activeSection = sectionForPhase(runState);
  const selectionThinking = activeSection === "selection" && !lockedTaskIds?.length && candidateDecisions.length > 0;
  const [scanIndex, setScanIndex] = useState(0);
  const [openSections, setOpenSections] = useState<Record<ConsoleSectionId, boolean>>({
    selection: true,
    execution: false,
    allocation: false
  });
  const dailyUpkeep = dailyUpkeepForDay(runState.currentDay, runState.activeBranch, state);
  const dailyUpkeepReasons = dailyUpkeepReasonsForDay(runState.currentDay, runState.activeBranch, state);
  const tomorrowPlan = nextDayPlan(runState);
  const finishedPlanning = runState.currentPhase === "planning_complete";

  useEffect(() => {
    setOpenSections({
      selection: activeSection === "selection",
      execution: activeSection === "execution",
      allocation: activeSection === "allocation"
    });
  }, [activeSection, runState.currentDay, runState.activeBranch]);

  useEffect(() => {
    if (!selectionThinking) {
      setScanIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setScanIndex((value) => (value + 1) % candidateDecisions.length);
    }, 620);

    return () => window.clearInterval(interval);
  }, [candidateDecisions.length, selectionThinking]);

  function toggleSection(section: ConsoleSectionId, open: boolean) {
    setOpenSections((current) => ({ ...current, [section]: open }));
  }

  return (
    <section className="panel agent-console-panel">
      <header className="aura-console-head">
        <img alt="" src={image2Assets.auraIdle.uiPath} />
        <div>
          <p className="panel-kicker">AURA AGENT CONSOLE</p>
          <b>{finishedPlanning ? "agent规划完成" : "可审计调度中"}</b>
          <span>Day {runState.currentDay} / {runState.activeBranch}</span>
        </div>
      </header>

      <details className="aura-flow-card" open={openSections.selection} onToggle={(event) => toggleSection("selection", event.currentTarget.open)}>
        <summary>
          <span>01</span>
          <b>任务抉择中（Thinking）</b>
          <em>{selectionThinking ? candidateDecisions[scanIndex]?.task.id ?? "scanning" : selectedTasks.map((task) => task.id).join(" + ") || "waiting"}</em>
        </summary>
        <div className="aura-flow-body">
          {selectionThinking ? (
            <div className="selection-scanner" aria-label="AURA task selection scanner">
              <span>正在扫描四个候选任务</span>
              <b>{candidateDecisions[scanIndex]?.task.title ?? "等待候选任务"}</b>
            </div>
          ) : null}

          <div className="state-scan-grid">
            <article>
              <span>环境状态</span>
              <div>
                {(["water", "food", "medicine", "battery"] as MetricKey[]).map((key) => (
                  <b className={state[key] < 45 ? "risk" : ""} key={key}>{resourceMetricLabels[key]} {state[key]}</b>
                ))}
              </div>
            </article>
            <article>
              <span>情绪状态</span>
              <div>
                {emotionSnapshot(state).map(([label, value]) => (
                  <b className={Number(value) > 60 || Number(value) < 40 ? "risk" : ""} key={label}>{label} {value}</b>
                ))}
              </div>
            </article>
          </div>

          <div className="npc-capacity-strip">
            {npcOrder.map((id) => (
              <span key={id}>
                <b>{characterProfilesById[id].shortName}</b>
                {npcAbilityLabels[id]}
              </span>
            ))}
          </div>

          <ol className="candidate-rank-list">
            {candidateDecisions.map((decision, index) => {
              const task = decision.task;
              return (
              <li className={`${selectedTaskIds.has(task.id) ? "selected" : "deferred"} ${decision.selectionLocked ? "locked-in" : ""} ${selectionThinking && index === scanIndex ? "thinking-focus" : ""}`} key={task.id}>
                <img alt="" src={taskCategoryIconAssets[task.category]} />
                <div>
                  <span>#{decision.rank} · {selectedTaskIds.has(task.id) ? "EXECUTE" : "DEFER"}{decision.selectionLocked ? " · LOCKED" : ""}</span>
                  <b>{task.title}</b>
                  <div className="decision-factor-row">
                    <em>{decision.environmentReason}</em>
                    <em>{decision.emotionReason}</em>
                    <em>{decision.npcReason}</em>
                    <em>{decision.riskReason}</em>
                  </div>
                  <small>dynamic score {Math.round(decision.score)}</small>
                </div>
              </li>
              );
            })}
          </ol>
        </div>
      </details>

      <details className="aura-flow-card" open={openSections.execution} onToggle={(event) => toggleSection("execution", event.currentTarget.open)}>
        <summary>
          <span>02</span>
          <b>执行两个任务并记录结果</b>
          <em>{currentTask?.id ?? latestOutcome?.taskId ?? "standby"}</em>
        </summary>
        <div className="task-execution-stack">
          {selectedTasks.map((task) => {
            const replay = taskReplay(state, task.id);
            const status = taskStatus(runState, task.id);
            const progress = taskProgress(runState, task.id);
            const deltas = replay ? compactDeltas(replay.stateDelta) : strongestDeltas(task.affects, 4);
            const deltaMode = replay ? "实际收支" : status === "locked" ? "预期收支" : "预计收支";
            const active = currentTask?.id === task.id;
            return (
              <article className={active ? "active" : ""} key={task.id}>
                <header>
                  <span>{task.id}</span>
                  <b>{task.title}</b>
                  <em className={`status ${status}`}>{resultLabel(status)}</em>
                </header>
                <div className="task-progress-bar" aria-label={`${task.title} progress`}>
                  <i style={{ width: `${progress}%` }} />
                </div>
                <div className="compact-delta-row">
                  <strong>{deltaMode}</strong>
                  {deltas.length ? deltas.slice(0, 5).map(([metric, value]) => (
                    <span className={value >= 0 ? "delta-up" : "delta-down"} key={metric}>
                      {resourceMetricLabels[metric] ?? metric} {signed(value)}
                    </span>
                  )) : <span>等待执行</span>}
                </div>
                <p>{replay?.explanation ?? task.executionText}</p>
              </article>
            );
          })}
        </div>
      </details>

      <details className="aura-flow-card" open={openSections.allocation} onToggle={(event) => toggleSection("allocation", event.currentTarget.open)}>
        <summary>
          <span>03</span>
          <b>分配今日消耗并制定明日计划</b>
          <em>{tomorrowPlan ? `Day ${tomorrowPlan.day}` : "audit"}</em>
        </summary>
        <div className="allocation-plan-grid">
          <article>
            <span>今日消耗策略</span>
            <div className="compact-delta-row">
              {nonZeroMetricDeltas(dailyUpkeep).map(([metric, value]) => (
                <span className={value >= 0 ? "delta-up" : "delta-down"} key={metric}>
                  {resourceMetricLabels[metric]} {signed(value)}
                </span>
              ))}
            </div>
            <p>
              AURA 每日扣除饮水、食物、药品、电力和照护成本；低库存不会自动补回，只会转化为健康、士气、信任和安全压力。
            </p>
            {dailyUpkeepReasons.length ? (
              <ul className="allocation-reason-list">
                {dailyUpkeepReasons.slice(0, 3).map((reason) => <li key={reason}>{reason}</li>)}
              </ul>
            ) : null}
          </article>
          <article>
            <span>第二天计划</span>
            <b>{tomorrowPlan?.title ?? "Final Audit"}</b>
            <p>{tomorrowPlan?.narrative ?? "汇总 replay、审计压力、资源状态和结局证据。"}</p>
          </article>
        </div>
      </details>

      <div className={`aura-plan-complete ${finishedPlanning ? "complete" : ""}`}>
        <b>{finishedPlanning ? "agent规划完成" : "等待本日任务闭环"}</b>
        <span>{finishedPlanning ? "选择依据、任务结果、消耗分配和明日计划已写入 replay。" : "完成两个任务后进入消耗分配。"}</span>
      </div>
    </section>
  );
}
