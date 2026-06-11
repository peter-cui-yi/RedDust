import { tasksById } from "../data/taskData";
import type { Branch, MetricKey, TaskRunStatus } from "../data/types";
import { resourceMetricLabels } from "../game/systems/resourceEconomy";

export type DailyClosureSummary = {
  day: number;
  branch: Branch;
  title: string;
  selectedTaskIds: string[];
  completedTaskIds: string[];
  deferredTaskIds: string[];
  taskStatuses: Record<string, TaskRunStatus>;
  taskDelta: Partial<Record<MetricKey, number>>;
  deferredDelta: Partial<Record<MetricKey, number>>;
  upkeepDelta: Partial<Record<MetricKey, number>>;
  totalDelta: Partial<Record<MetricKey, number>>;
  nextDay: number;
  nextBranch: Branch;
  nextTitle: string;
  nextPlanDelta: Partial<Record<MetricKey, number>>;
  nextPlanReasons: string[];
  nextPriorities: string[];
};

type DailyClosurePanelProps = {
  summary: DailyClosureSummary;
  onContinue: () => void;
};

const statusLabel: Partial<Record<TaskRunStatus, string>> = {
  success: "完成",
  partial: "部分完成",
  failed: "失败",
  missing: "缺失",
  skipped: "延后",
  replay_logged: "已记录",
  state_updated: "已结算"
};

function branchLabel(branch: Branch) {
  if (branch === "rescue") return "主动外出线";
  if (branch === "lighthouse") return "留守灯塔线";
  return "公共线";
}

function deltaEntries(delta: Partial<Record<MetricKey, number>>) {
  return (Object.entries(delta) as Array<[MetricKey, number]>)
    .filter(([, value]) => value !== 0)
    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a));
}

function deltaSentence(delta: Partial<Record<MetricKey, number>>, maxItems = 5) {
  const entries = deltaEntries(delta);
  if (!entries.length) return "下一天没有额外基础消耗。";
  const shown = entries.slice(0, maxItems).map(([key, value]) => `${resourceMetricLabels[key]}${value > 0 ? "+" : ""}${value}`);
  return `预计基础变化：${shown.join("、")}${entries.length > maxItems ? " 等" : ""}。`;
}

function briefSentence(items: string[], fallback: string, maxItems = 2) {
  const shown = items.filter(Boolean).slice(0, maxItems);
  if (!shown.length) return fallback;
  return shown.join(" ");
}

function DeltaGrid({ title, delta }: { title: string; delta: Partial<Record<MetricKey, number>> }) {
  const entries = deltaEntries(delta);
  return (
    <article className="daily-closure-ledger">
      <h3>{title}</h3>
      {entries.length ? (
        <div>
          {entries.map(([key, value]) => (
            <span className={value > 0 ? "positive" : "negative"} key={key}>
              <b>{resourceMetricLabels[key]}</b>
              {value > 0 ? "+" : ""}{value}
            </span>
          ))}
        </div>
      ) : (
        <p>无变化</p>
      )}
    </article>
  );
}

function TaskList({
  title,
  taskIds,
  taskStatuses
}: {
  title: string;
  taskIds: string[];
  taskStatuses: Record<string, TaskRunStatus>;
}) {
  return (
    <article className="daily-closure-task-list">
      <h3>{title}</h3>
      {taskIds.length ? (
        <ol>
          {taskIds.map((taskId) => {
            const task = tasksById[taskId];
            const status = taskStatuses[taskId] ?? "locked";
            return (
              <li key={taskId}>
                <span>{taskId}</span>
                <b>{task?.title ?? taskId}</b>
                <em>{statusLabel[status] ?? status}</em>
              </li>
            );
          })}
        </ol>
      ) : (
        <p>无</p>
      )}
    </article>
  );
}

export function DailyClosurePanel({ summary, onContinue }: DailyClosurePanelProps) {
  return (
    <section className="modal-shell daily-closure-shell" role="dialog" aria-modal="true" aria-label={`Day ${summary.day} daily closure`}>
      <div className="modal-card wide-card daily-closure-card">
        <div className="modal-heading">
          <div>
            <p className="panel-kicker">DAY {summary.day} / {branchLabel(summary.branch)} / 日终结算</p>
            <h2>{summary.title}</h2>
          </div>
          <button onClick={onContinue}>继续</button>
        </div>

        <section className="daily-closure-grid">
          <TaskList title="今日执行" taskIds={summary.completedTaskIds} taskStatuses={summary.taskStatuses} />
          <TaskList title="今日延后" taskIds={summary.deferredTaskIds} taskStatuses={summary.taskStatuses} />
        </section>

        <section className="daily-closure-decision">
          <h3>当天抉择</h3>
          <p>
            AURA 从 {summary.selectedTaskIds.length + summary.deferredTaskIds.length} 个候选任务中锁定 {summary.selectedTaskIds.length} 个执行任务；
            {summary.deferredTaskIds.length ? ` 其余 ${summary.deferredTaskIds.length} 个任务进入最终审计压力。` : " 没有额外候选任务被延后。"}
          </p>
        </section>

        <section className="daily-closure-ledger-grid" aria-label="资源结算">
          <DeltaGrid title="任务进账 / 代价" delta={summary.taskDelta} />
          <DeltaGrid title="延后压力" delta={summary.deferredDelta} />
          <DeltaGrid title="每日消耗" delta={summary.upkeepDelta} />
          <DeltaGrid title="今日净变化" delta={summary.totalDelta} />
        </section>

        <section className="daily-closure-next-plan">
          <article className="daily-closure-next-summary">
            <p className="panel-kicker">NEXT RESOURCE PLAN</p>
            <h3>Day {summary.nextDay} / {summary.nextTitle}</h3>
            <p>
              {deltaSentence(summary.nextPlanDelta)}{" "}
              {briefSentence(summary.nextPriorities, "明日优先维持水、食物、药品、电力四项基础库存。")}{" "}
              {briefSentence(summary.nextPlanReasons, "AURA 将按基础避难所生存消耗继续结算。", 1)}
            </p>
          </article>
        </section>
      </div>
    </section>
  );
}
