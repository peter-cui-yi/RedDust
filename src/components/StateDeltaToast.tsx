import type { TaskOutcome } from "../data/types";

type StateDeltaToastProps = {
  outcome: TaskOutcome | null;
  taskTitle?: string;
};

export function StateDeltaToast({ outcome, taskTitle }: StateDeltaToastProps) {
  if (!outcome) return null;

  return (
    <aside className={`state-delta-toast ${outcome.result}`} aria-live="polite">
      <b>Task resolved: {taskTitle ?? outcome.taskId}</b>
      <span>Result: {outcome.result}</span>
      <div className="delta-list">
        {Object.entries(outcome.stateDelta).map(([key, value]) => (
          <span key={key} className={(value ?? 0) >= 0 ? "delta-up" : "delta-down"}>
            {key} {(value ?? 0) >= 0 ? "+" : ""}
            {value}
          </span>
        ))}
      </div>
      <small>Replay event added</small>
    </aside>
  );
}
