import { generatedAssetByName, metricIconAssets } from "../data/asset-manifest.generated";
import type { AgentRunState, GlobalState, MetricKey, RedDustTask, TaskOutcome } from "../data/types";
import {
  coreResourceKeys,
  nonZeroMetricDeltas,
  pressureMetricKeys,
  resourceMetricLabels
} from "../game/systems/resourceEconomy";

type HudPanelProps = {
  state: GlobalState;
  runState: AgentRunState;
  currentTask: RedDustTask | null;
  latestOutcome: TaskOutcome | null;
  latestOutcomeTaskTitle?: string;
  dailyUpkeep: Partial<Record<MetricKey, number>>;
};

function meterClass(value: number) {
  if (value >= 70) return "strong";
  if (value >= 40) return "steady";
  return "weak";
}

function signed(value: number) {
  return `${value > 0 ? "+" : ""}${value}`;
}

function branchLabel(branch: AgentRunState["activeBranch"]) {
  if (branch === "rescue") return "Rescue";
  if (branch === "lighthouse") return "Lighthouse";
  return "Common";
}

function metricIcon(key: (typeof coreResourceKeys)[number]) {
  if (key === "food") return generatedAssetByName.resource.uiPath;
  if (key === "battery") return generatedAssetByName["battery-box"].uiPath;
  return metricIconAssets[key];
}

function coreResourceLabel(key: (typeof coreResourceKeys)[number]) {
  if (key === "food") return "食";
  if (key === "battery") return "电";
  return resourceMetricLabels[key];
}

function DeltaChip({ metric, value }: { metric: MetricKey; value: number }) {
  return (
    <span className={value >= 0 ? "gain" : "cost"}>
      <b>{resourceMetricLabels[metric]}</b>
      {signed(value)}
    </span>
  );
}

export function HudPanel({ state, runState, currentTask, latestOutcome, latestOutcomeTaskTitle, dailyUpkeep }: HudPanelProps) {
  const dailyDeltas = nonZeroMetricDeltas(dailyUpkeep);
  const taskDeltas = latestOutcome
    ? nonZeroMetricDeltas(latestOutcome.stateDelta)
    : currentTask
      ? nonZeroMetricDeltas(currentTask.affects)
      : [];
  const taskTitle = latestOutcome ? latestOutcomeTaskTitle ?? latestOutcome.taskId : currentTask?.title ?? "等待任务";
  const taskMode = latestOutcome ? "最近任务" : currentTask ? "当前任务预估" : "任务影响";

  return (
    <>
      <section className="resource-hud-panel resource-hud-left" aria-label="Shelter resources">
        <header className="resource-hud-header">
          <div>
            <span>DAY {runState.currentDay}</span>
            <b>{branchLabel(runState.activeBranch)}</b>
          </div>
          <em>{state.replayLog.length} replay</em>
        </header>

        <div className="resource-core-grid">
          {coreResourceKeys.map((key) => {
            const value = state[key];
            return (
              <article className="resource-meter" key={key}>
                <div>
                  <img alt="" src={metricIcon(key)} />
                  <span>{coreResourceLabel(key)}</span>
                  <b>{value}</b>
                </div>
                <i className={meterClass(value)} style={{ width: `${value}%` }} />
              </article>
            );
          })}
        </div>

        <div className="resource-pressure-strip" aria-label="Shelter pressure">
          {pressureMetricKeys.map((key) => (
            <span key={key}>
              {resourceMetricLabels[key]} <b>{state[key]}</b>
            </span>
          ))}
        </div>
      </section>

      <aside className="resource-action-panel" aria-label="Daily resource changes">
        <article>
          <span>今日消耗</span>
          <div className="resource-delta-list">
            {dailyDeltas.length ? dailyDeltas.map(([metric, value]) => <DeltaChip key={metric} metric={metric} value={value} />) : <small>无日终消耗</small>}
          </div>
        </article>
        <article>
          <span>{taskMode}</span>
          <b>{taskTitle}</b>
          <div className="resource-delta-list">
            {taskDeltas.length ? taskDeltas.slice(0, 6).map(([metric, value]) => <DeltaChip key={metric} metric={metric} value={value} />) : <small>等待 AURA 选择</small>}
          </div>
        </article>
      </aside>
    </>
  );
}
