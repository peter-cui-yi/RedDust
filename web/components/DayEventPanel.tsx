import type { DaySlice, MetricKey } from "../lib/trace";
import { KIND_META } from "../lib/labels";

type Props = { slice: DaySlice | undefined; day: number };

function DeltaChips({ delta }: { delta: Partial<Record<MetricKey, number>> }) {
  const entries = Object.entries(delta).filter(([, v]) => v && v !== 0);
  if (entries.length === 0) return null;
  return (
    <span className="delta-chips">
      {entries.map(([k, v]) => (
        <span key={k} className={`chip ${v! > 0 ? "chip-up" : "chip-down"}`}>
          {k} {v! > 0 ? "+" : ""}
          {v}
        </span>
      ))}
    </span>
  );
}

// The per-day event stream: exactly the trace lines tagged with the current day, in step order.
// This is the readable, byte-for-byte-from-the-trace panel that co-scrubs with the timeline.
export function DayEventPanel({ slice, day }: Props) {
  if (!slice || slice.lines.length === 0) {
    return (
      <div className="day-panel empty">
        <p className="muted">Day {day} 无记录事件。</p>
      </div>
    );
  }
  return (
    <div className="day-panel">
      <div className="day-panel-head">
        <span className="day-badge">Day {day}</span>
        <span className={`branch-badge branch-${slice.branch}`}>{slice.branch}</span>
        <DeltaChips delta={slice.metricDelta} />
      </div>
      <ol className="event-list">
        {slice.lines.map((line) => {
          const meta = KIND_META[line.kind];
          return (
            <li key={line.step} className={`event event-${meta.accent}`}>
              <span className="event-glyph" title={meta.label}>
                {meta.glyph}
              </span>
              <div className="event-body">
                <div className="event-label">{line.label}</div>
                <div className="event-detail">{line.detail}</div>
                {line.justification && <div className="event-just">“{line.justification}”</div>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
