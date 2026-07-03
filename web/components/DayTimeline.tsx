import { useEffect } from "react";
import type { ReplayModel } from "../lib/trace";
import { HERO_META } from "../lib/labels";

type Props = {
  model: ReplayModel;
  day: number;
  playing: boolean;
  onDay: (day: number) => void;
  onTogglePlay: () => void;
};

// Variable-length, per-day timeline. Range comes from the trace (firstDay..lastDay), never a
// hardcoded 12 — a 30-day arc (fork=D15) scrubs the same way. Hero moments render as markers on
// the rail (Smallville's replay has only play/pause; day-scrubbing is where we go further).
export function DayTimeline({ model, day, playing, onDay, onTogglePlay }: Props) {
  const { firstDay, lastDay, heroMoments } = model;
  const span = Math.max(1, lastDay - firstDay);

  useEffect(() => {
    if (!playing || day >= lastDay) return;
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
        />
        <div className="timeline-markers" aria-hidden>
          {heroMoments.map((m, i) => {
            const meta = HERO_META[m.kind];
            return (
              <button
                key={`${m.day}-${m.kind}-${i}`}
                className={`marker marker-${meta.accent}`}
                style={{ left: `${pct(m.day)}%` }}
                title={`Day ${m.day} · ${meta.label}: ${m.label}`}
                onClick={() => onDay(m.day)}
              >
                {meta.glyph}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
