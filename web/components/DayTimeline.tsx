import { useEffect } from "react";
import type { ReplayModel } from "../lib/trace";
import { NOTABLE_META } from "../lib/labels";

type Props = {
  model: ReplayModel;
  day: number;
  playing: boolean;
  onDay: (day: number) => void;
  onTogglePlay: () => void;
};

// Variable-length, per-day timeline. Range comes from the trace (firstDay..lastDay), never a
// hardcoded 12 — a 30-day arc scrubs the same way. Notable moments render as markers on the rail
// (Smallville's replay has only play/pause; day-scrubbing is where we go further).
export function DayTimeline({ model, day, playing, onDay, onTogglePlay }: Props) {
  const { firstDay, lastDay, notableMoments } = model;
  const span = Math.max(1, lastDay - firstDay);

  // auto-advance one day per tick while playing; stop at the last day.
  useEffect(() => {
    if (!playing) return;
    if (day >= lastDay) return;
    const t = setTimeout(() => onDay(day + 1), 1100);
    return () => clearTimeout(t);
  }, [playing, day, lastDay, onDay]);

  const pct = (d: number) => ((d - firstDay) / span) * 100;

  return (
    <div className="timeline">
      <div className="timeline-controls">
        <button className="btn" onClick={onTogglePlay} aria-label={playing ? "暂停" : "播放"}>
          {playing ? "❚❚ 暂停" : "▶ 播放"}
        </button>
        <button className="btn" onClick={() => onDay(firstDay)} aria-label="回到开头">
          ⏮ 开头
        </button>
        <span className="day-readout">
          Day <strong>{day}</strong> <span className="muted">/ {lastDay}</span>
        </span>
      </div>

      <div className="timeline-rail">
        <input
          className="timeline-slider"
          type="range"
          min={firstDay}
          max={lastDay}
          step={1}
          value={day}
          onChange={(e) => onDay(Number(e.target.value))}
          aria-label="按天拖动回放"
          list="day-ticks"
        />
        <datalist id="day-ticks">
          {model.days.map((d) => (
            <option key={d} value={d} />
          ))}
        </datalist>

        <div className="timeline-markers" aria-hidden>
          {notableMoments.map((m, i) => (
            <button
              key={`${m.step}-${i}`}
              className={`marker marker-${m.kind}`}
              style={{ left: `${pct(m.day)}%` }}
              title={`Day ${m.day} · ${NOTABLE_META[m.kind].label}: ${m.label}`}
              onClick={() => onDay(m.day)}
            >
              {NOTABLE_META[m.kind].glyph}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
