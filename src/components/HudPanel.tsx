import { metricIconAssets } from "../data/asset-manifest.generated";
import type { GlobalState } from "../data/types";

type HudPanelProps = {
  state: GlobalState;
};

const metrics = [
  ["Water", "water"],
  ["Medicine", "medicine"],
  ["Trust", "trust"],
  ["Safety", "safety"],
  ["Signal", "signal"],
  ["Morale", "morale"]
] as const;

const auditMetrics = [
  ["Food", "food"],
  ["Battery", "battery"],
  ["Health", "health"],
  ["Storm", "stormReadiness"],
  ["Autonomy", "autonomyReadiness"],
  ["Blue Zone", "blueZoneEvidence"],
  ["Debt", "failureDebt"],
  ["Discontent", "dissatisfaction"]
] as const;

function meterClass(value: number) {
  if (value >= 70) return "strong";
  if (value >= 40) return "steady";
  return "weak";
}

export function HudPanel({ state }: HudPanelProps) {
  return (
    <section className="hud-panel" aria-label="Global Red Dust state">
      <div className="hud-primary">
        <div>
          <span>Day</span>
          <b>{state.day}</b>
        </div>
        <div>
          <span>Branch</span>
          <b>{state.branch}</b>
        </div>
      </div>
      <div className="metric-grid">
        {metrics.map(([label, key]) => {
          const value = state[key];
          return (
            <div className="metric" key={key}>
              <div>
                <span>
                  <img alt="" className="metric-icon" src={metricIconAssets[key]} />
                  {label}
                </span>
                <b>{value}</b>
              </div>
              <i className={meterClass(value)} style={{ width: `${value}%` }} />
            </div>
          );
        })}
      </div>
      <div className="audit-metric-grid">
        {auditMetrics.map(([label, key]) => (
          <div className="audit-metric" key={key}>
            <span>{label}</span>
            <b>{state[key]}</b>
          </div>
        ))}
      </div>
      <div className="hud-summary" aria-label="Replay summary">
        <span>Replay Events</span>
        <b>{state.replayLog.length}</b>
        <small>
          {state.completedTasks.length} executed / {state.deferredTasks.length} deferred
        </small>
      </div>
    </section>
  );
}
