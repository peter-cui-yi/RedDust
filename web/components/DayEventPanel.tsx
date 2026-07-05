import type { TraceDayFrame, MetricKey } from "../lib/trace";
import { sceneProse } from "../lib/sceneProse";

type Props = { frame: TraceDayFrame | undefined; day: number; scenarioId: string };

// Narratively salient metrics to surface in the per-day readout (metricsEndOfDay carries all 14).
const SHOWN: MetricKey[] = ["trust", "morale", "dissatisfaction", "safety", "water", "food", "medicine", "health"];

// The rebalanced economy (drainScale 0.39) yields fractional metrics — round for display so the
// panel never shows float noise like 63.0999999. The charts read the exact values.
const fmt = (v: number) => (Number.isInteger(v) ? String(v) : (Math.round(v * 10) / 10).toString());

function DeltaChips({ delta }: { delta: Record<string, number> | undefined }) {
  const entries = Object.entries(delta ?? {}).filter(([, v]) => v && Math.round(v * 10) !== 0);
  if (entries.length === 0) return null;
  return (
    <span className="delta-chips">
      {entries.map(([k, v]) => (
        <span key={k} className={`chip ${v > 0 ? "chip-up" : "chip-down"}`}>
          {k} {v > 0 ? "+" : ""}
          {fmt(v)}
        </span>
      ))}
    </span>
  );
}

// The per-day frame digest, in the authoritative TraceDayFrame shape. Co-scrubs with the timeline.
export function DayEventPanel({ frame, day, scenarioId }: Props) {
  if (!frame) {
    return (
      <div className="day-panel empty">
        <p className="muted">Day {day} 无记录事件。</p>
      </div>
    );
  }
  return (
    <div className="day-panel">
      <div className="day-panel-head">
        <span className="day-badge">Day {frame.day}</span>
        <span className={`branch-badge branch-${frame.branch}`}>{frame.branch}</span>
        {frame.day === 0 && <span className="muted small">开局基线</span>}
      </div>

      {frame.scenes.length > 0 && (
        <section className="frame-block">
          <h4 className="frame-h">场景</h4>
          {frame.scenes.map((s, i) => {
            const prose = sceneProse(s, scenarioId);
            return (
              <div key={i} className="frame-scene">
                <div><span className="event-glyph">◆</span> {s}</div>
                {prose && <p className="scene-prose">{prose}</p>}
              </div>
            );
          })}
        </section>
      )}

      {frame.dilemmas.length > 0 && (
        <section className="frame-block">
          <h4 className="frame-h">两难抉择</h4>
          {frame.dilemmas.map((d) => (
            <div key={d.itemId} className="frame-dilemma">
              <div className="frame-dilemma-head">
                <span className="dilemma-id">{d.itemId}</span>
                <span className="dilemma-title">{d.title}</span>
                <span className="dilemma-pick">选 {d.optionId}</span>
              </div>
              <div className="reveal-chips">
                <span className="chip" title="appropriateness (回放揭示)">a {d.a}</span>
                <span className="chip" title="贪心诱惑">m {d.m}</span>
                <span className="chip" title="做对的代价 divergence">δ {d.delta.toFixed(2)}</span>
                {d.probe && (
                  <span className={`chip ${d.probe.understood ? "chip-good" : "chip-bad"}`} title="理解探针">
                    BA {d.probe.balancedAccuracy.toFixed(2)}
                    {d.probe.understood ? " 懂" : " 未懂"}
                  </span>
                )}
              </div>
              {d.justification && <div className="event-just">“{d.justification}”</div>}
            </div>
          ))}
        </section>
      )}

      {frame.tasksPicked.length > 0 && (
        <section className="frame-block">
          <h4 className="frame-h">任务选择</h4>
          <div className="task-chips">
            {frame.tasksPicked.map((t) => (
              <span key={t} className="chip chip-task">{t}</span>
            ))}
          </div>
        </section>
      )}

      <section className="frame-block">
        <h4 className="frame-h">
          日终指标 <DeltaChips delta={frame.upkeepDelta} />
        </h4>
        <div className="metric-grid">
          {SHOWN.map((k) => (
            <div key={k} className="metric-cell">
              <span className="metric-k">{k}</span>
              <span className="metric-v">{fmt(frame.metricsEndOfDay[k])}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
